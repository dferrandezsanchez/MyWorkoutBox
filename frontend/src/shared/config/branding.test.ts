import { afterEach, describe, expect, it, vi } from 'vitest';
import { BRAND, getDocumentTitle, getMarketingUrl } from './branding';

describe('branding config', () => {
  it('builds document titles with the active center as context', () => {
    expect(getDocumentTitle()).toBe(BRAND.name);
    expect(getDocumentTitle('  ')).toBe('STELIOS');
    expect(getDocumentTitle('TuMeta Personal Training')).toBe('STELIOS · TuMeta Personal Training');
  });

  describe('getMarketingUrl', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('returns null when no marketing site is configured', () => {
      vi.stubEnv('VITE_MARKETING_URL', '  ');
      expect(getMarketingUrl()).toBeNull();
    });

    it('returns the configured marketing site', () => {
      vi.stubEnv('VITE_MARKETING_URL', ' https://www.example.com ');
      expect(getMarketingUrl()).toBe('https://www.example.com');
    });
  });
});
