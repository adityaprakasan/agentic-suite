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
    
    # ============ CREATOR & HASHTAG UPLOAD METHODS ============
    
    def upload_from_creator_url(self, creator_url: str, unique_id: str = "default", scraper_cnt: int = 4, callback: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload videos from creator URL (private library)
        Endpoint: POST /serve/api/v1/scraper
        Platforms: TikTok, Instagram, YouTube
        Returns: {code, msg, data: {taskId}}
        """
        data = {
            "username": creator_url,
            "unique_id": unique_id,
            "scraper_cnt": scraper_cnt
        }
        if callback:
            data["callback_url"] = callback
        
        response = self._post("/serve/api/v1/scraper", json_data=data)
        logger.info("Creator scrape initiated (private)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    def upload_from_creator_url_public(self, creator_url: str, scraper_cnt: int = 4, callback: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload videos from creator URL (public library)
        Endpoint: POST /serve/api/v1/scraper_public
        """
        data = {
            "username": creator_url,
            "scraper_cnt": scraper_cnt
        }
        if callback:
            data["callback_url"] = callback
        
        response = self._post("/serve/api/v1/scraper_public", json_data=data)
        logger.info("Creator scrape initiated (public)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    def upload_from_hashtag(self, hashtags: List[str], unique_id: str = "default", scraper_cnt: int = 2, callback: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload videos from hashtags (private library)
        Endpoint: POST /serve/api/v1/scraper_tag
        Hashtags without # prefix (e.g., ["LVMH", "Dior"])
        Returns: {code, msg, data: {taskId}}
        """
        data = {
            "hash_tags": hashtags,
            "unique_id": unique_id,
            "scraper_cnt": scraper_cnt
        }
        if callback:
            data["callback_url"] = callback
        
        response = self._post("/serve/api/v1/scraper_tag", json_data=data)
        logger.info("Hashtag scrape initiated (private)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    def upload_from_hashtag_public(self, hashtags: List[str], scraper_cnt: int = 2, callback: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload videos from hashtags (public library)
        Endpoint: POST /serve/api/v1/scraper_tag_public
        """
        data = {
            "hash_tags": hashtags,
            "scraper_cnt": scraper_cnt
        }
        if callback:
            data["callback_url"] = callback
        
        response = self._post("/serve/api/v1/scraper_tag_public", json_data=data)
        logger.info("Hashtag scrape initiated (public)", task_id=response.get("data", {}).get("taskId"))
        return response
    
    def upload_image_from_file(self, file_paths: List[str], unique_id: str = "default", datetime_taken: Optional[str] = None, camera_model: Optional[str] = None, latitude: Optional[str] = None, longitude: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload one or multiple images
        Endpoint: POST /serve/api/v1/upload_img
        Returns: {code, msg, data: [{id, ...}]}
        """
        import os
        
        files = []
        for file_path in file_paths:
            f = open(file_path, 'rb')
            files.append(("files", (os.path.basename(file_path), f, "image/png")))
        
        data = {"unique_id": unique_id}
        if datetime_taken:
            data["datetime_taken"] = datetime_taken
        if camera_model:
            data["camera_model"] = camera_model
        if latitude:
            data["latitude"] = latitude
        if longitude:
            data["longitude"] = longitude
        
        try:
            response = self._post("/serve/api/v1/upload_img", json_data=data, files=files)
            logger.info("Images uploaded", count=len(file_paths))
            return response
        finally:
            for _, (_, f, _) in files:
                f.close()
    
    # ============ ADVANCED SEARCH METHODS ============
    
    def search_audio_transcripts(self, query: str, page: int = 1, page_size: int = 50, unique_id: str = "default") -> Dict[str, Any]:
        """
        Search audio transcripts in private library
        Endpoint: GET /serve/api/v1/search_audio_transcripts
        Returns: {results: [], page, page_size, total}
        """
        params = {
            "query": query,
            "page": page,
            "page_size": page_size,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/search_audio_transcripts", params=params)
        return response
    
    def search_public_audio_transcripts(self, query: str, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        """
        Search audio transcripts in public library
        Endpoint: GET /serve/api/v1/search_public_audio_transcripts
        """
        params = {
            "query": query,
            "page": page,
            "page_size": page_size
        }
        response = self._get("/serve/api/v1/search_public_audio_transcripts", params=params)
        return response
    
    def search_similar_images(self, file_path: str, unique_id: str = "default", similarity: float = 0.8) -> Dict[str, Any]:
        """
        Search for similar images in private library
        Endpoint: POST /serve/api/v1/search_similar_images
        """
        import os
        
        with open(file_path, 'rb') as f:
            files = {
                "file": (os.path.basename(file_path), f, "image/png")
            }
            data = {
                "unique_id": unique_id,
                "similarity": similarity
            }
            response = self._post("/serve/api/v1/search_similar_images", json_data=data, files=files)
        
        return response
    
    def search_public_similar_images(self, file_path: str, platform: str = "TIKTOK", similarity: float = 0.8) -> Dict[str, Any]:
        """
        Search for similar images in public library
        Endpoint: POST /serve/api/v1/search_public_similar_images
        Platforms: TIKTOK, YOUTUBE, INSTAGRAM
        """
        import os
        
        with open(file_path, 'rb') as f:
            files = {
                "file": (os.path.basename(file_path), f, "image/png")
            }
            data = {
                "type": platform.upper(),
                "similarity": similarity
            }
            response = self._post("/serve/api/v1/search_public_similar_images", json_data=data, files=files)
        
        return response
    
    def search_clips_by_image(self, file_path: str, video_no: str, prompt: str, unique_id: str = "default") -> List[Dict[str, Any]]:
        """
        Search video clips matching an image
        Endpoint: POST /serve/api/v1/search_clips_by_image
        Returns: {data: [{start_time, end_time, score}]}
        """
        import os
        
        with open(file_path, 'rb') as f:
            files = {
                "file": (os.path.basename(file_path), f, "image/png")
            }
            data = {
                "video_no": video_no,
                "prompt": prompt,
                "unique_id": unique_id
            }
            response = self._post("/serve/api/v1/search_clips_by_image", json_data=data, files=files)
        
        return response.get("data", [])
    
    # ============ ADVANCED CHAT METHODS ============
    
    def chat_personal(self, prompt: str, session_id: Optional[str] = None, unique_id: str = "default") -> Dict[str, Any]:
        """
        Chat with personal media entities (videos + images)
        Endpoint: POST /serve/api/v1/chat_personal
        Returns: {role, content, refs, thinkings}
        """
        data = {
            "prompt": prompt,
            "unique_id": unique_id
        }
        if session_id:
            data["session_id"] = session_id
        
        response = self._post("/serve/api/v1/chat_personal", json_data=data)
        return response.get("data", {})
    
    # ============ ADVANCED TRANSCRIPTION METHODS ============
    
    def generate_summary(self, video_no: str, summary_type: str = "CHAPTER", unique_id: str = "default") -> Dict[str, Any]:
        """
        Generate video summary (CHAPTER or TOPIC)
        Endpoint: GET /serve/api/v1/generate_summary
        Types: CHAPTER (scene-based), TOPIC (semantic grouping)
        Returns: {summary: str, items: [{title, start, end, description}]}
        """
        params = {
            "video_no": video_no,
            "type": summary_type.upper(),
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/generate_summary", params=params)
        return response.get("data", {})
    
    def update_video_transcription(self, video_no: str, prompt: str, unique_id: str = "default", callback: Optional[str] = None) -> Dict[str, Any]:
        """
        Update video transcription with custom prompt
        Endpoint: POST /serve/api/v1/update_video_transcription
        Note: Transcription is permanently updated
        Returns: {video_no}
        """
        data = {
            "video_no": video_no,
            "prompt": prompt,
            "unique_id": unique_id
        }
        if callback:
            data["callback"] = callback
        
        response = self._post("/serve/api/v1/update_video_transcription", json_data=data)
        return response.get("data", {})
    
    # ============ SESSION & DETAIL METHODS ============
    
    def list_sessions(self, page: int = 1, unique_id: str = "default") -> Dict[str, Any]:
        """
        List chat sessions
        Endpoint: GET /serve/api/v1/list_sessions
        Returns: {sessions: [{sessionId, title}], current_page, page_size, total_count}
        """
        params = {
            "page": page,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/list_sessions", params=params)
        return response.get("data", {})
    
    def get_session_detail(self, session_id: str, unique_id: str = "default") -> Dict[str, Any]:
        """
        Get session conversation history
        Endpoint: GET /serve/api/v1/get_session_detail
        Returns: {title, messages: [{role, content, thinkings, refs}]}
        """
        params = {
            "session_id": session_id,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/get_session_detail", params=params)
        return response.get("data", {})
    
    def get_private_video_details(self, video_no: str, unique_id: str = "default") -> Dict[str, Any]:
        """
        Get private video metadata
        Endpoint: GET /serve/api/v1/get_private_video_details
        Returns: {duration, size, status, fps, width, height, video_url, resolution_label}
        """
        params = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        response = self._get("/serve/api/v1/get_private_video_details", params=params)
        return response.get("data", {})
    
    def download_video(self, video_no: str, unique_id: str = "default") -> bytes:
        """
        Download video file (binary stream)
        Endpoint: POST /serve/api/v1/download
        Returns: Binary video content (save to file)
        """
        data = {
            "video_no": video_no,
            "unique_id": unique_id
        }
        url = f"{self.BASE_URL}/serve/api/v1/download"
        response = requests.post(url, json=data, headers={"Authorization": self.api_key}, stream=True)
        response.raise_for_status()
        
        # Return binary content
        return response.content
    
    def list_images(self, page: int = 1, page_size: int = 20, unique_id: str = "default") -> Dict[str, Any]:
        """
        List uploaded images
        Endpoint: POST /serve/api/v1/img_list_page
        Returns: {images: [{image_no, image_name, status, upload_time}], current_page, page_size, total_count}
        """
        data = {
            "page": page,
            "page_size": page_size,
            "unique_id": unique_id
        }
        response = self._post("/serve/api/v1/img_list_page", json_data=data)
        return response.get("data", {})


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
