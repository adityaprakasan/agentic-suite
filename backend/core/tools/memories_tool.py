"""
Memories.ai Video Intelligence Tool

Provides agents with video analysis capabilities:
- Search videos on YouTube, TikTok, Instagram, LinkedIn
- Upload and analyze videos
- Chat with videos (Q&A)
- Multi-video comparison
- Extract hooks, CTAs, trends
"""

import os
import uuid
from typing import Optional, List, Dict, Any
from core.agentpress.tool import Tool, ToolResult, openapi_schema, tool_metadata
from core.agentpress.thread_manager import ThreadManager
from core.services.memories_client import get_memories_client
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
        
        # Get API key
        api_key = config.MEMORIES_AI_API_KEY
        logger.error(f"   🔧 MemoriesTool.__init__ called with API_KEY: {api_key[:10] if api_key else 'NONE'}... (length: {len(api_key) if api_key else 0})")
        
        # Initialize memories.ai client
        self.memories_client = get_memories_client(api_key=api_key)
        
        if self.memories_client is None:
            logger.error(f"   ❌ memories_client is None after get_memories_client() call")
            raise ValueError(
                f"Memories.ai client failed to initialize. API_KEY={'SET' if api_key else 'NOT SET'}. Please check MEMORIES_AI_API_KEY."
            )
        
        logger.error(f"   ✅ memories_client initialized successfully")
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
            
            # Get existing memories_user_id from basejump schema
            result = await client.schema("basejump").table('accounts').select('memories_user_id').eq('id', account_id).single().execute()
            
            if result.data and result.data.get('memories_user_id'):
                return result.data['memories_user_id']
            
            # Generate new memories_user_id
            memories_user_id = str(uuid.uuid4())
            await client.schema("basejump").table('accounts').update({
                'memories_user_id': memories_user_id
            }).eq('id', account_id).execute()
            
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
            # For platform URLs (Instagram/TikTok/YouTube), use upload_from_platform_urls
            if platform in ['youtube', 'tiktok', 'instagram', 'linkedin']:
                task_response = self.memories_client.upload_from_platform_urls(
                    video_urls=[url],
                    unique_id=user_id,
                    is_public=False
                )
                task_id = task_response.get("data", {}).get("taskId")
                
                # Return task_id for async tracking
                return self.success_response({
                    "task_id": task_id,
                    "url": url,
                    "title": title,
                    "platform": platform,
                    "status": "processing",
                    "message": f"Video '{title}' is being uploaded from {platform}. Use check_task_status with task_id to monitor progress.",
                    "action_hint": "This is an async operation. Check status in a few seconds with check_task_status."
                })
            else:
                # For direct video URLs
                video_meta = self.memories_client.upload_video_from_url(
                    url=url,
                    unique_id=user_id
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
            
            # Get sandbox instance
            from core.utils.sandbox_utils import get_sandbox
            sandbox = get_sandbox(self.thread_manager)
            
            # Download file from sandbox to temp location
            import tempfile
            try:
                file_content = await sandbox.fs.download_file(file_path)
                
                # Save to temp file for upload
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_path)[1]) as temp_file:
                    temp_file.write(file_content)
                    temp_path = temp_file.name
                
                # Upload to memories.ai
                video_meta = self.memories_client.upload_video_from_file(
                    file_path=temp_path,
                    unique_id=user_id
                )
                
                # Clean up temp file
                os.unlink(temp_path)
                
            except Exception as e:
                return self.fail_response(f"Failed to read file from sandbox: {str(e)}")
            
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
            
            # Use chat_with_video to get analysis
            # memories.ai doesn't have a dedicated analyze endpoint - we use chat with analysis prompt
            analysis_prompt = """Analyze this video for marketing insights. Provide:

1. HOOKS: Identify attention-grabbing moments in the first 3-5 seconds with timestamps
2. CTAs (Calls-to-Action): Note any prompts for engagement (like, share, comment, link clicks) with timestamps
3. VISUAL ELEMENTS: Key visual patterns, text overlays, transitions
4. PACING: How the video flows (fast cuts vs slow transitions)
5. ENGAGEMENT PREDICTION: Rate 1-10 how engaging this content is
6. SUMMARY: Overall marketing effectiveness

Format with clear sections and timestamps where applicable."""

            result = self.memories_client.chat_with_video(
                video_nos=[video_id],
                prompt=analysis_prompt,
                unique_id=user_id,
                session_id=None,
                stream=False
            )
            
            # Extract the analysis from chat response
            analysis_text = result.get("data", {}).get("content", "") if isinstance(result.get("data"), dict) else str(result.get("data", ""))
            refs = result.get("data", {}).get("refs", []) if isinstance(result.get("data"), dict) else []
            
            # Return analysis result with compatibility for frontend
            # Frontend VideoAnalysisDisplay expects: hooks[], ctas[], summary, analysis text
            result_data = {
                "video_id": video_id,
                "analysis": analysis_text,  # Full markdown-formatted analysis
                "refs": refs,  # Timestamp references from memories.ai
                "session_id": result.get("session_id"),
                "summary": analysis_text[:200] + "..." if len(analysis_text) > 200 else analysis_text,
                # Compatibility fields for frontend (will be empty, frontend shows analysis text)
                "hooks": [],
                "ctas": [],
                "visual_elements": [],
                "pacing": "",
                "engagement_prediction": 0
            }
            
            # Update KB if video exists there
            try:
                client = await self.db.client
                await client.table('knowledge_base_videos').update({
                    'analysis_data': {"analysis": analysis_text, "analyzed_at": "now"}
                }).eq('video_id', video_id).execute()
            except:
                pass  # Not in KB yet
            
            return self.success_response(result_data)
            
        except Exception as e:
            logger.error(f"Error analyzing video: {str(e)}")
            return self.fail_response(f"Failed to analyze video: {str(e)}")
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_transcript",
            "description": "Extract the full transcript of a video with timestamps. Use this when user wants to read video content as text, search for specific quotes, create captions/subtitles, or needs the spoken content for documentation, analysis, or repurposing. Returns timestamped transcript segments for easy reference.",
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
            
            # Get both video and audio transcription
            transcript_data = self.memories_client.get_video_transcription(
                video_no=video_id,
                unique_id=user_id
            )
            
            # Combine transcripts into text
            transcript = "\n".join([
                f"[{t.get('startTime')}-{t.get('endTime')}s] {t.get('content', '')}"
                for t in transcript_data
            ])
            
            return self.success_response({
                "video_id": video_id,
                "transcript": transcript,
                "word_count": len(transcript.split()) if transcript else 0
            })
            
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
                        "description": "Specific question about the video content. Be precise and contextual. Good examples: 'Where does the speaker mention pricing?', 'What products are shown?', 'When does the CTA appear?', 'What is the main message?', 'How is the product demonstrated?' Avoid vague questions."
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
            result = self.memories_client.chat_with_video(
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
            
        except Exception as e:
            logger.error(f"Error querying video: {str(e)}")
            return self.fail_response(f"Failed to query video: {str(e)}")
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "search_in_video",
            "description": "Search for specific moments or clips within a video based on visual or audio content. Use this to find when particular products appear, when specific topics are discussed, or when certain scenes occur. Returns timestamp ranges (start/end) for each matching moment. Also called 'clip search'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_id": {
                        "type": "string",
                        "description": "Video ID from memories.ai"
                    },
                    "query": {
                        "type": "string",
                        "description": "What to search for in the video. Be specific about visual or audio elements. Examples: 'scenes with the product', 'when pricing is mentioned', 'moments with text overlays', 'scenes with people smiling', 'segments about features'"
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
            
            # Use search_private_library to search within uploaded videos
            results = self.memories_client.search_private_library(
                search_param=query,
                search_type="BY_VIDEO",
                unique_id=user_id,
                top_k=20,
                filtering_level="high"
            )
            
            # Filter results to only this video
            results = [r for r in results if r.get("videoNo") == video_id or r.get("video_no") == video_id]
            
            return self.success_response({
                "video_id": video_id,
                "query": query,
                "results": results,
                "matches_found": len(results)
            })
            
        except Exception as e:
            logger.error(f"Error searching in video: {str(e)}")
            return self.fail_response(f"Failed to search in video: {str(e)}")
    
    # Multi-Video Operations
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "compare_videos",
            "description": "Compare multiple videos side-by-side to identify patterns, differences, and which performs best. Use this when user wants to understand what makes certain videos more effective, identify winning strategies across campaigns, or decide which video approach to use. Returns comparative analysis with scores and recommendations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of video IDs to compare (2-10 videos recommended for meaningful comparison). Use videos from same category/campaign for best insights. Get IDs from previous upload or search operations."
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
            
            # Use chat_with_video to compare multiple videos
            compare_prompt = """Compare these videos and provide:

1. COMMON THEMES: What topics/patterns appear across all videos?
2. DIFFERENCES: How do these videos differ in style, approach, pacing?
3. HOOK COMPARISON: Which video has the strongest hook and why?
4. CTA COMPARISON: Which video has the clearest call-to-action?
5. ENGAGEMENT PREDICTION: Rate each video 1-10 for predicted engagement
6. WINNER: Which video performs best overall and why?

Format as a comparative table where possible."""

            results = self.memories_client.chat_with_video(
                video_nos=video_ids,
                prompt=compare_prompt,
                unique_id=user_id,
                session_id=None,
                stream=False
            )
            
            comparison_text = results.get("content", "") if isinstance(results, dict) else str(results)
            
            return self.success_response({
                "video_ids": video_ids,
                "video_count": len(video_ids),
                "comparison": comparison_text,
                "refs": results.get("refs", []) if isinstance(results, dict) else [],
                "summary": f"Compared {len(video_ids)} videos across multiple dimensions"
            })
            
        except Exception as e:
            logger.error(f"Error comparing videos: {str(e)}")
            return self.fail_response(f"Failed to compare videos: {str(e)}")
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "multi_video_search",
            "description": "Search across multiple videos simultaneously for patterns, themes, or specific content. Use this to identify common elements across a campaign, find trend patterns, or analyze content strategies across multiple creators/videos. More powerful than individual searches when analyzing content at scale.",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of video IDs to search across (can handle 5-50 videos). Use when you have a collection of related videos (campaign series, competitor videos, trending content)."
                    },
                    "query": {
                        "type": "string",
                        "description": "What to search for across all videos. Focus on patterns or themes. Examples: 'common hook strategies', 'how products are presented', 'trending audio patterns', 'CTA placement strategies', 'visual style elements'."
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
            
            # Use chat_with_video to search patterns across videos
            search_prompt = f"""Analyze these {len(video_ids)} videos for: {query}

Identify:
1. Common patterns or themes related to "{query}"
2. Examples with timestamps
3. Frequency and variations
4. Best practices observed
5. Summary of findings

Provide specific examples with video_no and timestamps."""

            results = self.memories_client.chat_with_video(
                video_nos=video_ids,
                prompt=search_prompt,
                unique_id=user_id,
                session_id=None,
                stream=False
            )
            
            analysis_text = results.get("content", "") if isinstance(results, dict) else str(results)
            
            return self.success_response({
                "video_ids": video_ids,
                "query": query,
                "analysis": analysis_text,
                "refs": results.get("refs", []) if isinstance(results, dict) else [],
                "videos_searched": len(video_ids),
                "summary": f"Searched {len(video_ids)} videos for '{query}'"
            })
            
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
            results = self.memories_client.search_public_videos(
                query=query,
                platform=platform_type,
                search_type="BY_VIDEO",
                top_k=min(limit, 50),
                filtering_level="medium"
            )
            
            # Fetch full details for each video to get thumbnails and URLs
            formatted_results = []
            for video in results[:limit]:  # Limit results
                video_no = video.get("videoNo") or video.get("video_no")
                if not video_no:
                    continue
                
                try:
                    # Get full video details including thumbnail
                    details = self.memories_client.get_public_video_detail(video_no=video_no)
                    
                    # Generate thumbnail from platform URL if not available
                    video_url = details.get("video_url") or ""
                    thumbnail_url = ""
                    
                    # For TikTok, we can use the video_url as thumbnail (TikTok player supports it)
                    # For Instagram, construct thumbnail from post ID
                    # For YouTube, extract video ID and use YouTube thumbnail API
                    if platform == "tiktok" and video_url:
                        thumbnail_url = video_url  # TikTok player URLs work as previews
                    elif platform == "instagram" and video_url:
                        # Instagram URL format: https://www.instagram.com/p/{POST_ID}/
                        thumbnail_url = video_url  # Instagram embed works
                    elif platform == "youtube" and video_url:
                        # Extract video ID and use YouTube thumbnail
                        import re
                        youtube_match = re.search(r'(?:v=|/)([a-zA-Z0-9_-]{11})', video_url)
                        if youtube_match:
                            video_id = youtube_match.group(1)
                            thumbnail_url = f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
                    
                    formatted_results.append({
                        "title": details.get("video_name") or video.get("videoName", "Untitled"),
                        "url": video_url,
                        "thumbnail_url": thumbnail_url,
                        "duration_seconds": details.get("duration") or video.get("duration"),
                        "platform": platform,
                        "video_no": video_no,
                        "views": details.get("view_count"),  # API uses "view_count" not "views"
                        "likes": details.get("like_count"),  # API uses "like_count" not "likes"
                        "score": video.get("score")
                    })
                except Exception as e:
                    logger.warning(f"Failed to get details for video {video_no}: {e}")
                    # Fallback to basic info
                    formatted_results.append({
                        "title": video.get("videoName", "Untitled"),
                        "url": video.get("video_url", ""),
                        "thumbnail_url": video.get("thumbnail_url", ""),
                        "duration_seconds": video.get("duration"),
                        "platform": platform,
                        "video_no": video_no,
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
            
        except Exception as e:
            logger.error(f"Error searching platform videos: {str(e)}")
            return self.fail_response(f"Failed to search {platform}: {str(e)}")
    
    # Human Re-identification
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "human_reid",
            "description": "Track a specific person across multiple videos using re-identification technology. Use this when user wants to find all appearances of a person (influencer, spokesperson, competitor personality), analyze their presence across content, or track product placements involving specific people. Can work from image reference or video frame.",
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
        # Human ReID requires special API key and uses security.memories.ai endpoint
        # This is not available with standard API keys
        return self.fail_response(
            "Human Re-identification feature requires a special API key. "
            "This feature uses security.memories.ai endpoint and is not included in standard API access. "
            "Contact techsupport@memories.ai to enable this feature for your account."
        )
    
    # Creator Analysis
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_creator",
            "description": "Analyze a creator's account on TikTok, Instagram, or YouTube to generate a comprehensive insight report on their content strategy, stats, posting patterns, and audience engagement. Use this when user asks about a specific creator's strategy, wants to learn from successful creators, or needs competitive intelligence. Simply provide the creator's URL or @handle - the tool will pull and analyze their recent videos automatically. Examples: 'analyze @nike on TikTok', 'get insights on MrBeast YouTube channel', 'what is @nike's content strategy'",
            "parameters": {
                "type": "object",
                "properties": {
                    "creator_url": {
                        "type": "string",
                        "description": "Creator's profile URL or handle. Formats: TikTok '@username' or 'tiktok.com/@username', Instagram '@username' or 'instagram.com/username', YouTube 'youtube.com/@channel' or 'youtube.com/channel/CHANNEL_ID'. The tool handles all platform-specific formats."
                    },
                    "video_count": {
                        "type": "integer",
                        "description": "Number of recent videos to analyze for the report (default 10). Recommended: 10-15 for quick insights, 20-30 for comprehensive analysis of content patterns. More videos = more accurate pattern detection.",
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
            scrape_result = self.memories_client.upload_from_creator_url(
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
            
        except Exception as e:
            logger.error(f"Error analyzing creator: {str(e)}")
            return self.fail_response(f"Failed to analyze creator: {str(e)}")
    
    # Task Status Checking
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "check_task_status",
            "description": "Check the status of an async task (video scraping from creator or hashtag). Use this to see if a previous analyze_creator or analyze_trend operation has completed. Returns task status and scraped video IDs if ready.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "Task ID returned from analyze_creator or analyze_trend"
                    }
                },
                "required": ["task_id"]
            }
        }
    })
    async def check_task_status(self, task_id: str) -> ToolResult:
        """Check status of async scraping task"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            # Check task status
            status_result = self.memories_client.check_task_status(
                task_id=task_id,
                unique_id=user_id
            )
            
            # Check if response has videos array (actual format from API)
            if "videos" in status_result:
                videos = status_result["videos"]
                
                # Extract video IDs and count parsed vs unparsed
                parsed_videos = [v for v in videos if v.get("status") == "PARSE"]
                unparsed_videos = [v for v in videos if v.get("status") in ["UNPARSE", None]]
                
                video_ids = [v["video_no"] for v in parsed_videos if v.get("video_no")]
                total_count = len(videos)
                parsed_count = len(parsed_videos)
                
                # If majority parsed, consider it ready
                if parsed_count > 0:
                    return self.success_response({
                        "status": "ready",
                        "task_id": task_id,
                        "total_videos": total_count,
                        "parsed_videos": parsed_count,
                        "unparsed_videos": len(unparsed_videos),
                        "video_ids": video_ids,
                        "message": f"✅ {parsed_count}/{total_count} videos ready! {len(unparsed_videos)} still processing.",
                        "videos": parsed_videos[:5],  # First 5 for preview
                        "next_steps": f"You can analyze the {parsed_count} ready videos using analyze_video, compare them with compare_videos, or search across them with multi_video_search."
                    })
                else:
                    return self.success_response({
                        "status": "processing",
                        "task_id": task_id,
                        "total_videos": total_count,
                        "message": f"⏳ Still processing... {total_count} videos scraped but none parsed yet. Check again in 30-60 seconds.",
                        "next_steps": "Use check_task_status again in a moment."
                    })
            
            # Fallback for simple status response
            task_status = status_result.get("status", "unknown")
            
            if task_status == "completed" or task_status == "success":
                video_ids = status_result.get("video_ids", [])
                return self.success_response({
                    "status": "completed",
                    "task_id": task_id,
                    "video_count": len(video_ids),
                    "video_ids": video_ids,
                    "message": f"✅ Scraping complete! {len(video_ids)} videos ready."
                })
            elif task_status == "processing" or task_status == "pending":
                return self.success_response({
                    "status": "processing",
                    "task_id": task_id,
                    "message": "⏳ Still processing..."
                })
            elif task_status == "failed" or task_status == "error":
                return self.fail_response(f"Task failed: {status_result.get('error', 'Unknown error')}")
            else:
                return self.success_response({
                    "status": "unknown",
                    "task_id": task_id,
                    "raw_response": status_result,
                    "message": "Task status unclear - see raw_response for details"
                })
            
        except Exception as e:
            logger.error(f"Error checking task status: {str(e)}")
            return self.fail_response(f"Failed to check task status: {str(e)}")
    
    # Trend/Hashtag Analysis
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_trend",
            "description": "Analyze trending content on TikTok or Instagram by hashtag(s) to identify what's currently viral, common content patterns, and trending formats. Use this when user asks what's trending with a topic, wants to understand hashtag performance, or needs to identify trending content strategies for campaign planning. The tool pulls recent trending videos using the hashtag(s) and analyzes patterns across them. Examples: 'what's trending with #fitness on TikTok', 'analyze #skincare trend', 'show me trending #nike videos'",
            "parameters": {
                "type": "object",
                "properties": {
                    "hashtags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Array of hashtag(s) to analyze (without # symbol). Can be single ['fitness'] or multiple ['fitness', 'gym', 'workout'] for broader analysis. Use trending or relevant hashtags for the user's industry/topic."
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
            scrape_result = self.memories_client.upload_from_hashtag(
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
            
        except Exception as e:
            logger.error(f"Error analyzing trend: {str(e)}")
            return self.fail_response(f"Failed to analyze trend: {str(e)}")
    
    # ============ NEW TOOLS: TRENDING CONTENT & MARKETER CHAT ============
    
    @openapi_schema({
        "name": "search_trending_content",
        "description": "Search and analyze trending videos from 1M+ indexed public videos on TikTok/YouTube/Instagram. This accesses memories.ai's massive database of trending content to find viral videos, understand what's working in your niche, and identify content opportunities. Perfect for competitive research, trend analysis, and content ideation.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language search query (e.g., 'What are the trending fitness videos on TikTok?', 'Show me viral Nike campaigns', 'What's working for skincare brands on Instagram?')"
                },
                "platform": {
                    "type": "string",
                    "description": "Platform to search (default: TIKTOK)",
                    "enum": ["TIKTOK", "YOUTUBE", "INSTAGRAM"],
                    "default": "TIKTOK"
                }
            },
            "required": ["query"]
        }
    })
    async def search_trending_content(
        self,
        query: str,
        platform: str = "TIKTOK"
    ) -> ToolResult:
        """Search 1M+ indexed videos for trends and insights"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            logger.info(f"Searching trending content: {query} on {platform}")
            result = self.memories_client.marketer_chat(
                prompt=query,
                platform=platform.upper(),
                unique_id=user_id
            )
            
            content = result.get("content", "")
            refs = result.get("refs", [])
            
            # Extract referenced videos
            referenced_videos = []
            for ref in refs:
                video = ref.get("video", {})
                if video:
                    referenced_videos.append({
                        "video_no": video.get("video_no"),
                        "title": video.get("video_name"),
                        "duration": video.get("duration")
                    })
            
            return self.success_response({
                "query": query,
                "platform": platform,
                "analysis": content,
                "referenced_videos": referenced_videos,
                "video_count": len(referenced_videos)
            })
            
        except Exception as e:
            logger.error(f"Error searching trending content: {str(e)}")
            return self.fail_response(f"Failed to search trending content: {str(e)}")
    
    # ============ IMAGE TOOLS ============
    
    @openapi_schema({
        "name": "upload_image",
        "description": "Upload image(s) to your personal library for similarity search and analysis. Supports multiple images at once.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_paths": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Paths to image files in the sandbox (e.g., ['/workspace/uploads/image.png'])"
                }
            },
            "required": ["file_paths"]
        }
    })
    async def upload_image(
        self,
        file_paths: List[str]
    ) -> ToolResult:
        """Upload images for similarity search"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            sandbox = self.thread_manager.agent_run.sandbox
            
            # Download images from sandbox to temp files
            temp_files = []
            for file_path in file_paths:
                try:
                    content = sandbox.fs.download_file(file_path)
                    temp_path = f"/tmp/memories_img_{os.path.basename(file_path)}"
                    with open(temp_path, 'wb') as f:
                        f.write(content)
                    temp_files.append(temp_path)
                except Exception as e:
                    logger.warning(f"Failed to download {file_path}: {str(e)}")
            
            if not temp_files:
                return self.fail_response("No valid image files found")
            
            result = self.memories_client.upload_image_from_file(
                file_paths=temp_files,
                unique_id=user_id
            )
            
            # Cleanup temp files
            for temp_path in temp_files:
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            uploaded_count = len(result.get("data", []))
            
            return self.success_response({
                "message": f"Successfully uploaded {uploaded_count} image(s)",
                "count": uploaded_count,
                "note": "Images can now be used for similarity search to find matching content"
            })
            
        except Exception as e:
            logger.error(f"Error uploading images: {str(e)}")
            return self.fail_response(f"Failed to upload images: {str(e)}")
    
    @openapi_schema({
        "name": "search_similar_images",
        "description": "Find visually similar images or videos in your library or public platforms. Upload a reference image and find matching content.",
        "parameters": {
            "type": "object",
            "properties": {
                "image_path": {
                    "type": "string",
                    "description": "Path to reference image in sandbox"
                },
                "search_type": {
                    "type": "string",
                    "description": "Where to search",
                    "enum": ["private", "public_tiktok", "public_youtube", "public_instagram"],
                    "default": "private"
                },
                "similarity_threshold": {
                    "type": "number",
                    "description": "Minimum similarity score (0.0-1.0, default: 0.8)",
                    "default": 0.8
                }
            },
            "required": ["image_path"]
        }
    })
    async def search_similar_images(
        self,
        image_path: str,
        search_type: str = "private",
        similarity_threshold: float = 0.8
    ) -> ToolResult:
        """Search for visually similar content"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            sandbox = self.thread_manager.agent_run.sandbox
            
            # Download image from sandbox
            content = sandbox.fs.download_file(image_path)
            temp_path = f"/tmp/memories_search_{os.path.basename(image_path)}"
            with open(temp_path, 'wb') as f:
                f.write(content)
            
            try:
                if search_type == "private":
                    result = self.memories_client.search_similar_images(
                        file_path=temp_path,
                        unique_id=user_id,
                        similarity=similarity_threshold
                    )
                else:
                    platform = search_type.replace("public_", "").upper()
                    result = self.memories_client.search_public_similar_images(
                        file_path=temp_path,
                        platform=platform,
                        similarity=similarity_threshold
                    )
                
                results = result.get("results", [])
                
                return self.success_response({
                    "search_type": search_type,
                    "similarity_threshold": similarity_threshold,
                    "matches_found": len(results),
                    "results": results[:20]  # Limit to top 20
                })
                
            finally:
                os.remove(temp_path)
            
        except Exception as e:
            logger.error(f"Error searching similar images: {str(e)}")
            return self.fail_response(f"Failed to search similar images: {str(e)}")
    
    # ============ VIDEO MANAGEMENT TOOLS ============
    
    @openapi_schema({
        "name": "list_my_videos",
        "description": "List all videos in your personal library with optional filtering by name or status.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of videos to return (default: 50)",
                    "default": 50
                },
                "filter_name": {
                    "type": "string",
                    "description": "Optional: Filter by video name"
                },
                "filter_status": {
                    "type": "string",
                    "description": "Optional: Filter by status (PARSE, UNPARSE, FAILED)"
                }
            }
        }
    })
    async def list_my_videos(
        self,
        limit: int = 50,
        filter_name: Optional[str] = None,
        filter_status: Optional[str] = None
    ) -> ToolResult:
        """List user's video library"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.list_videos(
                page=1,
                size=min(limit, 200),
                unique_id=user_id,
                video_name=filter_name,
                status=filter_status
            )
            
            videos = result.get("videos", [])
            total_count = result.get("total_count", 0)
            
            return self.success_response({
                "total_videos": total_count,
                "showing": len(videos),
                "videos": videos
            })
            
        except Exception as e:
            logger.error(f"Error listing videos: {str(e)}")
            return self.fail_response(f"Failed to list videos: {str(e)}")
    
    @openapi_schema({
        "name": "delete_videos",
        "description": "Delete one or more videos from your library to free up space.",
        "parameters": {
            "type": "object",
            "properties": {
                "video_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of video IDs to delete"
                }
            },
            "required": ["video_ids"]
        }
    })
    async def delete_videos(
        self,
        video_ids: List[str]
    ) -> ToolResult:
        """Delete videos from library"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            self.memories_client.delete_videos(
                video_nos=video_ids,
                unique_id=user_id
            )
            
            return self.success_response({
                "message": f"Successfully deleted {len(video_ids)} video(s)",
                "deleted_count": len(video_ids)
            })
            
        except Exception as e:
            logger.error(f"Error deleting videos: {str(e)}")
            return self.fail_response(f"Failed to delete videos: {str(e)}")
    
    @openapi_schema({
        "name": "get_video_summary",
        "description": "Generate a structured summary of a video with chapters or topics. Useful for long-form content analysis.",
        "parameters": {
            "type": "object",
            "properties": {
                "video_id": {
                    "type": "string",
                    "description": "Video ID to summarize"
                },
                "summary_type": {
                    "type": "string",
                    "description": "Type of summary",
                    "enum": ["CHAPTER", "TOPIC"],
                    "default": "CHAPTER"
                }
            },
            "required": ["video_id"]
        }
    })
    async def get_video_summary(
        self,
        video_id: str,
        summary_type: str = "CHAPTER"
    ) -> ToolResult:
        """Generate video summary with chapters or topics"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.generate_summary(
                video_no=video_id,
                summary_type=summary_type.upper(),
                unique_id=user_id
            )
            
            summary = result.get("summary", "")
            items = result.get("items", [])
            
            return self.success_response({
                "video_id": video_id,
                "summary_type": summary_type,
                "summary": summary,
                "items": items,
                "chapter_count": len(items)
            })
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return self.fail_response(f"Failed to generate summary: {str(e)}")
    
    @openapi_schema({
        "name": "get_video_details",
        "description": "Get complete metadata for a video including duration, resolution, fps, file size, and processing status.",
        "parameters": {
            "type": "object",
            "properties": {
                "video_id": {
                    "type": "string",
                    "description": "Video ID to get details for"
                }
            },
            "required": ["video_id"]
        }
    })
    async def get_video_details(
        self,
        video_id: str
    ) -> ToolResult:
        """Get complete video metadata"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            details = self.memories_client.get_private_video_details(
                video_no=video_id,
                unique_id=user_id
            )
            
            return self.success_response(details)
            
        except Exception as e:
            logger.error(f"Error getting video details: {str(e)}")
            return self.fail_response(f"Failed to get video details: {str(e)}")
    
    @openapi_schema({
        "name": "download_video_file",
        "description": "Download a video file from your library to the sandbox. Useful for editing or sharing.",
        "parameters": {
            "type": "object",
            "properties": {
                "video_id": {
                    "type": "string",
                    "description": "Video ID to download"
                },
                "save_path": {
                    "type": "string",
                    "description": "Path in sandbox to save video (e.g., '/workspace/downloads/video.mp4')"
                }
            },
            "required": ["video_id", "save_path"]
        }
    })
    async def download_video_file(
        self,
        video_id: str,
        save_path: str
    ) -> ToolResult:
        """Download video file to sandbox"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            sandbox = self.thread_manager.agent_run.sandbox
            
            # Download video binary
            video_content = self.memories_client.download_video(
                video_no=video_id,
                unique_id=user_id
            )
            
            # Upload to sandbox
            sandbox.fs.upload_file(save_path, video_content)
            
            file_size_mb = len(video_content) / (1024 * 1024)
            
            return self.success_response({
                "message": f"Video downloaded successfully to {save_path}",
                "path": save_path,
                "size_mb": round(file_size_mb, 2)
            })
            
        except Exception as e:
            logger.error(f"Error downloading video: {str(e)}")
            return self.fail_response(f"Failed to download video: {str(e)}")
    
    # ============ SESSION & CHAT HISTORY TOOLS ============
    
    @openapi_schema({
        "name": "list_chat_sessions",
        "description": "List all video chat sessions to review past conversations and analyses.",
        "parameters": {
            "type": "object",
            "properties": {
                "page": {
                    "type": "integer",
                    "description": "Page number (default: 1)",
                    "default": 1
                }
            }
        }
    })
    async def list_chat_sessions(
        self,
        page: int = 1
    ) -> ToolResult:
        """List chat sessions"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.list_sessions(
                page=page,
                unique_id=user_id
            )
            
            sessions = result.get("sessions", [])
            total_count = result.get("total_count", 0)
            
            return self.success_response({
                "sessions": sessions,
                "total_sessions": total_count,
                "page": page
            })
            
        except Exception as e:
            logger.error(f"Error listing sessions: {str(e)}")
            return self.fail_response(f"Failed to list sessions: {str(e)}")
    
    @openapi_schema({
        "name": "get_session_history",
        "description": "Get the full conversation history for a chat session, including all questions, answers, and referenced videos.",
        "parameters": {
            "type": "object",
            "properties": {
                "session_id": {
                    "type": "string",
                    "description": "Session ID to retrieve"
                }
            },
            "required": ["session_id"]
        }
    })
    async def get_session_history(
        self,
        session_id: str
    ) -> ToolResult:
        """Get session conversation history"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.get_session_detail(
                session_id=session_id,
                unique_id=user_id
            )
            
            return self.success_response(result)
            
        except Exception as e:
            logger.error(f"Error getting session history: {str(e)}")
            return self.fail_response(f"Failed to get session history: {str(e)}")
    
    @openapi_schema({
        "name": "chat_with_media",
        "description": "Chat with your personal media library (videos + images combined). Ask questions across all your uploaded content.",
        "parameters": {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "Question to ask about your media (e.g., 'When did I go to the beach?', 'Show me all fitness videos')"
                }
            },
            "required": ["question"]
        }
    })
    async def chat_with_media(
        self,
        question: str
    ) -> ToolResult:
        """Chat with videos + images combined"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.chat_personal(
                prompt=question,
                unique_id=user_id
            )
            
            content = result.get("content", "")
            refs = result.get("refs", [])
            
            return self.success_response({
                "question": question,
                "answer": content,
                "references": refs,
                "reference_count": len(refs)
            })
            
        except Exception as e:
            logger.error(f"Error chatting with media: {str(e)}")
            return self.fail_response(f"Failed to chat with media: {str(e)}")
    
    # ============ ADVANCED TRANSCRIPTION TOOLS ============
    
    @openapi_schema({
        "name": "update_transcription",
        "description": "Update a video's transcription with a custom prompt. Useful for specialized descriptions (e.g., e-commerce product descriptions).",
        "parameters": {
            "type": "object",
            "properties": {
                "video_id": {
                    "type": "string",
                    "description": "Video ID to update"
                },
                "custom_prompt": {
                    "type": "string",
                    "description": "Custom instruction for transcription (e.g., 'Describe this video as an e-commerce product listing')"
                }
            },
            "required": ["video_id", "custom_prompt"]
        }
    })
    async def update_transcription(
        self,
        video_id: str,
        custom_prompt: str
    ) -> ToolResult:
        """Update video transcription with custom prompt"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.update_video_transcription(
                video_no=video_id,
                prompt=custom_prompt,
                unique_id=user_id
            )
            
            return self.success_response({
                "message": "Transcription update initiated",
                "video_id": video_id,
                "note": "Transcription will be permanently updated. This may take a few moments."
            })
            
        except Exception as e:
            logger.error(f"Error updating transcription: {str(e)}")
            return self.fail_response(f"Failed to update transcription: {str(e)}")
    
    @openapi_schema({
        "name": "get_audio_transcript",
        "description": "Get audio-only transcription of a video. Useful for podcasts or audio-focused content.",
        "parameters": {
            "type": "object",
            "properties": {
                "video_id": {
                    "type": "string",
                    "description": "Video ID to transcribe"
                }
            },
            "required": ["video_id"]
        }
    })
    async def get_audio_transcript(
        self,
        video_id: str
    ) -> ToolResult:
        """Get audio-only transcription"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.get_audio_transcription(
                video_no=video_id,
                unique_id=user_id
            )
            
            transcriptions = result.get("transcriptions", [])
            
            # Format as continuous text
            full_transcript = " ".join([t.get("content", "") for t in transcriptions])
            word_count = len(full_transcript.split())
            
            return self.success_response({
                "transcript": full_transcript,
                "segments": transcriptions,
                "word_count": word_count
            })
            
        except Exception as e:
            logger.error(f"Error getting audio transcript: {str(e)}")
            return self.fail_response(f"Failed to get audio transcript: {str(e)}")
    
    # ============ IMAGE LIBRARY TOOLS ============
    
    @openapi_schema({
        "name": "list_my_images",
        "description": "List all images in your personal library.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of images to return (default: 50)",
                    "default": 50
                }
            }
        }
    })
    async def list_my_images(
        self,
        limit: int = 50
    ) -> ToolResult:
        """List user's image library"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            result = self.memories_client.list_images(
                page=1,
                page_size=min(limit, 100),
                unique_id=user_id
            )
            
            images = result.get("images", [])
            total_count = result.get("total_count", 0)
            
            return self.success_response({
                "total_images": total_count,
                "showing": len(images),
                "images": images
            })
            
        except Exception as e:
            logger.error(f"Error listing images: {str(e)}")
            return self.fail_response(f"Failed to list images: {str(e)}")
    
    # ============ ADVANCED SEARCH TOOLS ============
    
    @openapi_schema({
        "name": "search_audio",
        "description": "Search through audio transcripts to find specific spoken content in your videos or public content.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query for audio content"
                },
                "search_type": {
                    "type": "string",
                    "description": "Where to search",
                    "enum": ["private", "public"],
                    "default": "private"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum results (default: 50)",
                    "default": 50
                }
            },
            "required": ["query"]
        }
    })
    async def search_audio(
        self,
        query: str,
        search_type: str = "private",
        limit: int = 50
    ) -> ToolResult:
        """Search audio transcripts"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            
            if search_type == "private":
                result = self.memories_client.search_audio_transcripts(
                    query=query,
                    page=1,
                    page_size=limit,
                    unique_id=user_id
                )
            else:
                result = self.memories_client.search_public_audio_transcripts(
                    query=query,
                    page=1,
                    page_size=limit
                )
            
            results = result.get("results", [])
            total = result.get("total", 0)
            
            return self.success_response({
                "query": query,
                "search_type": search_type,
                "results_found": total,
                "results": results
            })
            
        except Exception as e:
            logger.error(f"Error searching audio: {str(e)}")
            return self.fail_response(f"Failed to search audio: {str(e)}")
    
    @openapi_schema({
        "name": "search_clips_by_image",
        "description": "Find specific moments in a video that match a reference image. Useful for finding when a person, object, or scene appears.",
        "parameters": {
            "type": "object",
            "properties": {
                "video_id": {
                    "type": "string",
                    "description": "Video ID to search in"
                },
                "image_path": {
                    "type": "string",
                    "description": "Path to reference image in sandbox"
                },
                "search_prompt": {
                    "type": "string",
                    "description": "What to look for (e.g., 'Find scenes with this person', 'Find when this product appears')"
                }
            },
            "required": ["video_id", "image_path", "search_prompt"]
        }
    })
    async def search_clips_by_image(
        self,
        video_id: str,
        image_path: str,
        search_prompt: str
    ) -> ToolResult:
        """Find video clips matching an image"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            user_id = await self._get_memories_user_id()
            sandbox = self.thread_manager.agent_run.sandbox
            
            # Download image from sandbox
            content = sandbox.fs.download_file(image_path)
            temp_path = f"/tmp/memories_clip_search_{os.path.basename(image_path)}"
            with open(temp_path, 'wb') as f:
                f.write(content)
            
            try:
                clips = self.memories_client.search_clips_by_image(
                    file_path=temp_path,
                    video_no=video_id,
                    prompt=search_prompt,
                    unique_id=user_id
                )
                
                return self.success_response({
                    "video_id": video_id,
                    "search_prompt": search_prompt,
                    "clips_found": len(clips),
                    "clips": clips
                })
                
            finally:
                os.remove(temp_path)
            
        except Exception as e:
            logger.error(f"Error searching clips by image: {str(e)}")
            return self.fail_response(f"Failed to search clips by image: {str(e)}")


