import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client } from '@shared/types/api';
import DashboardPage from './DashboardPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useAuthUser: vi.fn(),
  useClients: vi.fn(),
  useExercises: vi.fn(),
  useTrainers: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/auth/hooks/useAuthUser', () => ({ useAuthUser: mocks.useAuthUser }));
vi.mock('@features/clients/hooks/useClients', () => ({ useClients: mocks.useClients }));
vi.mock('@features/exercises/hooks/useExercises', () => ({ useExercises: mocks.useExercises }));
vi.mock('@features/trainers/hooks/useTrainers', () => ({ useTrainers: mocks.useTrainers }));
vi.mock('@shared/theme/useTheme', () => ({ useTheme: () => ({ brand: { name: 'Demo Center' } }) }));

const completeClient: Client = {
  id: 'client-1', firstName: 'Alex', lastName: 'Molina', birthDate: '1990-01-01', height: 180, weight: 80,
  status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DashboardPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.useAuthUser.mockReturnValue({ data: { name: 'Daniel Admin' } });
    mocks.useClients.mockReturnValue({ data: [completeClient], isLoading: false, isError: false });
    mocks.useExercises.mockReturnValue({ data: [{ id: 'exercise-1', status: 'ACTIVE' }], isLoading: false, isError: false });
    mocks.useTrainers.mockReturnValue({ data: [{ id: 'trainer-1', active: true }], isLoading: false, isError: false });
  });

  it('shows real operational data and navigates through management and work mode', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(screen.getByText('Hola, Daniel Admin')).toBeInTheDocument();
    expect(screen.getByText('Controla tu centro')).toBeInTheDocument();
    expect(screen.getByText('No hay incidencias visibles')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Clientes Alta/ }));
    await user.click(screen.getByRole('button', { name: /Entrenadores Accesos/ }));
    await user.click(screen.getByRole('button', { name: /Ejercicios Catálogo/ }));
    await user.click(screen.getByRole('button', { name: /Ajustes Identidad/ }));
    await user.click(screen.getByRole('button', { name: /Modo entrenador/ }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, '/admin/clients');
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, '/admin/trainers');
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, '/admin/exercises');
    expect(mocks.navigate).toHaveBeenNthCalledWith(4, '/admin/settings');
    expect(mocks.navigate).toHaveBeenNthCalledWith(5, '/trainer');
  });

  it('lists actionable client data issues', async () => {
    const user = userEvent.setup();
    mocks.useClients.mockReturnValue({ data: [{ ...completeClient, id: 'issue-1', height: null, weight: null }], isLoading: false, isError: false });
    render(<DashboardPage />);

    expect(screen.getByText('Edad o datos físicos pendientes')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Alex Molina/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/admin/clients/issue-1');
  });

  it('handles loading and partial request failures', () => {
    mocks.useClients.mockReturnValue({ data: undefined, isLoading: true, isError: true });
    mocks.useExercises.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mocks.useTrainers.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<DashboardPage />);

    expect(screen.getByText('No se pudo cargar todo el resumen operativo.')).toBeInTheDocument();
    expect(screen.getByText('No se pudieron cargar los clientes.')).toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(4);
  });
});
