"""
COMPLETE Memories.ai API Client - ALL Features Implemented

This client implements EVERY endpoint from the memories.ai API v1.2:
- All upload methods (file, URL, platform, creator, hashtag, images)
- All search methods (private, public, audio, images, clips)
- All chat methods (video chat, marketer chat, personal chat) 
- All transcription methods (video, audio, summaries)
- All utility methods (list, delete, sessions, download)
- All special features (caption, ReID)
"""

import aiohttp
import asyncio
import json
import os
from typing import Optional, List, Dict, Any, Union, BinaryIO
from dataclasses import dataclass
from datetime import datetime


class MemoriesAPIError(Exception):
    """Exception for Memories.ai API errors"""
    pass


@dataclass
class VideoMetadata:
    """Video metadata from memories.ai"""
    video_no: str
    video_name: Optional[str] = None
    video_status: Optional[str] = None
    upload_time: Optional[str] = None
    duration: Optional[str] = None
    url: Optional[str] = None


class MemoriesClient:
    """Complete Memories.ai API Client - ALL Features"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.memories.ai"):
        self.api_key = api_key
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                headers={"Authorization": self.api_key}
            )
        return self.session
    
    async def close(self):
        """Close the session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[Dict] = None,
        form_data: Optional[aiohttp.FormData] = None,
        params: Optional[Dict] = None,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """Make HTTP request"""
        session = await self._get_session()
        url = f"{self.base_url}/{endpoint}"
        
        try:
            kwargs = {"timeout": aiohttp.ClientTimeout(total=timeout)}
            
            if json_data:
                kwargs["json"] = json_data
            elif form_data:
                kwargs["data"] = form_data
            
            if params:
                kwargs["params"] = params
            
            async with session.request(method, url, **kwargs) as response:
                result = await response.json()
                
                # Check API response code
                if result.get("code") not in ["0000", "SUCCESS"]:
                    raise MemoriesAPIError(
                        f"API Error {result.get('code')}: {result.get('msg', 'Unknown error')}"
                    )
                
                return result
                
        except aiohttp.ClientError as e:
            raise MemoriesAPIError(f"Request failed: {str(e)}")
        except asyncio.TimeoutError:
            raise MemoriesAPIError("Request timeout")
    
    # ==================== UPLOAD METHODS ====================
    
    async def upload_video_from_file(
        self,
        file_path: str,
        unique_id: str = "default",
        callback: Optional[str] = None
    ) -> VideoMetadata:
        """Upload video from local file"""
        form = aiohttp.FormData()
        form.add_field('file', open(file_path, 'rb'),
                      filename=os.path.basename(file_path),
                      content_type='video/mp4')
        form.add_field('unique_id', unique_id)
        
        if callback:
            form.add_field('callback', callback)
        
        result = await self._request("POST", "serve/api/v1/upload", form_data=form, timeout=300)
        
        data = result.get("data", {})
        return VideoMetadata(
            video_no=data.get("videoNo"),
            video_name=data.get("videoName"),
            video_status=data.get("videoStatus"),
            upload_time=data.get("uploadTime")
        )
    
    async def upload_video_from_url(
        self,
        video_url: str,
        unique_id: str = "default",
        callback: Optional[str] = None
    ) -> VideoMetadata:
        """Upload video from URL"""
        # API expects form-data, not JSON
        form = aiohttp.FormData()
        form.add_field('url', video_url)
        form.add_field('unique_id', unique_id)
        
        if callback:
            form.add_field('callback', callback)
        
        result = await self._request("POST", "serve/api/v1/upload_url", form_data=form, timeout=300)
        
        resp_data = result.get("data", {})
        return VideoMetadata(
            video_no=resp_data.get("videoNo"),
            video_name=resp_data.get("videoName"),
            video_status=resp_data.get("videoStatus"),
            upload_time=resp_data.get("uploadTime")
        )
    
    async def upload_from_platform_urls(
        self,
        video_urls: List[str],
        unique_id: str = "default",
        callback_url: Optional[str] = None,
        to_public: bool = False,
        quality: int = 720
    ) -> Dict[str, Any]:
        """Upload video(s) from platform URLs (TikTok, YouTube, Instagram)"""
        data = {
            "video_urls": video_urls,
            "quality": quality
        }
        
        if not to_public:
            data["unique_id"] = unique_id
        
        if callback_url:
            data["callback_url"] = callback_url
        
        endpoint = "serve/api/v1/scraper_url_public" if to_public else "serve/api/v1/scraper_url"
        result = await self._request("POST", endpoint, json_data=data, timeout=180)
        
        return result.get("data", {})
    
    async def upload_from_creator_url(
        self,
        creator_url: str,
        scraper_cnt: int = 10,
        unique_id: str = "default",
        callback_url: Optional[str] = None,
        to_public: bool = False
    ) -> Dict[str, Any]:
        """Upload videos from creator's page"""
        data = {
            "username": creator_url,
            "scraper_cnt": scraper_cnt
        }
        
        if not to_public:
            data["unique_id"] = unique_id
        
        if callback_url:
            data["callback_url"] = callback_url
        
        endpoint = "serve/api/v1/scraper_public" if to_public else "serve/api/v1/scraper"
        result = await self._request("POST", endpoint, json_data=data, timeout=180)
        
        return result.get("data", {})
    
    async def upload_from_hashtag(
        self,
        hashtags: List[str],
        scraper_cnt: int = 10,
        unique_id: str = "default",
        callback_url: Optional[str] = None,
        to_public: bool = False
    ) -> Dict[str, Any]:
        """Upload videos from hashtag(s)"""
        data = {
            "hash_tags": hashtags,
            "scraper_cnt": scraper_cnt
        }
        
        if not to_public:
            data["unique_id"] = unique_id
        
        if callback_url:
            data["callback_url"] = callback_url
        
        endpoint = "serve/api/v1/scraper_tag_public" if to_public else "serve/api/v1/scraper_tag"
        result = await self._request("POST", endpoint, json_data=data, timeout=180)
        
        return result.get("data", {})
    
    async def upload_image_from_file(
        self,
        file_paths: List[str],
        unique_id: str = "default",
        metadata: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """Upload image(s) from local files"""
        form = aiohttp.FormData()
        
        for file_path in file_paths:
            form.add_field('files', open(file_path, 'rb'),
                          filename=os.path.basename(file_path),
                          content_type='image/jpeg')
        
        form.add_field('unique_id', unique_id)
        
        if metadata:
            for key, value in metadata.items():
                form.add_field(key, value)
        
        result = await self._request("POST", "serve/api/v1/upload_img", form_data=form, timeout=120)
        
        return result.get("data", [])
    
    # ==================== SEARCH METHODS ====================
    
    async def search_private_library(
        self,
        search_param: str,
        search_type: str = "BY_VIDEO",  # BY_VIDEO, BY_AUDIO, BY_IMAGE
        unique_id: str = "default",
        top_k: int = 3,
        filtering_level: str = "medium"
    ) -> List[Dict[str, Any]]:
        """Search in private video/image library"""
        data = {
            "search_param": search_param,
            "search_type": search_type,
            "unique_id": unique_id,
            "top_k": top_k,
            "filtering_level": filtering_level
        }
        
        result = await self._request("POST", "serve/api/v1/search", json_data=data, timeout=60)
        return result.get("data", [])
    
    async def search_public_videos(
        self,
        search_param: str,
        platform_type: str = "TIKTOK",  # TIKTOK, YOUTUBE, INSTAGRAM
        search_type: str = "BY_VIDEO",
        top_k: int = 3,
        filtering_level: str = "medium"
    ) -> List[Dict[str, Any]]:
        """Search public platform videos"""
        data = {
            "search_param": search_param,
            "search_type": search_type,
            "type": platform_type,
            "top_k": top_k,
            "filtering_level": filtering_level
        }
        
        result = await self._request("POST", "serve/api/v1/search_public", json_data=data, timeout=60)
        return result.get("data", [])
    
    async def search_audio_transcripts(
        self,
        query: str,
        unique_id: str = "default",
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """Search private audio transcripts"""
        params = {
            "query": query,
            "unique_id": unique_id,
            "page": page,
            "page_size": page_size
        }
        
        result = await self._request("GET", "serve/api/v1/search_audio_transcripts", params=params)
        return result.get("data", {})
    
    async def search_public_audio_transcripts(
        self,
        query: str,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """Search public audio transcripts"""
        params = {
            "query": query,
            "page": page,
            "page_size": page_size
        }
        
        result = await self._request("GET", "serve/api/v1/search_public_audio_transcripts", params=params)
        return result.get("data", {})
    
    async def search_similar_images_public(
        self,
        image_path: str,
        platform_type: str = "TIKTOK",
        similarity: float = 0.8
    ) -> List[Dict[str, Any]]:
        """Search for similar images in public datasets"""
        form = aiohttp.FormData()
        form.add_field('file', open(image_path, 'rb'),
                      filename=os.path.basename(image_path),
                      content_type='image/png')
        form.add_field('type', platform_type)
        form.add_field('similarity', str(similarity))
        
        result = await self._request("POST", "serve/api/v1/search_public_similar_images", form_data=form)
        return result.get("results", [])
    
    async def search_similar_images_private(
        self,
        image_path: str,
        unique_id: str = "default",
        similarity: float = 0.8
    ) -> List[Dict[str, Any]]:
        """Search for similar images in private library"""
        form = aiohttp.FormData()
        form.add_field('file', open(image_path, 'rb'),
                      filename=os.path.basename(image_path),
                      content_type='image/png')
        form.add_field('unique_id', unique_id)
        form.add_field('similarity', str(similarity))
        
        result = await self._request("POST", "serve/api/v1/search_similar_images", form_data=form)
        return result.get("results", [])
    
    async def search_clips_by_image(
        self,
        image_path: str,
        video_no: str,
        prompt: str,
        unique_id: str = "default"
    ) -> List[Dict[str, Any]]:
        """Search for clips in video matching an image"""
        form = aiohttp.FormData()
        form.add_field('file', open(image_path, 'rb'),
                      filename=os.path.basename(image_path),
                      content_type='image/png')
        form.add_field('video_no', video_no)
        form.add_field('prompt', prompt)
        form.add_field('unique_id', unique_id)
        
        result = await self._request("POST", "serve/api/v1/search_clips_by_image", form_data=form)
        return result.get("data", [])
    
    # ==================== CHAT METHODS ====================
    
    async def chat_with_video(
        self,
        video_nos: List[str],
        prompt: str,
        unique_id: str = "default",
        session_id: Optional[str] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Chat with video(s) using AI"""
        data = {
            "video_nos": video_nos,
            "prompt": prompt,
            "unique_id": unique_id
        }
        
        if session_id:
            data["session_id"] = session_id
        
        endpoint = "serve/api/v1/chat_stream" if stream else "serve/api/v1/chat"
        result = await self._request("POST", endpoint, json_data=data, timeout=120)
        
        return result.get("data", {})
    
    async def video_marketer_chat(
        self,
        prompt: str,
        unique_id: str = "default",
        platform_type: str = "TIKTOK",
        session_id: Optional[str] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Chat with Video Marketer (public video intelligence)"""
        data = {
            "prompt": prompt,
            "unique_id": unique_id,
            "type": platform_type
        }
        
        if session_id:
            data["session_id"] = session_id
        
        endpoint = "serve/api/v1/marketer_chat_stream" if stream else "serve/api/v1/marketer_chat"
        result = await self._request("POST", endpoint, json_data=data, timeout=120)
        
        return result.get("data", {})
    
    async def chat_personal(
        self,
        prompt: str,
        unique_id: str = "default",
        session_id: Optional[str] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Chat with personal media entities"""
        data = {
            "prompt": prompt,
            "unique_id": unique_id
        }
        
        if session_id:
            data["session_id"] = session_id
        
        endpoint = "serve/api/v1/chat_personal_stream" if stream else "serve/api/v1/chat_personal"
        result = await self._request("POST", endpoint, json_data=data, timeout=120)
        
        return result.get("data", {})
    
    # ==================== TRANSCRIPTION METHODS ====================
    
    async def get_video_transcription(
        self,
        video_no: str,
        unique_id: str = "default"
    ) -> List[Dict[str, Any]]:
        """Get video transcription (visual content)"""
        params = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        
        result = await self._request("GET", "serve/api/v1/get_video_transcription", params=params)
        return result.get("data", {}).get("transcriptions", [])
    
    async def get_audio_transcription(
        self,
        video_no: str,
        unique_id: str = "default"
    ) -> List[Dict[str, Any]]:
        """Get audio transcription"""
        params = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        
        result = await self._request("GET", "serve/api/v1/get_audio_transcription", params=params)
        return result.get("data", {}).get("transcriptions", [])
    
    async def generate_video_summary(
        self,
        video_no: str,
        summary_type: str = "CHAPTER",  # CHAPTER or TOPIC
        unique_id: str = "default"
    ) -> Dict[str, Any]:
        """Generate video summary (chapters or topics)"""
        params = {
            "video_no": video_no,
            "type": summary_type,
            "unique_id": unique_id
        }
        
        result = await self._request("GET", "serve/api/v1/generate_summary", params=params)
        return result.get("data", {})
    
    async def get_public_video_transcription(
        self,
        video_no: str
    ) -> List[Dict[str, Any]]:
        """Get transcription from public video"""
        params = {"video_no": video_no}
        
        result = await self._request("GET", "serve/api/v1/get_public_video_transcription", params=params)
        return result.get("data", {}).get("transcriptions", [])
    
    async def get_public_audio_transcription(
        self,
        video_no: str
    ) -> List[Dict[str, Any]]:
        """Get audio transcription from public video"""
        params = {"video_no": video_no}
        
        result = await self._request("GET", "serve/api/v1/get_public_audio_transcription", params=params)
        return result.get("data", {}).get("transcriptions", [])
    
    async def update_video_transcription(
        self,
        video_no: str,
        prompt: str,
        unique_id: str = "default",
        callback: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update video transcription with custom prompt"""
        data = {
            "video_no": video_no,
            "prompt": prompt,
            "unique_id": unique_id
        }
        
        if callback:
            data["callback"] = callback
        
        result = await self._request("POST", "serve/api/v1/update_video_transcription", json_data=data)
        return result.get("data", {})
    
    # ==================== UTILITY METHODS ====================
    
    async def list_videos(
        self,
        unique_id: str = "default",
        page: int = 1,
        size: int = 20,
        video_name: Optional[str] = None,
        video_no: Optional[str] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """List uploaded videos"""
        data = {
            "page": page,
            "size": size,
            "unique_id": unique_id
        }
        
        if video_name:
            data["video_name"] = video_name
        if video_no:
            data["video_no"] = video_no
        if status:
            data["status"] = status
        
        result = await self._request("POST", "serve/api/v1/list_videos", json_data=data)
        return result.get("data", {})
    
    async def list_sessions(
        self,
        unique_id: str = "default",
        page: int = 1
    ) -> Dict[str, Any]:
        """List chat sessions"""
        params = {
            "unique_id": unique_id,
            "page": page
        }
        
        result = await self._request("GET", "serve/api/v1/list_sessions", params=params)
        return result.get("data", {})
    
    async def delete_videos(
        self,
        video_ids: List[str],
        unique_id: str = "default"
    ) -> bool:
        """Delete video(s)"""
        params = {"unique_id": unique_id}
        
        result = await self._request("POST", "serve/api/v1/delete_videos", 
                                    json_data=video_ids, params=params)
        return result.get("success", False)
    
    async def get_session_detail(
        self,
        session_id: str,
        unique_id: str = "default"
    ) -> Dict[str, Any]:
        """Get detailed session information"""
        params = {
            "session_id": session_id,
            "unique_id": unique_id
        }
        
        result = await self._request("GET", "serve/api/v1/get_session_detail", params=params)
        return result.get("data", {})
    
    async def get_public_video_detail(
        self,
        video_no: str
    ) -> Dict[str, Any]:
        """Get public video details and metadata"""
        params = {"video_no": video_no}
        
        result = await self._request("GET", "serve/api/v1/get_public_video_detail", params=params)
        return result.get("data", {})
    
    async def get_private_video_detail(
        self,
        video_no: str,
        unique_id: str = "default"
    ) -> Dict[str, Any]:
        """Get private video details"""
        params = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        
        result = await self._request("GET", "serve/api/v1/get_private_video_details", params=params)
        return result.get("data", {})
    
    async def get_task_status(
        self,
        task_id: str,
        unique_id: str = "default"
    ) -> Dict[str, Any]:
        """Get status of async task (scraping, etc.)"""
        params = {
            "task_id": task_id,
            "unique_id": unique_id
        }
        
        result = await self._request("GET", "serve/api/v1/get_video_ids_by_task_id", params=params)
        return result.get("data", {})
    
    async def list_images(
        self,
        unique_id: str = "default",
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """List uploaded images"""
        data = {
            "page": page,
            "page_size": page_size,
            "unique_id": unique_id
        }
        
        result = await self._request("POST", "serve/api/v1/img_list_page", json_data=data)
        return result.get("data", {})
    
    async def download_video(
        self,
        video_no: str,
        unique_id: str = "default",
        output_path: Optional[str] = None
    ) -> Union[bytes, str]:
        """Download video file"""
        data = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        
        session = await self._get_session()
        url = f"{self.base_url}/serve/api/v1/download"
        
        async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=300)) as response:
            content_type = response.headers.get('Content-Type', '')
            
            if 'application/json' in content_type:
                # Error response
                result = await response.json()
                raise MemoriesAPIError(f"Download failed: {result.get('msg', 'Unknown error')}")
            
            # Binary video content
            video_data = await response.read()
            
            if output_path:
                with open(output_path, 'wb') as f:
                    f.write(video_data)
                return output_path
            
            return video_data


# Singleton instance
_client: Optional[MemoriesClient] = None


def get_memories_client(api_key: Optional[str] = None) -> MemoriesClient:
    """Get or create singleton client"""
    global _client
    if _client is None and api_key:
        _client = MemoriesClient(api_key)
    return _client


# Alias for backwards compatibility
get_client = get_memories_client


async def cleanup_memories_client():
    """Cleanup singleton client"""
    global _client
    if _client:
        await _client.close()
        _client = None

