'use client';

import React from 'react';
import { Examples as DefaultExamples } from '../examples';

interface PresentationExamplesProps {
  onSelectPrompt?: (query: string) => void;
  count?: number;
}

export function PresentationExamples({ onSelectPrompt, count = 4 }: PresentationExamplesProps) {
  // TODO: Implement Presentation specific examples
  // For now, fall back to default examples
  return <DefaultExamples onSelectPrompt={onSelectPrompt} count={count} />;
}
