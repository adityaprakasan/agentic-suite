/**
 * React Query hooks for knowledge base videos
 * 
 * Provides hooks for fetching, uploading, and managing videos in the knowledge base.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export interface Video {
  video_id: string;
  entry_id: string;
  folder_id: string;
  title: string;
  url?: string;
  platform?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  transcript?: string;
  analysis_data: {
    hooks?: Array<any>;
    ctas?: Array<any>;
    engagement_prediction?: number;
  };
  created_at: string;
}

export interface VideoListResponse {
  videos: Video[];
  total_count: number;
  folder_name?: string;
}

export interface VideoChatRequest {
  question: string;
}

export interface VideoChatResponse {
  video_id: string;
  question: string;
  answer: string;
  timestamps: Array<{
    timestamp: string;
    text: string;
  }>;
  confidence: number;
}

export interface VideoPreview {
  video_id: string;
  title: string;
  url?: string;
  platform?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  folder_name?: string;
  hooks_count: number;
  ctas_count: number;
  engagement_prediction: number;
}

/**
 * Hook to fetch list of videos
 */
export function useVideos(options?: {
  folderId?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['kb-videos', options],
    queryFn: async (): Promise<VideoListResponse> => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const params = new URLSearchParams();
      if (options?.folderId) params.append('folder_id', options.folderId);
      if (options?.platform) params.append('platform', options.platform);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await fetch(
        `${API_URL}/api/knowledge-base/videos?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }

      return response.json();
    },
  });
}

/**
 * Hook to fetch a single video by ID
 */
export function useVideo(videoId?: string) {
  return useQuery({
    queryKey: ['kb-video', videoId],
    queryFn: async (): Promise<Video> => {
      if (!videoId) throw new Error('Video ID is required');

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_URL}/api/knowledge-base/videos/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!videoId,
  });
}

/**
 * Hook to get video preview data
 */
export function useVideoPreview(videoId?: string) {
  return useQuery({
    queryKey: ['kb-video-preview', videoId],
    queryFn: async (): Promise<VideoPreview> => {
      if (!videoId) throw new Error('Video ID is required');

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_URL}/api/knowledge-base/videos/${videoId}/preview`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch video preview: ${response.statusText}`);
      }

      return response.json();
    },
    enabled: !!videoId,
  });
}

/**
 * Hook to delete a video
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_URL}/api/knowledge-base/videos/${videoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate video queries
      queryClient.invalidateQueries({ queryKey: ['kb-videos'] });
      queryClient.invalidateQueries({ queryKey: ['kb-video'] });
      queryClient.invalidateQueries({ queryKey: ['kb-video-preview'] });
    },
  });
}

/**
 * Hook to chat with a video
 */
export function useChatWithVideo() {
  return useMutation({
    mutationFn: async ({ videoId, question }: { videoId: string; question: string }): Promise<VideoChatResponse> => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_URL}/api/knowledge-base/videos/${videoId}/chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to chat with video: ${response.statusText}`);
      }

      return response.json();
    },
  });
}

/**
 * Helper function to format video duration
 */
export function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Helper function to get platform badge color
 */
export function getPlatformColor(platform?: string): string {
  switch (platform?.toLowerCase()) {
    case 'youtube':
      return 'bg-red-500';
    case 'tiktok':
      return 'bg-black';
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'linkedin':
      return 'bg-blue-600';
    case 'upload':
    case 'url':
      return 'bg-gray-500';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Helper function to get platform icon (emoji)
 */
export function getPlatformIcon(platform?: string): string {
  switch (platform?.toLowerCase()) {
    case 'youtube':
      return '▶️';
    case 'tiktok':
      return '🎵';
    case 'instagram':
      return '📷';
    case 'linkedin':
      return '💼';
    case 'upload':
      return '⬆️';
    default:
      return '🎥';
  }
}


