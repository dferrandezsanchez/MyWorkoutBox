import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@shared/types/auth';
import { UserMenu } from './UserMenu';

const admin: AuthUser = { id: 'user-1', name: 'Admin Demo', email: 'admin@example.com', role: 'ADMIN', tenantId: 'tenant-1', organizationId: 'org-1' };

describe('UserMenu', () => {
  it('shows account context and switches an admin to trainer mode', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const close = vi.fn();
    render(<UserMenu open user={admin} tenantName="Demo Center" mode="admin" onClose={close} onNavigate={navigate} onLogout={vi.fn()} />);

    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('Demo Center')).toBeInTheDocument();
    expect(screen.getByText('Modo administración')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Entrenador' }));
    expect(navigate).toHaveBeenCalledWith('/trainer');
    expect(close).toHaveBeenCalled();
  });

  it('does not offer admin mode to trainers and exposes account and logout', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    const logout = vi.fn();
    render(<UserMenu open user={{ ...admin, role: 'TRAINER' }} tenantName="Demo Center" mode="trainer" onClose={vi.fn()} onNavigate={navigate} onLogout={logout} />);

    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cuenta y seguridad/ }));
    expect(navigate).toHaveBeenCalledWith('/account?mode=trainer');
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/ }));
    expect(logout).toHaveBeenCalled();
  });

  it('closes with Escape and renders nothing while closed', async () => {
    const close = vi.fn();
    const view = render(<UserMenu open user={admin} tenantName="Demo" mode="admin" onClose={close} onNavigate={vi.fn()} onLogout={vi.fn()} />);
    await userEvent.keyboard('{Escape}');
    expect(close).toHaveBeenCalled();
    view.rerender(<UserMenu open={false} user={admin} tenantName="Demo" mode="admin" onClose={close} onNavigate={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
