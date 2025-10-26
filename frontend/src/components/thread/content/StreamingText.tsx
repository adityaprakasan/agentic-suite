import React from 'react';
import { ComposioUrlDetector } from './composio-url-detector';

interface StreamingTextProps {
  content: string;
  className?: string;
}

// Clean up verbose function call XML during streaming
function cleanStreamingContent(content: string): string {
  if (!content || typeof content !== 'string') return content || '';
  
  let cleaned = content;
  
  // Remove entire function_calls blocks to prevent overspill
  // This prevents showing raw XML like <function_calls><invoke name="..."...
  cleaned = cleaned.replace(/<function_calls>[\s\S]*?<\/function_calls>/gi, '');
  
  // Also handle incomplete/streaming function calls (no closing tag yet)
  cleaned = cleaned.replace(/<function_calls>[\s\S]*?$/gi, '');
  
  // Remove any stray invoke/parameter tags
  cleaned = cleaned.replace(/<invoke[\s\S]*?<\/invoke>/gi, '');
  cleaned = cleaned.replace(/<parameter[\s\S]*?<\/parameter>/gi, '');
  
  // Remove incomplete invoke tags (streaming)
  cleaned = cleaned.replace(/<invoke[\s\S]*?$/gi, '');
  cleaned = cleaned.replace(/<parameter[\s\S]*?$/gi, '');
  
  return cleaned;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  content,
  className = "text-sm prose prose-sm dark:prose-invert chat-markdown max-w-none [&>:first-child]:mt-0 prose-headings:mt-3 break-words overflow-wrap-anywhere"
}) => {
  if (!content) {
    return null;
  }

  // Clean content before displaying
  const cleanedContent = cleanStreamingContent(content);

  return (
    <div className="prose prose-sm dark:prose-invert chat-markdown max-w-none [&>:first-child]:mt-0 prose-headings:mt-3 break-words overflow-hidden">
      <ComposioUrlDetector content={cleanedContent} className={className} />
    </div>
  );
};
