import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCanManageRoutines } from './useCanManageRoutines';

const mocks = vi.hoisted(() => ({ useAuthUser: vi.fn(), getAuthUser: vi.fn() }));

vi.mock('@features/auth/hooks/useAuthUser', () => ({ useAuthUser: mocks.useAuthUser }));
vi.mock('@features/auth/model/auth-store', () => ({ getAuthUser: mocks.getAuthUser }));

describe('useCanManageRoutines', () => {
  beforeEach(() => {
    mocks.getAuthUser.mockReturnValue({ id: 'u1', role: 'TRAINER' });
  });

  it('uses the /auth/me permission when loaded', () => {
    mocks.useAuthUser.mockReturnValue({ data: { id: 'u1', role: 'TRAINER', canManageRoutines: true } });
    expect(renderHook(() => useCanManageRoutines()).result.current).toBe(true);
  });

  it('falls back to the token role while the user payload loads', () => {
    mocks.useAuthUser.mockReturnValue({ data: undefined });
    expect(renderHook(() => useCanManageRoutines()).result.current).toBe(false);

    mocks.getAuthUser.mockReturnValue({ id: 'u1', role: 'ADMIN' });
    expect(renderHook(() => useCanManageRoutines()).result.current).toBe(true);
  });
});
