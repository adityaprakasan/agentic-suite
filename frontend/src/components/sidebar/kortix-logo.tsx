'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface AdenticLogoProps {
  size?: number;
}
export function AdenticLogo({ size = 24 }: AdenticLogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const brandColor = '#CC3A00';
  const fontSize = Math.max(size * 0.75, 16); // Scale font size with logo size

  return (
    <span
      className="flex-shrink-0 font-bold flex items-center justify-center"
      style={{
        color: brandColor,
        fontSize: `${fontSize}px`,
        width: size,
        height: size,
        minWidth: size,
        minHeight: size
      }}
    >
      A
    </span>
  );
}
