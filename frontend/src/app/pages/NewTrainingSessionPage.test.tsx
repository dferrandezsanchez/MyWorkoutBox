import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client, RoutineTemplate, SessionStartOptions, TrainingSession } from '@shared/types/api';
import NewTrainingSessionPage from './NewTrainingSessionPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useActiveSession: vi.fn(),
  useTrainerSessions: vi.fn(),
  useClients: vi.fn(),
  mutateAsync: vi.fn(),
  useSessionOptions: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/clients/hooks/useClients', () => ({ useClients: mocks.useClients }));
vi.mock('@features/training-sessions/hooks/useTrainingSessions', () => ({
  useActiveSession: mocks.useActiveSession,
  useTrainerSessions: mocks.useTrainerSessions,
  useSessionOptions: mocks.useSessionOptions,
  useStartSession: () => ({ mutateAsync: mocks.mutateAsync, isPending: false, isError: false }),
}));

const client: Client = {
  id: 'client-1',
  firstName: 'Alex',
  lastName: 'Molina',
  birthDate: '1990-01-01',
  height: 178,
  weight: 78.5,
  notes: 'Objetivo: mejorar dominadas.',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const startedSession: TrainingSession = {
  id: 'session-1',
  tenantId: 'tenant-1',
  clientId: client.id,
  trainerId: 'trainer-1',
  trainerName: 'Roberto',
  status: 'ACTIVE',
  startedAt: '2026-07-01T10:00:00.000Z',
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
  client,
  exercises: [],
};

function template(id: string, name: string, exercises = 2): RoutineTemplate {
  return {
    id, tenantId: 'tenant-1', name, notes: null, status: 'ACTIVE', createdById: 'admin-1',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    exercises: Array.from({ length: exercises }, (_, index) => ({
      id: `${id}-${index}`, templateId: id, exerciseId: `exercise-${index}`, position: index + 1,
      targetSets: 3, targetReps: '10', notes: null, exercise: {} as RoutineTemplate['exercises'][number]['exercise'],
    })),
  };
}

const pushB = template('tpl-b', 'Empuje B', 4);
const legs = template('tpl-legs', 'Pierna fuerza', 5);
const routineOptions: SessionStartOptions = {
  plan: null,
  nextRoutine: { position: 2, template: pushB },
  templates: [pushB, legs],
};

describe('NewTrainingSessionPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.mutateAsync.mockReset();
    mocks.mutateAsync.mockResolvedValue(startedSession);
    mocks.useActiveSession.mockReturnValue({ data: null });
    mocks.useTrainerSessions.mockReturnValue({ data: [startedSession, { ...startedSession, id: 'session-2' }] });
    mocks.useClients.mockReturnValue({ data: [client], isLoading: false, isError: false });
    mocks.useSessionOptions.mockReturnValue({ data: { plan: null, nextRoutine: null, templates: [] }, isLoading: false, isError: false });
  });

  it('searches, confirms and starts a session for the selected client', async () => {
    const user = userEvent.setup();
    render(<NewTrainingSessionPage />);

    await user.type(screen.getByPlaceholderText('Buscar cliente'), 'Alex');
    await user.click(screen.getByRole('button', { name: /Alex Molina/ }));

    expect(screen.getByRole('dialog', { name: 'Confirmar cliente' })).toBeInTheDocument();
    expect(screen.getByText(/Se iniciará una nueva sesión activa/)).toBeInTheDocument();
    expect(screen.getByText('Objetivo: mejorar dominadas.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ clientId: client.id, mode: 'free' });
    expect(mocks.useSessionOptions).toHaveBeenLastCalledWith(client.id);
    expect(mocks.navigate).toHaveBeenCalledWith('/trainer/sessions/session-1');
  });

  it('closes the confirmation without starting a session', async () => {
    const user = userEvent.setup();
    render(<NewTrainingSessionPage />);

    await user.click(screen.getAllByRole('button', { name: /Alex Molina/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('returns to the dashboard and reports empty searches', async () => {
    const user = userEvent.setup();
    render(<NewTrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Volver' }));
    await user.type(screen.getByPlaceholderText('Buscar cliente'), 'Nadie');

    expect(mocks.navigate).toHaveBeenCalledWith('/trainer');
    expect(screen.getByText('No se encontraron clientes')).toBeInTheDocument();
  });

  it('redirects the trainer to an existing active session', async () => {
    const user = userEvent.setup();
    mocks.useActiveSession.mockReturnValue({ data: startedSession });
    render(<NewTrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Continuar sesión' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/trainer/sessions/session-1');
  });

  it('preselects the next routine of the plan and starts in plan mode', async () => {
    const user = userEvent.setup();
    mocks.useSessionOptions.mockReturnValue({ data: routineOptions, isLoading: false, isError: false });
    render(<NewTrainingSessionPage />);

    await user.click(screen.getAllByRole('button', { name: /Alex Molina/ })[0]);
    const next = screen.getByRole('radio', { name: /Empuje B/ });
    expect(next).toHaveAttribute('aria-checked', 'true');
    expect(next).toHaveTextContent('B');
    expect(next).toHaveTextContent('Siguiente de su serie · 4 ejercicios');

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ clientId: client.id, mode: 'plan' });
  });

  it('starts a free session when chosen instead of the routine', async () => {
    const user = userEvent.setup();
    mocks.useSessionOptions.mockReturnValue({ data: routineOptions, isLoading: false, isError: false });
    render(<NewTrainingSessionPage />);

    await user.click(screen.getAllByRole('button', { name: /Alex Molina/ })[0]);
    await user.click(screen.getByRole('radio', { name: /Entreno libre/ }));
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ clientId: client.id, mode: 'free' });
  });

  it('requires picking a template when starting from another routine', async () => {
    const user = userEvent.setup();
    mocks.useSessionOptions.mockReturnValue({ data: routineOptions, isLoading: false, isError: false });
    render(<NewTrainingSessionPage />);

    await user.click(screen.getAllByRole('button', { name: /Alex Molina/ })[0]);
    await user.click(screen.getByRole('radio', { name: /Otra rutina/ }));
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /Pierna fuerza/ }));
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ clientId: client.id, mode: 'template', templateId: 'tpl-legs' });
  });

  it('waits for the routines and falls back to a free session when they fail', async () => {
    const user = userEvent.setup();
    mocks.useSessionOptions.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { rerender } = render(<NewTrainingSessionPage />);

    await user.click(screen.getAllByRole('button', { name: /Alex Molina/ })[0]);
    expect(screen.getByText('Cargando rutinas...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();

    mocks.useSessionOptions.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    rerender(<NewTrainingSessionPage />);
    expect(screen.getByText(/No se pudieron cargar las rutinas/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(mocks.mutateAsync).toHaveBeenCalledWith({ clientId: client.id, mode: 'free' });
  });
});
