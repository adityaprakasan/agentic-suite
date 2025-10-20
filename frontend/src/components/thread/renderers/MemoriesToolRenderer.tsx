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

  // Route to appropriate renderer based on method
  switch (method_name) {
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
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
        )}

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
  const hooks = data.hooks || [];
  const ctas = data.ctas || [];
  const engagementScore = data.engagement_prediction || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Video Analysis</h4>
        {engagementScore > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {engagementScore.toFixed(1)}/10
          </Badge>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <p className="text-sm text-gray-700 dark:text-gray-300">{data.summary}</p>
      )}

      {/* Hooks */}
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

      {/* CTAs */}
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
  const comparison = data.comparison || {};
  const videoCount = data.video_count || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Video Comparison</h4>
        <Badge>{videoCount} videos</Badge>
      </div>

      {data.summary && (
        <p className="text-sm text-gray-700 dark:text-gray-300">{data.summary}</p>
      )}

      {/* Render comparison table or data */}
      <div className="overflow-x-auto">
        <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
          {JSON.stringify(comparison, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Video Query Display
function VideoQueryDisplay({ data }: { data: any }) {
  const answer = data.answer || '';
  const timestamps = data.timestamps || [];
  const confidence = data.confidence || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Video Response</h4>
        {confidence > 0 && (
          <Badge variant="secondary">
            {(confidence * 100).toFixed(0)}% confidence
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
        <p className="text-sm">{answer}</p>
      </div>

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
  const results = data.results || [];
  const videosSearched = data.videos_searched || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Multi-Video Search</h4>
        <Badge>{videosSearched} videos searched</Badge>
      </div>

      {data.query && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Query: <span className="font-medium">{data.query}</span>
        </p>
      )}

      <div className="space-y-2">
        {results.slice(0, 10).map((result: any, idx: number) => (
          <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline" className="text-xs">
                Video {idx + 1}
              </Badge>
              {result.timestamp && (
                <Badge className="text-xs">{result.timestamp}</Badge>
              )}
            </div>
            <p className="text-xs">{result.text || result.description || 'Match found'}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400">
        Found {results.length} matches across {videosSearched} videos
      </p>
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


