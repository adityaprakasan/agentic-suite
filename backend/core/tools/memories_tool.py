"""
Memories.ai Video Intelligence Tool - Public Library Only

Provides 5 core video intelligence capabilities:
1. search_platform_videos - Find videos on TikTok/YouTube/Instagram
2. video_marketer_chat - AI-powered analysis from 1M+ indexed videos
3. upload_creator_videos - Scrape and index creator's videos (async)
4. upload_hashtag_videos - Scrape and index hashtag videos (async)
5. chat_with_videos - Q&A with specific videos
"""

import asyncio
import time
from typing import Optional, List, Dict, Any
from core.agentpress.tool import Tool, ToolResult, openapi_schema, tool_metadata
from core.agentpress.thread_manager import ThreadManager
from core.services.memories_client import get_memories_client
from core.utils.logger import logger
from core.utils.config import config


@tool_metadata(
    display_name="Video Intelligence",
    description="Search and analyze videos from TikTok, YouTube, and Instagram with AI-powered insights",
    icon="Video",
    color="bg-purple-100 dark:bg-purple-800/50",
    weight=150,
    visible=True
)
class MemoriesTool(Tool):
    """Tool for video intelligence using Memories.ai public library API"""
    
    def __init__(self, thread_manager: ThreadManager):
        super().__init__()
        self.thread_manager = thread_manager
        
        # Get API key
        api_key = config.MEMORIES_AI_API_KEY
        
        # Initialize memories.ai client
        try:
            self.memories_client = get_memories_client(api_key=api_key)
            if self.memories_client is None:
                logger.warning("Memories.ai client not initialized - API key may be missing")
            else:
                logger.info("Memories.ai client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Memories.ai client: {str(e)}")
            self.memories_client = None
        
    def _check_client(self) -> Optional[ToolResult]:
        """Check if client is initialized"""
        if not self.memories_client:
            return ToolResult(
                success=False,
                output={"error": "Memories.ai client not initialized. Please ensure MEMORIES_AI_API_KEY is set."}
            )
        return None
    
    async def _fetch_video_detail(self, video_no: str) -> Optional[Dict[str, Any]]:
        """Fetch full metadata for a single video"""
        try:
            response = await asyncio.to_thread(
                self.memories_client.get_public_video_detail,
                video_no
            )
            if response.get('code') == '0000' and response.get('data'):
                data = response['data']
                
                # Build standardized video object
            return {
                    'video_no': data.get('video_no', ''),
                    'title': data.get('video_name', 'Untitled'),
                    'creator': data.get('blogger_id', 'Unknown'),
                    'duration': int(data.get('duration', 0)) if data.get('duration') else 0,
                    'view_count': int(data.get('view_count', 0)) if data.get('view_count') else 0,
                    'like_count': int(data.get('like_count', 0)) if data.get('like_count') else 0,
                    'share_count': int(data.get('share_count', 0)) if data.get('share_count') else 0,
                    'comment_count': int(data.get('comment_count', 0)) if data.get('comment_count') else 0,
                    'video_url': data.get('video_url', ''),
                    'thumbnail_url': self._extract_thumbnail(data),
                    'web_url': self._build_web_url(data),
                    'hashtags': data.get('hash_tag', ''),
                    'publish_time': data.get('publish_time', ''),
                    'status': data.get('status', 'UNKNOWN')
                }
            return None
        except Exception as e:
            logger.error(f"Failed to fetch video detail for {video_no}: {str(e)}")
            return None
    
    def _extract_thumbnail(self, video_data: Dict) -> str:
        """Extract thumbnail URL from video data"""
        video_url = video_data.get('video_url', '')
        
        # For YouTube videos, construct thumbnail URL
        if 'youtube.com' in video_url or 'youtu.be' in video_url:
            if 'watch?v=' in video_url:
                video_id = video_url.split('v=')[-1].split('&')[0]
                return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
            elif 'youtu.be/' in video_url:
                video_id = video_url.split('youtu.be/')[-1].split('?')[0]
                return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        
        # For TikTok, no reliable thumbnail in API response
        # For Instagram, no reliable thumbnail in API response
        return ""
    
    def _build_web_url(self, video_data: Dict) -> str:
        """Build shareable web URL from video data"""
        video_url = video_data.get('video_url', '')
        blogger_id = video_data.get('blogger_id', '')
        
        # TikTok: convert player URL to web URL
        if 'tiktok.com/player/v1/' in video_url:
            video_id = video_url.split('/')[-1]
            if blogger_id:
                return f"https://www.tiktok.com/@{blogger_id}/video/{video_id}"
        
        # YouTube: already a web URL
        if 'youtube.com' in video_url or 'youtu.be' in video_url:
            return video_url
        
        # Instagram: API returns web URL
        if 'instagram.com' in video_url:
            return video_url
        
        return video_url
    
    async def _fetch_all_video_details(self, video_nos: List[str]) -> List[Dict[str, Any]]:
        """
        Fetch full metadata for multiple videos SEQUENTIALLY with delays
        Note: API rate limits parallel requests, so we fetch one at a time
        """
        videos = []
        
        for i, video_no in enumerate(video_nos):
            try:
                result = await self._fetch_video_detail(video_no)
                if result:
                    videos.append(result)
                
                # Add delay between requests to avoid rate limiting (except for last video)
                # get_public_video_detail is not listed in rate limits docs, so it's severely limited
                if i < len(video_nos) - 1:
                    await asyncio.sleep(2.0)  # 2 second delay - API rate limits are very strict
                    
            except Exception as e:
                logger.error(f"Error fetching video {video_no}: {str(e)}")
                continue
    
        return videos
    
    @openapi_schema({
        "name": "search_platform_videos",
        "description": "Search TikTok, YouTube, or Instagram for videos matching a query. Returns videos with full metadata including title, creator, stats, and thumbnail.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Specific search query describing the actual video content (e.g., 'red lipstick tutorial', 'nike running shoes review', 'pasta recipe'). Search for what you SEE in videos, not meta-concepts like 'promotions' or 'influencer content'."
                },
                "platform": {
                    "type": "string",
                    "enum": ["TIKTOK", "YOUTUBE", "INSTAGRAM"],
                    "default": "TIKTOK",
                    "description": "Platform to search (default: TIKTOK)"
                },
                "top_k": {
                    "type": "integer",
                    "default": 5,
                    "description": "Number of results to return (default: 5, max recommended: 5 due to API rate limits)"
                }
            },
            "required": ["query"]
        }
    })
    async def search_platform_videos(
        self,
        query: str,
        platform: str = "TIKTOK",
        top_k: int = 5
    ) -> ToolResult:
        """Search for videos on public platforms"""
        
        # Check client
        error = self._check_client()
        if error:
                return error
            
        try:
            # Defensive type handling
            if isinstance(query, list):
                query = " ".join(str(q) for q in query)
            if isinstance(platform, list):
                platform = platform[0] if platform else "TIKTOK"
            
            query = str(query).strip()
            platform = str(platform).upper()
            top_k = int(top_k)
            
            logger.info(f"Searching {platform} for: {query} (top_k={top_k})")
            
            # Call API
            response = await asyncio.to_thread(
                self.memories_client.search_public_videos,
                query=query,
                platform=platform,
                top_k=top_k,
                filtering_level="high"
            )
            
            # Extract video numbers and deduplicate
            video_data = response if isinstance(response, list) else []
            video_nos = list(dict.fromkeys([v.get('videoNo') for v in video_data if v.get('videoNo')]))  # Deduplicate while preserving order
            
            if not video_nos:
                return ToolResult(
                    success=True,
                    output={
                        "videos": [],
                        "count": 0,
                        "platform": platform,
                        "query": query,
                        "message": "No videos found"
                    }
                )
            
            # Fetch full details for all videos in parallel
            videos = await self._fetch_all_video_details(video_nos)
            
            logger.info(f"Found {len(videos)} videos on {platform}")
            
            return ToolResult(
                success=True,
                output={
                    "videos": videos,
                    "count": len(videos),
                    "platform": platform,
                    "query": query
                }
            )
            
        except Exception as e:
            logger.error(f"Error searching {platform}: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Failed to search {platform}: {str(e)}"}
            )
    
    @openapi_schema({
        "name": "video_marketer_chat",
        "description": "Get AI-powered analysis and insights from 1M+ indexed videos. Use for trend analysis, creator strategies, content patterns, and marketing insights.",
            "parameters": {
                "type": "object",
                "properties": {
                "prompt": {
                        "type": "string",
                    "description": "Analysis question (e.g., 'What does Nike post on TikTok?', 'Analyze MrBeast viral strategies', 'Find trending fitness content patterns')"
                    },
                "platform": {
                        "type": "string",
                    "enum": ["TIKTOK", "YOUTUBE", "INSTAGRAM"],
                    "default": "TIKTOK",
                    "description": "Platform to analyze (default: TIKTOK)"
                }
            },
            "required": ["prompt"]
        }
    })
    async def video_marketer_chat(
        self, 
        prompt: str,
        platform: str = "TIKTOK"
    ) -> ToolResult:
        """Get AI analysis and insights from indexed videos"""
        
        # Check client
        error = self._check_client()
        if error:
                return error
            
        try:
            # Defensive type handling
            if isinstance(prompt, list):
                prompt = " ".join(str(p) for p in prompt)
            if isinstance(platform, list):
                platform = platform[0] if platform else "TIKTOK"
            
            prompt = str(prompt).strip()
            platform = str(platform).upper()
            
            logger.info(f"Video Marketer Chat on {platform}: {prompt[:100]}")
            
            # Call API (non-streaming)
            response = await asyncio.to_thread(
                self.memories_client.marketer_chat,
                prompt=prompt,
                platform=platform
            )
            
            # Extract data (response IS already the data from marketer_chat)
            role = response.get('role', 'ASSISTANT')
            content = response.get('content', '')
            thinkings = response.get('thinkings', [])
            refs = response.get('refs', [])
            session_id = response.get('session_id', '')
            
            # Enrich refs with full video metadata
            if refs:
                for ref_group in refs:
                    video_info = ref_group.get('video', {})
                    video_no = video_info.get('video_no')
                    
                    if video_no:
                        # Fetch full details
                        full_details = await self._fetch_video_detail(video_no)
                        if full_details:
                            # Merge full details into video_info
                            video_info.update(full_details)
            
            logger.info(f"Marketer chat completed: {len(thinkings)} thinkings, {len(refs)} ref groups")
            
            return ToolResult(
                success=True,
                output={
                    "role": role,
                    "content": content,
                    "thinkings": thinkings,
                "refs": refs,
                    "session_id": session_id,
                    "platform": platform
                }
            )
            
        except Exception as e:
            logger.error(f"Error in video marketer chat: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Failed to get marketer insights: {str(e)}"}
            )
    
    async def _wait_for_task(self, task_id: str, max_wait: int = 180) -> List[Dict]:
        """Poll task status until complete or timeout"""
        start_time = time.time()
        poll_interval = 10  # seconds
        
        while time.time() - start_time < max_wait:
            try:
                response = await asyncio.to_thread(
                    self.memories_client.get_video_ids_by_task_id,
                    task_id
                )
                
                videos = response.get('data', {}).get('videos', [])
                
                # Check if we have videos with PARSE status
                parsed_videos = [v for v in videos if v.get('status') == 'PARSE']
                
                if parsed_videos:
                    logger.info(f"Task {task_id} complete: {len(parsed_videos)} videos parsed")
                    return videos
                
                # Still processing, wait and retry
                await asyncio.sleep(poll_interval)
                
            except Exception as e:
                logger.error(f"Error polling task {task_id}: {str(e)}")
                await asyncio.sleep(poll_interval)
        
        raise TimeoutError(f"Task {task_id} did not complete within {max_wait} seconds")
    
    @openapi_schema({
        "name": "upload_creator_videos",
        "description": "SLOW (1-2 min): Scrape and index videos from a creator's profile. Use for archiving a creator's content to the public library for deep analysis.",
            "parameters": {
                "type": "object",
                "properties": {
                    "creator_url": {
                        "type": "string",
                    "description": "Creator URL or handle (e.g., 'https://www.tiktok.com/@nike', '@mrbeast', 'https://www.instagram.com/nike/')"
                    },
                    "video_count": {
                        "type": "integer",
                    "default": 10,
                    "description": "Number of recent videos to scrape (default: 10)"
                    }
                },
                "required": ["creator_url"]
        }
    })
    async def upload_creator_videos(
        self,
        creator_url: str,
        video_count: int = 10
    ) -> ToolResult:
        """Scrape and index videos from a creator's profile"""
        
        # Check client
        error = self._check_client()
        if error:
                return error
            
        try:
            # Defensive type handling
            if isinstance(creator_url, list):
                creator_url = creator_url[0] if creator_url else ""
            if isinstance(video_count, list):
                video_count = int(video_count[0]) if video_count else 10
            
            creator_url = str(creator_url).strip()
            video_count = int(video_count)
            
            logger.info(f"Uploading {video_count} videos from creator: {creator_url}")
            
            # Start scraping task
            response = await asyncio.to_thread(
                self.memories_client.scraper_public,
                username=creator_url,
                scraper_cnt=video_count
            )
            
            task_id = response.get('data', {}).get('taskId')
            if not task_id:
                raise ValueError("No task ID returned from scraper API")
            
            logger.info(f"Scraping started, task_id: {task_id}. Waiting for completion...")
            
            # Wait for task to complete (blocking)
            videos_data = await self._wait_for_task(task_id, max_wait=180)
            
            # Fetch full details for all videos (API returns 'video_no' in some responses, 'videoNo' in others)
            video_nos = [v.get('video_no') or v.get('videoNo') for v in videos_data if (v.get('video_no') or v.get('videoNo'))]
            videos = await self._fetch_all_video_details(video_nos)
            
            logger.info(f"Creator upload complete: {len(videos)} videos indexed")
            
            return ToolResult(
                success=True,
                output={
                    "videos": videos,
                        "task_id": task_id,
                    "creator": creator_url,
                    "status": "completed",
                    "count": len(videos)
                }
            )
            
        except TimeoutError as e:
            logger.error(f"Creator upload timeout: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Upload timed out: {str(e)}. Videos may still be processing."}
            )
        except Exception as e:
            logger.error(f"Error uploading creator videos: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Failed to upload creator videos: {str(e)}"}
            )
    
    @openapi_schema({
        "name": "upload_hashtag_videos",
        "description": "SLOW (1-2 min): Scrape and index videos by hashtag. Use for trend analysis or archiving hashtag content to the public library.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hashtags": {
                        "type": "array",
                        "items": {"type": "string"},
                    "description": "Hashtags to scrape (e.g., ['LVMH', 'Dior', 'fashion'])"
                    },
                    "video_count": {
                        "type": "integer",
                    "default": 10,
                    "description": "Number of videos per hashtag (default: 10)"
                    }
                },
                "required": ["hashtags"]
        }
    })
    async def upload_hashtag_videos(
        self,
        hashtags: List[str],
        video_count: int = 10
    ) -> ToolResult:
        """Scrape and index videos by hashtag"""
        
        # Check client
        error = self._check_client()
        if error:
                return error
            
        try:
            # Defensive type handling
            if isinstance(hashtags, str):
                hashtags = [hashtags]
            hashtags = [str(h).strip('#').strip() for h in hashtags]
            video_count = int(video_count)
            
            logger.info(f"Uploading {video_count} videos per hashtag: {hashtags}")
            
            # Start scraping task
            response = await asyncio.to_thread(
                self.memories_client.scraper_tag_public,
                hash_tags=hashtags,
                scraper_cnt=video_count
            )
            
            task_id = response.get('data', {}).get('taskId')
            if not task_id:
                raise ValueError("No task ID returned from scraper API")
            
            logger.info(f"Hashtag scraping started, task_id: {task_id}. Waiting for completion...")
            
            # Wait for task to complete (blocking)
            videos_data = await self._wait_for_task(task_id, max_wait=180)
            
            # Fetch full details for all videos (API returns 'video_no' in some responses, 'videoNo' in others)
            video_nos = [v.get('video_no') or v.get('videoNo') for v in videos_data if (v.get('video_no') or v.get('videoNo'))]
            videos = await self._fetch_all_video_details(video_nos)
            
            logger.info(f"Hashtag upload complete: {len(videos)} videos indexed")
            
            return ToolResult(
                success=True,
                output={
                    "videos": videos,
                    "task_id": task_id,
                    "hashtags": hashtags,
                    "status": "completed",
                    "count": len(videos)
                }
            )
            
        except TimeoutError as e:
            logger.error(f"Hashtag upload timeout: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Upload timed out: {str(e)}. Videos may still be processing."}
            )
        except Exception as e:
            logger.error(f"Error uploading hashtag videos: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Failed to upload hashtag videos: {str(e)}"}
            )
    
    @openapi_schema({
        "name": "chat_with_videos",
        "description": "Ask questions about specific videos you've already found or uploaded. Provides detailed analysis based on video content.",
        "parameters": {
            "type": "object",
            "properties": {
                "video_nos": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of video IDs (e.g., ['PI-603068775285264430', 'PI-602590241592840230'])"
                },
                "prompt": {
                    "type": "string",
                    "description": "Question about the videos (e.g., 'Summarize the key points', 'What emotions are shown?', 'Compare the editing styles')"
                }
            },
            "required": ["video_nos", "prompt"]
        }
    })
    async def chat_with_videos(
        self,
        video_nos: List[str],
        prompt: str
    ) -> ToolResult:
        """Ask questions about specific videos"""
        
        # Check client
        error = self._check_client()
        if error:
                return error
            
        try:
            # Defensive type handling
            if isinstance(video_nos, str):
                video_nos = [video_nos]
            if isinstance(prompt, list):
                prompt = " ".join(str(p) for p in prompt)
            
            video_nos = [str(vno).strip() for vno in video_nos]
            prompt = str(prompt).strip()
            
            logger.info(f"Chatting with {len(video_nos)} videos: {prompt[:100]}")
            
            # Call API (non-streaming)
            response = await asyncio.to_thread(
                self.memories_client.chat_with_video,
                video_nos=video_nos,
                prompt=prompt
            )
            
            # Extract data (response IS already the data from chat_with_video)
            role = response.get('role', 'ASSISTANT')
            content = response.get('content', '')
            thinkings = response.get('thinkings', [])
            refs = response.get('refs', [])
            session_id = response.get('session_id', '')
            
            # Enrich refs with full video metadata
            if refs:
                for ref_group in refs:
                    video_info = ref_group.get('video', {})
                    video_no = video_info.get('video_no')
                    
                    if video_no:
                        # Fetch full details
                        full_details = await self._fetch_video_detail(video_no)
                        if full_details:
                            # Merge full details into video_info
                            video_info.update(full_details)
            
            logger.info(f"Video chat completed: {len(thinkings)} thinkings, {len(refs)} ref groups")
            
            return ToolResult(
                success=True,
                output={
                    "role": role,
                    "content": content,
                    "thinkings": thinkings,
                    "refs": refs,
                    "session_id": session_id,
                    "video_count": len(video_nos)
                }
            )
            
        except Exception as e:
            logger.error(f"Error in video chat: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Failed to chat with videos: {str(e)}"}
            )
