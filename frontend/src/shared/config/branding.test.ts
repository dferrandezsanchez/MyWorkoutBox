import { describe, expect, it } from 'vitest';
import { getActiveTenantBrand, getDocumentTitle, PLATFORM_BRAND, TENANT_BRANDS } from './branding';

describe('branding config', () => {
  it('returns the platform brand by default', () => {
    expect(Object.values(TENANT_BRANDS)).toContainEqual(getActiveTenantBrand());
  });

  it('builds document titles for platform and tenant brands', () => {
    expect(getDocumentTitle(PLATFORM_BRAND)).toBe('MyWorkoutBox');
    expect(getDocumentTitle(TENANT_BRANDS.tumeta)).toBe('MyWorkoutBox · TuMeta');
    expect(getDocumentTitle({ ...TENANT_BRANDS.tumeta, shortName: '' })).toBe('MyWorkoutBox · TuMeta Personal Training');
  });
});
