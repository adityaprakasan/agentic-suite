'use client';

import React from 'react';
import { Play, Clock, TrendingUp, MessageSquare, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDuration, getPlatformColor, getPlatformIcon } from '@/hooks/react-query/knowledge-base/use-videos';
import type { Video } from '@/hooks/react-query/knowledge-base/use-videos';

interface VideoCardProps {
  video: Video;
  onPlay?: (video: Video) => void;
  onChat?: (video: Video) => void;
  onDelete?: (video: Video) => void;
  onAnalyze?: (video: Video) => void;
}

export function VideoCard({ video, onPlay, onChat, onDelete, onAnalyze }: VideoCardProps) {
  const duration = formatDuration(video.duration_seconds);
  const platformColor = getPlatformColor(video.platform);
  const platformIcon = getPlatformIcon(video.platform);
  const engagementScore = video.analysis_data?.engagement_prediction || 0;
  const hooksCount = video.analysis_data?.hooks?.length || 0;
  const ctasCount = video.analysis_data?.ctas?.length || 0;

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Play className="w-12 h-12" />
          </div>
        )}

        {/* Platform badge */}
        <div className={`absolute top-2 left-2 ${platformColor} text-white text-xs px-2 py-1 rounded flex items-center gap-1`}>
          <span>{platformIcon}</span>
          <span className="capitalize">{video.platform || 'Video'}</span>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{duration}</span>
        </div>

        {/* Play overlay on hover */}
        <div 
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => onPlay?.(video)}
        >
          <div className="bg-white rounded-full p-3">
            <Play className="w-8 h-8 text-gray-900" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-900 dark:text-gray-100">
          {video.title}
        </h3>

        {/* Stats */}
        {(hooksCount > 0 || ctasCount > 0 || engagementScore > 0) && (
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-3">
            {engagementScore > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{engagementScore.toFixed(1)}/10</span>
              </div>
            )}
            {hooksCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {hooksCount} Hooks
              </Badge>
            )}
            {ctasCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {ctasCount} CTAs
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onPlay?.(video)}
          >
            <Play className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onChat?.(video)}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="px-2">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onAnalyze && (
                <DropdownMenuItem onClick={() => onAnalyze(video)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analyze
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onPlay?.(video)}>
                <Play className="w-4 h-4 mr-2" />
                View Full Details
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(video)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}


