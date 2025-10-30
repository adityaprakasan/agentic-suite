'use client';

import React, { useState } from 'react';
import { 
  Play, Clock, ExternalLink, Eye, Heart, MessageCircle, Share2, 
  User, Video, ChevronDown, ChevronUp, Brain, Sparkles, TrendingUp,
  CheckCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface MemoriesToolRendererProps {
  result: {
    success: boolean;
    output: any;
    method_name?: string;
  };
  agentExplanation?: string;
}

// Helper function to format large numbers
function formatCount(count: string | number | undefined): string {
  if (!count) return '0';
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (isNaN(num)) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Helper function to format duration
function formatDuration(seconds: number | undefined): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get platform badge color
function getPlatformColor(platform: string): string {
  const p = platform?.toLowerCase() || '';
  if (p.includes('tiktok')) return 'bg-black text-white';
  if (p.includes('youtube')) return 'bg-red-600 text-white';
  if (p.includes('instagram')) return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white';
  return 'bg-gray-600 text-white';
}

// Reusable Video Card Component
interface VideoCardProps {
  video: any;
  platform?: string;
}

function VideoCard({ video, platform }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  
  // Extract video data with fallbacks
  const title = video.title || video.video_name || video.videoName || 'Untitled';
  const creator = video.creator || video.blogger_id || video.author || 'Unknown';
  const views = video.view_count || video.views || 0;
  const likes = video.like_count || video.likes || 0;
  const comments = video.comment_count || video.comments || 0;
  const shares = video.share_count || video.shares || 0;
  const duration = video.duration || video.duration_seconds || 0;
  const thumbnail = video.thumbnail_url || video.cover_url || video.img_url || '';
  const webUrl = video.web_url || video.share_url || video.url || '';
  const embedUrl = video.url || video.video_url || webUrl;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {thumbnail && !imgError ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : embedUrl && (embedUrl.includes('youtube.com/embed') || 
                          embedUrl.includes('tiktok.com/player') || 
                          embedUrl.includes('instagram.com/p/')) ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
            <Video className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {duration > 0 && (
          <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(duration)}
          </Badge>
              )}
        {platform && (
          <Badge className={`absolute top-2 right-2 ${getPlatformColor(platform)}`}>
            {platform.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h4 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{title}</h4>

        {/* Creator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>@{creator}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {views > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>{formatCount(views)}</span>
        </div>
      )}
          {likes > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-3 w-3" />
              <span>{formatCount(likes)}</span>
          </div>
        )}
          {comments > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              <span>{formatCount(comments)}</span>
          </div>
        )}
          {shares > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Share2 className="h-3 w-3" />
              <span>{formatCount(shares)}</span>
            </div>
          )}
        </div>

        {/* Link */}
        {webUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a href={webUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-2" />
              View Video
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}

// Renderer for search_platform_videos
function PlatformSearchResults({ data }: { data: any }) {
  const videos = data?.videos || [];
  const platform = data?.platform || 'TIKTOK';
  const query = data?.query || '';
  const count = data?.count || 0;

  if (videos.length === 0) {
  return (
      <div className="p-6 text-center">
        <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No videos found for "{query}"</p>
    </div>
  );
}

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Found {count} videos</h3>
          <p className="text-sm text-muted-foreground">
            Searching {platform} for "{query}"
          </p>
        </div>
        <Badge variant="secondary">{platform}</Badge>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video: any, index: number) => (
          <VideoCard key={video.video_no || index} video={video} platform={platform} />
        ))}
      </div>
    </div>
  );
}

// Renderer for video_marketer_chat and chat_with_videos
function VideoMarketerDisplay({ data }: { data: any }) {
  const content = data?.content || '';
  const thinkings = data?.thinkings || [];
  const refs = data?.refs || [];
  const platform = data?.platform || 'TIKTOK';

  // Extract all videos from refs
  const allVideos: any[] = [];
  refs.forEach((refGroup: any) => {
    if (refGroup.video) {
      allVideos.push(refGroup.video);
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Thinking Process (Collapsible) */}
      {thinkings && thinkings.length > 0 && (
        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="thinking" className="border-none">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="font-semibold">Thinking Process</span>
                <Badge variant="secondary" className="ml-2">{thinkings.length} steps</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {thinkings.map((thinking: any, index: number) => (
                  <div key={index} className="border-l-2 border-purple-200 dark:border-purple-800 pl-4">
                    <h4 className="font-semibold text-sm mb-1">{thinking.title}</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {thinking.content}
                    </p>
            </div>
          ))}
        </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Referenced Videos */}
      {allVideos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <h3 className="font-semibold">Referenced Videos</h3>
            <Badge variant="secondary">{allVideos.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allVideos.map((video: any, index: number) => (
              <VideoCard key={video.video_no || index} video={video} platform={platform} />
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {content && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold">Analysis</h3>
                    </div>
          <div className="prose dark:prose-invert max-w-none">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}

// Renderer for upload_creator_videos and upload_hashtag_videos
function CreatorUploadResults({ data }: { data: any }) {
  const videos = data?.videos || [];
  const creator = data?.creator || '';
  const hashtags = data?.hashtags || [];
  const status = data?.status || 'completed';
  const count = data?.count || 0;

  const title = creator 
    ? `Indexed ${count} videos from ${creator}` 
    : `Indexed ${count} videos from ${hashtags.map((h: string) => `#${h}`).join(', ')}`;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 dark:text-green-100">{title}</h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Videos are now available in the public library for analysis
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          {status}
        </Badge>
            </div>

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video: any, index: number) => (
            <VideoCard key={video.video_no || index} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Renderer
export function MemoriesToolRenderer({ result, agentExplanation }: MemoriesToolRendererProps) {
  const { output, method_name } = result;

  if (!result.success) {
  return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-900 dark:text-red-100">
          {output?.error || 'Video operation failed'}
        </p>
    </div>
  );
}

  // Normalize method name
  const normalizedMethod = method_name?.replace(/-/g, '_')?.toLowerCase();

  // Render agent explanation if provided
  const explanationSection = agentExplanation && (
    <div className="mb-4 text-sm text-zinc-700 dark:text-zinc-300 prose prose-sm dark:prose-invert max-w-none">
      <Markdown>{agentExplanation}</Markdown>
    </div>
  );

  // Route to appropriate renderer
  switch (normalizedMethod) {
    case 'search_platform_videos':
      return (
        <>
          {explanationSection}
          <PlatformSearchResults data={output} />
        </>
      );
    
    case 'video_marketer_chat':
    case 'chat_with_videos':
      return (
        <>
          {explanationSection}
          <VideoMarketerDisplay data={output} />
        </>
      );
    
    case 'upload_creator_videos':
    case 'upload_hashtag_videos':
      return (
        <>
          {explanationSection}
          <CreatorUploadResults data={output} />
        </>
      );
    
    default:
      // Fallback: try to auto-detect based on output structure
      if (output?.thinkings || output?.refs) {
        return (
          <>
            {explanationSection}
            <VideoMarketerDisplay data={output} />
          </>
        );
      }
      if (output?.videos && Array.isArray(output.videos)) {
        if (output.creator || output.hashtags) {
          return (
            <>
              {explanationSection}
              <CreatorUploadResults data={output} />
            </>
          );
        }
        return (
          <>
            {explanationSection}
            <PlatformSearchResults data={output} />
          </>
        );
      }
      
      // Generic fallback
  return (
        <>
          {explanationSection}
          <div className="p-4 rounded-lg bg-muted">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(output, null, 2)}
      </pre>
    </div>
        </>
  );
}
}
