'use client';

import React, { useState } from 'react';
import { X, MessageSquare, FileText, TrendingUp, Clock, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVideo, useChatWithVideo, formatDuration, getPlatformIcon } from '@/hooks/react-query/knowledge-base/use-videos';
import type { Video, VideoChatResponse } from '@/hooks/react-query/knowledge-base/use-videos';
import { toast } from 'sonner';

interface VideoPreviewModalProps {
  videoId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPreviewModal({ videoId, open, onOpenChange }: VideoPreviewModalProps) {
  const { data: video, isLoading } = useVideo(videoId);
  const chatMutation = useChatWithVideo();
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<VideoChatResponse[]>([]);

  const handleAskQuestion = async () => {
    if (!question.trim() || !videoId) return;

    try {
      const response = await chatMutation.mutateAsync({ videoId, question });
      setChatHistory([...chatHistory, response]);
      setQuestion('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to chat with video');
    }
  };

  if (!video && !isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : video ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-xl mb-2">{video.title}</DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Badge variant="secondary" className="text-xs">
                      <span className="mr-1">{getPlatformIcon(video.platform)}</span>
                      {video.platform}
                    </Badge>
                    {video.duration_seconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(video.duration_seconds)}</span>
                      </div>
                    )}
                    {video.analysis_data?.engagement_prediction && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{video.analysis_data.engagement_prediction.toFixed(1)}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="preview" className="h-full flex flex-col">
                <TabsList className="px-6 pt-4">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="chat">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="flex-1 overflow-auto p-6">
                  {/* Video Player / Thumbnail */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-4">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FileText className="w-16 h-16" />
                      </div>
                    )}
                  </div>

                  {video.url && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(video.url, '_blank')}
                    >
                      Open Original Video
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="flex-1 overflow-auto p-6">
                  <ScrollArea className="h-full">
                    <div className="space-y-6">
                      {/* Hooks */}
                      {video.analysis_data?.hooks && video.analysis_data.hooks.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Hooks ({video.analysis_data.hooks.length})</h3>
                          <div className="space-y-2">
                            {video.analysis_data.hooks.map((hook: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {hook.timestamp || '0:00'}
                                  </Badge>
                                  <Badge className="text-xs capitalize">
                                    {hook.strength || 'medium'}
                                  </Badge>
                                </div>
                                <p className="text-sm">{hook.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CTAs */}
                      {video.analysis_data?.ctas && video.analysis_data.ctas.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">CTAs ({video.analysis_data.ctas.length})</h3>
                          <div className="space-y-2">
                            {video.analysis_data.ctas.map((cta: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {cta.timestamp || '0:00'}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium">{cta.text}</p>
                                {cta.type && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Type: {cta.type}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Engagement */}
                      {video.analysis_data?.engagement_prediction !== undefined && (
                        <div>
                          <h3 className="font-semibold mb-3">Engagement Prediction</h3>
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <TrendingUp className="w-6 h-6" />
                              <div>
                                <div className="text-2xl font-bold">
                                  {video.analysis_data.engagement_prediction.toFixed(1)}/10
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Predicted engagement score
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="transcript" className="flex-1 overflow-auto p-6">
                  <ScrollArea className="h-full">
                    {video.transcript ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <p className="whitespace-pre-wrap">{video.transcript}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <p>No transcript available</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col p-6">
                  {/* Chat history */}
                  <ScrollArea className="flex-1 mb-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Ask a question about this video</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatHistory.map((chat, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Q: {chat.question}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm">{chat.answer}</p>
                              {chat.timestamps && chat.timestamps.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {chat.timestamps.map((ts: any, tsIdx: number) => (
                                    <Badge key={tsIdx} variant="outline" className="text-xs">
                                      {ts.timestamp}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Confidence: {(chat.confidence * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Chat input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a question about this video..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                      disabled={chatMutation.isPending}
                    />
                    <Button
                      onClick={handleAskQuestion}
                      disabled={!question.trim() || chatMutation.isPending}
                    >
                      {chatMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}


