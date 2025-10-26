'use client';

import React, { useState } from 'react';
import { Play, TrendingUp, Clock, ExternalLink, Save, MessageSquare, Video, User, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import { formatDuration, getPlatformColor, getPlatformIcon } from '@/hooks/react-query/knowledge-base/use-videos';

interface MemoriesToolRendererProps {
  result: {
    success: boolean;
    output: any;
    method_name?: string;
  };
}

export function MemoriesToolRenderer({ result }: MemoriesToolRendererProps) {
  const { output, method_name } = result;

  if (!result.success) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-sm text-red-900 dark:text-red-100">
          {output?.error || 'Video operation failed'}
        </p>
      </div>
    );
  }

  // Normalize method name (handle both snake_case and kebab-case)
  const normalizedMethod = method_name?.replace(/-/g, '_')?.toLowerCase();

  // Route to appropriate renderer based on method
  switch (normalizedMethod) {
    case 'search_platform_videos':
      return <PlatformSearchResults data={output} />;
    case 'query_video':
    case 'ask_video':
      return <VideoQueryDisplay data={output} />;
    case 'upload_video':
    case 'upload_video_file':
      return <VideoUploadDisplay data={output} />;
    case 'get_transcript':
      return <TranscriptDisplay data={output} />;
    case 'check_task_status':
      return <TaskStatusDisplay data={output} />;
    case 'analyze_creator':
    case 'analyze_trend':
      return <AsyncTaskDisplay data={output} />;
    case 'search_trending_content':
    case 'video_marketer':
    case 'marketer_chat':
      return <TrendingContentDisplay data={output} />;
    case 'chat_with_media':
    case 'chat_personal':
      return <PersonalMediaDisplay data={output} />;
    case 'list_my_videos':
    case 'delete_videos':
    case 'list_video_chat_sessions':
      return <SessionListDisplay data={output} />;
    default:
      return <DefaultDisplay data={output} />;
  }
}

// Platform Search Results - UPGRADED TO PREMIUM QUALITY
function PlatformSearchResults({ data }: { data: any }) {
  const videos = data.videos || [];
  const platform = data.platform || 'Platform';
  const query = data.query || '';

  // Helper to format counts (handle both strings and numbers from API)
  const formatCount = (count: number | string | undefined | null) => {
    if (count === null || count === undefined) return null;
    
    // Convert string to number (Memories.ai API returns strings like "1460")
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    
    if (isNaN(num) || num === 0) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Helper to get video link - try multiple fields
  const getVideoLink = (video: any) => {
    // Try all possible URL fields
    const url = video.web_url || video.share_url || video.video_url || video.url || video.video_play_url;
    
    // If we have a URL, return it
    if (url) return url;
    
    // Fallback: construct platform-specific URLs if we have enough info
    if (video.video_no || video.aweme_id) {
      const videoId = video.video_no || video.aweme_id;
      if (platform?.toLowerCase() === 'tiktok') {
        const creator = video.creator || video.author || 'video';
        return `https://www.tiktok.com/@${creator}/video/${videoId}`;
      }
    }
    
    return null;
  };

  return (
    <div className="space-y-4 p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b sticky top-0 bg-white dark:bg-gray-950 z-10">
        <h4 className="font-semibold text-base flex items-center gap-2">
          <Video className="w-4 h-4 text-purple-500" />
          {platform.charAt(0).toUpperCase() + platform.slice(1)} Results
        </h4>
        <Badge variant="secondary" className="text-xs px-2 py-1">{videos.length} videos</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {videos.map((video: any, idx: number) => {
          const videoLink = getVideoLink(video);
          const thumbnail = video.thumbnail_url || video.cover_url || video.img_url || video.cover;
          const hasStats = !!(video.view_count || video.like_count || video.share_count || video.comment_count);
          const platformColor = getPlatformColor(video.platform || platform);
          const creator = video.creator || video.author || video.author_name || video.blogger_id;
          const title = video.title || video.video_name || video.desc || video.description || `Video ${idx + 1}`;

          // If no link, make it a div instead of anchor
          const CardWrapper = videoLink ? 'a' : 'div';
          const cardProps: any = videoLink ? {
            href: videoLink,
            target: "_blank",
            rel: "noopener noreferrer"
          } : {};

  return (
            <CardWrapper
              key={idx}
              {...cardProps}
              className={`group block ${!videoLink && 'cursor-default'}`}
            >
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg border hover:border-purple-400 dark:hover:border-purple-600 h-full flex flex-col">
                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                  {video.url && (video.platform?.toLowerCase() === 'youtube' || video.url.includes('youtube.com/embed')) ? (
                    // YouTube: Show iframe embed directly (best UX)
                    <iframe
                      src={video.url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={title}
                    />
                  ) : thumbnail ? (
                    <>
                      <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken image and show fallback
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                        <Video className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Preview unavailable</span>
                      </div>
                      {videoLink && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Play className="w-12 h-12 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Video className="w-10 h-10 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">No preview</span>
                    </div>
                  )}

                  {/* Platform badge - Better positioning */}
                  <div className={`absolute top-1.5 left-1.5 ${platformColor} text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-md`}>
                    {video.platform || platform}
        </div>

                  {/* Duration badge */}
        {video.duration_seconds && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDuration(video.duration_seconds)}
                    </div>
                  )}

                  {/* External link indicator - Only show on hover */}
                  {videoLink && (
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-1 shadow-md">
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                      </div>
          </div>
        )}
      </div>

                <div className="p-4 space-y-3">
                  {/* Title */}
                  <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {title}
                  </h5>

                  {/* Creator */}
                  {creator && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      @{creator}
                    </p>
                  )}

                  {/* Stats Grid - Show whatever stats we have */}
                  {hasStats && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      {formatCount(video.view_count) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                          <span className="font-medium">{formatCount(video.view_count)}</span>
                          <span className="text-gray-500">views</span>
        </div>
                      )}
                      {formatCount(video.like_count) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Heart className="w-3.5 h-3.5 text-red-500" />
                          <span className="font-medium">{formatCount(video.like_count)}</span>
                          <span className="text-gray-500">likes</span>
                        </div>
                      )}
                      {formatCount(video.comment_count) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium">{formatCount(video.comment_count)}</span>
                          <span className="text-gray-500">comments</span>
                        </div>
                      )}
                      {formatCount(video.share_count) && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Share2 className="w-3.5 h-3.5 text-green-500" />
                          <span className="font-medium">{formatCount(video.share_count)}</span>
                          <span className="text-gray-500">shares</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video ID and Action */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t">
                    <span className="font-mono text-gray-500">{video.video_no || video.aweme_id || 'Unknown ID'}</span>
                    {videoLink ? (
                      <span className="text-blue-500 group-hover:underline flex items-center gap-1">
                        Watch <ExternalLink className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[10px]">No link available</span>
                    )}
                  </div>

                  {/* Missing data notice */}
                  {!hasStats && !videoLink && (
                    <div className="pt-2 border-t">
                      <p className="text-[10px] text-gray-400 italic">Limited metadata available</p>
                    </div>
                  )}
      </div>
    </Card>
            </CardWrapper>
          );
        })}
      </div>

      {data.next_action_hint && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <span className="text-base">💡</span>
            {data.next_action_hint}
          </p>
        </div>
      )}
    </div>
  );
}

