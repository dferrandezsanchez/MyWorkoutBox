import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_CONTEXT_EVENT,
  getAuthUser,
  getStoredTenantBrand,
  getToken,
  isTokenExpired,
  removeToken,
  setStoredTenantBrand,
  setToken,
} from './session-store';
import type { JwtPayload, TenantBrand } from '@shared/types/auth';

function createJwt(payload: JwtPayload): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${encodedPayload}.signature`;
}

const tenant: TenantBrand = {
  id: 'tenant-1',
  organizationId: 'org-1',
  name: 'Demo Center',
  slug: 'demo-center',
  appName: 'MyWorkoutBox',
  shortName: 'Demo',
  mark: 'MW',
  claim: 'Training Intelligence',
  description: 'Demo tenant',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primarySoft: '#93C5FD',
};

describe('session-store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and removes token while notifying auth context listeners', () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_CONTEXT_EVENT, listener);

    setToken('jwt-token');
    expect(getToken()).toBe('jwt-token');
    expect(listener).toHaveBeenCalledOnce();

    setStoredTenantBrand(tenant);
    expect(getStoredTenantBrand()).toEqual(tenant);
    expect(listener).toHaveBeenCalledTimes(2);

    removeToken();
    expect(getToken()).toBeNull();
    expect(getStoredTenantBrand()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(3);

    window.removeEventListener(AUTH_CONTEXT_EVENT, listener);
  });

  it('returns auth user data for a valid non-expired token', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-06-26T12:00:00Z').getTime());
    setToken(
      createJwt({
        sub: 'user-1',
        role: 'ADMIN',
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        iat: Math.floor(new Date('2026-06-26T12:00:00Z').getTime() / 1000),
        exp: Math.floor(new Date('2026-06-26T13:00:00Z').getTime() / 1000),
      }),
    );

    expect(getAuthUser()).toMatchObject({
      id: 'user-1',
      role: 'ADMIN',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
    });
    expect(isTokenExpired()).toBe(false);
  });

  it('treats malformed or expired tokens as unauthenticated', () => {
    setToken('not-a-jwt');
    expect(getAuthUser()).toBeNull();
    expect(isTokenExpired()).toBe(true);

    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-06-26T12:00:00Z').getTime());
    setToken(
      createJwt({
        sub: 'user-1',
        role: 'TRAINER',
        tenantId: 'tenant-1',
        organizationId: 'org-1',
        iat: Math.floor(new Date('2026-06-26T10:00:00Z').getTime() / 1000),
        exp: Math.floor(new Date('2026-06-26T11:00:00Z').getTime() / 1000),
      }),
    );

    expect(getAuthUser()).toBeNull();
    expect(isTokenExpired()).toBe(true);
  });

  it('clears corrupted tenant branding from storage', () => {
    localStorage.setItem('auth_tenant_brand', '{invalid-json');

    expect(getStoredTenantBrand()).toBeNull();
    expect(localStorage.getItem('auth_tenant_brand')).toBeNull();
  });
});
