'use client';

import React from 'react';
import { ToolViewProps } from './types';
import { GenericToolView } from './GenericToolView';
import { MemoriesToolRenderer } from '../renderers/MemoriesToolRenderer';
import { extractToolData } from './utils';

/**
 * MemoriesToolView - Displays results from memories.ai video intelligence tool
 * 
 * Wraps the MemoriesToolRenderer to match the ToolViewProps interface
 */
export function MemoriesToolView({
  name = 'memories-tool',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  
  // If streaming or no toolContent, show clean loading state
  if (isStreaming || !toolContent) {
    return (
      <div className="max-h-[85vh] overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-8 px-6">
          <div className="text-center w-full max-w-xs">
            <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800/40 dark:to-blue-900/60 border border-purple-200 dark:border-purple-700">
              <div className="w-8 h-8 animate-spin text-purple-500 dark:text-purple-400">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              </div>
            </div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Using Adentic Video Intelligence Engine
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Analyzing video content...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Extract tool result from toolContent
  const extracted = extractToolData(toolContent);
  const toolResult = extracted.toolResult;
  
  // Debug logging
  console.log('[MemoriesToolView] Tool name:', name);
  console.log('[MemoriesToolView] Tool result:', toolResult);
  console.log('[MemoriesToolView] Extracted method:', toolResult?.toolName || toolResult?.functionName);
  
  if (!toolResult || typeof toolResult !== 'object') {
    console.warn('[MemoriesToolView] No valid toolResult, falling back to GenericToolView');
    return (
      <GenericToolView
        name={name}
        assistantContent={assistantContent}
        toolContent={toolContent}
        assistantTimestamp={assistantTimestamp}
        toolTimestamp={toolTimestamp}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
      />
    );
  }

  // Use MemoriesToolRenderer for rich video display
  const methodName = toolResult.toolName || toolResult.functionName || name;
  console.log('[MemoriesToolView] Rendering with method_name:', methodName);
  console.log('[MemoriesToolView] Tool output:', toolResult.toolOutput);
  
  return (
    <div className="max-h-[85vh] overflow-y-auto">
      <MemoriesToolRenderer
        result={{
          success: toolResult.isSuccess,
          output: toolResult.toolOutput || extracted,
          method_name: methodName,
        }}
      />
    </div>
  );
}


