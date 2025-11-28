"""
Memories.ai Video Intelligence Tool - Public Library Only

Provides 4 core video intelligence capabilities:
1. video_marketer_chat - AI-powered analysis from 1M+ indexed videos
2. upload_creator_videos - Scrape and index creator's videos (async)
3. upload_hashtag_videos - Scrape and index hashtag videos (async)
4. chat_with_videos - Q&A with specific videos

Note: search_platform_videos has been disabled
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
    description="Analyze videos from TikTok, YouTube, and Instagram with AI-powered insights from 1M+ indexed videos",
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
    
    # DISABLED: search_platform_videos tool - commented out per user request
    # @openapi_schema({
    #     "name": "search_platform_videos",
    #     "description": "Search TikTok, YouTube, or Instagram for videos matching a query. Returns videos with full metadata including title, creator, stats, and thumbnail.",
    #         "parameters": {
    #             "type": "object",
    #             "properties": {
    #             "query": {
    #                     "type": "string",
    #                 "description": "Specific search query describing the actual video content (e.g., 'red lipstick tutorial', 'nike running shoes review', 'pasta recipe'). Search for what you SEE in videos, not meta-concepts like 'promotions' or 'influencer content'."
    #                 },
    #             "platform": {
    #                     "type": "string",
    #                 "enum": ["TIKTOK", "YOUTUBE", "INSTAGRAM"],
    #                 "default": "TIKTOK",
    #                 "description": "Platform to search (default: TIKTOK)"
    #             },
    #             "top_k": {
    #                     "type": "integer",
    #                 "default": 10,
    #                 "description": "Number of results to return (default: 10, max: 20. Note: Higher values take longer due to rate limiting - each video detail fetch has a 2-second delay)"
    #                 }
    #             },
    #         "required": ["query"]
    #     }
    # })
    # async def search_platform_videos(
    #     self,
    #     query: str,
    #     platform: str = "TIKTOK",
    #     top_k: int = 10
    # ) -> ToolResult:
    #     """Search for videos on public platforms"""
    #     
    #     # Check client
    #     error = self._check_client()
    #     if error:
    #             return error
    #         
    #     try:
    #         # Defensive type handling
    #         if isinstance(query, list):
    #             query = " ".join(str(q) for q in query)
    #         if isinstance(platform, list):
    #             platform = platform[0] if platform else "TIKTOK"
    #         
    #         query = str(query).strip()
    #         platform = str(platform).upper()
    #         top_k = int(top_k)
    #         
    #         logger.info(f"Searching {platform} for: {query} (top_k={top_k})")
    #         
    #         # Call API
    #         response = await asyncio.to_thread(
    #             self.memories_client.search_public_videos,
    #             query=query,
    #                 platform=platform,
    #             top_k=top_k,
    #             filtering_level="high"
    #         )
    #         
    #         # Extract video numbers and deduplicate
    #         video_data = response if isinstance(response, list) else []
    #         video_nos = list(dict.fromkeys([v.get('videoNo') for v in video_data if v.get('videoNo')]))  # Deduplicate while preserving order
    #         
    #         if not video_nos:
    #             return ToolResult(
    #                 success=True,
    #                 output={
    #                     "videos": [],
    #                     "count": 0,
    #                     "platform": platform,
    #                     "query": query,
    #                     "message": "No videos found"
    #                 }
    #             )
    #         
    #         # Fetch full details for all videos in parallel
    #         videos = await self._fetch_all_video_details(video_nos)
    #         
    #         logger.info(f"Found {len(videos)} videos on {platform}")
    #         
    #         return ToolResult(
    #             success=True,
    #             output={
    #                 "videos": videos,
    #                 "count": len(videos),
    #                 "platform": platform,
    #                 "query": query
    #             }
    #         )
    #         
    #     except Exception as e:
    #         logger.error(f"Error searching {platform}: {str(e)}")
    #         return ToolResult(
    #             success=False,
    #             output={"error": f"Failed to search {platform}: {str(e)}"}
    #         )
    
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
            
            if not isinstance(response, dict):
                logger.error("marketer_chat returned unexpected payload", payload_type=type(response))
                response = {}
            
            # Check for API error
            if response.get('error'):
                error_msg = response.get('error', 'Unknown error')
                logger.warning(f"video_marketer_chat API returned error: {error_msg}")
                return ToolResult(
                    success=False,
                    output={"error": f"Marketer chat failed: {error_msg}"}
                )
            
            # Extract data (response IS already the data from marketer_chat)
            role = response.get('role', 'ASSISTANT')
            content = response.get('content', '')
            thinkings = response.get('thinkings', []) or []  # Handle None
            session_id = response.get('session_id', '')
            
            # Refs can be at top level OR nested inside thinkings (API inconsistency)
            # Always check both locations to ensure we get all refs
            refs = response.get('refs', []) or []  # Handle None
            top_level_count = len(refs)
            
            # Also extract refs from inside thinkings (some APIs put them there)
            for thinking in thinkings:
                thinking_refs = thinking.get('refs')
                if thinking_refs:
                    refs.extend(thinking_refs)
            
            thinkings_count = len(refs) - top_level_count
            if refs:
                logger.info(f"Found {len(refs)} refs ({top_level_count} top-level, {thinkings_count} in thinkings) on {platform}")
            
            # Enrich refs with FULL video metadata by fetching from API (same as upload tools)
            if refs:
                # First, collect all video_nos and extract stats from refItems
                video_nos = []
                stats_map = {}  # video_no -> stats from refItems
                
                for ref_group in refs:
                    video_info = ref_group.get('video', {})
                    video_no = video_info.get('video_no')
                    ref_items = ref_group.get('refItems', [])
                    
                    if video_no:
                        video_nos.append(video_no)
                        # Extract stats from refItems (API puts view_count, like_count, etc. here)
                        if ref_items:
                            first_item = ref_items[0]
                            stats_map[video_no] = {
                                'view_count': first_item.get('view_count', 0),
                                'like_count': first_item.get('like_count', 0),
                                'share_count': first_item.get('share_count', 0),
                                'comment_count': first_item.get('comment_count', 0),
                                'summary': first_item.get('summary', '')
                            }
                
                # Fetch full video details (creator, video_url, thumbnail, etc.)
                if video_nos:
                    fetched_videos = await self._fetch_all_video_details(video_nos)
                    fetched_map = {v['video_no']: v for v in fetched_videos if v.get('video_no')}
                    
                    # Update each ref's video with full details + stats from refItems
                    for ref_group in refs:
                        video_info = ref_group.get('video', {})
                        video_no = video_info.get('video_no')
                        
                        if video_no and video_no in fetched_map:
                            # Merge full fetched details (creator, video_url, thumbnail, etc.)
                            video_info.update(fetched_map[video_no])
                        else:
                            # Fallback: normalize basic fields
                            video_info['title'] = video_info.get('video_name', video_info.get('title', 'Untitled'))
                            video_info['duration'] = int(video_info.get('duration', 0)) if video_info.get('duration') else 0
                            video_info['creator'] = 'Unknown'
                            video_info['web_url'] = self._build_web_url(video_info)
                            video_info['thumbnail_url'] = self._extract_thumbnail(video_info)
                        
                        # Always merge stats from refItems (more accurate than fetched)
                        if video_no and video_no in stats_map:
                            stats = stats_map[video_no]
                            video_info['view_count'] = stats['view_count']
                            video_info['like_count'] = stats['like_count']
                            video_info['share_count'] = stats['share_count']
                            video_info['comment_count'] = stats['comment_count']
                            if stats['summary']:
                                video_info['summary'] = stats['summary']
            else:
                # Log when no refs are returned (common for Instagram/YouTube due to limited indexed content)
                if platform in ['INSTAGRAM', 'YOUTUBE']:
                    logger.info(f"Marketer chat on {platform} returned no video references - this is normal as {platform} has less indexed content than TikTok")
            
            logger.info(f"Marketer chat completed: {len(thinkings)} thinkings, {len(refs)} ref groups on {platform}")
            
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
        """
        Poll task status until complete or timeout.
        Returns videos even if they're UNPARSE status (still processing).
        """
        start_time = time.time()
        poll_interval = 10  # seconds
        
        while time.time() - start_time < max_wait:
            try:
                response = await asyncio.to_thread(
                    self.memories_client.get_video_ids_by_task_id,
                    task_id
                )
                
                videos = response.get('data', {}).get('videos', [])
                
                # If we have any videos at all (even UNPARSE), return them
                # UNPARSE videos have metadata and can be used, they're just still being processed
                if videos:
                    parsed_count = len([v for v in videos if v.get('status') == 'PARSE'])
                    unparsed_count = len([v for v in videos if v.get('status') == 'UNPARSE'])
                    
                    if parsed_count > 0:
                        logger.info(f"Task {task_id} complete: {parsed_count} videos parsed, {unparsed_count} still processing")
                    else:
                        logger.info(f"Task {task_id}: {unparsed_count} videos found but still processing (UNPARSE status)")
                    
                    return videos
                
                # No videos yet, wait and retry
                await asyncio.sleep(poll_interval)
                
            except Exception as e:
                logger.error(f"Error polling task {task_id}: {str(e)}")
                await asyncio.sleep(poll_interval)
        
        # Timeout - return empty list to indicate no videos found
        logger.warning(f"Task {task_id} timed out after {max_wait}s - no videos appeared")
        return []
    
    @openapi_schema({
        "name": "upload_creator_videos",
        "description": "SLOW (TikTok: 1-2 min, Instagram/YouTube: 5+ min): Scrape and index videos from a creator's profile. Use 'private' library for chat_with_videos, 'public' for video_marketer_chat.",
            "parameters": {
                "type": "object",
                "properties": {
                    "creator_url": {
                        "type": "string",
                    "description": "Creator URL - use full URL format: TikTok: 'https://www.tiktok.com/@nike', Instagram: 'https://www.instagram.com/nike/', YouTube: 'https://www.youtube.com/@nike'"
                    },
                    "video_count": {
                        "type": "integer",
                    "default": 10,
                    "description": "Number of recent videos to scrape (default: 10)"
                },
                "library": {
                    "type": "string",
                    "enum": ["public", "private"],
                    "default": "public",
                    "description": "Which library to upload to: 'public' (PI- videos for video_marketer_chat) or 'private' (VI- videos for chat_with_videos)"
                    }
                },
                "required": ["creator_url"]
        }
    })
    async def upload_creator_videos(
        self,
        creator_url: str,
        video_count: int = 10,
        library: str = "public"
    ) -> ToolResult:
        """Scrape and index videos from a creator's profile to public or private library"""
        
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
            if isinstance(library, list):
                library = library[0] if library else "public"
            
            creator_url = str(creator_url).strip()
            video_count = int(video_count)
            library = str(library).lower().strip()
            
            # Validate library parameter
            if library not in ["public", "private"]:
                library = "public"
            
            logger.info(f"Uploading {video_count} videos from creator: {creator_url} to {library} library")
            
            # Start scraping task - use correct endpoint based on library
            if library == "private":
                response = await asyncio.to_thread(
                    self.memories_client.scraper_private,
                    username=creator_url,
                    scraper_cnt=video_count
                )
            else:
                response = await asyncio.to_thread(
                    self.memories_client.scraper_public,
                    username=creator_url,
                    scraper_cnt=video_count
                )
            
            task_id = response.get('data', {}).get('taskId')
            if not task_id:
                raise ValueError("No task ID returned from scraper API")
            
            # Detect platform from URL
            platform = "UNKNOWN"
            if "tiktok.com" in creator_url.lower():
                platform = "TikTok"
            elif "instagram.com" in creator_url.lower() or "instagr.am" in creator_url.lower():
                platform = "Instagram"
            elif "youtube.com" in creator_url.lower() or "youtu.be" in creator_url.lower():
                platform = "YouTube"
            
            logger.info(f"Scraping started for {platform} ({library} library), task_id: {task_id}. Waiting for completion...")
            
            # Wait for task to complete (blocking)
            # Instagram/YouTube take longer (5+ minutes) than TikTok (~20 seconds)
            max_wait_time = 600 if platform == "TikTok" else 900  # 15 min for Instagram/YouTube
            videos_data = await self._wait_for_task(task_id, max_wait=max_wait_time)
            
            # Check if we got any videos at all
            if not videos_data:
                error_msg = f"No videos found for {platform} creator: {creator_url}"
                if platform == "Instagram":
                    error_msg += ". Instagram scraping typically takes 5+ minutes. The task may still be processing - check back later using the task_id."
                elif platform == "YouTube":
                    error_msg += ". YouTube scraping can take longer. The task may still be processing - check back later using the task_id."
                elif platform == "TikTok":
                    error_msg += ". The creator may not have videos, or the URL may be invalid."
                else:
                    error_msg += ". Platform may not be supported or URL format is invalid."
                
                logger.warning(error_msg)
                return ToolResult(
                    success=False,
                    output={
                        "error": error_msg,
                        "task_id": task_id,
                        "creator": creator_url,
                        "platform": platform
                    }
                )
            
            # Extract video_nos and create lookup map for basic metadata (in case detail fetch fails)
            video_nos = []
            basic_metadata_map = {}  # video_no -> basic metadata from task response
            
            for v in videos_data:
                video_no = v.get('video_no') or v.get('videoNo')
                if video_no:
                    video_nos.append(video_no)
                    # Store basic metadata as fallback
                    basic_metadata_map[video_no] = {
                        'video_no': video_no,
                        'title': v.get('video_name', 'Untitled'),
                        'video_url': v.get('video_url', ''),
                        'duration': int(v.get('duration', 0)) if v.get('duration') else 0,
                        'status': v.get('status', 'UNKNOWN')
                    }
            
            if not video_nos:
                return ToolResult(
                    success=False,
                    output={
                        "error": f"Videos found but no valid video IDs extracted. This may indicate an API issue with {platform}.",
                        "task_id": task_id,
                        "creator": creator_url,
                        "platform": platform
                    }
                )
            
            # Fetch full details for all videos (will return None for UNPARSE or if fetch fails)
            fetched_videos = await self._fetch_all_video_details(video_nos)
            
            # Create lookup for successfully fetched videos
            fetched_map = {v['video_no']: v for v in fetched_videos if v.get('video_no')}
            
            # Build final video list: use fetched details if available, otherwise use basic metadata
            videos = []
            for video_no in video_nos:
                if video_no in fetched_map:
                    # Use full fetched details
                    videos.append(fetched_map[video_no])
                elif video_no in basic_metadata_map:
                    # Fallback to basic metadata from task response (for UNPARSE videos)
                    basic = basic_metadata_map[video_no].copy()
                    # Enrich with platform-specific URL building
                    basic['web_url'] = self._build_web_url(basic)
                    basic['thumbnail_url'] = self._extract_thumbnail(basic)
                    videos.append(basic)
            
            parsed_count = len([v for v in videos if v.get('status') == 'PARSE'])
            unparsed_count = len([v for v in videos if v.get('status') == 'UNPARSE'])
            
            logger.info(f"Creator upload complete: {len(videos)} videos indexed from {platform} to {library} library ({parsed_count} parsed, {unparsed_count} still processing)")
            
            return ToolResult(
                success=True,
                output={
                    "videos": videos,
                        "task_id": task_id,
                    "creator": creator_url,
                    "platform": platform,
                    "library": library,
                    "status": "completed",
                    "count": len(videos),
                    "usage_note": f"Videos uploaded to {library} library. Use {'chat_with_videos' if library == 'private' else 'video_marketer_chat'} to analyze them."
                }
            )
            
        except TimeoutError as e:
            # Detect platform for better error message
            platform = "UNKNOWN"
            if "tiktok.com" in creator_url.lower():
                platform = "TikTok"
            elif "instagram.com" in creator_url.lower():
                platform = "Instagram"
            elif "youtube.com" in creator_url.lower():
                platform = "YouTube"
            
            error_msg = f"Upload timed out after 15 minutes for {platform}: {str(e)}"
            if platform == "Instagram":
                error_msg += " Instagram scraping can take 5+ minutes. Videos may still be processing in the background."
            elif platform == "YouTube":
                error_msg += " YouTube scraping can take longer. Videos may still be processing in the background."
            
            # Get task_id if it exists
            task_id_val = None
            try:
                task_id_val = task_id
            except NameError:
                pass
            
            logger.error(f"Creator upload timeout ({platform}): {str(e)}")
            return ToolResult(
                success=False,
                output={
                    "error": error_msg,
                    "task_id": task_id_val,
                    "creator": creator_url,
                    "platform": platform
                }
            )
        except Exception as e:
            logger.error(f"Error uploading creator videos: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Failed to upload creator videos: {str(e)}"}
            )
    
    @openapi_schema({
        "name": "upload_hashtag_videos",
        "description": "SLOW (1-2 min): Scrape and index videos by hashtag from TikTok ONLY. Instagram/YouTube hashtag support coming soon. Use for trend analysis or archiving hashtag content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "hashtags": {
                        "type": "array",
                        "items": {"type": "string"},
                    "description": "Hashtags to scrape from TikTok (e.g., ['LVMH', 'Dior', 'fashion']) - without # prefix"
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
            videos_data = await self._wait_for_task(task_id, max_wait=600)
            
            # Check if we got any videos at all
            if not videos_data:
                error_msg = f"No videos found for hashtags: {hashtags}. Videos may take longer to appear or hashtags may not have videos."
                logger.warning(error_msg)
                return ToolResult(
                    success=False,
                    output={
                        "error": error_msg,
                        "task_id": task_id,
                        "hashtags": hashtags
                    }
                )
            
            # Extract video_nos and create lookup map for basic metadata (in case detail fetch fails)
            video_nos = []
            basic_metadata_map = {}  # video_no -> basic metadata from task response
            
            for v in videos_data:
                video_no = v.get('video_no') or v.get('videoNo')
                if video_no:
                    video_nos.append(video_no)
                    # Store basic metadata as fallback
                    basic_metadata_map[video_no] = {
                        'video_no': video_no,
                        'title': v.get('video_name', 'Untitled'),
                        'video_url': v.get('video_url', ''),
                        'duration': int(v.get('duration', 0)) if v.get('duration') else 0,
                        'status': v.get('status', 'UNKNOWN')
                    }
            
            if not video_nos:
                return ToolResult(
                    success=False,
                    output={
                        "error": f"Videos found but no valid video IDs extracted. This may indicate an API issue.",
                        "task_id": task_id,
                        "hashtags": hashtags
                    }
                )
            
            # Fetch full details for all videos (will return None for UNPARSE or if fetch fails)
            fetched_videos = await self._fetch_all_video_details(video_nos)
            
            # Create lookup for successfully fetched videos
            fetched_map = {v['video_no']: v for v in fetched_videos if v.get('video_no')}
            
            # Build final video list: use fetched details if available, otherwise use basic metadata
            videos = []
            for video_no in video_nos:
                if video_no in fetched_map:
                    # Use full fetched details
                    videos.append(fetched_map[video_no])
                elif video_no in basic_metadata_map:
                    # Fallback to basic metadata from task response (for UNPARSE videos)
                    basic = basic_metadata_map[video_no].copy()
                    # Enrich with platform-specific URL building
                    basic['web_url'] = self._build_web_url(basic)
                    basic['thumbnail_url'] = self._extract_thumbnail(basic)
                    videos.append(basic)
            
            parsed_count = len([v for v in videos if v.get('status') == 'PARSE'])
            unparsed_count = len([v for v in videos if v.get('status') == 'UNPARSE'])
            
            logger.info(f"Hashtag upload complete: {len(videos)} videos indexed ({parsed_count} parsed, {unparsed_count} still processing)")
            
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
            
            input_video_nos = [str(vno).strip() for vno in video_nos]
            prompt = str(prompt).strip()
            
            # Input validation
            if not input_video_nos:
                return ToolResult(
                    success=False,
                    output={"error": "No video IDs provided. Please specify at least one video_no."}
                )
            
            logger.info(f"Chatting with {len(input_video_nos)} videos: {prompt[:100]}")
            
            # Call API (non-streaming)
            response = await asyncio.to_thread(
                self.memories_client.chat_with_video,
                video_nos=input_video_nos,
                prompt=prompt
            )

            if not isinstance(response, dict):
                logger.error("chat_with_video returned unexpected payload", payload_type=type(response))
                response = {}
            
            # Check for API error
            if response.get('error'):
                error_msg = response.get('error', 'Unknown error')
                logger.warning(f"chat_with_videos API returned error: {error_msg}")
                return ToolResult(
                    success=False,
                    output={"error": f"Video chat failed: {error_msg}. The video IDs may be invalid or expired."}
            )
            
            # Extract data (response IS already the data from chat_with_video)
            role = response.get('role', 'ASSISTANT')
            content = response.get('content', '')
            thinkings = response.get('thinkings', []) or []  # Handle None
            session_id = response.get('session_id', '')
            
            # Refs can be at top level OR nested inside thinkings (API inconsistency)
            # Always check both locations to ensure we get all refs
            refs = response.get('refs', []) or []  # Handle None
            top_level_count = len(refs)
            
            # Also extract refs from inside thinkings
            for thinking in thinkings:
                thinking_refs = thinking.get('refs')
                if thinking_refs:
                    refs.extend(thinking_refs)
            
            thinkings_count = len(refs) - top_level_count
            if refs:
                logger.info(f"Found {len(refs)} refs ({top_level_count} top-level, {thinkings_count} in thinkings)")
            
            # Enrich refs with FULL video metadata by fetching from API (same as upload tools)
            if refs:
                # First, collect all video_nos and extract stats from refItems
                ref_video_nos = []
                stats_map = {}  # video_no -> stats from refItems
                
                for ref_group in refs:
                    video_info = ref_group.get('video', {})
                    video_no = video_info.get('video_no')
                    ref_items = ref_group.get('refItems', [])
                    
                    if video_no:
                        ref_video_nos.append(video_no)
                        # Extract stats from refItems (API puts view_count, like_count, etc. here)
                        if ref_items:
                            first_item = ref_items[0]
                            stats_map[video_no] = {
                                'view_count': first_item.get('view_count', 0),
                                'like_count': first_item.get('like_count', 0),
                                'share_count': first_item.get('share_count', 0),
                                'comment_count': first_item.get('comment_count', 0),
                                'summary': first_item.get('summary', '')
                            }
                
                # Fetch full video details (creator, video_url, thumbnail, etc.)
                if ref_video_nos:
                    fetched_videos = await self._fetch_all_video_details(ref_video_nos)
                    fetched_map = {v['video_no']: v for v in fetched_videos if v.get('video_no')}
                    
                    # Update each ref's video with full details + stats from refItems
                    for ref_group in refs:
                        video_info = ref_group.get('video', {})
                        video_no = video_info.get('video_no')
                        
                        if video_no and video_no in fetched_map:
                            # Merge full fetched details (creator, video_url, thumbnail, etc.)
                            video_info.update(fetched_map[video_no])
                        else:
                            # Fallback: normalize basic fields
                            video_info['title'] = video_info.get('video_name', video_info.get('title', 'Untitled'))
                            video_info['duration'] = int(video_info.get('duration', 0)) if video_info.get('duration') else 0
                            video_info['creator'] = 'Unknown'
                            video_info['web_url'] = self._build_web_url(video_info)
                            video_info['thumbnail_url'] = self._extract_thumbnail(video_info)
                        
                        # Always merge stats from refItems (more accurate than fetched)
                        if video_no and video_no in stats_map:
                            stats = stats_map[video_no]
                            video_info['view_count'] = stats['view_count']
                            video_info['like_count'] = stats['like_count']
                            video_info['share_count'] = stats['share_count']
                            video_info['comment_count'] = stats['comment_count']
                            if stats['summary']:
                                video_info['summary'] = stats['summary']
            
            logger.info(f"Video chat completed: {len(thinkings)} thinkings, {len(refs)} ref groups")
            
            return ToolResult(
                success=True,
                output={
                    "role": role,
                    "content": content,
                    "thinkings": thinkings,
                    "refs": refs,
                    "session_id": session_id,
                    "video_count": len(input_video_nos)
                }
            )
            
        except Exception as e:
            logger.error(f"Error in video chat: {str(e)}")
            return ToolResult(
                success=False,
                output={"error": f"Failed to chat with videos: {str(e)}"}
            )
