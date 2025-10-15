'use client';

import React from 'react';
import { Examples as DefaultExamples } from '../examples';

interface DesignerExamplesProps {
  onSelectPrompt?: (query: string) => void;
  count?: number;
}

export function DesignerExamples({ onSelectPrompt, count = 4 }: DesignerExamplesProps) {
  // TODO: Implement Designer specific examples
  // For now, fall back to default examples
  return <DefaultExamples onSelectPrompt={onSelectPrompt} count={count} />;
}
