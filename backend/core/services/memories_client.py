"""
Memories.ai API Client - Public Library Only
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
    """Client for Memories.ai video intelligence API - Public Library Only"""
    
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
    
    def _post(self, endpoint: str, json_data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make POST request to Memories.ai API"""
        url = f"{self.BASE_URL}{endpoint}"
        headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
        response = requests.post(url, headers=headers, json=json_data)
        response.raise_for_status()
        result = response.json()
        # Ensure we always return a dict, never None
        return result if result is not None else {}
    
    def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request to Memories.ai API"""
        url = f"{self.BASE_URL}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        result = response.json()
        # Ensure we always return a dict, never None
        return result if result is not None else {}
    
    # ============ PUBLIC LIBRARY SEARCH ============
    # DISABLED: search_public_videos - not exposed as a tool per user request
    
    # def search_public_videos(
    #     self, 
    #     query: str, 
    #     platform: str = "TIKTOK", 
    #     search_type: str = "BY_VIDEO", 
    #     top_k: int = 10, 
    #     filtering_level: str = "high"
    # ) -> List[Dict[str, Any]]:
    #     """
    #     Search public video platforms (TikTok, YouTube, Instagram)
    #     Endpoint: POST /serve/api/v1/search_public
    #     platform: TIKTOK, YOUTUBE, INSTAGRAM
    #     Returns: {code, msg, data: [{videoNo, videoName, startTime, endTime, score}]}
    #     """
    #     data = {
    #         "search_param": query,
    #         "search_type": search_type,
    #         "type": platform.upper(),
    #         "top_k": top_k,
    #         "filtering_level": filtering_level
    #     }
    #     
    #     response = self._post("/serve/api/v1/search_public", json_data=data)
    #     return response.get("data", [])
    
    # ============ PUBLIC VIDEO DETAILS ============
    
    def get_public_video_detail(self, video_no: str) -> Dict[str, Any]:
        """
        Get details of a public video
        Endpoint: GET /serve/api/v1/get_public_video_detail
        Returns: {code, msg, data: {video_no, video_name, duration, video_url, like_count, view_count, etc.}}
        """
        params = {"video_no": video_no}
        response = self._get("/serve/api/v1/get_public_video_detail", params=params)
        return response  # Return full response to check code field
    
    # ============ AI CHAT WITH PUBLIC VIDEOS ============
    
    def marketer_chat(
        self, 
        prompt: str, 
        platform: str = "TIKTOK", 
        session_id: Optional[str] = None, 
        unique_id: str = "default"
    ) -> Dict[str, Any]:
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
        # Defensive: ensure response is a dict
        if not isinstance(response, dict):
            logger.warning(f"marketer_chat received non-dict response: {type(response)}")
            return {"role": "ASSISTANT", "content": "", "thinkings": [], "refs": [], "session_id": ""}
        
        # Check for API error
        if response.get("code") != "0000" or response.get("failed"):
            error_msg = response.get("msg", "Unknown error")
            logger.warning(f"marketer_chat API error: {error_msg}")
            return {"role": "ASSISTANT", "content": "", "thinkings": [], "refs": [], "session_id": "", "error": error_msg}
        
        # Handle null data (response.get returns None, not default, when value is explicitly null)
        return response.get("data") or {}
    
    def chat_with_video(
        self, 
        video_nos: List[str], 
        prompt: str, 
        session_id: Optional[str] = None, 
        unique_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Chat with specific videos (works with both public PI- and private VI- video IDs)
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
        # Defensive: ensure response is a dict
        if not isinstance(response, dict):
            logger.warning(f"chat_with_video received non-dict response: {type(response)}")
            return {"role": "ASSISTANT", "content": "", "thinkings": [], "refs": [], "session_id": ""}
        
        # Check for API error
        if response.get("code") != "0000" or response.get("failed"):
            error_msg = response.get("msg", "Unknown error")
            logger.warning(f"chat_with_video API error: {error_msg}")
            return {"role": "ASSISTANT", "content": "", "thinkings": [], "refs": [], "session_id": "", "error": error_msg}
        
        # Handle null data (response.get returns None, not default, when value is explicitly null)
        result = response.get("data") or {}
        # Preserve session_id at top level for backward compatibility
        if "session_id" in response:
            result["session_id"] = response["session_id"]
        return result
    
    # ============ LIBRARY UPLOAD (SCRAPING) ============
    
    def scraper_private(
        self, 
        username: str, 
        scraper_cnt: int = 10, 
        unique_id: str = "default",
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scrape creator's videos to PRIVATE library (for Video Chat)
        Endpoint: POST /serve/api/v1/scraper
        Platforms: TikTok, Instagram, YouTube
        Returns: {code, msg, data: {taskId}}
        Note: Creates VI- prefix videos that work with chat_with_videos
        """
        data = {
            "username": username,
            "scraper_cnt": scraper_cnt,
            "unique_id": unique_id
        }
        if callback_url:
            data["callback_url"] = callback_url
        
        response = self._post("/serve/api/v1/scraper", json_data=data)
        logger.info("Creator scrape initiated (private)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    def scraper_public(
        self, 
        username: str, 
        scraper_cnt: int = 10, 
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scrape creator's videos to PUBLIC library (for Video Marketer)
        Endpoint: POST /serve/api/v1/scraper_public
        Platforms: TikTok, Instagram, YouTube
        Returns: {code, msg, data: {taskId}}
        Note: Creates PI- prefix videos that work with video_marketer_chat
        """
        data = {
            "username": username,
            "scraper_cnt": scraper_cnt
        }
        if callback_url:
            data["callback_url"] = callback_url
        
        response = self._post("/serve/api/v1/scraper_public", json_data=data)
        logger.info("Creator scrape initiated (public)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    def scraper_tag_public(
        self, 
        hash_tags: List[str], 
        scraper_cnt: int = 10, 
        callback_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scrape hashtag videos to public library
        Endpoint: POST /serve/api/v1/scraper_tag_public
        Hashtags without # prefix (e.g., ["LVMH", "Dior"])
        Returns: {code, msg, data: {taskId}}
        """
        data = {
            "hash_tags": hash_tags,
            "scraper_cnt": scraper_cnt
        }
        if callback_url:
            data["callback_url"] = callback_url
        
        response = self._post("/serve/api/v1/scraper_tag_public", json_data=data)
        logger.info("Hashtag scrape initiated (public)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    # ============ TASK STATUS ============
    
    def get_video_ids_by_task_id(self, task_id: str, unique_id: str = "default") -> Dict[str, Any]:
        """
        Get task status and video IDs
        Endpoint: GET /serve/api/v1/get_video_ids_by_task_id
        Returns: {code, msg, data: {videos: [{video_no, status, duration, video_name, video_url}]}}
        """
        params = {
            "task_id": task_id,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/get_video_ids_by_task_id", params=params)
        return response  # Return full response, not just data


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
