import { describe, it, expect } from '@jest/globals';

describe('Brand Config API Contract', () => {
  it('should return brand configuration matching the contract', async () => {
    // This test will fail until the API is implemented
    const response = await fetch('/api/brand/config');
    expect(response.status).toBe(200);

    const data = await response.json();

    // Validate contract structure
    expect(data).toHaveProperty('name', 'Adentic');
    expect(data).toHaveProperty('primaryColor', '#CC3A00');
    expect(data).toHaveProperty('copyrightText', '© 2025 Adentic. All rights reserved.');

    // Validate social links
    expect(data.social).toBeDefined();
    expect(data.social.linkedin).toBe('https://www.linkedin.com/company/tryadentic');

    // Validate assets
    expect(data.assets).toBeDefined();
    expect(data.assets.logoUrl).toBe('/logo.png');
    expect(data.assets.faviconUrl).toBe('/favicon.ico');
  });
});