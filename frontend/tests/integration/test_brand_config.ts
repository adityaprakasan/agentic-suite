import { describe, it, expect, beforeAll } from '@jest/globals';
import { BrandConfig } from '../../src/lib/brand-config';

describe('BrandConfig Integration', () => {
  let brandConfig: BrandConfig;

  beforeAll(async () => {
    // This will fail until brand-config.ts is created
    const module = await import('../../src/lib/brand-config');
    brandConfig = module.brandConfig;
  });

  it('should load Adentic brand configuration', () => {
    expect(brandConfig.name).toBe('Adentic');
    expect(brandConfig.primaryColor).toBe('#CC3A00');
    expect(brandConfig.copyrightText).toBe('© 2025 Adentic. All rights reserved.');
  });

  it('should have correct social media links', () => {
    expect(brandConfig.social.linkedin).toBe('https://www.linkedin.com/company/tryadentic');
  });

  it('should validate hex color format', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    expect(brandConfig.primaryColor).toMatch(hexColorRegex);
  });

  it('should have non-empty brand name', () => {
    expect(brandConfig.name).toBeTruthy();
    expect(brandConfig.name.length).toBeGreaterThan(0);
  });
});