import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@shared/types/auth';
import RootRedirectPage from './RootRedirectPage';

const { getAuthUser } = vi.hoisted(() => ({
  getAuthUser: vi.fn<() => AuthUser | null>(),
}));

vi.mock('@features/auth/model/auth-store', () => ({
  getAuthUser,
}));

function renderAtRoot() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RootRedirectPage />} />
        <Route path="/login" element={<p>login</p>} />
        <Route path="/admin" element={<p>admin</p>} />
        <Route path="/trainer" element={<p>trainer</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function createAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    name: 'Demo',
    email: 'demo@example.com',
    role: 'TRAINER',
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    ...overrides,
  };
}

describe('RootRedirectPage', () => {
  beforeEach(() => {
    getAuthUser.mockReset();
  });

  it('sends visitors to login', () => {
    getAuthUser.mockReturnValue(null);
    renderAtRoot();
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('sends an authenticated admin to admin mode', () => {
    getAuthUser.mockReturnValue(createAuthUser({ role: 'ADMIN' }));
    renderAtRoot();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('sends an authenticated trainer to trainer mode', () => {
    getAuthUser.mockReturnValue(createAuthUser({ role: 'TRAINER' }));
    renderAtRoot();
    expect(screen.getByText('trainer')).toBeInTheDocument();
  });
});
