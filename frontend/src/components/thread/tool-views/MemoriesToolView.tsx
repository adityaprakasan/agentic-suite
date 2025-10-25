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
  
  // If streaming or no toolContent, fallback to generic view
  if (isStreaming || !toolContent) {
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
    <div className="p-4">
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


