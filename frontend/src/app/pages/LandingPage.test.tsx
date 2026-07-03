import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@shared/types/auth';
import LandingPage from './LandingPage';

const { getAuthUser } = vi.hoisted(() => ({
  getAuthUser: vi.fn<() => AuthUser | null>(),
}));

vi.mock('@features/auth/model/auth-store', () => ({
  getAuthUser,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  beforeEach(() => getAuthUser.mockReset());

  it('sends visitors to login', () => {
    getAuthUser.mockReturnValue(null);
    renderPage();

    expect(screen.getAllByRole('link', { name: /Entrar/i })[0]).toHaveAttribute('href', '/login');
  });

  it.each([
    ['ADMIN', '/admin'],
    ['TRAINER', '/trainer'],
  ] as const)('sends an authenticated %s user to the correct mode', (role, path) => {
    getAuthUser.mockReturnValue({
      id: 'user-1',
      name: 'Demo',
      email: 'demo@example.com',
      role,
      tenantId: 'tenant-1',
      organizationId: 'org-1',
    });
    renderPage();

    expect(screen.getAllByRole('link', { name: /Ir a la plataforma/i })[0]).toHaveAttribute('href', path);
  });
});
