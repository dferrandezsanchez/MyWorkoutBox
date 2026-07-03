import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@shared/types/auth';
import LandingPage from './LandingPage';

const { getAuthUser, landingContentSpy } = vi.hoisted(() => ({
  getAuthUser: vi.fn<() => AuthUser | null>(),
  landingContentSpy: vi.fn(),
}));

vi.mock('@features/auth/model/auth-store', () => ({
  getAuthUser,
}));

vi.mock('@features/landing/components/LandingContent', () => ({
  LandingContent: (props: { appPath: string; authenticated: boolean }) => {
    landingContentSpy(props);

    return (
      <main>
        <a href={props.appPath}>
          {props.authenticated ? 'Ir a la plataforma' : 'Entrar'}
        </a>

        <span data-testid="landing-app-path">{props.appPath}</span>
        <span data-testid="landing-authenticated">
          {String(props.authenticated)}
        </span>
      </main>
    );
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
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

describe('LandingPage', () => {
  beforeEach(() => {
    getAuthUser.mockReset();
    landingContentSpy.mockReset();
  });

  it('sends visitors to login', () => {
    getAuthUser.mockReturnValue(null);

    renderPage();

    expect(getAuthUser).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: /Entrar/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByTestId('landing-app-path')).toHaveTextContent('/login');
    expect(screen.getByTestId('landing-authenticated')).toHaveTextContent(
      'false',
    );
    expect(landingContentSpy).toHaveBeenCalledWith({
      appPath: '/login',
      authenticated: false,
    });
  });

  it('sends an authenticated admin user to admin mode', () => {
    getAuthUser.mockReturnValue(createAuthUser({ role: 'ADMIN' }));

    renderPage();

    expect(getAuthUser).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('link', { name: /Ir a la plataforma/i }),
    ).toHaveAttribute('href', '/admin');
    expect(screen.getByTestId('landing-app-path')).toHaveTextContent('/admin');
    expect(screen.getByTestId('landing-authenticated')).toHaveTextContent(
      'true',
    );
    expect(landingContentSpy).toHaveBeenCalledWith({
      appPath: '/admin',
      authenticated: true,
    });
  });

  it('sends an authenticated trainer user to trainer mode', () => {
    getAuthUser.mockReturnValue(createAuthUser({ role: 'TRAINER' }));

    renderPage();

    expect(getAuthUser).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('link', { name: /Ir a la plataforma/i }),
    ).toHaveAttribute('href', '/trainer');
    expect(screen.getByTestId('landing-app-path')).toHaveTextContent(
      '/trainer',
    );
    expect(screen.getByTestId('landing-authenticated')).toHaveTextContent(
      'true',
    );
    expect(landingContentSpy).toHaveBeenCalledWith({
      appPath: '/trainer',
      authenticated: true,
    });
  });

  it('sends any authenticated non-admin user to trainer mode', () => {
    getAuthUser.mockReturnValue(
      createAuthUser({
        role: 'TRAINER',
      }),
    );

    renderPage();

    expect(getAuthUser).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('link', { name: /Ir a la plataforma/i }),
    ).toHaveAttribute('href', '/trainer');
    expect(landingContentSpy).toHaveBeenCalledWith({
      appPath: '/trainer',
      authenticated: true,
    });
  });
});