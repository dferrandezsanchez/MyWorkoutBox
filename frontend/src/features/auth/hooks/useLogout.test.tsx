import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLogout } from './useLogout';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  clear: vi.fn(),
  logout: vi.fn(),
  removeToken: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ clear: mocks.clear }) }));
vi.mock('@features/auth/api/auth.api', () => ({ logout: mocks.logout }));
vi.mock('@features/auth/model/auth-store', () => ({ removeToken: mocks.removeToken }));

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logout.mockResolvedValue(undefined);
  });

  it('closes the remote and local session', async () => {
    const { result } = renderHook(() => useLogout());
    await act(() => result.current.execute());

    expect(mocks.logout).toHaveBeenCalledOnce();
    expect(mocks.removeToken).toHaveBeenCalledOnce();
    expect(mocks.clear).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('clears local authentication when the server logout fails', async () => {
    mocks.logout.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useLogout());
    await act(() => result.current.execute());

    expect(mocks.removeToken).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
