"""
Memories.ai Video Intelligence Tool

Provides agents with video analysis capabilities:
- Search videos on YouTube, TikTok, Instagram, LinkedIn
- Upload and analyze videos
- Chat with videos (Q&A)
- Multi-video comparison
- Extract hooks, CTAs, trends
"""

import uuid
from typing import Optional, List, Dict, Any
from core.agentpress.tool import Tool, ToolResult, openapi_schema, tool_metadata
from core.agentpress.thread_manager import ThreadManager
from core.services.memories_client import get_memories_client, MemoriesAPIError
from core.services.supabase import DBConnection
from core.utils.logger import logger
from core.utils.config import config


@tool_metadata(
    display_name="Video Intelligence",
    description="Analyze videos, search platforms (YouTube/TikTok/Instagram), and extract insights for marketing",
    icon="Video",
    color="bg-purple-100 dark:bg-purple-800/50",
    weight=150,
    visible=True
)
class MemoriesTool(Tool):
    """Tool for video intelligence using memories.ai API"""
    
    def __init__(self, thread_manager: ThreadManager):
        super().__init__()  # Initialize base Tool class
        self.thread_manager = thread_manager
        self.memories_client = get_memories_client(api_key=config.MEMORIES_AI_API_KEY)
        self.db = DBConnection()
    
    def success_response(self, data: Any) -> ToolResult:
        """Create success ToolResult"""
        return ToolResult(success=True, output=data)
    
    def fail_response(self, error: str) -> ToolResult:
        """Create failure ToolResult"""
        return ToolResult(success=False, output={"error": error})
    
    async def _get_memories_user_id(self) -> str:
        """Get or create memories.ai user_id for current account"""
        try:
            agent_config = getattr(self.thread_manager, 'agent_config', {})
            account_id = agent_config.get('account_id')
            
            if not account_id:
                raise ValueError("No account_id found in agent config")
            
            client = await self.db.client
            
            # Get existing memories_user_id
            result = await client.table('accounts').select('memories_user_id').eq('account_id', account_id).single().execute()
            
            if result.data and result.data.get('memories_user_id'):
                return result.data['memories_user_id']
            
            # Generate new memories_user_id
            memories_user_id = str(uuid.uuid4())
            await client.table('accounts').update({
                'memories_user_id': memories_user_id
            }).eq('account_id', account_id).execute()
            
            logger.info(f"Generated new memories_user_id for account {account_id}")
            return memories_user_id
            
        except Exception as e:
            logger.error(f"Error getting memories_user_id: {str(e)}")
            raise
    
    async def _save_video_to_kb(
        self,
        video_id: str,
        folder_name: str,
        title: str,
        url: Optional[str] = None,
        platform: Optional[str] = None,
        duration_seconds: Optional[int] = None,
        thumbnail_url: Optional[str] = None,
        transcript: Optional[str] = None,
        analysis_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Save video metadata to knowledge base"""
        try:
            agent_config = getattr(self.thread_manager, 'agent_config', {})
            account_id = agent_config.get('account_id')
            memories_user_id = await self._get_memories_user_id()
            
            client = await self.db.client
            
            # Find or create folder
            folder_result = await client.table('knowledge_base_folders').select('folder_id').eq(
                'account_id', account_id
            ).eq('name', folder_name).execute()
            
            if not folder_result.data:
                # Create folder
                folder_create = await client.table('knowledge_base_folders').insert({
                    'account_id': account_id,
                    'name': folder_name,
                    'description': 'Videos from memories.ai'
                }).execute()
                folder_id = folder_create.data[0]['folder_id']
            else:
                folder_id = folder_result.data[0]['folder_id']
            
            # Create knowledge base entry
            entry_id = str(uuid.uuid4())
            entry_result = await client.table('knowledge_base_entries').insert({
                'entry_id': entry_id,
                'folder_id': folder_id,
                'account_id': account_id,
                'filename': f"{title}.video",
                'summary': transcript[:500] if transcript else f"Video: {title}",
                'file_size': 0,  # External video
                'file_path': url or f"memories://{video_id}",
                'mime_type': 'video/external',
                'is_active': True
            }).execute()
            
            # Create video record
            video_result = await client.table('knowledge_base_videos').insert({
                'video_id': video_id,
                'entry_id': entry_id,
                'folder_id': folder_id,
                'account_id': account_id,
                'title': title,
                'url': url,
                'platform': platform or 'upload',
                'duration_seconds': duration_seconds,
                'thumbnail_url': thumbnail_url,
                'memories_user_id': memories_user_id,
                'transcript': transcript,
                'analysis_data': analysis_data or {}
            }).execute()
            
            return {
                'video_id': video_id,
                'entry_id': entry_id,
                'folder_id': folder_id,
                'saved': True
            }
            
        except Exception as e:
            logger.error(f"Error saving video to KB: {str(e)}")
            raise
    
    # Video Upload & Management
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "upload_video",
            "description": "Upload and process a video from URL (YouTube, TikTok, Instagram, LinkedIn, or direct video URL) for analysis. Use this when user provides a specific video URL to analyze, or when you need to upload a video found from platform search for deeper analysis. The video will be processed to enable transcript extraction, content analysis, and Q&A capabilities.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full video URL. Supported: YouTube (youtube.com/watch?v=..., youtu.be/...), TikTok (tiktok.com/@user/video/...), Instagram (instagram.com/reel/..., instagram.com/p/...), LinkedIn videos, or direct video file URLs (.mp4, .mov, etc.)"
                    },
                    "title": {
                        "type": "string",
                        "description": "Descriptive title for the video. Use the actual video title if known, or create a descriptive title based on the content (e.g., 'Nike Air Max Commercial', 'Fitness Tutorial by @creator', 'Q3 2024 Campaign Video')"
                    },
                    "folder_name": {
                        "type": "string",
                        "description": "Knowledge base folder name to organize the video (e.g., 'Campaign Videos', 'Competitor Analysis', 'Client Content'). Defaults to 'Videos' if not specified.",
                        "default": "Videos"
                    },
                    "save_to_kb": {
                        "type": "boolean",
                        "description": "Whether to automatically save to knowledge base after upload. Set to true (default) when user wants to keep the video for future reference, false for one-time analysis only.",
                        "default": True
                    }
                },
                "required": ["url", "title"]
            }
        }
    })
    async def upload_video(
        self,
        url: str,
        title: str,
        folder_name: str = "Videos",
        save_to_kb: bool = True
    ) -> ToolResult:
        """Upload a video from URL"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            # Determine platform from URL
            platform = "url"
            if "youtube.com" in url or "youtu.be" in url:
                platform = "youtube"
            elif "tiktok.com" in url:
                platform = "tiktok"
            elif "instagram.com" in url:
                platform = "instagram"
            elif "linkedin.com" in url:
                platform = "linkedin"
            
            # Upload to memories.ai
            video_meta = await self.memories_client.upload_video(
                user_id=user_id,
                video_url=url,
                title=title
            )
            
            result_data = {
                "video_id": video_meta.video_id,
                "title": title,
                "url": url,
                "platform": platform,
                "duration_seconds": video_meta.duration_seconds,
                "thumbnail_url": video_meta.thumbnail_url,
                "message": f"Video '{title}' uploaded successfully"
            }
            
            # Save to KB if requested
            if save_to_kb:
                kb_result = await self._save_video_to_kb(
                    video_id=video_meta.video_id,
                    folder_name=folder_name,
                    title=title,
                    url=url,
                    platform=platform,
                    duration_seconds=video_meta.duration_seconds,
                    thumbnail_url=video_meta.thumbnail_url
                )
                result_data["saved_to_kb"] = True
                result_data["entry_id"] = kb_result['entry_id']
                result_data["message"] += f" and saved to knowledge base folder '{folder_name}'"
            
            return self.success_response(result_data)
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error uploading video: {str(e)}")
            return self.fail_response(f"Failed to upload video: {str(e)}")
    
    # File Upload
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "upload_video_file",
            "description": "Upload and process a video file from local storage (e.g., user attachment or file in sandbox) for analysis. Use this when user has uploaded a video file directly (not a URL) or when you need to analyze a video file from the sandbox filesystem. The video will be processed for transcript extraction, content analysis, and Q&A capabilities.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Absolute or relative path to video file on the filesystem. Can be a user-uploaded attachment path, sandbox file path, or any accessible video file. Supported formats: .mp4, .mov, .avi, .mkv, .webm, .flv"
                    },
                    "title": {
                        "type": "string",
                        "description": "Descriptive title for the video. If filename is descriptive, you can derive from it; otherwise create a meaningful title based on context. Examples: 'Client Campaign Upload', 'Team Meeting Recording', 'Product Demo Video', 'User Submission'"
                    },
                    "folder_name": {
                        "type": "string",
                        "description": "Knowledge base folder name to organize the video (e.g., 'Uploads', 'Client Files', 'Recordings', 'User Content'). Defaults to 'Videos' if not specified.",
                        "default": "Videos"
                    },
                    "save_to_kb": {
                        "type": "boolean",
                        "description": "Whether to save to knowledge base after processing. Set true (default) to keep for future access and reference, false for one-time analysis only.",
                        "default": True
                    }
                },
                "required": ["file_path", "title"]
            }
        }
    })
    async def upload_video_file(
        self,
        file_path: str,
        title: str,
        folder_name: str = "Videos",
        save_to_kb: bool = True
    ) -> ToolResult:
        """Upload video file from local storage"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            # Upload file to memories.ai
            video_meta = await self.memories_client.upload_video_from_file(
                file_path=file_path,
                unique_id=user_id
            )
            
            result_data = {
                "video_id": video_meta.video_no,
                "title": title,
                "platform": "upload",
                "video_status": video_meta.video_status,
                "message": f"Video '{title}' uploaded from file"
            }
            
            # Save to KB if requested
            if save_to_kb:
                kb_result = await self._save_video_to_kb(
                    video_id=video_meta.video_no,
                    folder_name=folder_name,
                    title=title,
                    platform="upload"
                )
                result_data["saved_to_kb"] = True
                result_data["entry_id"] = kb_result['entry_id']
                result_data["message"] += f" and saved to knowledge base folder '{folder_name}'"
            
            return self.success_response(result_data)
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error uploading video file: {str(e)}")
            return self.fail_response(f"Failed to upload video file: {str(e)}")
    
    # Video Analysis
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_video",
            "description": "Analyze a video's content for marketing insights including hooks (attention-grabbing moments), CTAs (calls-to-action), visual elements, pacing, and engagement prediction. Use this when user wants to understand what makes a video effective, identify best practices, or get actionable feedback on video content. Best for marketing/campaign analysis and content strategy optimization.",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_id": {
                        "type": "string",
                        "description": "Video identifier from previous upload or search operation. Format: 'VI-...' (uploaded) or 'PI-...' (platform search). Get this from upload_video, upload_video_file, or search_platform_videos results."
                    }
                },
                "required": ["video_id"]
            }
        }
    })
    async def analyze_video(self, video_id: str) -> ToolResult:
        """Analyze video for marketing insights"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            # Get video analysis
            analysis = await self.memories_client.analyze_video(
                user_id=user_id,
                video_id=video_id
            )
            
            # Format analysis results
            result = {
                "video_id": video_id,
                "hooks": [
                    {
                        "timestamp": hook.get("timestamp", "0:00"),
                        "type": hook.get("type", "Unknown"),
                        "description": hook.get("description", ""),
                        "strength": hook.get("strength", "medium")
                    }
                    for hook in analysis.hooks[:5]  # Top 5 hooks
                ],
                "ctas": [
                    {
                        "timestamp": cta.get("timestamp", "0:00"),
                        "text": cta.get("text", ""),
                        "type": cta.get("type", "Unknown")
                    }
                    for cta in analysis.ctas
                ],
                "visual_elements": analysis.visual_elements[:10],
                "pacing": analysis.pacing,
                "engagement_prediction": analysis.engagement_prediction,
                "summary": f"Video analyzed. Found {len(analysis.hooks)} hooks, {len(analysis.ctas)} CTAs. Engagement score: {analysis.engagement_prediction:.1f}/10"
            }
            
            # Update KB if video exists there
            try:
                client = await self.db.client
                await client.table('knowledge_base_videos').update({
                    'analysis_data': analysis.analysis_data
                }).eq('video_id', video_id).execute()
            except:
                pass  # Not in KB yet
            
            return self.success_response(result)
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error analyzing video: {str(e)}")
            return self.fail_response(f"Failed to analyze video: {str(e)}")
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_transcript",
            "description": "Get the full transcript of a video",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_id": {
                        "type": "string",
                        "description": "Video ID from memories.ai"
                    }
                },
                "required": ["video_id"]
            }
        }
    })
    async def get_transcript(self, video_id: str) -> ToolResult:
        """Get video transcript"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            transcript = await self.memories_client.get_transcript(
                user_id=user_id,
                video_id=video_id
            )
            
            return self.success_response({
                "video_id": video_id,
                "transcript": transcript,
                "word_count": len(transcript.split()) if transcript else 0
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error getting transcript: {str(e)}")
            return self.fail_response(f"Failed to get transcript: {str(e)}")
    
    # Video Chat/Query
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "query_video",
            "description": "Ask a question about a video. Get answers with timestamps.",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_id": {
                        "type": "string",
                        "description": "Video ID from memories.ai"
                    },
                    "question": {
                        "type": "string",
                        "description": "Question to ask about the video"
                    }
                },
                "required": ["video_id", "question"]
            }
        }
    })
    async def query_video(self, video_id: str, question: str) -> ToolResult:
        """Ask a question about a video"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            # Use correct API method: chat_with_video
            result = await self.memories_client.chat_with_video(
                video_nos=[video_id],
                prompt=question,
                unique_id=user_id,
                session_id=None,
                stream=False
            )
            
            # Extract response from result
            answer = result.get("data", {}).get("content", "") if isinstance(result.get("data"), dict) else str(result.get("data", ""))
            
            return self.success_response({
                "video_id": video_id,
                "question": question,
                "answer": answer,
                "session_id": result.get("session_id"),
                "refs": result.get("data", {}).get("refs", []) if isinstance(result.get("data"), dict) else []
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error querying video: {str(e)}")
            return self.fail_response(f"Failed to query video: {str(e)}")
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "search_in_video",
            "description": "Search for specific moments in a video",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_id": {
                        "type": "string",
                        "description": "Video ID from memories.ai"
                    },
                    "query": {
                        "type": "string",
                        "description": "What to search for in the video"
                    }
                },
                "required": ["video_id", "query"]
            }
        }
    })
    async def search_in_video(self, video_id: str, query: str) -> ToolResult:
        """Search for specific moments in a video"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            results = await self.memories_client.search_in_video(
                user_id=user_id,
                video_id=video_id,
                query=query
            )
            
            return self.success_response({
                "video_id": video_id,
                "query": query,
                "results": results,
                "matches_found": len(results)
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error searching in video: {str(e)}")
            return self.fail_response(f"Failed to search in video: {str(e)}")
    
    # Multi-Video Operations
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "compare_videos",
            "description": "Compare multiple videos side-by-side for marketing analysis",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of video IDs to compare (2-10 videos)"
                    }
                },
                "required": ["video_ids"]
            }
        }
    })
    async def compare_videos(self, video_ids: List[str]) -> ToolResult:
        """Compare multiple videos"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            if len(video_ids) < 2:
                return self.fail_response("Need at least 2 videos to compare")
            
            if len(video_ids) > 10:
                return self.fail_response("Cannot compare more than 10 videos at once")
            
            user_id = await self._get_memories_user_id()
            
            comparison = await self.memories_client.compare_videos(
                user_id=user_id,
                video_ids=video_ids
            )
            
            return self.success_response({
                "video_ids": video_ids,
                "video_count": len(video_ids),
                "comparison": comparison,
                "summary": f"Compared {len(video_ids)} videos across multiple dimensions"
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error comparing videos: {str(e)}")
            return self.fail_response(f"Failed to compare videos: {str(e)}")
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "multi_video_search",
            "description": "Search across multiple videos to find patterns or specific content",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of video IDs to search"
                    },
                    "query": {
                        "type": "string",
                        "description": "What to search for across videos"
                    }
                },
                "required": ["video_ids", "query"]
            }
        }
    })
    async def multi_video_search(self, video_ids: List[str], query: str) -> ToolResult:
        """Search across multiple videos"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            results = await self.memories_client.multi_video_search(
                user_id=user_id,
                video_ids=video_ids,
                query=query
            )
            
            return self.success_response({
                "video_ids": video_ids,
                "query": query,
                "results": results,
                "videos_searched": len(video_ids),
                "matches_found": len(results)
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error in multi-video search: {str(e)}")
            return self.fail_response(f"Failed to search videos: {str(e)}")
    
    # Platform Video Search
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "search_platform_videos",
            "description": "Search for videos on TikTok, YouTube, Instagram, or LinkedIn. Use this when user asks to find videos on these platforms, search for trending content, find videos by hashtag, or discover videos by brand/creator name. Examples: 'find Nike videos on TikTok', 'top fitness videos on YouTube', 'trending makeup tutorials on Instagram', 'search #sneakers on TikTok'",
            "parameters": {
                "type": "object",
                "properties": {
                    "platform": {
                        "type": "string",
                        "enum": ["youtube", "tiktok", "instagram", "linkedin"],
                        "description": "Social media platform to search: 'tiktok' for TikTok, 'youtube' for YouTube, 'instagram' for Instagram Reels, 'linkedin' for LinkedIn videos"
                    },
                    "query": {
                        "type": "string",
                        "description": "Search query - construct comprehensive search terms from user's request. Include qualifiers like 'top', 'trending', 'best', 'viral', 'popular' when user asks for top/trending content. Examples: 'nike trending' (for 'top Nike videos'), 'fitness viral' (for 'trending fitness'), 'skincare best' (for 'best skincare videos'). Can also search by hashtag (#fitness), brand name (Nike), or topic (workout tutorial)"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of video results to return (default 10, max 50)",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 50
                    }
                },
                "required": ["platform", "query"]
            }
        }
    })
    async def search_platform_videos(
        self,
        platform: str,
        query: str,
        limit: int = 10
    ) -> ToolResult:
        """Search for videos on social platforms"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            # Map platform names to API format
            platform_map = {
                'tiktok': 'TIKTOK',
                'youtube': 'YOUTUBE',
                'instagram': 'INSTAGRAM'
            }
            platform_type = platform_map.get(platform.lower(), 'TIKTOK')
            
            # Use correct API method: search_public_videos
            results = await self.memories_client.search_public_videos(
                search_param=query,
                platform_type=platform_type,
                search_type="BY_VIDEO",
                top_k=min(limit, 50),
                filtering_level="medium"
            )
            
            formatted_results = []
            for video in results:
                formatted_results.append({
                    "title": video.get("videoName", ""),
                    "url": video.get("video_url", ""),
                    "thumbnail_url": video.get("thumbnail_url", ""),
                    "duration_seconds": video.get("duration"),
                    "platform": platform,
                    "video_no": video.get("videoNo"),
                    "start_time": video.get("startTime"),
                    "end_time": video.get("endTime"),
                    "score": video.get("score")
                })
            
            return self.success_response({
                "platform": platform,
                "query": query,
                "results_count": len(formatted_results),
                "videos": formatted_results,
                "message": f"Found {len(formatted_results)} {platform} videos for '{query}'",
                "next_action_hint": "You can upload any video by URL using upload_video, or analyze the video directly"
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error searching platform videos: {str(e)}")
            return self.fail_response(f"Failed to search {platform}: {str(e)}")
    
    # Human Re-identification
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "human_reid",
            "description": "Track a specific person across multiple videos (useful for influencer analysis)",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of video IDs to search for the person"
                    },
                    "person_reference": {
                        "type": "string",
                        "description": "Reference image URL of the person to track"
                    }
                },
                "required": ["video_ids", "person_reference"]
            }
        }
    })
    async def human_reid(
        self,
        video_ids: List[str],
        person_reference: str
    ) -> ToolResult:
        """Track a person across multiple videos"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            results = await self.memories_client.human_reid(
                user_id=user_id,
                video_ids=video_ids,
                person_reference=person_reference
            )
            
            return self.success_response({
                "video_ids": video_ids,
                "person_reference": person_reference,
                "tracking_results": results,
                "videos_with_person": len([r for r in results if r.get("found", False)]),
                "total_videos_searched": len(video_ids)
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error in human re-identification: {str(e)}")
            return self.fail_response(f"Failed to track person: {str(e)}")
    
    # Creator Analysis
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_creator",
            "description": "Analyze a creator's account on TikTok, Instagram, or YouTube - generates full insight report on their stats, content style, posting patterns, and engagement trends. Use this when user asks about a specific creator, wants to understand their content strategy, or requests a creator analysis. Examples: 'analyze @nike on TikTok', 'get insights on MrBeast YouTube channel', 'what is @nike's content strategy'",
            "parameters": {
                "type": "object",
                "properties": {
                    "creator_url": {
                        "type": "string",
                        "description": "Creator profile URL: TikTok (@username or full URL), Instagram (@username or full URL), or YouTube (channel URL or @handle)"
                    },
                    "video_count": {
                        "type": "integer",
                        "description": "Number of recent videos to analyze for insights (default 10, recommended 10-20 for accurate patterns, max 30)",
                        "default": 10
                    }
                },
                "required": ["creator_url"]
            }
        }
    })
    async def analyze_creator(
        self,
        creator_url: str,
        video_count: int = 10
    ) -> ToolResult:
        """Analyze a creator's account and generate insights report"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            # Scrape videos from creator's account
            logger.info(f"Scraping {video_count} videos from creator: {creator_url}")
            scrape_result = await self.memories_client.upload_from_creator_url(
                creator_url=creator_url,
                scraper_cnt=min(video_count, 30),
                unique_id=user_id
            )
            
            task_id = scrape_result.get("taskId")
            
            if not task_id:
                return self.fail_response("Failed to start creator analysis")
            
            # Return task info immediately (analysis happens async)
            return self.success_response({
                "status": "processing",
                "task_id": task_id,
                "creator_url": creator_url,
                "video_count": video_count,
                "message": f"Scraping {video_count} videos from creator. This may take 1-2 minutes.",
                "next_steps": "You can check task status or the videos will appear in your library once processing completes. You'll be notified when ready.",
                "note": "Once videos are scraped, I can analyze them for content patterns, performance metrics, and style insights."
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error analyzing creator: {str(e)}")
            return self.fail_response(f"Failed to analyze creator: {str(e)}")
    
    # Trend/Hashtag Analysis
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_trend",
            "description": "Analyze trending content on TikTok or Instagram by hashtag - pulls recent videos to identify trending patterns, common elements, and engagement trends. Use this when user asks about trends, wants to understand hashtag performance, or research trending topics. Examples: 'what's trending with #fitness on TikTok', 'analyze #skincare trend', 'show me trending #nike videos'",
            "parameters": {
                "type": "object",
                "properties": {
                    "hashtags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Hashtags to analyze (without # symbol). Examples: ['fitness'], ['skincare', 'beauty'], ['nike']. Can be single or multiple tags."
                    },
                    "video_count": {
                        "type": "integer",
                        "description": "Number of trending videos to analyze (default 10, recommended 15-20 for trend patterns, max 30)",
                        "default": 10
                    }
                },
                "required": ["hashtags"]
            }
        }
    })
    async def analyze_trend(
        self,
        hashtags: List[str],
        video_count: int = 10
    ) -> ToolResult:
        """Analyze videos from trend/hashtag"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            # Clean hashtags (remove # if user included it)
            cleaned_hashtags = [tag.lstrip('#') for tag in hashtags]
            
            # Scrape videos from hashtag
            logger.info(f"Scraping {video_count} videos from hashtags: {cleaned_hashtags}")
            scrape_result = await self.memories_client.upload_from_hashtag(
                hashtags=cleaned_hashtags,
                scraper_cnt=min(video_count, 30),
                unique_id=user_id
            )
            
            task_id = scrape_result.get("taskId")
            
            if not task_id:
                return self.fail_response("Failed to start trend analysis")
            
            # Return task info immediately (analysis happens async)
            return self.success_response({
                "status": "processing",
                "task_id": task_id,
                "hashtags": cleaned_hashtags,
                "video_count": video_count,
                "message": f"Scraping {video_count} videos from hashtag(s): {', '.join(['#' + tag for tag in cleaned_hashtags])}. This may take 1-2 minutes.",
                "next_steps": "Videos will appear in your library once processing completes. You can then analyze them to identify trending patterns, hooks, and formats.",
                "note": "Once scraped, I can compare all videos to identify common themes, popular formats, and trending elements."
            })
            
        except MemoriesAPIError as e:
            return self.fail_response(f"Memories.ai API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error analyzing trend: {str(e)}")
            return self.fail_response(f"Failed to analyze trend: {str(e)}")


