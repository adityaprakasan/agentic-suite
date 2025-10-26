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
        
        # Initialize memories.ai client (allow None for graceful degradation)
        try:
            self.memories_client = get_memories_client(api_key=api_key)
            
            if self.memories_client is None:
                logger.warning(f"   ⚠️  memories_client is None - tool will be available but methods will fail gracefully")
                logger.warning(f"   API_KEY={'SET' if api_key else 'NOT SET'}, Length={len(api_key) if api_key else 0}")
            else:
                logger.error(f"   ✅ memories_client initialized successfully")
        except Exception as e:
            logger.error(f"   ❌ Exception during client initialization: {str(e)}")
            self.memories_client = None
        
        self.db = DBConnection()
    
    def success_response(self, data: Any) -> ToolResult:
        """Create success ToolResult"""
        return ToolResult(success=True, output=data)
    
    def fail_response(self, error: str) -> ToolResult:
        """Create failure ToolResult"""
        return ToolResult(success=False, output={"error": error})
    
    def _check_client_initialized(self) -> Optional[ToolResult]:
        """Check if memories client is initialized, return error ToolResult if not"""
        if not self.memories_client:
            return self.fail_response(
                "Memories.ai client not initialized. Please ensure MEMORIES_AI_API_KEY environment variable is set correctly."
            )
        return None
    
    def _validate_video_id(self, video_id: str) -> tuple[bool, Optional[str]]:
        """
        Validate video ID format
        Returns: (is_valid, error_message)
        
        Valid formats:
        - VI* = Private video (e.g., VI568102998803353600)
        - PI-* = Public video (e.g., PI-594886569698136064)
        """
        if not video_id:
            return False, "Video ID cannot be empty"
        
        if video_id.startswith("VI") or video_id.startswith("PI"):
            return True, None
        
        return False, f"Invalid video ID format: '{video_id}'. Must start with 'VI' (private) or 'PI' (public). Example: VI568102998803353600 or PI-594886569698136064"
    
    async def _get_memories_user_id(self) -> str:
        """Get or create memories.ai user_id for current account"""
        try:
            agent_config = getattr(self.thread_manager, 'agent_config', {})
            account_id = agent_config.get('account_id')
            
            if not account_id:
                raise ValueError("No account_id found in agent config")
            
            client = await self.db.client
            
            # Get existing memories_user_id from account_settings (public schema)
            result = await client.table('account_settings').select('memories_user_id').eq('account_id', account_id).maybe_single().execute()
            
            if result.data and result.data.get('memories_user_id'):
                return result.data['memories_user_id']
            
            # Generate new memories_user_id
            memories_user_id = str(uuid.uuid4())
            
            # Upsert into account_settings
            await client.table('account_settings').upsert({
                'account_id': account_id,
                'memories_user_id': memories_user_id
            }).execute()
            
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
            "description": "Upload video from URL (YouTube, TikTok, Instagram, direct link) for analysis.",
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
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of tags for organizing and searching videos (e.g., ['campaign', 'Q1-2024', 'nike', 'social-media']). Up to 20 tags supported."
                    },
                    "transcription_prompt": {
                        "type": "string",
                        "description": "Optional custom prompt to guide video transcription/analysis. Use this to focus on specific aspects (e.g., 'Focus on product mentions and prices', 'Describe visual styling and color palette', 'Extract all spoken dialogue verbatim')"
                    },
                    "quality": {
                        "type": "integer",
                        "description": "Optional video quality/resolution for YouTube videos (480, 720, 1080). Default 720. Final resolution will be <= specified value based on source. Only effective for YouTube URLs; other platforms use original resolution.",
                        "default": 720,
                        "enum": [480, 720, 1080]
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
        save_to_kb: bool = True,
        tags: Optional[List[str]] = None,
        transcription_prompt: Optional[str] = None,
        quality: int = 720
    ) -> ToolResult:
        """Upload a video from URL"""
        try:
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            # DEFENSIVE: Convert parameters to strings if they're lists
            if isinstance(url, list):
                url = url[0] if url else ""
                logger.warning(f"URL was passed as list, using first item: {url}")
            if isinstance(title, list):
                title = " ".join(str(t) for t in title)
                logger.warning(f"Title was passed as list, converted to: {title}")
            
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
                    urls=[url],  # ✅ Correct parameter name
                    unique_id=user_id,
                    quality=quality  # ✅ Pass user-specified quality
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
                    unique_id=user_id,
                    tags=tags,
                    video_transcription_prompt=transcription_prompt
                )
            
            result_data = {
                "video_id": video_meta.video_id,
                "title": title,
                "url": url,
                "video_url": url,  # For embedding in frontend
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
            "description": "Upload video file from local storage or sandbox for analysis.",
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
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of tags for organizing and searching videos (e.g., ['meeting', 'Q4-2024', 'client-review', 'internal']). Up to 20 tags supported."
                    },
                    "transcription_prompt": {
                        "type": "string",
                        "description": "Optional custom prompt to guide video transcription/analysis. Use this to focus on specific aspects (e.g., 'Extract action items from meeting', 'Describe all products shown', 'Transcribe all spoken dialogue verbatim')"
                    },
                    "datetime_taken": {
                        "type": "string",
                        "description": "Optional date/time when video was captured (format: YYYY-MM-DD HH:MM:SS). Useful for organizing videos chronologically, especially for phone/camera uploads."
                    },
                    "camera_model": {
                        "type": "string",
                        "description": "Optional camera model metadata (e.g., 'iPhone 15 Pro', 'Canon EOS R5'). Useful for tracking video source and quality."
                    },
                    "latitude": {
                        "type": "string",
                        "description": "Optional GPS latitude where video was captured (e.g., '40.7128'). Useful for location-based organization."
                    },
                    "longitude": {
                        "type": "string",
                        "description": "Optional GPS longitude where video was captured (e.g., '-74.0060'). Useful for location-based organization."
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
        save_to_kb: bool = True,
        tags: Optional[List[str]] = None,
        transcription_prompt: Optional[str] = None,
        datetime_taken: Optional[str] = None,
        camera_model: Optional[str] = None,
        latitude: Optional[str] = None,
        longitude: Optional[str] = None
    ) -> ToolResult:
        """Upload video file from local storage"""
        try:
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            user_id = await self._get_memories_user_id()
            
            # Get sandbox instance from thread_manager
            if not hasattr(self.thread_manager, 'sandbox') or not self.thread_manager.sandbox:
                return self.fail_response("Sandbox not available. Cannot access uploaded files.")
            
            sandbox = self.thread_manager.sandbox
            
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
                    unique_id=user_id,
                    tags=tags,
                    video_transcription_prompt=transcription_prompt,
                    datetime_taken=datetime_taken,
                    camera_model=camera_model,
                    latitude=latitude,
                    longitude=longitude
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
                "video_url": video_meta.video_url if hasattr(video_meta, 'video_url') else None,  # For embedding
                "thumbnail_url": video_meta.thumbnail_url if hasattr(video_meta, 'thumbnail_url') else None,
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
            "name": "get_transcript",
            "description": "Extract timestamped transcript from a video.",
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            user_id = await self._get_memories_user_id()
            
            # Get transcription based on video type
            if video_id.startswith("VI"):
                # Private video
                transcript_response = self.memories_client.get_video_transcription(
                    video_no=video_id,
                    unique_id=user_id
                )
            elif video_id.startswith("PI"):
                # Public video
                transcript_response = self.memories_client.get_public_video_transcription(
                    video_no=video_id
                )
            else:
                raise ValueError(f"Invalid video ID format: {video_id}. Must start with 'VI' (private) or 'PI' (public)")
            
            # Extract transcriptions array
            transcript_data = transcript_response.get("transcriptions", [])
            
            # Combine transcripts into text
            transcript = "\n".join([
                f"[{t.get('startTime')}-{t.get('endTime')}s] {t.get('content', '')}"
                for t in transcript_data
            ])
            
            # Get video details for embedding
            try:
                if video_id.startswith("VI"):
                    video_details = self.memories_client.get_private_video_details(
                        video_no=video_id, 
                        unique_id=user_id
                    )
                else:
                    video_details = self.memories_client.get_public_video_detail(
                        video_no=video_id
                    )
                
                video_metadata = {
                    "video_id": video_id,
                    "title": video_details.get("video_name", "Video"),
                    "url": video_details.get("video_url"),
                    "duration": video_details.get("duration"),
                    "thumbnail_url": video_details.get("thumbnail_url") if "thumbnail_url" in video_details else None
                }
            except Exception as e:
                logger.warning(f"Could not get video details for {video_id}: {e}")
                video_metadata = {"video_id": video_id, "title": "Video"}

            return self.success_response({
                "video_id": video_id,
                "transcript": transcript,
                "word_count": len(transcript.split()) if transcript else 0,
                "video": video_metadata
            })
            
        except Exception as e:
            logger.error(f"Error getting transcript: {str(e)}")
            return self.fail_response(f"Failed to get transcript: {str(e)}")
    
    # Video Chat/Query
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "query_video",
            "description": "Ask questions about a video. Supports multi-turn Q&A with session context.",
            "parameters": {
                "type": "object",
                "properties": {
                    "video_id": {
                        "type": "string",
                        "description": "Video ID from memories.ai (VI-... for uploaded, PI-... for platform videos)"
                    },
                    "question": {
                        "type": "string",
                        "description": "Question about the video. Be precise and contextual. Examples: 'Where does the speaker mention pricing?', 'What products are shown?', 'When does the CTA appear?', 'Tell me more about that product' (in follow-up with session_id)"
                    },
                    "session_id": {
                        "type": "string",
                        "description": "Optional: Session ID from previous query_video call. Provide this to continue the conversation with full context. Example: User asks 'What products appear?' then 'Tell me more about the Nike shoes' - use session_id to maintain context about which video and previous discussion."
                    }
                },
                "required": ["video_id", "question"]
            }
        }
    })
    async def query_video(
        self, 
        video_id: str, 
        question: str,
        session_id: Optional[str] = None
    ) -> ToolResult:
        """Ask questions about a video with conversation context"""
        try:
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            user_id = await self._get_memories_user_id()
            agent_config = getattr(self.thread_manager, 'agent_config', {})
            account_id = agent_config.get('account_id')
            
            logger.info(f"Querying video {video_id}: {question} (session: {session_id})")
            
            # Chat with video (with session context)
            result = self.memories_client.chat_with_video(
                video_nos=[video_id],
                prompt=question,
                unique_id=user_id,
                session_id=session_id  # ✅ Pass session for context
            )
            
            # Extract response (result is now the data dict directly)
            answer = result.get("content", "")
            refs = result.get("refs", [])
            returned_session_id = result.get("session_id")
            
            # Get video details for UI rendering
            video_metadata = None
            try:
                if video_id.startswith("VI"):
                    # Private video
                    video_details = self.memories_client.get_private_video_details(
                        video_no=video_id,
                        unique_id=user_id
                    )
                    video_metadata = {
                        "video_id": video_id,
                        "video_no": video_id,
                        "title": video_details.get("video_name", ""),
                        "duration": video_details.get("duration"),
                        "url": video_details.get("video_url"),
                        "thumbnail_url": None,  # Private videos may not have thumbnail
                        "type": "private"
                    }
                elif video_id.startswith("PI"):
                    # Public platform video
                    video_details = self.memories_client.get_public_video_detail(video_no=video_id)
                    video_metadata = {
                        "video_id": video_id,
                        "video_no": video_id,
                        "title": video_details.get("video_name", ""),
                        "duration": video_details.get("duration"),
                        "url": video_details.get("video_url"),
                        "thumbnail_url": None,  # Can be derived from platform URL
                        "platform": "public",
                        "view_count": video_details.get("view_count"),
                        "like_count": video_details.get("like_count")
                    }
            except Exception as e:
                logger.warning(f"Failed to fetch video metadata: {str(e)}")
            
            # Save/update session in database
            if returned_session_id and account_id:
                try:
                    client = await self.db.client
                    
                    existing = await client.table('memories_chat_sessions').select('id, video_ids').eq(
                        'session_id', returned_session_id
                    ).eq('account_id', account_id).execute()
                    
                    if existing.data:
                        # Update existing session
                        existing_video_ids = existing.data[0].get('video_ids', []) or []
                        if video_id not in existing_video_ids:
                            existing_video_ids.append(video_id)
                        
                        await client.table('memories_chat_sessions').update({
                            'last_prompt': question,
                            'last_message_at': 'now()',
                            'video_ids': existing_video_ids
                        }).eq('id', existing.data[0]['id']).execute()
                    else:
                        # Create new session
                        await client.table('memories_chat_sessions').insert({
                            'account_id': account_id,
                            'session_id': returned_session_id,
                            'memories_user_id': user_id,
                            'session_type': 'video_chat',
                            'title': question[:100],
                            'last_prompt': question,
                            'video_ids': [video_id]
                        }).execute()
                    
                    logger.info(f"Saved video chat session: {returned_session_id}")
                except Exception as e:
                    logger.warning(f"Failed to save session: {str(e)}")
            
            return self.success_response({
                "video_id": video_id,
                "question": question,
                "answer": answer,
                "session_id": returned_session_id,
                "refs": refs,
                "video": video_metadata,  # ✅ For UI rendering
                "conversation_hint": "💡 Use this session_id in your next question to maintain conversation context!"
            })
            
        except Exception as e:
            logger.error(f"Error querying video: {str(e)}")
            return self.fail_response(f"Failed to query video: {str(e)}")
    
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "search_platform_videos",
            "description": "Find and retrieve specific videos from TikTok, YouTube, Instagram, or LinkedIn. Use when user wants VIDEO RESULTS (e.g., 'find videos by MrBeast', 'show me Nike's TikToks', 'get top videos about fitness'). Returns actual videos with thumbnails, titles, stats, and links.",
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
                        "description": "Search query - use creator names, brand names, hashtags, or topics. Examples: 'mrbeast' (for MrBeast's videos), 'nike' (for Nike content), '#fitness' (for fitness hashtag), 'workout tutorial' (for topic search)"
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
        """Search for videos on social platforms - SIMPLIFIED VERSION"""
        try:
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            # Defensive: ensure parameters are strings (shouldn't happen, but prevents crashes)
            query = str(query) if not isinstance(query, str) else query
            platform = str(platform) if not isinstance(platform, str) else platform
            
            # Map platform names to API format
            platform_map = {'tiktok': 'TIKTOK', 'youtube': 'YOUTUBE', 'instagram': 'INSTAGRAM', 'linkedin': 'LINKEDIN'}
            platform_type = platform_map.get(platform.lower(), 'TIKTOK')
            
            logger.info(f"Searching {platform_type} for: '{query}' (limit: {limit})")
            
            # Call Memories.ai search API
            results = self.memories_client.search_public_videos(
                query=query,
                platform=platform_type,
                search_type="BY_VIDEO",
                top_k=min(limit, 50),
                filtering_level="medium"
            )
            
            if not results:
                return self.success_response({
                    "platform": platform,
                    "query": query,
                    "results_count": 0,
                    "videos": [],
                    "message": f"No {platform} videos found for '{query}'"
                })
            
            # Get details for each video in parallel (faster)
            import asyncio
            
            async def get_video_details(video_item):
                """Fetch video details with error handling"""
                video_no = video_item.get("videoNo") or video_item.get("video_no")
                if not video_no:
                    return None
                
                try:
                    # Get full metadata from API
                    details = await asyncio.to_thread(
                        self.memories_client.get_public_video_detail,
                        video_no=video_no
                    )
                    
                    # Safe int parser
                    def to_int(val):
                        try:
                            return int(val) if val else None
                        except (ValueError, TypeError):
                            return None
                    
                    # Extract raw fields
                    api_video_url = details.get("video_url") or ""
                    title = str(details.get("video_name") or "Untitled")
                    blogger_id = str(details.get("blogger_id") or "")
                    
                    # ===== PLATFORM-SPECIFIC URL CONSTRUCTION =====
                    # Construct web URLs and thumbnails based on platform
                    web_url = ""
                    thumbnail_url = ""
                    embed_url = api_video_url  # For iframe embedding
                    
                    if platform.lower() == 'tiktok':
                        # TikTok: api_video_url is iframe player, construct web URL
                        # Example: https://www.tiktok.com/player/v1/7543855594466266423
                        if 'tiktok.com/player/v1/' in api_video_url:
                            video_id = api_video_url.split('/')[-1]
                            if blogger_id:
                                web_url = f"https://www.tiktok.com/@{blogger_id}/video/{video_id}"
                        # TikTok doesn't provide thumbnails via API - frontend will show fallback
                        
                    elif platform.lower() == 'youtube':
                        # YouTube: api_video_url is watch URL, construct thumbnail
                        # Example: https://www.youtube.com/watch?v=V8ZgthCwvl8
                        web_url = api_video_url  # Use as-is for web link
                        if 'youtube.com/watch?v=' in api_video_url:
                            video_id = api_video_url.split('v=')[-1].split('&')[0]
                            thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                            embed_url = f"https://www.youtube.com/embed/{video_id}"
                        elif 'youtu.be/' in api_video_url:
                            video_id = api_video_url.split('youtu.be/')[-1].split('?')[0]
                            thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                            embed_url = f"https://www.youtube.com/embed/{video_id}"
                            web_url = f"https://www.youtube.com/watch?v={video_id}"
                    
                    elif platform.lower() == 'instagram':
                        # Instagram: use api_video_url as web URL
                        web_url = api_video_url
                        # Instagram doesn't provide thumbnails via API
                    
                    return {
                        # Primary fields
                        "video_no": video_no,
                        "title": title,
                        "platform": platform,
                        "url": embed_url or web_url,  # For iframe/embed (YouTube embed, TikTok player, or web fallback)
                        "web_url": web_url or api_video_url,  # For "open in new tab"
                        "thumbnail_url": thumbnail_url,
                        "duration": to_int(details.get("duration")),
                        "duration_seconds": to_int(details.get("duration")),
                        "view_count": to_int(details.get("view_count")),
                        "like_count": to_int(details.get("like_count")),
                        "share_count": to_int(details.get("share_count")),
                        "comment_count": to_int(details.get("comment_count")),
                        "creator": blogger_id,
                        "description": str(details.get("description") or details.get("video_name") or ""),
                        "score": float(video_item.get("score", 0)),
                        # Frontend-compatible aliases
                        "video_name": title,
                        "share_url": web_url,  # Another alias
                        "video_url": api_video_url,  # Original API URL
                        "cover_url": thumbnail_url,
                        "img_url": thumbnail_url,
                        "blogger_id": blogger_id,
                        "author": blogger_id,
                    }
                    
                except Exception as e:
                    logger.warning(f"Couldn't fetch details for {video_no}: {e}")
                    # Return minimal data from search result (with frontend-compatible aliases)
                    title = str(video_item.get("videoName") or "Untitled")
                    return {
                        "video_no": video_no,
                        "title": title,
                        "video_name": title,
                        "platform": platform,
                        "score": float(video_item.get("score", 0))
                    }
            
            # Fetch all video details concurrently
            tasks = [get_video_details(v) for v in results[:limit]]
            videos = await asyncio.gather(*tasks)
            
            # Filter out None results
            videos = [v for v in videos if v is not None]
            
            return self.success_response({
                "platform": platform,
                "query": query,
                "results_count": len(videos),
                "videos": videos,
                "message": f"Found {len(videos)} {platform} videos for '{query}'"
            })
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error in search_platform_videos: {error_msg}", exc_info=True)
            return self.fail_response(f"Search failed: {error_msg}")
    
    # Human Re-identification
    
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "analyze_creator",
            "description": "ASYNC SCRAPE TOOL (1-2 min): Download creator's videos to personal library for deep analysis. Use ONLY when user explicitly wants to SAVE/ARCHIVE a creator's content for future reference. For quick searches, use search_platform_videos instead.",
            "parameters": {
                "type": "object",
                "properties": {
                    "creator_url": {
                        "type": "string",
                        "description": "Creator's profile URL or handle. Flexible formats accepted: '@cutshall73' (assumes TikTok), 'cutshall73' (adds @ for TikTok), 'tiktok.com/@cutshall73', 'https://www.tiktok.com/@cutshall73', 'instagram.com/nike', 'youtube.com/@channel'. The tool automatically normalizes URLs and preserves @ symbols for TikTok handles."
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            # DEFENSIVE: Convert parameters to strings if they're lists
            if isinstance(creator_url, list):
                creator_url = creator_url[0] if creator_url else ""
                logger.warning(f"creator_url was passed as list, using first item: {creator_url}")
            if isinstance(video_count, list):
                video_count = int(video_count[0]) if video_count else 10
                logger.warning(f"video_count was passed as list, using first item: {video_count}")
            
            user_id = await self._get_memories_user_id()
            
            # Normalize creator URL
            if not creator_url.startswith('http'):
                # Handle different input formats
                if creator_url.startswith('@'):
                    # Just a handle like @cutshall73 - assume TikTok
                    creator_url = f"https://www.tiktok.com/{creator_url}"
                elif '/' not in creator_url:
                    # Just a username without platform - assume TikTok and add @
                    creator_url = f"https://www.tiktok.com/@{creator_url}"
                else:
                    # Has path but no protocol - add https://
                    creator_url = f"https://{creator_url}"
            
            # Scrape videos from creator's account
            logger.info(f"Scraping {video_count} videos from creator: {creator_url}")
            scrape_result = self.memories_client.upload_from_creator_url(
                creator_url=creator_url,
                scraper_cnt=min(video_count, 30),
                unique_id=user_id
            )
            
            logger.info(f"Creator scrape response: {scrape_result}")
            
            # Extract task_id from nested data structure
            task_id = scrape_result.get("data", {}).get("taskId") if isinstance(scrape_result.get("data"), dict) else scrape_result.get("taskId")
            
            if not task_id:
                error_msg = scrape_result.get("msg", "Unknown error")
                logger.error(f"No task_id in response. Full response: {scrape_result}")
                return self.fail_response(f"Failed to start creator analysis: {error_msg}")
            
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
            "description": "Check status of async scraping task.",
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            "description": "Scrape hashtag videos into personal library (1-2 min). Use when explicitly adding to library.",
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            
            logger.info(f"Hashtag scrape response: {scrape_result}")
            
            # Extract task_id from nested data structure
            task_id = scrape_result.get("data", {}).get("taskId") if isinstance(scrape_result.get("data"), dict) else scrape_result.get("taskId")
            
            if not task_id:
                error_msg = scrape_result.get("msg", "Unknown error")
                logger.error(f"No task_id in response. Full response: {scrape_result}")
                return self.fail_response(f"Failed to start trend analysis: {error_msg}")
            
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
        "description": "Get AI-powered analysis and insights about trending video content. Use when user wants ANALYSIS/INSIGHTS (e.g., 'analyze Nike's trending strategy', 'what makes viral fitness content work', 'identify patterns in beauty videos'). Returns conversational AI summaries, not raw video lists.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Detailed analysis request describing what insights you need. Good: 'Analyze Nike's trending TikTok content - what engagement patterns make their videos viral, who are their top creators, and what formats work best'. Bad: 'nike videos' (use search_platform_videos instead for video lists)."
                },
                "platform": {
                    "type": "string",
                    "description": "Platform to search: TIKTOK (default), YOUTUBE, or INSTAGRAM",
                    "enum": ["TIKTOK", "YOUTUBE", "INSTAGRAM"],
                    "default": "TIKTOK"
                },
                "session_id": {
                    "type": "string",
                    "description": "Optional: Session ID from a previous search_trending_content call to continue the conversation with context. Use this to ask follow-up questions like 'Tell me more about the top video' or 'Compare this to their competitor'"
                }
            },
            "required": ["query"]
        }
    })
    async def search_trending_content(
        self,
        query: str,
        platform: str = "TIKTOK",
        session_id: Optional[str] = None
    ) -> ToolResult:
        """Search 1M+ indexed videos for trends and insights with conversation context"""
        try:
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            # DEFENSIVE: Convert parameters to strings if they're lists
            if isinstance(query, list):
                query = " ".join(str(q) for q in query)
                logger.warning(f"Query was passed as list, converted to: {query}")
            if isinstance(platform, list):
                platform = platform[0] if platform else "TIKTOK"
                logger.warning(f"Platform was passed as list, using first item: {platform}")
            
            user_id = await self._get_memories_user_id()
            agent_config = getattr(self.thread_manager, 'agent_config', {})
            account_id = agent_config.get('account_id')
            
            logger.info(f"Searching trending content: {query} on {platform} (session: {session_id})")
            
            # Call memories.ai API with session context
            result = self.memories_client.marketer_chat(
                prompt=query,
                platform=platform.upper(),
                unique_id=user_id,
                session_id=session_id  # Pass session_id for conversation continuity
            )
            
            content = result.get("content", "")
            refs = result.get("refs", [])
            returned_session_id = result.get("session_id")
            
            # Extract referenced videos and fetch full details for UI rendering
            referenced_videos = []
            for ref in refs:
                video = ref.get("video", {})
                if video:
                    video_no = video.get("video_no")
                    if video_no:
                        try:
                            # Fetch full video details to get URL for embedding
                            details = self.memories_client.get_public_video_detail(video_no=video_no)
                            referenced_videos.append({
                                "video_no": video_no,
                                "title": video.get("video_name") or details.get("video_name"),
                                "duration": video.get("duration") or details.get("duration"),
                                "url": details.get("video_url"),  # ✅ For video player embedding
                                "view_count": details.get("view_count"),
                                "like_count": details.get("like_count")
                            })
                        except Exception as e:
                            # Fallback to basic info if details fetch fails
                            logger.warning(f"Failed to fetch details for {video_no}: {str(e)}")
                            referenced_videos.append({
                                "video_no": video_no,
                                "title": video.get("video_name"),
                                "duration": video.get("duration")
                            })
            
            # Save/update session in database for future reference
            if returned_session_id and account_id:
                try:
                    client = await self.db.client
                    
                    # Check if session exists
                    existing = await client.table('memories_chat_sessions').select('id').eq(
                        'session_id', returned_session_id
                    ).eq('account_id', account_id).execute()
                    
                    if existing.data:
                        # Update existing session
                        await client.table('memories_chat_sessions').update({
                            'last_prompt': query,
                            'last_message_at': 'now()',
                            'title': query[:100] if not existing.data[0].get('title') else existing.data[0].get('title')
                        }).eq('id', existing.data[0]['id']).execute()
                    else:
                        # Create new session
                        await client.table('memories_chat_sessions').insert({
                            'account_id': account_id,
                            'session_id': returned_session_id,
                            'memories_user_id': user_id,
                            'session_type': 'marketer_chat',
                            'title': query[:100],  # Use first query as title
                            'last_prompt': query,
                            'platform': platform.upper()
                        }).execute()
                    
                    logger.info(f"Saved marketer chat session: {returned_session_id}")
                except Exception as e:
                    logger.warning(f"Failed to save session to DB: {str(e)}")
                    # Don't fail the whole request if DB save fails
            
            return self.success_response({
                "query": query,
                "platform": platform,
                "analysis": content,
                "videos": referenced_videos,  # ✅ Frontend expects "videos" not "referenced_videos"
                "videos_searched": len(referenced_videos),  # ✅ Frontend expects "videos_searched" not "video_count"
                "session_id": returned_session_id,  # Return for future queries
                "conversation_hint": "💡 Use this session_id in your next query to continue the conversation with context!"
            })
            
        except Exception as e:
            logger.error(f"Error searching trending content: {str(e)}")
            return self.fail_response(f"Failed to search trending content: {str(e)}")
    
    
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
        "name": "get_video_details",
            "description": "Get complete metadata for a video (duration, resolution, fps, file size).",
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
        "name": "list_video_chat_sessions",
            "description": "List recent Video Chat sessions to continue conversations.",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of recent sessions to return (default: 10)",
                    "default": 10
                }
            }
        }
    })
    async def list_video_chat_sessions(
        self,
        limit: int = 10
    ) -> ToolResult:
        """List recent Video Chat sessions"""
        try:
            if not config.MEMORIES_AI_API_KEY:
                return self.fail_response("Memories.ai API key not configured")
            
            agent_config = getattr(self.thread_manager, 'agent_config', {})
            account_id = agent_config.get('account_id')
            
            if not account_id:
                return self.fail_response("No account_id found")
            
            client = await self.db.client
            
            result = await client.table('memories_chat_sessions').select(
                'id, session_id, title, last_prompt, video_ids, last_message_at, created_at'
            ).eq('account_id', account_id).eq('session_type', 'video_chat').order(
                'last_message_at', desc=True
            ).limit(limit).execute()
            
            sessions = result.data or []
            
            return self.success_response({
                "sessions": sessions,
                "total": len(sessions),
                "message": f"Found {len(sessions)} recent Video Chat sessions",
                "hint": "Use session_id to continue any conversation about those videos"
            })
            
        except Exception as e:
            logger.error(f"Error listing video chat sessions: {str(e)}")
            return self.fail_response(f"Failed to list video chat sessions: {str(e)}")
    
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            "description": "Get conversation history for a chat session with questions and answers.",
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            "description": "Chat with personal media library (videos + images). Supports multi-turn Q&A.",
        "parameters": {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "Question about your media library. Examples: 'When did I go to the beach?', 'Show me all fitness videos', 'Tell me more about that sunset photo' (in follow-up with session_id)"
                },
                "session_id": {
                    "type": "string",
                    "description": "Optional: Session ID from previous chat_with_media call. Provide this to continue the conversation with full context. Example: 'When did I go to the beach?' → 'Show me more photos from that trip' (uses session_id to understand 'that trip')"
                }
            },
            "required": ["question"]
        }
    })
    async def chat_with_media(
        self,
        question: str,
        session_id: Optional[str] = None
    ) -> ToolResult:
        """Chat with your personal media library with conversation context"""
        try:
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
            user_id = await self._get_memories_user_id()
            agent_config = getattr(self.thread_manager, 'agent_config', {})
            account_id = agent_config.get('account_id')
            
            logger.info(f"Chat with media: {question} (session: {session_id})")
            
            # Chat with personal media (with session context)
            result = self.memories_client.chat_personal(
                prompt=question,
                unique_id=user_id,
                session_id=session_id  # ✅ Pass session for context
            )
            
            content = result.get("content", "")
            refs = result.get("refs", [])
            returned_session_id = result.get("session_id")
            
            # Extract video/image metadata for UI rendering
            media_items = []
            video_ids = []
            
            for ref in refs:
                video = ref.get("video", {})
                if video:
                    video_no = video.get("video_no")
                    if video_no:
                        video_ids.append(video_no)
                        media_items.append({
                            "type": "video",
                            "video_no": video_no,
                            "title": video.get("video_name", ""),
                            "duration": video.get("duration"),
                            "ref_items": ref.get("refItems", [])
                        })
            
            # Save/update session in database
            if returned_session_id and account_id:
                try:
                    client = await self.db.client
                    
                    existing = await client.table('memories_chat_sessions').select('id, video_ids').eq(
                        'session_id', returned_session_id
                    ).eq('account_id', account_id).execute()
                    
                    if existing.data:
                        # Update existing session
                        existing_video_ids = existing.data[0].get('video_ids', []) or []
                        # Add new video IDs
                        for vid in video_ids:
                            if vid not in existing_video_ids:
                                existing_video_ids.append(vid)
                        
                        await client.table('memories_chat_sessions').update({
                            'last_prompt': question,
                            'last_message_at': 'now()',
                            'video_ids': existing_video_ids
                        }).eq('id', existing.data[0]['id']).execute()
                    else:
                        # Create new session
                        await client.table('memories_chat_sessions').insert({
                            'account_id': account_id,
                            'session_id': returned_session_id,
                            'memories_user_id': user_id,
                            'session_type': 'personal_chat',
                            'title': question[:100],
                            'last_prompt': question,
                            'video_ids': video_ids
                        }).execute()
                    
                    logger.info(f"Saved personal chat session: {returned_session_id}")
                except Exception as e:
                    logger.warning(f"Failed to save session: {str(e)}")
            
            return self.success_response({
                "question": question,
                "answer": content,
                "session_id": returned_session_id,
                "references": refs,
                "media_items": media_items,  # ✅ For UI rendering
                "reference_count": len(refs),
                "conversation_hint": "💡 Use this session_id to continue the conversation with context!"
            })
            
        except Exception as e:
            logger.error(f"Error chatting with media: {str(e)}")
            return self.fail_response(f"Failed to chat with media: {str(e)}")
    
    # ============ ADVANCED TRANSCRIPTION TOOLS ============
    
    @openapi_schema({
        "name": "update_transcription",
            "description": "Update video transcription with custom prompt for specialized descriptions.",
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
            # Check client initialization
            if error := self._check_client_initialized():
                return error
            
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
    
    