/**
 * Unit tests for brand configuration validation
 */

import { describe, it, expect } from '@jest/globals';
import { validateHexColor, validateBrandConfig } from '../../src/lib/brand-config';

describe('Brand Configuration Validation', () => {
  describe('validateHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(validateHexColor('#CC3A00')).toBe(true);
      expect(validateHexColor('#000000')).toBe(true);
      expect(validateHexColor('#FFFFFF')).toBe(true);
      expect(validateHexColor('#abc123')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(validateHexColor('CC3A00')).toBe(false); // Missing #
      expect(validateHexColor('#CC3A0')).toBe(false); // Too short
      expect(validateHexColor('#CC3A000')).toBe(false); // Too long
      expect(validateHexColor('#GGGGGG')).toBe(false); // Invalid characters
      expect(validateHexColor('rgb(204, 58, 0)')).toBe(false); // Wrong format
    });
  });

  describe('validateBrandConfig', () => {
    it('should validate a complete brand config', () => {
      const config = {
        name: 'Adentic',
        primaryColor: '#CC3A00',
        copyrightText: '© 2025 Adentic. All rights reserved.',
        social: {
          linkedin: 'https://www.linkedin.com/company/tryadentic'
        }
      };

      expect(validateBrandConfig(config)).toBe(true);
    });

    it('should reject config with empty name', () => {
      const config = {
        name: '',
        primaryColor: '#CC3A00',
        copyrightText: '© 2025 Adentic. All rights reserved.',
        social: {
          linkedin: 'https://www.linkedin.com/company/tryadentic'
        }
      };

      expect(validateBrandConfig(config)).toBe(false);
    });

    it('should reject config with invalid color', () => {
      const config = {
        name: 'Adentic',
        primaryColor: 'invalid-color',
        copyrightText: '© 2025 Adentic. All rights reserved.',
        social: {
          linkedin: 'https://www.linkedin.com/company/tryadentic'
        }
      };

      expect(validateBrandConfig(config)).toBe(false);
    });

    it('should reject config with empty copyright', () => {
      const config = {
        name: 'Adentic',
        primaryColor: '#CC3A00',
        copyrightText: '',
        social: {
          linkedin: 'https://www.linkedin.com/company/tryadentic'
        }
      };

      expect(validateBrandConfig(config)).toBe(false);
    });

    it('should reject config with invalid LinkedIn URL', () => {
      const config = {
        name: 'Adentic',
        primaryColor: '#CC3A00',
        copyrightText: '© 2025 Adentic. All rights reserved.',
        social: {
          linkedin: 'not-a-url'
        }
      };

      expect(validateBrandConfig(config)).toBe(false);
    });

    it('should accept config without optional fields', () => {
      const config = {
        name: 'Adentic',
        primaryColor: '#CC3A00',
        copyrightText: '© 2025 Adentic. All rights reserved.',
        social: {
          linkedin: 'https://www.linkedin.com/company/tryadentic'
        }
      };

      expect(validateBrandConfig(config)).toBe(true);
    });
  });

  describe('Brand Name Requirements', () => {
    it('should ensure brand name is Adentic', () => {
      const { brandConfig } = require('../../src/lib/brand-config');
      expect(brandConfig.name).toBe('Adentic');
      expect(brandConfig.name).not.toContain('Kortix');
    });

    it('should ensure primary color is correct', () => {
      const { brandConfig } = require('../../src/lib/brand-config');
      expect(brandConfig.primaryColor).toBe('#CC3A00');
    });

    it('should ensure copyright text is updated', () => {
      const { brandConfig } = require('../../src/lib/brand-config');
      expect(brandConfig.copyrightText).toBe('© 2025 Adentic. All rights reserved.');
      expect(brandConfig.copyrightText).not.toContain('Kortix');
    });

    it('should ensure LinkedIn URL is correct', () => {
      const { brandConfig } = require('../../src/lib/brand-config');
      expect(brandConfig.social.linkedin).toBe('https://www.linkedin.com/company/tryadentic');
    });
  });
});