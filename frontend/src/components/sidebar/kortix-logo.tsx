'use client';

import Image from 'next/image';
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

  // Use a cropped version of the header logo for icon-only views
  return (
    <Image
      src="/adentic-logo-header.jpeg"
      alt="Adentic"
      width={size * 3}
      height={size}
      className="object-contain"
      style={{
        width: 'auto',
        height: size,
        minHeight: size,
        maxHeight: size
      }}
    />
  );
}
