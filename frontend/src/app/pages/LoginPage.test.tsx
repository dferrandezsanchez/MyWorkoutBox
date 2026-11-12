import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
import { login, selectTenant } from '@features/auth/api/auth.api';

const navigate = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useSearchParams: () => [searchParams],
}));

vi.mock('@features/auth/api/auth.api', () => ({
  login: vi.fn(),
  selectTenant: vi.fn(),
}));

vi.mock('@features/auth/model/auth-store', () => ({
  setStoredTenant: vi.fn(),
  setToken: vi.fn(),
}));

vi.mock('@shared/state/query-client', () => ({
  queryClient: { clear: vi.fn() },
}));

async function loginAsAdmin() {
  vi.mocked(login).mockResolvedValueOnce({
    token: 'jwt',
    tenant: { id: 'tenant-1', organizationId: 'org-1', name: 'Demo Center', slug: 'demo-center' },
    user: { id: 'user-1', name: 'Admin', email: 'admin-demo@gym.com', role: 'ADMIN', tenantId: 'tenant-1', organizationId: 'org-1' },
  });
  const user = userEvent.setup();
  render(<LoginPage />);
  await user.type(screen.getByLabelText('Email'), 'admin-demo@gym.com');
  await user.type(screen.getByLabelText('Contraseña'), 'Admin1234!');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns to a safe in-app path after login', async () => {
    searchParams = new URLSearchParams({ next: '/admin/clients?page=2' });
    await loginAsAdmin();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin/clients?page=2', { replace: true }));
  });

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', '/login?next=/admin'])(
    'ignores an unsafe next path (%s)',
    async (next) => {
      searchParams = new URLSearchParams({ next });
      await loginAsAdmin();
      await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin', { replace: true }));
    },
  );

  it('links back to the marketing site only when configured', () => {
    vi.stubEnv('VITE_MARKETING_URL', '');
    const { unmount } = render(<LoginPage />);
    expect(screen.queryByRole('link', { name: /Volver a la web/ })).not.toBeInTheDocument();
    unmount();

    vi.stubEnv('VITE_MARKETING_URL', 'https://www.example.com');
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /Volver a la web de STELIOS/ })).toHaveAttribute('href', 'https://www.example.com');
  });

  it('toggles password visibility without changing the typed value', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText('Contraseña');
    await user.type(passwordInput, 'Admin1234!');

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveValue('Admin1234!');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a generic error when credentials are rejected', async () => {
    vi.mocked(login).mockRejectedValueOnce(new Error('Unauthorized'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin-demo@gym.com');
    await user.type(screen.getByLabelText('Contraseña'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders tenant choices and completes tenant selection', async () => {
    vi.mocked(login).mockResolvedValueOnce({
      tenantSelectionRequired: true,
      selectionToken: 'selection-token',
      tenants: [
        {
          id: 'tenant-1',
          organizationId: 'org-1',
          name: 'Demo Center',
          organizationName: 'Demo Org',
          role: 'ADMIN',
        },
      ],
    });
    vi.mocked(selectTenant).mockResolvedValueOnce({
      token: 'jwt',
      tenant: {
        id: 'tenant-1',
        organizationId: 'org-1',
        name: 'Demo Center',
        slug: 'demo-center',
      },
      user: {
        id: 'user-1',
        name: 'Admin',
        email: 'admin-demo@gym.com',
        role: 'ADMIN',
        tenantId: 'tenant-1',
        organizationId: 'org-1',
      },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin-demo@gym.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Admin1234!');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await user.click(await screen.findByRole('button', { name: /Demo Center/ }));

    await waitFor(() => expect(selectTenant).toHaveBeenCalledWith('selection-token', 'tenant-1'));
    expect(navigate).toHaveBeenCalledWith('/admin', { replace: true });
  });

  it('keeps tenant selection recoverable when access fails', async () => {
    vi.mocked(login).mockResolvedValueOnce({
      tenantSelectionRequired: true,
      selectionToken: 'selection-token',
      tenants: [{
        id: 'tenant-1', organizationId: 'org-1', name: 'Demo Center',
        organizationName: 'Demo Org', role: 'ADMIN',
      }],
    });
    vi.mocked(selectTenant).mockRejectedValueOnce(new Error('Tenant unavailable'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'admin-demo@gym.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Admin1234!');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await user.click(await screen.findByRole('button', { name: /Demo Center/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo acceder a ese centro');
    expect(screen.getByRole('button', { name: /Demo Center/ })).toBeEnabled();
    expect(navigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Volver al login' }));
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
