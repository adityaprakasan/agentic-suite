'use client';

import React, { useState } from 'react';
import { Play, TrendingUp, Clock, ExternalLink, Save, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  const normalizedMethod = method_name?.replace(/-/g, '_');

  // Route to appropriate renderer based on method
  switch (normalizedMethod) {
    case 'search_platform_videos':
      return <PlatformSearchResults data={output} />;
    case 'analyze_video':
      return <VideoAnalysisDisplay data={output} />;
    case 'compare_videos':
      return <VideoComparisonDisplay data={output} />;
    case 'query_video':
    case 'search_in_video':
      return <VideoQueryDisplay data={output} />;
    case 'upload_video':
    case 'upload_video_file':
      return <VideoUploadDisplay data={output} />;
    case 'get_transcript':
      return <TranscriptDisplay data={output} />;
    case 'multi_video_search':
      return <MultiVideoSearchDisplay data={output} />;
    case 'check_task_status':
      return <TaskStatusDisplay data={output} />;
    case 'analyze_creator':
    case 'analyze_trend':
      return <AsyncTaskDisplay data={output} />;
    case 'search_trending_content':
      return <TrendingContentDisplay data={output} />;
    case 'chat_with_media':
      return <PersonalMediaDisplay data={output} />;
    case 'list_trending_sessions':
    case 'list_video_chat_sessions':
      return <SessionListDisplay data={output} />;
    default:
      return <DefaultDisplay data={output} />;
  }
}

// Platform Search Results
function PlatformSearchResults({ data }: { data: any }) {
  const videos = data.videos || [];
  const platform = data.platform || 'Platform';
  const query = data.query || '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">
          {platform.charAt(0).toUpperCase() + platform.slice(1)} Results: "{query}"
        </h4>
        <Badge>{videos.length} videos</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.slice(0, 12).map((video: any, idx: number) => (
          <VideoSearchCard key={idx} video={video} />
        ))}
      </div>

      {data.next_action_hint && (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
          {data.next_action_hint}
        </p>
      )}
    </div>
  );
}