// Video Analysis Display - UPGRADED TO PREMIUM QUALITY 🔥
function VideoAnalysisDisplay({ data }: { data: any }) {
  const analysis = data.analysis || data.summary || '';
  const video = data.video;
  const hooks = data.hooks || [];
  const ctas = data.ctas || [];
  const engagementScore = data.engagement_prediction || 0;

  const formatCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getVideoLink = (video: any) => {
    return video.web_url || video.share_url || video.video_url || video.url;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Video Player Card - Enhanced */}
      {video && (
        <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800">
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {video.url ? (
              <iframe
                src={video.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : video.thumbnail_url || video.cover_url ? (
              <img
                src={video.thumbnail_url || video.cover_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-16 h-16 text-gray-400" />
              </div>
            )}
              {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.duration)}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-t-2 border-purple-200 dark:border-purple-800">
            <h5 className="text-base font-semibold mb-3">{video.title || video.video_no}</h5>
            
            {/* Stats Grid */}
            {(video.view_count || video.like_count || video.comment_count || video.share_count) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {video.view_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-sm font-bold">{formatCount(video.view_count)}</p>
                    </div>
                  </div>
                )}
                {video.like_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Heart className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="text-sm font-bold">{formatCount(video.like_count)}</p>
            </div>
                  </div>
                )}
                {video.comment_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Comments</p>
                      <p className="text-sm font-bold">{formatCount(video.comment_count)}</p>
                    </div>
                  </div>
                )}
                {video.share_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Share2 className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Shares</p>
                      <p className="text-sm font-bold">{formatCount(video.share_count)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {getVideoLink(video) && (
              <a
                href={getVideoLink(video)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on platform →
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Analysis Header with Engagement Score */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Video Analysis
        </h4>
        {engagementScore > 0 && (
          <Badge variant="secondary" className="text-base px-3 py-1.5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {engagementScore.toFixed(1)}/10 Score
          </Badge>
        )}
      </div>

      {/* AI Analysis with Markdown Support */}
      {analysis && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
            <Markdown className="text-sm leading-relaxed [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            {analysis}
            </Markdown>
          </div>
        </div>
      )}

      {/* Hooks Section - Enhanced Design */}
      {hooks.length > 0 && (
        <div>
          <h5 className="text-base font-semibold mb-3 flex items-center gap-2">
            🎣 Hooks ({hooks.length})
          </h5>
          <div className="space-y-3">
            {hooks.map((hook: any, idx: number) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {hook.timestamp}
                  </Badge>
                  <Badge className="text-xs capitalize bg-yellow-500 text-white">
                    {hook.strength}
                  </Badge>
                </div>
                <p className="text-sm">{hook.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTAs Section - Enhanced Design */}
      {ctas.length > 0 && (
        <div>
          <h5 className="text-base font-semibold mb-3 flex items-center gap-2">
            📣 Calls-to-Action ({ctas.length})
          </h5>
          <div className="space-y-3">
            {ctas.map((cta: any, idx: number) => (
              <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {cta.timestamp}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{cta.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Video Comparison Display - UPGRADED TO PREMIUM QUALITY 🔥
function VideoComparisonDisplay({ data }: { data: any }) {
  const comparison = data.comparison || '';
  const videoCount = data.video_count || 0;
  const videos = data.videos || [];

  const formatCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getVideoLink = (video: any) => {
    return video.web_url || video.share_url || video.video_url || video.url;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 pb-3 border-b">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-500" />
          Video Comparison ({videoCount || videos.length})
        </h4>
          </div>

      {/* Video Grid - 2 COLUMNS with rich stats */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video: any, idx: number) => {
            const videoLink = getVideoLink(video);
            const thumbnail = video.thumbnail_url || video.cover_url || video.img_url;
            const hasStats = video.view_count || video.like_count || video.share_count || video.comment_count;
            
            return (
              <a
                key={idx}
                href={videoLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block ${!videoLink && 'pointer-events-none'}`}
              >
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-purple-400 dark:hover:border-purple-600">
                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  {video.url ? (
                    <iframe
                      src={video.url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    ) : thumbnail ? (
                      <>
                        <img
                          src={thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Play className="w-16 h-16 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                      </div>
                    )}

                    {videoLink && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {video.title || video.video_no || `Video ${idx + 1}`}
                    </h5>

                    {video.creator && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        @{video.creator}
                    </p>
                  )}

                    {hasStats && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  {video.view_count && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span className="font-medium">{formatCount(video.view_count)}</span>
                            <span className="text-gray-500">views</span>
                          </div>
                        )}
                        {video.like_count && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Heart className="w-3.5 h-3.5 text-red-500" />
                            <span className="font-medium">{formatCount(video.like_count)}</span>
                            <span className="text-gray-500">likes</span>
                </div>
                        )}
                        {video.comment_count && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-medium">{formatCount(video.comment_count)}</span>
                            <span className="text-gray-500">comments</span>
          </div>
                        )}
                        {video.share_count && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Share2 className="w-3.5 h-3.5 text-green-500" />
                            <span className="font-medium">{formatCount(video.share_count)}</span>
                            <span className="text-gray-500">shares</span>
                          </div>
                        )}
        </div>
      )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span className="font-mono">{video.video_no}</span>
                      {videoLink && (
                        <span className="text-blue-500 group-hover:underline">Watch →</span>
                      )}
                    </div>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      )}

      {/* Comparison Analysis Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Comparison Analysis
        </h4>

        {data.summary && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border-l-4 border-yellow-500">
            <p className="text-sm font-medium">{data.summary}</p>
          </div>
        )}

        {comparison && typeof comparison === 'string' && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
              <Markdown className="text-sm leading-relaxed [&>:first-child]:mt-0 [&>:last-child]:mb-0">
              {comparison}
              </Markdown>
            </div>
          </div>
        )}
        
        {comparison && typeof comparison === 'object' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(comparison, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Video Query Display - UPGRADED TO PREMIUM QUALITY 🔥
function VideoQueryDisplay({ data }: { data: any }) {
  const answer = data.answer || '';
  const video = data.video;
  const refs = data.refs || [];
  const timestamps = data.timestamps || [];
  const confidence = data.confidence || 0;

  const getVideoLink = (video: any) => {
    return video.web_url || video.share_url || video.video_url || video.url;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Video Player Section - Enhanced */}
      {video && (
        <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-800">
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {video.url ? (
              <iframe
                src={video.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : video.thumbnail_url || video.cover_url ? (
              <img
                src={video.thumbnail_url || video.cover_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-16 h-16 text-gray-400" />
              </div>
            )}
              {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.duration)}
              </div>
            )}
          </div>
          <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-t-2 border-blue-200 dark:border-blue-800">
            <h5 className="text-base font-semibold mb-2">{video.title || video.video_no}</h5>
            {getVideoLink(video) && (
              <a
                href={getVideoLink(video)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on platform →
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Q&A Header with Badges */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          Video Q&A
        </h4>
        <div className="flex items-center gap-2">
          {confidence > 0 && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {(confidence * 100).toFixed(0)}% confidence
            </Badge>
          )}
          {data.session_id && (
            <Badge variant="outline" className="text-sm px-3 py-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Conversation Mode
            </Badge>
          )}
        </div>
        </div>

      {/* Question Box */}
        {data.question && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl border-l-4 border-blue-500 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 pt-1">
              {data.question}
            </p>
          </div>
          </div>
        )}

      {/* Answer Box with Markdown */}
      {answer && (
        <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-l-4 border-green-500 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">A</span>
        </div>
            <div className="prose prose-sm dark:prose-invert max-w-none flex-1 pt-1">
              <Markdown className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                {answer}
              </Markdown>
            </div>
          </div>
        </div>
      )}

      {/* Timestamp References - Enhanced */}
        {refs.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-base font-semibold flex items-center gap-2">
            🎬 Referenced Moments ({refs.length})
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {refs.map((ref: any, idx: number) => {
              const refItems = ref.refItems || [];
              return refItems.map((item: any, itemIdx: number) => (
                <div key={`${idx}-${itemIdx}`} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border-l-2 border-purple-400">
                  <Badge variant="outline" className="text-xs mb-1 font-mono">
                    ⏱️ {item.startTime}s - {item.endTime || item.startTime}s
                  </Badge>
                  {item.text && <p className="text-sm mt-2">{item.text}</p>}
                </div>
              ));
            })}
          </div>
          </div>
        )}

        {/* Legacy timestamp format */}
        {timestamps.length > 0 && (
          <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Relevant moments:</span>
            {timestamps.map((ts: any, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs font-mono">
              ⏱️ {ts.timestamp || ts}
              </Badge>
            ))}
          </div>
        )}

        {data.conversation_hint && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2 font-medium">
              <span className="text-base">💡</span>
            {data.conversation_hint}
          </p>
          </div>
        )}
    </div>
  );
}

// Video Upload Display - UPGRADED TO PREMIUM QUALITY 🔥
function VideoUploadDisplay({ data }: { data: any }) {
  const formatCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getVideoLink = (video: any) => {
    return video.web_url || video.share_url || video.video_url || video.url;
  };

  const video = data.video || data;
  const videoLink = getVideoLink(video);

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Success Message */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Video className="w-5 h-5 text-white" />
        </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
              {data.title || 'Video Uploaded Successfully!'}
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              {data.message || 'Your video has been uploaded and is ready for analysis'}
            </p>
          </div>
        </div>
      </div>

      {/* Video Preview Card */}
      {(data.video_url || data.thumbnail_url || video.url) && (
        <Card className="overflow-hidden border-2 border-green-200 dark:border-green-800">
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            {data.video_url || video.url ? (
            <iframe
                src={data.video_url || video.url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
                title={data.title || 'Uploaded Video'}
            />
          ) : (
              <img 
                src={data.thumbnail_url || video.thumbnail_url} 
                alt={data.title || 'Video thumbnail'} 
                className="w-full h-full object-cover" 
              />
            )}

            {(data.duration_seconds || video.duration) && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(data.duration_seconds || video.duration)}
        </div>
      )}
          </div>

          <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-t-2 border-green-200 dark:border-green-800">
            <h5 className="text-base font-semibold mb-3">
              {video.title || data.video_name || data.video_no || 'Uploaded Video'}
            </h5>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        {data.platform && (
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <Video className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Platform</p>
                    <p className="text-sm font-bold">{data.platform}</p>
                  </div>
                </div>
              )}
              
              {data.video_no && (
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-xs text-gray-500">Video ID</span>
                  <p className="text-xs font-mono font-bold">{data.video_no}</p>
                </div>
              )}

        {data.saved_to_kb && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Save className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
            Saved to KB
                    </p>
                  </div>
                </div>
        )}
      </div>

            {/* Stats if available */}
            {(video.view_count || video.like_count || video.comment_count || video.share_count) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 pt-3 border-t">
                {video.view_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-sm font-bold">{formatCount(video.view_count)}</p>
                    </div>
                  </div>
                )}
                {video.like_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Heart className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="text-sm font-bold">{formatCount(video.like_count)}</p>
                    </div>
                  </div>
                )}
                {video.comment_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Comments</p>
                      <p className="text-sm font-bold">{formatCount(video.comment_count)}</p>
                    </div>
                  </div>
                )}
                {video.share_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Share2 className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Shares</p>
                      <p className="text-sm font-bold">{formatCount(video.share_count)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {videoLink && (
              <a
                href={videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on platform →
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Next Steps */}
      {data.action_hint && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <span className="text-base">💡</span>
            {data.action_hint}
          </p>
        </div>
      )}
    </div>
  );
}

// Transcript Display - UPGRADED TO PREMIUM QUALITY 🔥
function TranscriptDisplay({ data }: { data: any }) {
  const transcript = data.transcript || '';
  const wordCount = data.word_count || 0;
  const video = data.video || {};

  const formatCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getVideoLink = (video: any) => {
    return video.web_url || video.share_url || video.video_url || video.url;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-gray-950 pb-3 border-b">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-500" />
          Video Transcript
        </h4>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {wordCount.toLocaleString()} words
        </Badge>
      </div>

      {/* Video Player Card */}
      {video.url && (
        <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800">
          <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <iframe
              src={video.url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title || 'Video'}
            />
            {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(video.duration)}
          </div>
            )}
          </div>
          
          <div className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-t-2 border-purple-200 dark:border-purple-800">
            <h5 className="text-base font-semibold mb-3">{video.title || video.video_no || 'Video'}</h5>
            
            {/* Stats Grid */}
            {(video.view_count || video.like_count || video.comment_count || video.share_count) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {video.view_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Views</p>
                      <p className="text-sm font-bold">{formatCount(video.view_count)}</p>
                    </div>
            </div>
          )}
                {video.like_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Heart className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-xs text-gray-500">Likes</p>
                      <p className="text-sm font-bold">{formatCount(video.like_count)}</p>
                    </div>
                  </div>
                )}
                {video.comment_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Comments</p>
                      <p className="text-sm font-bold">{formatCount(video.comment_count)}</p>
                    </div>
                  </div>
                )}
                {video.share_count && (
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Share2 className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Shares</p>
                      <p className="text-sm font-bold">{formatCount(video.share_count)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {getVideoLink(video) && (
              <a
                href={getVideoLink(video)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Watch on platform →
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Transcript Content */}
      {transcript && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-base font-semibold">Full Transcript</h5>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(transcript);
              }}
              className="text-xs"
            >
              📋 Copy
            </Button>
        </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 max-h-[400px] overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                {transcript}
              </p>
        </div>
      </div>
        </div>
      )}

      {!transcript && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            No transcript available for this video.
          </p>
        </div>
      )}
    </div>
  );
}

// Multi Video Search Display - UPGRADED TO PREMIUM QUALITY
function MultiVideoSearchDisplay({ data }: { data: any }) {
  const analysis = data.analysis || '';
  const videosSearched = data.videos_searched || 0;
  const videos = data.videos || [];  // ✅ Video metadata for rendering

  // Helper to format counts (handle both strings and numbers from API)
  const formatCount = (count: number | string | undefined | null) => {
    if (count === null || count === undefined) return null;
    
    // Convert string to number (Memories.ai API returns strings like "1460")
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    
    if (isNaN(num) || num === 0) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getVideoLink = (video: any) => {
    return video.web_url || video.share_url || video.video_url || video.url || 
           (video.video_no ? `https://www.tiktok.com/@unknown/video/${video.video_no}` : null);
  };

  const getThumbnail = (video: any) => {
    return video.cover_url || video.thumbnail_url || video.img_url || video.cover;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Analysis Section - Show FIRST */}
      {analysis && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 pb-4 border-b">
          <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Multi-Video Search Results
          </h4>
          {data.query && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <span className="font-medium">Query:</span> {data.query}
            </p>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <Markdown className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                {analysis}
              </Markdown>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid - 2 COLUMNS with rich stats */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              Analyzed Videos ({videosSearched || videos.length})
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video: any, idx: number) => {
              const videoLink = getVideoLink(video);
              const thumbnail = getThumbnail(video);
              const hasStats = video.view_count || video.like_count || video.share_count || video.comment_count;
              
              return (
                <a 
                  key={idx} 
                  href={videoLink || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`group block ${!videoLink && 'pointer-events-none'}`}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-purple-400 dark:hover:border-purple-600">
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      {thumbnail ? (
                        <>
                          <img
                            src={thumbnail}
                            alt={video.title || `Video ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Play className="w-16 h-16 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                      
                  {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                        </div>
                      )}
                      
                      {videoLink && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      )}
        </div>

                    <div className="p-4 space-y-3">
                      <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {video.title || video.video_name || video.video_no || `Video ${idx + 1}`}
                      </h5>
                      
                      {video.creator && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          @{video.creator}
          </p>
        )}

                      {hasStats && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          {video.view_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              <span className="font-medium">{formatCount(video.view_count)}</span>
                              <span className="text-gray-500">views</span>
            </div>
                          )}
                          {video.like_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Heart className="w-3.5 h-3.5 text-red-500" />
                              <span className="font-medium">{formatCount(video.like_count)}</span>
                              <span className="text-gray-500">likes</span>
                            </div>
                          )}
                          {video.comment_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                              <span className="font-medium">{formatCount(video.comment_count)}</span>
                              <span className="text-gray-500">comments</span>
                            </div>
                          )}
                          {video.share_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Share2 className="w-3.5 h-3.5 text-green-500" />
                              <span className="font-medium">{formatCount(video.share_count)}</span>
                              <span className="text-gray-500">shares</span>
                            </div>
                          )}
          </div>
        )}

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                        <span className="font-mono">{video.video_no}</span>
                        {videoLink && (
                          <span className="text-blue-500 group-hover:underline">Watch →</span>
        )}
      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Task Status Display (for check_task_status)
function TaskStatusDisplay({ data }: { data: any }) {
  const videos = data.videos || [];
  const taskId = data.task_id || '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Task Status</h4>
        <Badge variant="secondary">{videos.length} videos</Badge>
      </div>

      {taskId && (
        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          Task ID: {taskId}
        </p>
      )}

      {videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((video: any, idx: number) => (
            <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium">{video.video_name || video.video_no}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {video.duration}s • {video.video_no}
                </p>
              </div>
              <Badge variant={video.status === 'PARSE' ? 'default' : 'secondary'}>
                {video.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {videos.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {data.message || 'Videos are still being processed...'}
        </p>
      )}
    </div>
  );
}

// Async Task Display (for analyze_creator, analyze_trend) - UPGRADED TO PREMIUM QUALITY 🔥
function AsyncTaskDisplay({ data }: { data: any }) {
  const taskId = data.task_id || '';
  const status = data.status || 'processing';
  const videos = data.videos || [];
  const analysis = data.analysis || '';

  const formatCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getVideoLink = (video: any) => {
    return video.web_url || video.share_url || video.video_url || video.url;
  };

  const getThumbnail = (video: any) => {
    return video.cover_url || video.thumbnail_url || video.img_url || video.cover;
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Task Status Card */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-lg text-blue-900 dark:text-blue-100 mb-1">
              {status === 'processing' ? 'Task In Progress...' : 'Task Started'}
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              {data.message || 'Processing your request in the background'}
            </p>
            
            {taskId && (
              <div className="space-y-2">
      <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Task ID:</span>
                  <code className="text-xs bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded font-mono">
                    {taskId}
                  </code>
        </div>
                <Badge 
                  variant={status === 'completed' ? 'default' : 'secondary'}
                  className={status === 'processing' ? 'animate-pulse' : ''}
                >
                  {status}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Hint */}
      {data.action_hint && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <span className="text-base">💡</span>
            {data.action_hint}
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div>
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Analysis Results
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-sm">
              <Markdown className="text-sm leading-relaxed [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                {analysis}
              </Markdown>
            </div>
          </div>
        </div>
      )}

      {/* Videos Grid - 2 COLUMNS with rich stats */}
      {videos.length > 0 && (
        <div>
          <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-purple-500" />
            Creator Videos ({videos.length})
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((video: any, idx: number) => {
              const videoLink = getVideoLink(video);
              const thumbnail = getThumbnail(video);
              const hasStats = video.view_count || video.like_count || video.share_count || video.comment_count;
              
              return (
                <a
                  key={idx}
                  href={videoLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block ${!videoLink && 'pointer-events-none'}`}
                >
                  <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-purple-400 dark:hover:border-purple-600">
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  {video.url ? (
                    <iframe
                      src={video.url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={video.title}
                    />
                      ) : thumbnail ? (
                        <>
                          <img
                            src={thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Play className="w-16 h-16 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                        </div>
                      )}

                      {videoLink && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {video.title || video.video_no || `Video ${idx + 1}`}
                      </h5>

                      {video.creator && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          @{video.creator}
                    </p>
                  )}

                      {hasStats && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          {video.view_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              <span className="font-medium">{formatCount(video.view_count)}</span>
                              <span className="text-gray-500">views</span>
                            </div>
                          )}
                          {video.like_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Heart className="w-3.5 h-3.5 text-red-500" />
                              <span className="font-medium">{formatCount(video.like_count)}</span>
                              <span className="text-gray-500">likes</span>
                            </div>
                          )}
                          {video.comment_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                              <span className="font-medium">{formatCount(video.comment_count)}</span>
                              <span className="text-gray-500">comments</span>
                            </div>
                          )}
                          {video.share_count && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Share2 className="w-3.5 h-3.5 text-green-500" />
                              <span className="font-medium">{formatCount(video.share_count)}</span>
                              <span className="text-gray-500">shares</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                        <span className="font-mono">{video.video_no}</span>
                        {videoLink && (
                          <span className="text-blue-500 group-hover:underline">Watch →</span>
                        )}
                      </div>
                </div>
              </Card>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Trending Content Display (search_trending_content)
function TrendingContentDisplay({ data }: { data: any }) {
  const analysis = data.analysis || '';
  const videos = data.videos || [];  // ✅ Match backend field name
  const platform = data.platform || 'TIKTOK';

  // Helper to format counts (handle both strings and numbers from API)
  const formatCount = (count: number | string | undefined | null) => {
    if (count === null || count === undefined) return null;
    
    // Convert string to number (Memories.ai API returns strings like "1460")
    const num = typeof count === 'string' ? parseInt(count, 10) : count;
    
    if (isNaN(num) || num === 0) return null;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Helper to get video link (try multiple possible fields)
  const getVideoLink = (video: any) => {
    const url = video.web_url || video.share_url || video.video_url || video.url || video.video_play_url;
    if (url) return url;
    
    // Fallback: construct TikTok URL if we have video_no
    if (video.video_no || video.aweme_id) {
      const videoId = video.video_no || video.aweme_id;
      const creator = video.creator || video.author || 'video';
      return `https://www.tiktok.com/@${creator}/video/${videoId}`;
    }
    
    return null;
  };

  // Helper to get thumbnail (try multiple possible fields)
  const getThumbnail = (video: any) => {
    return video.cover_url || video.thumbnail_url || video.img_url || video.cover;
  };

  return (
    <div className="space-y-4 p-4 max-h-[80vh] overflow-y-auto">
      {/* Analysis Section - Show FIRST for better UX */}
      {analysis && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 pb-3 border-b">
          <h4 className="font-semibold mb-2 text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Trending Analysis
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <Markdown className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                {analysis}
              </Markdown>
            </div>
          </div>
        </div>
      )}

      {/* Referenced Videos Grid - 2 COLUMNS with rich stats */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-500" />
              Trending Videos ({videos.length})
            </h4>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {platform}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {videos.map((video: any, idx: number) => {
              const videoLink = getVideoLink(video);
              const thumbnail = getThumbnail(video);
              const hasStats = !!(video.view_count || video.like_count || video.share_count || video.comment_count);
              const creator = video.creator || video.author || video.author_name || video.blogger_id;
              const title = video.title || video.video_name || video.desc || video.description || `Video ${idx + 1}`;
              
              const CardWrapper = videoLink ? 'a' : 'div';
              const cardProps: any = videoLink ? {
                href: videoLink,
                target: "_blank",
                rel: "noopener noreferrer"
              } : {};
              
              return (
                <CardWrapper
                  key={idx}
                  {...cardProps}
                  className={`group block ${!videoLink && 'cursor-default'}`}
                >
                  <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg border hover:border-purple-400 dark:hover:border-purple-600 h-full flex flex-col">
                    {/* Thumbnail with overlay OR iframe embed */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                      {video.url && (video.platform?.toLowerCase() === 'youtube' || video.url.includes('youtube.com/embed')) ? (
                        // YouTube: Show iframe embed directly (best UX)
                        <iframe
                          src={video.url}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={title}
                        />
                      ) : thumbnail ? (
                        <>
                          <img
                            src={thumbnail}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide broken image and show fallback
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-full h-full flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                            <Video className="w-12 h-12 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Preview unavailable</span>
                          </div>
                          {videoLink && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Play className="w-16 h-16 text-white drop-shadow-lg" />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                          <Video className="w-12 h-12 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">No preview</span>
                        </div>
                      )}
                      
                      {/* Duration badge */}
                  {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                        </div>
                      )}
                      
                      {/* External link indicator */}
                      {videoLink && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Video info */}
                    <div className="p-4 space-y-3">
                      {/* Title */}
                      <h5 className="font-semibold text-sm line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {title}
                      </h5>
                      
                      {/* Creator */}
                      {creator && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          @{creator}
                        </p>
                      )}
                      
                      {/* Stats Grid */}
                      {hasStats && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          {formatCount(video.view_count) && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              <span className="font-medium">{formatCount(video.view_count)}</span>
                              <span className="text-gray-500">views</span>
                </div>
                          )}
                          {formatCount(video.like_count) && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Heart className="w-3.5 h-3.5 text-red-500" />
                              <span className="font-medium">{formatCount(video.like_count)}</span>
                              <span className="text-gray-500">likes</span>
          </div>
                          )}
                          {formatCount(video.comment_count) && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                              <span className="font-medium">{formatCount(video.comment_count)}</span>
                              <span className="text-gray-500">comments</span>
                            </div>
                          )}
                          {formatCount(video.share_count) && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Share2 className="w-3.5 h-3.5 text-green-500" />
                              <span className="font-medium">{formatCount(video.share_count)}</span>
                              <span className="text-gray-500">shares</span>
                            </div>
                          )}
        </div>
      )}

                      {/* Additional metadata */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t">
                        <span className="font-mono text-gray-500">{video.video_no || video.aweme_id || 'Unknown ID'}</span>
                        {videoLink ? (
                          <span className="text-blue-500 group-hover:underline flex items-center gap-1">
                            Watch <ExternalLink className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">No link available</span>
                        )}
            </div>

                      {!hasStats && !videoLink && (
                        <div className="pt-2 border-t">
                          <p className="text-[10px] text-gray-400 italic">Limited metadata available</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </CardWrapper>
              );
            })}
          </div>
        </div>
      )}

      {data.conversation_hint && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
          <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2 font-medium">
            <span className="text-base">💡</span>
          {data.conversation_hint}
        </p>
        </div>
      )}
    </div>
  );
}

// Personal Media Display (chat_with_media)
function PersonalMediaDisplay({ data }: { data: any }) {
  const answer = data.answer || '';
  const mediaItems = data.media_items || [];

  return (
    <div className="space-y-4">
      {/* Media Grid */}
      {mediaItems.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Referenced Media ({mediaItems.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mediaItems.map((item: any, idx: number) => (
              <Card key={idx} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 dark:bg-gray-900">
                  {item.type === 'video' && item.video_url ? (
                    <iframe
                      src={item.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={item.title}
                    />
                  ) : item.img_url ? (
                    <img src={item.img_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                  {item.duration && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatDuration(item.duration)}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Answer Section */}
      {answer && (
        <div>
          <h4 className="font-semibold mb-2">Answer</h4>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>
        </div>
      )}

      {data.conversation_hint && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
          <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2 font-medium">
            <span className="text-base">💡</span>
          {data.conversation_hint}
        </p>
        </div>
      )}
    </div>
  );
}

// Session List Display
function SessionListDisplay({ data }: { data: any }) {
  const sessions = data.sessions || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Recent Conversations</h4>
        <Badge>{sessions.length} sessions</Badge>
      </div>

      {data.message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{data.message}</p>
      )}

      <div className="space-y-2">
        {sessions.map((session: any, idx: number) => (
          <Card key={idx} className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">{session.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {session.last_prompt}
                </p>
              </div>
              {session.platform && (
                <Badge variant="secondary" className="ml-2">{session.platform}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <span className="font-mono">{session.session_id}</span>
              <span>
                {new Date(session.last_message_at).toLocaleDateString()}
              </span>
            </div>
            {session.video_ids && session.video_ids.length > 0 && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {session.video_ids.length} video{session.video_ids.length > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      {data.hint && (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          {data.hint}
        </p>
      )}
    </div>
  );
}

// Default Display (INTELLIGENT fallback - NO MORE RAW JSON!)
function DefaultDisplay({ data }: { data: any }) {
  // Extract ALL possible video fields
  const videos = data.videos || data.referenced_videos || data.results || data.video || [];
  const videoArray = Array.isArray(videos) ? videos : (videos ? [videos] : []);
  
  // Extract ALL possible text content fields (try markdown first, then plain text)
  const analysis = data.analysis || data.content || data.answer || data.summary || 
                   data.message || data.description || data.text || data.result || '';
  
  // Extract single video metadata if present
  const singleVideo = data.video || (data.video_id && data);
  
  // Check for metadata
  const hasVideos = videoArray.length > 0;
  const hasAnalysis = !!analysis;
  const hasSingleVideo = singleVideo && (singleVideo.url || singleVideo.video_url);
  
  // If we have ANY renderable content, show it beautifully
  if (hasVideos || hasAnalysis || hasSingleVideo) {
  return (
      <div className="space-y-4">
        {/* Single Video Display (for video-specific operations) */}
        {hasSingleVideo && !hasVideos && (
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
              {singleVideo.url || singleVideo.video_url ? (
                <iframe
                  src={singleVideo.url || singleVideo.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={singleVideo.title || 'Video'}
                />
              ) : singleVideo.thumbnail_url ? (
                <img
                  src={singleVideo.thumbnail_url}
                  alt={singleVideo.title || 'Video'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-3 border-t">
              <h5 className="text-sm font-medium">{singleVideo.title || singleVideo.video_no || 'Video'}</h5>
              {singleVideo.duration && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatDuration(singleVideo.duration)}
                </p>
              )}
            </div>
          </Card>
        )}
        
        {/* Video Grid - render multiple videos */}
        {hasVideos && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4" />
              <h4 className="font-semibold">Videos ({videoArray.length})</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {videoArray.map((video: any, idx: number) => (
                <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
                    {video.url || video.video_url ? (
                      <iframe
                        src={video.url || video.video_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={video.title || video.video_name || `Video ${idx + 1}`}
                      />
                    ) : video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title || 'Video thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-2">
                      {video.title || video.video_name || video.video_no || `Video ${idx + 1}`}
                    </p>
                    {video.duration && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.duration)}
                      </p>
                    )}
                    {video.view_count && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(video.view_count / 1000).toFixed(0)}K views
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Analysis/Content with Markdown support */}
        {hasAnalysis && (
          <div>
            <h4 className="font-semibold mb-2">
              {data.query ? 'Analysis' : data.question ? 'Answer' : 'Content'}
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Markdown className="text-sm [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                  {analysis}
                </Markdown>
              </div>
            </div>
          </div>
        )}
        
        {/* Show query/question context if present */}
        {data.query && (
          <div className="text-xs text-gray-600 dark:text-gray-400 italic">
            <span className="font-semibold">Query:</span> {data.query}
          </div>
        )}
        
        {/* Show helpful metadata */}
        <div className="flex flex-wrap gap-2 text-xs">
          {data.platform && (
            <Badge variant="secondary">{data.platform}</Badge>
          )}
          {data.session_id && (
            <Badge variant="outline" className="font-mono">
              Session: {data.session_id.slice(0, 8)}...
            </Badge>
          )}
          {data.videos_searched && (
            <Badge variant="outline">
              {data.videos_searched} videos searched
            </Badge>
          )}
          {data.video_count && (
            <Badge variant="outline">
              {data.video_count} videos
            </Badge>
          )}
        </div>
        
        {/* Show hints if present */}
        {data.conversation_hint && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
            <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2 font-medium">
              <span className="text-base">💡</span>
              {data.conversation_hint}
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // Last resort: if truly no renderable content, show a friendly message
  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Video className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Operation Completed</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            The operation completed successfully but returned no displayable content.
          </p>
        </div>
      </div>
      {Object.keys(data).length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
            Show technical details
          </summary>
          <pre className="text-xs mt-2 p-2 bg-white dark:bg-gray-950 rounded overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
        </details>
      )}
    </div>
  );
}



