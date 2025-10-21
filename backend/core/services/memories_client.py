"""
Memories.ai API Client
Official documentation: https://docs.memories.ai

Base URL: https://api.memories.ai
Authentication: Bearer token in Authorization header
"""

import requests
from typing import Optional, Dict, Any, List
import structlog

logger = structlog.get_logger(__name__)

# Singleton instance
_client_instance = None


class MemoriesClient:
    """Client for Memories.ai video intelligence API"""
    
    BASE_URL = "https://api.memories.ai"
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Memories.ai API key is required")
        self.api_key = api_key
        self.headers = {
            "Authorization": api_key,
            "Content-Type": "application/json"
        }
        logger.info("Memories.ai client initialized", api_key_prefix=api_key[:20])
    
    def _post(self, endpoint: str, json_data: Optional[Dict] = None, files: Optional[Dict] = None) -> Dict[str, Any]:
        """Make POST request to Memories.ai API"""
        url = f"{self.BASE_URL}{endpoint}"
        headers = {"Authorization": self.api_key}
        
        if files:
            # Don't set Content-Type for multipart/form-data
            response = requests.post(url, headers=headers, files=files, data=json_data)
        else:
            headers["Content-Type"] = "application/json"
            response = requests.post(url, headers=headers, json=json_data)
        
        response.raise_for_status()
        return response.json()
    
    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request to Memories.ai API"""
        url = f"{self.BASE_URL}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    # ============ UPLOAD METHODS ============
    
    def upload_video_from_file(self, file_path: str, unique_id: str = "default", callback: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload video from local file
        Endpoint: POST /serve/api/v1/upload
        Returns: {code, msg, data: {videoNo, videoName, videoStatus, uploadTime}}
        """
        import os
        
        with open(file_path, 'rb') as f:
            files = {
                "file": (os.path.basename(file_path), f, "video/mp4")
            }
            data = {"unique_id": unique_id}
            if callback:
                data["callback"] = callback
            
            response = self._post("/serve/api/v1/upload", json_data=data, files=files)
        
        logger.info("Video uploaded from file", video_no=response.get("data", {}).get("videoNo"))
        return response
    
    def upload_video_from_url(self, url: str, unique_id: str = "default", callback: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload video from direct URL
        Endpoint: POST /serve/api/v1/upload_url
        Returns: {code, msg, data: {videoNo, videoName, videoStatus, uploadTime}}
        """
        data = {
            "url": url,
            "unique_id": unique_id
        }
        if callback:
            data["callback"] = callback
        
        response = self._post("/serve/api/v1/upload_url", json_data=data)
        logger.info("Video uploaded from URL", video_no=response.get("data", {}).get("videoNo"))
        return response
    
    def upload_from_platform_urls(self, urls: List[str], unique_id: str = "default", callback: Optional[str] = None, quality: int = 720) -> Dict[str, Any]:
        """
        Upload videos from platform URLs (TikTok, YouTube, Instagram) to PRIVATE library
        Endpoint: POST /serve/api/v1/scraper_url
        Returns: {code, msg, data: {taskId}}
        """
        data = {
            "video_urls": urls,
            "unique_id": unique_id,
            "quality": quality
        }
        if callback:
            data["callback_url"] = callback
        
        response = self._post("/serve/api/v1/scraper_url", json_data=data)
        logger.info("Platform URL scrape initiated (private)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    def upload_from_platform_urls_public(self, urls: List[str], callback: Optional[str] = None, quality: int = 720) -> Dict[str, Any]:
        """
        Upload videos from platform URLs to PUBLIC library (no unique_id needed)
        Endpoint: POST /serve/api/v1/scraper_url_public
        Returns: {code, msg, data: {taskId}}
        """
        data = {
            "video_urls": urls,
            "quality": quality
        }
        if callback:
            data["callback_url"] = callback
        
        response = self._post("/serve/api/v1/scraper_url_public", json_data=data)
        logger.info("Platform URL scrape initiated (public)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    # ============ SEARCH METHODS ============
    
    def search_private_library(self, query: str, search_type: str = "BY_VIDEO", unique_id: str = "default", top_k: int = 10, filtering_level: str = "medium") -> List[Dict[str, Any]]:
        """
        Search private video library
        Endpoint: POST /serve/api/v1/search
        search_type: BY_VIDEO, BY_AUDIO, BY_IMAGE
        Returns: {code, msg, data: [{videoNo, videoName, startTime, endTime, score}]}
        """
        data = {
            "search_param": query,
            "search_type": search_type,
            "unique_id": unique_id,
            "top_k": top_k,
            "filtering_level": filtering_level
        }
        
        response = self._post("/serve/api/v1/search", json_data=data)
        return response.get("data", [])
    
    def search_public_videos(self, query: str, platform: str = "TIKTOK", search_type: str = "BY_VIDEO", top_k: int = 10, filtering_level: str = "medium") -> List[Dict[str, Any]]:
        """
        Search public video platforms (TikTok, YouTube, Instagram)
        Endpoint: POST /serve/api/v1/search_public
        platform: TIKTOK, YOUTUBE, INSTAGRAM
        Returns: {code, msg, data: [{videoNo, videoName, startTime, endTime, score}]}
        """
        data = {
            "search_param": query,
            "search_type": search_type,
            "type": platform.upper(),
            "top_k": top_k,
            "filtering_level": filtering_level
        }
        
        response = self._post("/serve/api/v1/search_public", json_data=data)
        return response.get("data", [])
    
    # ============ CHAT METHODS ============
    
    def chat_with_video(self, video_nos: List[str], prompt: str, session_id: Optional[str] = None, unique_id: str = "default") -> str:
        """
        Chat with videos (non-streaming)
        Endpoint: POST /serve/api/v1/chat
        Returns: {code, msg, data: {role, content, refs, thinkings, session_id}}
        """
        data = {
            "video_nos": video_nos,
            "prompt": prompt,
            "unique_id": unique_id
        }
        if session_id:
            data["session_id"] = session_id
        
        response = self._post("/serve/api/v1/chat", json_data=data)
        return response.get("data", {}).get("content", "")
    
    def marketer_chat(self, prompt: str, session_id: Optional[str] = None, unique_id: str = "default", platform: str = "TIKTOK") -> Dict[str, Any]:
        """
        Chat with 1M+ indexed public videos (Video Marketer)
        Endpoint: POST /serve/api/v1/marketer_chat
        Returns: {code, msg, data: {role, content, refs, thinkings, session_id}}
        """
        data = {
            "prompt": prompt,
            "unique_id": unique_id,
            "type": platform.upper()
        }
        if session_id:
            data["session_id"] = session_id
        
        response = self._post("/serve/api/v1/marketer_chat", json_data=data)
        return response.get("data", {})
    
    # ============ TRANSCRIPTION METHODS ============
    
    def get_video_transcription(self, video_no: str, unique_id: str = "default") -> Dict[str, Any]:
        """
        Get video transcription (visual + audio)
        Endpoint: GET /serve/api/v1/get_video_transcription
        Returns: {code, msg, data: {videoNo, transcriptions: [{index, content, startTime, endTime}]}}
        """
        params = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/get_video_transcription", params=params)
        return response.get("data", {})
    
    def get_audio_transcription(self, video_no: str, unique_id: str = "default") -> Dict[str, Any]:
        """
        Get audio transcription only
        Endpoint: GET /serve/api/v1/get_audio_transcription
        Returns: {code, msg, data: {videoNo, transcriptions: [{index, content, startTime, endTime}]}}
        """
        params = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/get_audio_transcription", params=params)
        return response.get("data", {})
    
    def get_public_video_transcription(self, video_no: str) -> Dict[str, Any]:
        """
        Get transcription for public video
        Endpoint: GET /serve/api/v1/get_public_video_transcription
        """
        params = {"video_no": video_no}
        response = self._get("/serve/api/v1/get_public_video_transcription", params=params)
        return response.get("data", {})
    
    def get_public_audio_transcription(self, video_no: str) -> Dict[str, Any]:
        """
        Get audio transcription for public video
        Endpoint: GET /serve/api/v1/get_public_audio_transcription
        """
        params = {"video_no": video_no}
        response = self._get("/serve/api/v1/get_public_audio_transcription", params=params)
        return response.get("data", {})
    
    # ============ UTILITY METHODS ============
    
    def list_videos(self, page: int = 1, size: int = 200, unique_id: str = "default", video_name: Optional[str] = None, video_no: Optional[str] = None, status: Optional[str] = None) -> Dict[str, Any]:
        """
        List videos in private library
        Endpoint: POST /serve/api/v1/list_videos
        Returns: {code, msg, data: {videos: [], current_page, page_size, total_count}}
        """
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
        
        response = self._post("/serve/api/v1/list_videos", json_data=data)
        return response.get("data", {})
    
    def get_public_video_detail(self, video_no: str) -> Dict[str, Any]:
        """
        Get details of a public video
        Endpoint: GET /serve/api/v1/get_public_video_detail
        Returns: {code, msg, data: {video_no, video_name, duration, video_url, like_count, view_count, etc.}}
        """
        params = {"video_no": video_no}
        response = self._get("/serve/api/v1/get_public_video_detail", params=params)
        return response.get("data", {})
    
    def check_task_status(self, task_id: str, unique_id: str = "default") -> Dict[str, Any]:
        """
        Check status of async task (platform URL upload)
        Endpoint: GET /serve/api/v1/get_video_ids_by_task_id
        Returns: {code, msg, data: {videos: [{video_no, status, duration, video_name, video_url}]}}
        """
        params = {
            "task_id": task_id,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/get_video_ids_by_task_id", params=params)
        return response.get("data", {})
    
    def delete_videos(self, video_nos: List[str], unique_id: str = "default") -> Dict[str, Any]:
        """
        Delete videos from private library
        Endpoint: POST /serve/api/v1/delete_videos
        Body: array of video_nos
        Returns: {code, msg, data: null}
        """
        params = {"unique_id": unique_id}
        response = self._post("/serve/api/v1/delete_videos", json_data=video_nos)
        return response


def get_memories_client(api_key: Optional[str] = None) -> Optional[MemoriesClient]:
    """
    Get or create singleton Memories.ai client instance
    
    Args:
        api_key: Memories.ai API key. If None, returns None.
    
    Returns:
        MemoriesClient instance or None if no API key
    """
    global _client_instance
    
    if not api_key:
        logger.warning("No Memories.ai API key provided, client disabled")
        return None
    
    if _client_instance is None or _client_instance.api_key != api_key:
        try:
            _client_instance = MemoriesClient(api_key)
            logger.info("Memories.ai client created successfully")
        except Exception as e:
            logger.error("Failed to create Memories.ai client", error=str(e))
            return None
    
    return _client_instance
