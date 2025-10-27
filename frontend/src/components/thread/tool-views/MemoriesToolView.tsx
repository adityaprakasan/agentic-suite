'use client';

import React from 'react';
import { ToolViewProps } from './types';
import { GenericToolView } from './GenericToolView';
import { MemoriesToolRenderer } from '../renderers/MemoriesToolRenderer';
import { extractToolData } from './utils';
import { ToolViewWrapper } from './wrapper/ToolViewWrapper';

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
  
  // If streaming or no toolContent, show clean loading state with persistent header
  if (isStreaming || !toolContent) {
    return (
      <ToolViewWrapper
        name={name}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
        assistantTimestamp={assistantTimestamp}
        toolTimestamp={toolTimestamp}
        showStatus={true}
        customStatus={{
          streaming: "Analyzing video content..."
        }}
      >
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
      </ToolViewWrapper>
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

  // Retrieve agent explanation from sessionStorage
  // Use timestamp + name as composite key since we don't have messageId
  const storageKeys = Object.keys(sessionStorage).filter(key => key.startsWith('memories-explanation-'));
  let agentExplanation: string | undefined;
  
  // Try to find the most recent explanation (last one stored)
  if (storageKeys.length > 0) {
    const lastKey = storageKeys[storageKeys.length - 1];
    agentExplanation = sessionStorage.getItem(lastKey) || undefined;
    // Clean up to prevent memory leaks
    sessionStorage.removeItem(lastKey);
    console.log('[MemoriesToolView] Retrieved agent explanation:', agentExplanation?.substring(0, 100));
  }

  // Use MemoriesToolRenderer for rich video display with persistent header
  const methodName = toolResult.toolName || toolResult.functionName || name;
  console.log('[MemoriesToolView] Rendering with method_name:', methodName);
  console.log('[MemoriesToolView] Tool output:', toolResult.toolOutput);
  
  return (
    <ToolViewWrapper
      name={name}
      isSuccess={isSuccess}
      isStreaming={isStreaming}
      assistantTimestamp={assistantTimestamp}
      toolTimestamp={toolTimestamp}
      showStatus={true}
    >
      <MemoriesToolRenderer
        result={{
          success: toolResult.isSuccess,
          output: toolResult.toolOutput || extracted,
          method_name: methodName,
        }}
        agentExplanation={agentExplanation}
      />
    </ToolViewWrapper>
  );
}


