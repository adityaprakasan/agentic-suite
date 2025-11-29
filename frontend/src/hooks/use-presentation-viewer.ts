import { useState } from 'react';

interface PresentationViewerState {
  isOpen: boolean;
  presentationName?: string;
  sandboxUrl?: string;
  sandboxId?: string;
  sandboxToken?: string;
  initialSlide?: number;
}

export function usePresentationViewer() {
  const [viewerState, setViewerState] = useState<PresentationViewerState>({
    isOpen: false,
  });

  const openPresentation = (
    presentationName: string,
    sandboxUrl: string,
    initialSlide: number = 1,
    sandboxId?: string,
    sandboxToken?: string
  ) => {
    setViewerState({
      isOpen: true,
      presentationName,
      sandboxUrl,
      sandboxId,
      sandboxToken,
      initialSlide,
    });
  };

  const closePresentation = () => {
    setViewerState({
      isOpen: false,
    });
  };

  return {
    viewerState,
    openPresentation,
    closePresentation,
  };
}