function VideoSearchCard({ video }: { video: any }) {
  const platformColor = getPlatformColor(video.platform);
  const platformIcon = getPlatformIcon(video.platform);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
        {video.url ? (
          <iframe
            src={video.url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        ) : video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${video.url || video.thumbnail_url ? 'hidden' : ''}`}>
          <Play className="w-8 h-8 text-gray-400" />
        </div>

        <div className={`absolute top-2 left-2 ${platformColor} text-white text-xs px-2 py-1 rounded flex items-center gap-1`}>
          <span>{platformIcon}</span>
        </div>

        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(video.duration_seconds)}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h5 className="text-sm font-medium line-clamp-2 mb-2">{video.title}</h5>
        <div className="flex items-center gap-2">
          {video.url && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => window.open(video.url, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Video Analysis Display
function VideoAnalysisDisplay({ data }: { data: any }) {
  const analysis = data.analysis || data.summary || '';
  const video = data.video;  // ✅ Video metadata for rendering
  const hooks = data.hooks || [];
  const ctas = data.ctas || [];
  const engagementScore = data.engagement_prediction || 0;

  return (
    <div className="space-y-4">
      {/* Video Player */}
      {video && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
            {video.url ? (
              <iframe
                src={video.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-3 border-t">
            <h5 className="text-sm font-medium mb-1">{video.title || video.video_no}</h5>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              {video.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.duration)}
                </span>
              )}
              {video.view_count && (
                <span>{(video.view_count / 1000).toFixed(0)}K views</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Analysis Section */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Video Analysis</h4>
        {engagementScore > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {engagementScore.toFixed(1)}/10
          </Badge>
        )}
      </div>

      {/* Full Analysis Text (primary display) */}
      {analysis && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap">
            {analysis}
          </div>
        </div>
      )}

      {/* Hooks (legacy format - only if structured data available) */}
      {hooks.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Hooks ({hooks.length})</h5>
          <div className="space-y-2">
            {hooks.map((hook: any, idx: number) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {hook.timestamp}
                  </Badge>
                  <Badge className="text-xs capitalize">{hook.strength}</Badge>
                </div>
                <p className="text-xs">{hook.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTAs (legacy format - only if structured data available) */}
      {ctas.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">CTAs ({ctas.length})</h5>
          <div className="space-y-2">
            {ctas.map((cta: any, idx: number) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">{cta.timestamp}</Badge>
                </div>
                <p className="text-xs font-medium">{cta.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Video Comparison Display
function VideoComparisonDisplay({ data }: { data: any }) {
  const comparison = data.comparison || '';
  const videoCount = data.video_count || 0;
  const videos = data.videos || [];  // ✅ Video metadata for rendering

  return (
    <div className="space-y-4">
      {/* Video Grid */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Compared Videos ({videoCount})</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {videos.map((video: any, idx: number) => (
              <Card key={idx} className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
                  {video.url ? (
                    <iframe
                      src={video.url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                  {video.duration && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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

      {/* Comparison Analysis */}
      <div className="space-y-3">
        <h4 className="font-semibold">Comparison Analysis</h4>

        {data.summary && (
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.summary}</p>
        )}

        {/* Render comparison analysis (text format from chat_with_video) */}
        {comparison && typeof comparison === 'string' && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap">
              {comparison}
            </div>
          </div>
        )}
        
        {/* Fallback for legacy structured format */}
        {comparison && typeof comparison === 'object' && (
          <div className="overflow-x-auto">
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
              {JSON.stringify(comparison, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Video Query Display
function VideoQueryDisplay({ data }: { data: any }) {
  const answer = data.answer || '';
  const video = data.video; // Video metadata for rendering
  const refs = data.refs || [];
  const timestamps = data.timestamps || [];
  const confidence = data.confidence || 0;

  return (
    <div className="space-y-4">
      {/* Video Player Section */}
      {video && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
            {video.url ? (
              <iframe
                src={video.url}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-3 border-t">
            <h5 className="text-sm font-medium mb-1">{video.title || video.video_no}</h5>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              {video.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.duration)}
                </span>
              )}
              {video.view_count && (
                <span>{(video.view_count / 1000).toFixed(0)}K views</span>
              )}
              {video.like_count && (
                <span>{(video.like_count / 1000).toFixed(0)}K likes</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Q&A Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Video Q&A</h4>
          {confidence > 0 && (
            <Badge variant="secondary">
              {(confidence * 100).toFixed(0)}% confidence
            </Badge>
          )}
          {data.session_id && (
            <Badge variant="outline" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Session Active
            </Badge>
          )}
        </div>

        {data.question && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Q: {data.question}
            </p>
          </div>
        )}

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <p className="text-sm whitespace-pre-wrap">{answer}</p>
        </div>

        {/* Timestamp References from refs array */}
        {refs.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Referenced Moments:
            </span>
            {refs.map((ref: any, idx: number) => {
              const refItems = ref.refItems || [];
              return refItems.map((item: any, itemIdx: number) => (
                <div key={`${idx}-${itemIdx}`} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <Badge variant="outline" className="text-xs mb-1">
                    {item.startTime}s - {item.endTime || item.startTime}s
                  </Badge>
                  {item.text && <p className="text-xs mt-1">{item.text}</p>}
                </div>
              ));
            })}
          </div>
        )}

        {/* Legacy timestamp format */}
        {timestamps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Relevant moments:</span>
            {timestamps.map((ts: any, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {ts.timestamp || ts}
              </Badge>
            ))}
          </div>
        )}

        {data.conversation_hint && (
          <p className="text-xs text-blue-600 dark:text-blue-400 italic">
            {data.conversation_hint}
          </p>
        )}
      </div>
    </div>
  );
}

// Video Upload Display
function VideoUploadDisplay({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h4 className="font-semibold">{data.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.message}</p>
        </div>
      </div>

      {data.thumbnail_url && (
        <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded overflow-hidden">
          <img src={data.thumbnail_url} alt={data.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        {data.platform && (
          <Badge variant="secondary">{data.platform}</Badge>
        )}
        {data.duration_seconds && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(data.duration_seconds)}
          </span>
        )}
        {data.saved_to_kb && (
          <Badge variant="outline" className="text-green-600 dark:text-green-400">
            <Save className="w-3 h-3 mr-1" />
            Saved to KB
          </Badge>
        )}
      </div>
    </div>
  );
}

// Transcript Display
function TranscriptDisplay({ data }: { data: any }) {
  const transcript = data.transcript || '';
  const wordCount = data.word_count || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Transcript</h4>
        <Badge variant="secondary">{wordCount} words</Badge>
      </div>

      <div className="max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded">
        <p className="text-sm whitespace-pre-wrap">{transcript}</p>
      </div>
    </div>
  );
}

// Multi Video Search Display
function MultiVideoSearchDisplay({ data }: { data: any }) {
  const analysis = data.analysis || '';
  const videosSearched = data.videos_searched || 0;
  const videos = data.videos || [];  // ✅ Video metadata for rendering

  return (
    <div className="space-y-4">
      {/* Video Grid */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Searched Videos ({videosSearched})</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {videos.map((video: any, idx: number) => (
              <Card key={idx} className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
                  {video.url ? (
                    <iframe
                      src={video.url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                  {video.duration && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatDuration(video.duration)}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Search Results</h4>
        </div>

        {data.query && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Query: <span className="font-medium">{data.query}</span>
          </p>
        )}

        {/* Display analysis text */}
        {analysis && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        )}

        {data.summary && (
          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
            {data.summary}
          </p>
        )}
      </div>
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

// Async Task Display (for analyze_creator, analyze_trend)
function AsyncTaskDisplay({ data }: { data: any }) {
  const taskId = data.task_id || '';
  const status = data.status || 'processing';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        <div>
          <h4 className="font-semibold">Task Started</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.message}</p>
        </div>
      </div>

      {taskId && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <p className="text-xs text-blue-900 dark:text-blue-100 mb-1">
            Task ID: <span className="font-mono">{taskId}</span>
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            {data.action_hint || 'Use check_task_status with this task_id to monitor progress'}
          </p>
        </div>
      )}

      <Badge variant="secondary">{status}</Badge>
    </div>
  );
}

// Trending Content Display (search_trending_content)
function TrendingContentDisplay({ data }: { data: any }) {
  const analysis = data.analysis || '';
  const referencedVideos = data.referenced_videos || [];
  const platform = data.platform || 'TIKTOK';

  return (
    <div className="space-y-4">
      {/* Referenced Videos Grid */}
      {referencedVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Trending Videos ({referencedVideos.length})</h4>
            <Badge variant="secondary">{platform}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {referencedVideos.map((video: any, idx: number) => (
              <Card key={idx} className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900">
                  {video.url ? (
                    <iframe
                      src={video.url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                  {video.duration && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatDuration(video.duration)}
                    </p>
                  )}
                  {video.view_count && (
                    <p className="text-xs text-gray-500 mt-1">
                      {(video.view_count / 1000).toFixed(0)}K views
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                    {video.video_no}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Section */}
      {analysis && (
        <div>
          <h4 className="font-semibold mb-2">Trending Analysis</h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        </div>
      )}

      {data.conversation_hint && (
        <p className="text-xs text-blue-600 dark:text-blue-400 italic">
          {data.conversation_hint}
        </p>
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
                <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  {item.type === 'video' ? (
                    <Play className="w-8 h-8 text-gray-400" />
                  ) : (
                    <div className="w-full h-full">
                      {item.img_url ? (
                        <img src={item.img_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
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
        <p className="text-xs text-blue-600 dark:text-blue-400 italic">
          {data.conversation_hint}
        </p>
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

// Default Display (fallback)
function DefaultDisplay({ data }: { data: any }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
      <pre className="text-xs overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}


