"""
Video API for Knowledge Base

Provides REST API endpoints for managing videos in the knowledge base.
Videos are stored in memories.ai but metadata is tracked here.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime

from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.services.supabase import DBConnection
from core.services.memories_client import get_memories_client
from core.utils.logger import logger

router = APIRouter(prefix="/knowledge-base/videos", tags=["knowledge-base-videos"])


# Models
class VideoResponse(BaseModel):
    video_id: str
    entry_id: str
    folder_id: str
    title: str
    url: Optional[str]
    platform: Optional[str]
    duration_seconds: Optional[int]
    thumbnail_url: Optional[str]
    transcript: Optional[str]
    analysis_data: dict
    created_at: str


class VideoListResponse(BaseModel):
    videos: List[VideoResponse]
    total_count: int
    folder_name: Optional[str] = None


class VideoChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)


class VideoChatResponse(BaseModel):
    video_id: str
    question: str
    answer: str
    timestamps: List[dict]
    confidence: float


# API Endpoints

@router.get("", response_model=VideoListResponse)
async def list_videos(
    folder_id: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """List all videos in knowledge base, optionally filtered by folder or platform"""
    try:
        client = await DBConnection().client
        account_id = user_id
        
        # Build query
        query = client.table('knowledge_base_videos').select('''
            video_id,
            entry_id,
            folder_id,
            title,
            url,
            platform,
            duration_seconds,
            thumbnail_url,
            transcript,
            analysis_data,
            created_at,
            knowledge_base_folders (name)
        ''').eq('account_id', account_id)
        
        # Apply filters
        if folder_id:
            query = query.eq('folder_id', folder_id)
        
        if platform:
            query = query.eq('platform', platform)
        
        # Order and paginate
        query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
        
        result = await query.execute()
        
        # Get total count
        count_query = client.table('knowledge_base_videos').select('video_id', count='exact').eq('account_id', account_id)
        if folder_id:
            count_query = count_query.eq('folder_id', folder_id)
        if platform:
            count_query = count_query.eq('platform', platform)
        
        count_result = await count_query.execute()
        
        videos = []
        folder_name = None
        
        for video_data in result.data:
            if not folder_name and video_data.get('knowledge_base_folders'):
                folder_name = video_data['knowledge_base_folders']['name']
            
            videos.append(VideoResponse(
                video_id=video_data['video_id'],
                entry_id=video_data['entry_id'],
                folder_id=video_data['folder_id'],
                title=video_data['title'],
                url=video_data.get('url'),
                platform=video_data.get('platform'),
                duration_seconds=video_data.get('duration_seconds'),
                thumbnail_url=video_data.get('thumbnail_url'),
                transcript=video_data.get('transcript'),
                analysis_data=video_data.get('analysis_data', {}),
                created_at=video_data['created_at']
            ))
        
        return VideoListResponse(
            videos=videos,
            total_count=count_result.count or 0,
            folder_name=folder_name
        )
        
    except Exception as e:
        logger.error(f"Error listing videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list videos")


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get details of a specific video"""
    try:
        client = await DBConnection().client
        account_id = user_id
        
        result = await client.table('knowledge_base_videos').select('''
            video_id,
            entry_id,
            folder_id,
            title,
            url,
            platform,
            duration_seconds,
            thumbnail_url,
            transcript,
            analysis_data,
            created_at
        ''').eq('video_id', video_id).eq('account_id', account_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_data = result.data
        
        return VideoResponse(
            video_id=video_data['video_id'],
            entry_id=video_data['entry_id'],
            folder_id=video_data['folder_id'],
            title=video_data['title'],
            url=video_data.get('url'),
            platform=video_data.get('platform'),
            duration_seconds=video_data.get('duration_seconds'),
            thumbnail_url=video_data.get('thumbnail_url'),
            transcript=video_data.get('transcript'),
            analysis_data=video_data.get('analysis_data', {}),
            created_at=video_data['created_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get video")


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Delete a video from knowledge base and memories.ai"""
    try:
        client = await DBConnection().client
        account_id = user_id
        
        # Verify ownership and get memories_user_id
        video_result = await client.table('knowledge_base_videos').select(
            'video_id, memories_user_id, entry_id'
        ).eq('video_id', video_id).eq('account_id', account_id).single().execute()
        
        if not video_result.data:
            raise HTTPException(status_code=404, detail="Video not found")
        
        memories_user_id = video_result.data['memories_user_id']
        entry_id = video_result.data['entry_id']
        
        # Delete from memories.ai
        try:
            from core.utils.config import config
            memories_client = get_memories_client(api_key=config.MEMORIES_AI_API_KEY)
            await memories_client.delete_video(user_id=memories_user_id, video_id=video_id)
        except Exception as e:
            logger.warning(f"Failed to delete video from memories.ai: {str(e)}")
            # Continue with local deletion even if memories.ai fails
        
        # Delete from database (cascade will handle knowledge_base_videos)
        await client.table('knowledge_base_entries').delete().eq('entry_id', entry_id).execute()
        
        return {"success": True, "message": "Video deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete video")


@router.post("/{video_id}/chat", response_model=VideoChatResponse)
async def chat_with_video(
    video_id: str,
    request: VideoChatRequest,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Chat with a video - ask questions and get answers with timestamps"""
    try:
        client = await DBConnection().client
        account_id = user_id
        
        # Verify ownership and get memories_user_id
        video_result = await client.table('knowledge_base_videos').select(
            'video_id, memories_user_id'
        ).eq('video_id', video_id).eq('account_id', account_id).single().execute()
        
        if not video_result.data:
            raise HTTPException(status_code=404, detail="Video not found")
        
        memories_user_id = video_result.data['memories_user_id']
        
        # Query video via memories.ai
        from core.utils.config import config
        memories_client = get_memories_client(api_key=config.MEMORIES_AI_API_KEY)
        result = await memories_client.query_video(
            user_id=memories_user_id,
            video_id=video_id,
            question=request.question
        )
        
        return VideoChatResponse(
            video_id=video_id,
            question=request.question,
            answer=result.answer,
            timestamps=result.timestamps,
            confidence=result.confidence
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error chatting with video: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to chat with video")


@router.get("/{video_id}/preview")
async def get_video_preview(
    video_id: str,
    user_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """Get video preview data for UI display"""
    try:
        client = await DBConnection().client
        account_id = user_id
        
        result = await client.table('knowledge_base_videos').select('''
            video_id,
            title,
            url,
            platform,
            duration_seconds,
            thumbnail_url,
            analysis_data,
            knowledge_base_folders (name)
        ''').eq('video_id', video_id).eq('account_id', account_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_data = result.data
        analysis = video_data.get('analysis_data', {})
        
        return {
            "video_id": video_data['video_id'],
            "title": video_data['title'],
            "url": video_data.get('url'),
            "platform": video_data.get('platform'),
            "duration_seconds": video_data.get('duration_seconds'),
            "thumbnail_url": video_data.get('thumbnail_url'),
            "folder_name": video_data.get('knowledge_base_folders', {}).get('name'),
            "hooks_count": len(analysis.get('hooks', [])),
            "ctas_count": len(analysis.get('ctas', [])),
            "engagement_prediction": analysis.get('engagement_prediction', 0.0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video preview: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get video preview")


