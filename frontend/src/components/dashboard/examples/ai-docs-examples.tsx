'use client';

import React from 'react';
import { Examples as DefaultExamples } from '../examples';

interface AIDocsExamplesProps {
  onSelectPrompt?: (query: string) => void;
  count?: number;
}

export function AIDocsExamples({ onSelectPrompt, count = 4 }: AIDocsExamplesProps) {
  // TODO: Implement AI Docs specific examples
  // For now, fall back to default examples
  return <DefaultExamples onSelectPrompt={onSelectPrompt} count={count} />;
}
