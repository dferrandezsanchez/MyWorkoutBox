import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client, DashboardOverview } from '@shared/types/api';
import DashboardPage from './DashboardPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useAuthUser: vi.fn(),
  useClients: vi.fn(),
  useExercises: vi.fn(),
  useTrainers: vi.fn(),
  useDashboardOverview: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/auth/hooks/useAuthUser', () => ({ useAuthUser: mocks.useAuthUser }));
vi.mock('@features/clients/hooks/useClients', () => ({ useClients: mocks.useClients }));
vi.mock('@features/exercises/hooks/useExercises', () => ({ useExercises: mocks.useExercises }));
vi.mock('@features/trainers/hooks/useTrainers', () => ({ useTrainers: mocks.useTrainers }));
vi.mock('@features/dashboard/hooks/useDashboardOverview', () => ({ useDashboardOverview: mocks.useDashboardOverview }));
vi.mock('@shared/tenant/useActiveTenant', () => ({ useActiveTenant: () => ({ tenant: { name: 'Demo Center' } }) }));

const completeClient: Client = {
  id: 'client-1', firstName: 'Alex', lastName: 'Molina', birthDate: '1990-01-01', height: 180, weight: 80,
  status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
};

const daily = Array.from({ length: 28 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 9, 15 + index)).toISOString().slice(0, 10),
  sessions: index % 3 === 0 ? 1 : 0,
  series: index % 3 === 0 ? 9 : 0,
}));

const overview: DashboardOverview = {
  period: { from: '2026-10-15T00:00:00.000Z', to: '2026-11-12T00:00:00.000Z', days: 28 },
  totals: { completedSessions: 12, previousCompletedSessions: 10, series: 108, previousSeries: 120, trainedClients: 4, previousTrainedClients: 4 },
  daily,
  activeSessions: [{ id: 'live-1', clientId: 'client-2', clientName: 'Marta Ruiz', trainerName: 'Roberto', startedAt: new Date().toISOString(), seriesCount: 3 }],
  trainers: [
    { id: 't1', name: 'Roberto Gil', sessions: 8, series: 72 },
    { id: 't2', name: 'Lucía Pérez', sessions: 4, series: 36 },
  ],
  recentSessions: [{ id: 's1', clientId: 'client-3', clientName: 'Elena Torres', trainerName: 'Roberto Gil', completedAt: '2026-11-10T10:00:00.000Z', exerciseCount: 3, seriesCount: 9 }],
  clientsToReactivate: [
    { id: 'client-4', name: 'Nuria Vidal', lastSessionAt: '2026-10-20T10:00:00.000Z', daysSince: 22 },
    { id: 'client-5', name: 'Javier Santos', lastSessionAt: null, daysSince: null },
  ],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.useAuthUser.mockReturnValue({ data: { name: 'Daniel Admin' } });
    mocks.useClients.mockReturnValue({ data: [completeClient], isLoading: false, isError: false });
    mocks.useExercises.mockReturnValue({ data: [{ id: 'exercise-1', status: 'ACTIVE' }], isLoading: false, isError: false });
    mocks.useTrainers.mockReturnValue({ data: [{ id: 'trainer-1', active: true }], isLoading: false, isError: false });
    mocks.useDashboardOverview.mockReturnValue({ data: overview, isLoading: false, isError: false });
  });

  it('shows period indicators with their comparison', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Hola, Daniel Admin')).toBeInTheDocument();
    expect(screen.getByText('108')).toBeInTheDocument();
    expect(screen.getByText('+20%')).toHaveTextContent('+20% vs. periodo anterior');
    expect(screen.getByText('-10%')).toHaveTextContent('-10% vs. periodo anterior');
    expect(screen.getByText('=')).toHaveTextContent('= vs. periodo anterior');
    expect(screen.getByText('de 1 activos')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /90 series registradas en 28 días, con actividad en 10/ })).toBeInTheDocument();
  });

  it('surfaces live sessions, recent sessions, team and clients to reactivate', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    expect(screen.getByText('con Roberto')).toBeInTheDocument();
    expect(screen.getByText('3 ej · 9 series')).toBeInTheDocument();
    expect(screen.getByText('8 ses · 72 series')).toBeInTheDocument();
    expect(screen.getByText('22 días')).toBeInTheDocument();
    expect(screen.getByText('Sin sesiones')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Marta Ruiz/ }));
    await user.click(screen.getByRole('button', { name: /Elena Torres/ }));
    await user.click(screen.getByRole('button', { name: /Nuria Vidal/ }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, '/clients/client-2?mode=admin');
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, '/clients/client-3?mode=admin');
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, '/clients/client-4?mode=admin');
  });

  it('navigates to management areas and trainer mode', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByRole('button', { name: /Clientes activos/ }));
    await user.click(screen.getByRole('button', { name: /^Entrenadores 1/ }));
    await user.click(screen.getByRole('button', { name: /Ejercicios 1/ }));
    await user.click(screen.getByRole('button', { name: /Modo entrenador/ }));
    await user.click(screen.getByRole('button', { name: /Gestionar clientes/ }));
    expect(mocks.navigate.mock.calls.map(([path]) => path)).toEqual(['/admin/clients', '/admin/trainers', '/admin/exercises', '/trainer', '/admin/clients']);
  });

  it('shows empty states when the center has no activity yet', () => {
    mocks.useDashboardOverview.mockReturnValue({
      data: { ...overview, activeSessions: [], trainers: [], recentSessions: [], clientsToReactivate: [] },
      isLoading: false,
      isError: false,
    });
    render(<DashboardPage />);

    expect(screen.getByText('Ningún entrenamiento en curso')).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay sesiones completadas')).toBeInTheDocument();
    expect(screen.getByText('Sin actividad del equipo')).toBeInTheDocument();
    expect(screen.getByText('Todos entrenan con regularidad')).toBeInTheDocument();
    expect(screen.getByText('No hay incidencias visibles')).toBeInTheDocument();
  });

  it('lists actionable client data issues', async () => {
    const user = userEvent.setup();
    mocks.useClients.mockReturnValue({ data: [{ ...completeClient, id: 'issue-1', height: null, weight: null }], isLoading: false, isError: false });
    render(<DashboardPage />);

    expect(screen.getByText('Edad o datos físicos pendientes')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Alex Molina Edad/ }));
    expect(mocks.navigate).toHaveBeenCalledWith('/admin/clients/issue-1');
  });

  it('handles loading and partial request failures', () => {
    mocks.useDashboardOverview.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mocks.useClients.mockReturnValue({ data: undefined, isLoading: true, isError: true });
    mocks.useExercises.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mocks.useTrainers.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<DashboardPage />);

    expect(screen.getByText('No se pudo cargar todo el resumen operativo.')).toBeInTheDocument();
    expect(screen.getByText('No se pudieron cargar los clientes.')).toBeInTheDocument();
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(4);
  });
});
