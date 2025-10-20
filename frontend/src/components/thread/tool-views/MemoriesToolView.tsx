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
  const toolResult = extractToolData(toolContent);
  
  if (!toolResult || typeof toolResult !== 'object') {
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
  return (
    <div className="p-4">
      <MemoriesToolRenderer
        result={{
          success: isSuccess,
          output: toolResult.toolOutput || toolResult,
          method_name: toolResult.methodName || name,
        }}
      />
    </div>
  );
}


