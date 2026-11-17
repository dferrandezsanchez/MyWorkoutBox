import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TenantSettingsPage from './TenantSettingsPage';

const { mutateAsync, tenantQuery } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  tenantQuery: {
    data: { id: 'tenant-1', organizationId: 'org-1', name: 'TuMeta Personal Training', slug: 'tumeta', measurementsEnabled: true } as
      | { id: string; organizationId: string; name: string; slug: string; measurementsEnabled: boolean }
      | undefined,
    isLoading: false,
    isError: false,
  },
}));

vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/auth/hooks/useAuthUser', () => ({
  useCurrentTenant: () => tenantQuery,
  useUpdateCurrentTenant: () => ({ mutateAsync, isPending: false }),
}));

describe('TenantSettingsPage', () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    tenantQuery.isLoading = false;
    tenantQuery.isError = false;
  });

  it('only offers to edit the center name, with no branding controls', () => {
    render(<TenantSettingsPage />);

    expect(screen.getByLabelText('Nombre del centro')).toHaveValue('TuMeta Personal Training');
    expect(screen.queryByLabelText(/color/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar cambios/ })).toBeDisabled();
  });

  it('saves a trimmed name and confirms it', async () => {
    mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<TenantSettingsPage />);

    const input = screen.getByLabelText('Nombre del centro');
    await user.clear(input);
    await user.type(input, '  TuMeta Studio  ');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    expect(mutateAsync).toHaveBeenCalledWith({ name: 'TuMeta Studio' });
    expect(await screen.findByRole('status')).toHaveTextContent('Cambios guardados');
  });

  it('shows the server error when saving fails', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    render(<TenantSettingsPage />);

    await user.type(screen.getByLabelText('Nombre del centro'), ' Pro');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar el nombre del centro.');
  });

  it('renders loading and error states', () => {
    tenantQuery.isLoading = true;
    const { unmount } = render(<TenantSettingsPage />);
    expect(screen.getByText('Cargando ajustes...')).toBeInTheDocument();
    unmount();

    tenantQuery.isLoading = false;
    tenantQuery.isError = true;
    render(<TenantSettingsPage />);
    expect(screen.getByText('No se pudieron cargar los ajustes')).toBeInTheDocument();
  });

  it('switches measurement tracking for the center', async () => {
    mutateAsync.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    render(<TenantSettingsPage />);

    const toggle = screen.getByRole('switch', { name: 'Seguimiento de mediciones y objetivos' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    expect(mutateAsync).toHaveBeenCalledWith({ measurementsEnabled: false });

    await user.click(toggle);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar el ajuste.');
  });
});
