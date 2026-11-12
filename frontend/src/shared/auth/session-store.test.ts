import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_CONTEXT_EVENT,
  getAuthUser,
  getStoredTenant,
  getToken,
  isTokenExpired,
  removeToken,
  setStoredTenant,
  setToken,
} from './session-store';
import type { ActiveTenant, JwtPayload } from '@shared/types/auth';

function createJwt(payload: JwtPayload): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${encodedPayload}.signature`;
}

const tenant: ActiveTenant = {
  id: 'tenant-1',
  organizationId: 'org-1',
  name: 'Demo Center',
  slug: 'demo-center',
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

    setStoredTenant(tenant);
    expect(getStoredTenant()).toEqual(tenant);
    expect(listener).toHaveBeenCalledTimes(2);

    removeToken();
    expect(getToken()).toBeNull();
    expect(getStoredTenant()).toBeNull();
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

  it('clears a corrupted active tenant from storage', () => {
    localStorage.setItem('auth_active_tenant', '{invalid-json');

    expect(getStoredTenant()).toBeNull();
    expect(localStorage.getItem('auth_active_tenant')).toBeNull();
  });
});
