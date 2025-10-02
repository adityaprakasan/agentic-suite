import { describe, it, expect } from '@jest/globals';
import { Metadata } from 'next';

describe('SEO Metadata Integration', () => {
  it('should generate Adentic SEO metadata', async () => {
    // This will fail until seo-metadata.ts is created
    const { generateMetadata } = await import('../../src/lib/seo-metadata');

    const metadata: Metadata = generateMetadata({
      title: 'Home',
      description: 'AI Agent Platform',
    });

    expect(metadata.title).toContain('Adentic');
    expect(metadata.openGraph?.siteName).toBe('Adentic');
  });

  it('should include OpenGraph image', async () => {
    const { generateMetadata } = await import('../../src/lib/seo-metadata');

    const metadata = generateMetadata({});

    expect(metadata.openGraph?.images).toBeDefined();
    expect(metadata.openGraph?.images?.[0]?.url).toBe('/og-image.png');
    expect(metadata.openGraph?.images?.[0]?.width).toBe(1200);
    expect(metadata.openGraph?.images?.[0]?.height).toBe(630);
  });

  it('should include Twitter card metadata', async () => {
    const { generateMetadata } = await import('../../src/lib/seo-metadata');

    const metadata = generateMetadata({});

    expect(metadata.twitter?.card).toBe('summary_large_image');
    expect(metadata.twitter?.title).toContain('Adentic');
  });

  it('should not contain Kortix in metadata', async () => {
    const { generateMetadata } = await import('../../src/lib/seo-metadata');

    const metadata = generateMetadata({
      title: 'Features',
      description: 'Platform features',
    });

    const metadataString = JSON.stringify(metadata);
    expect(metadataString).not.toContain('Kortix');
    expect(metadataString).toContain('Adentic');
  });
});