import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingContent } from './LandingContent';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  setToken: vi.fn(),
  setStoredTenantBrand: vi.fn(),
}));

vi.mock('@features/auth/api/auth.api', () => ({ login: mocks.login }));
vi.mock('@features/auth/model/auth-store', () => ({
  setToken: mocks.setToken,
  setStoredTenantBrand: mocks.setStoredTenantBrand,
}));

function renderLanding(appPath: '/login' | '/admin' | '/trainer' = '/login', authenticated = false) {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="*" element={<LandingContent appPath={appPath} authenticated={authenticated} />} />
        <Route path="/admin" element={<p>Admin demo</p>} />
        <Route path="/trainer" element={<p>Trainer demo</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LandingContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the public product proposition without exposing demo credentials', () => {
    renderLanding();

    expect(screen.getByRole('heading', { name: /Gestiona tu centro/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Entrar en la plataforma/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('button', { name: /Gestionar el centro/i })).toBeInTheDocument();
    expect(screen.queryByText('admin-demo@gym.com')).not.toBeInTheDocument();
  });

  it('logs into the selected demo mode and stores its session', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({
      token: 'demo-token',
      user: { id: 'user-1', name: 'Demo', email: 'admin-demo@gym.com', role: 'ADMIN', tenantId: 'tenant-1', organizationId: 'org-1' },
      tenant: { id: 'tenant-1', name: 'Demo', primary: '#2563eb' },
    });
    renderLanding();

    await user.click(screen.getByRole('button', { name: /Gestionar el centro/i }));

    expect(mocks.login).toHaveBeenCalledWith('admin-demo@gym.com', 'Admin1234!');
    expect(mocks.setToken).toHaveBeenCalledWith('demo-token');
    expect(screen.getByText('Admin demo')).toBeInTheDocument();
  });

  it('shows a recoverable error when demo access fails', async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue(new Error('unauthorized'));
    renderLanding();

    await user.click(screen.getByRole('button', { name: /Registrar una sesión/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hemos podido abrir la demo');
  });

  it('uses the authenticated destination and label', () => {
    renderLanding('/admin', true);

    expect(screen.getAllByRole('link', { name: /Ir a la plataforma/i })[0]).toHaveAttribute('href', '/admin');
  });

  it('opens and closes the mobile menu with its controls and Escape', async () => {
    const user = userEvent.setup();
    renderLanding();

    const trigger = screen.getByRole('button', { name: 'Abrir menú' });
    await user.click(trigger);
    expect(screen.getByRole('navigation', { name: 'Navegación móvil de producto' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Navegación móvil de producto' })).not.toBeInTheDocument();
  });
});
