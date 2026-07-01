import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client, TrainingSession } from '@shared/types/api';
import TrainerPage from './TrainerPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useActiveSession: vi.fn(),
  useTrainerSessions: vi.fn(),
  useAuthUser: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/training-sessions/hooks/useTrainingSessions', () => ({
  useActiveSession: mocks.useActiveSession,
  useTrainerSessions: mocks.useTrainerSessions,
}));
vi.mock('@features/auth/hooks/useAuthUser', () => ({ useAuthUser: mocks.useAuthUser }));

const client: Client = {
  id: 'client-1',
  firstName: 'Alex',
  lastName: 'Molina',
  birthDate: '1990-01-01',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 'session-1',
    tenantId: 'tenant-1',
    clientId: client.id,
    trainerId: 'trainer-1',
    trainerName: 'Roberto',
    status: 'COMPLETED',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    client,
    exercises: [],
    ...overrides,
  };
}

describe('TrainerPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.useAuthUser.mockReturnValue({ data: { name: 'Roberto' } });
    mocks.useActiveSession.mockReturnValue({ data: null });
    mocks.useTrainerSessions.mockReturnValue({ data: [session()], isLoading: false });
  });

  it('prioritizes starting a session when none is active', async () => {
    const user = userEvent.setup();
    render(<TrainerPage />);

    expect(screen.getByText('Inicia una nueva sesión')).toBeInTheDocument();
    expect(screen.getByText('Actividad reciente')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Nuevo entrenamiento/ }));

    expect(mocks.navigate).toHaveBeenCalledWith('/trainer/sessions/new');
  });

  it('shows session metrics and warns about a stale active session', async () => {
    const user = userEvent.setup();
    const activeSession = session({
      id: 'active-1',
      status: 'ACTIVE',
      completedAt: null,
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      exercises: [{
        id: 'item-1', sessionId: 'active-1', exerciseId: 'exercise-1', position: 1, createdAt: new Date().toISOString(),
        exercise: { id: 'exercise-1', name: 'Dominadas', category: 'strength', movementPattern: 'pull', evaluationType: 'repetitions', improvementDirection: 'higher', defaultUnit: 'repetitions', measurementFields: '[]', variantGroups: '[]', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        series: [{ id: 'record-1', clientId: client.id, exerciseId: 'exercise-1', trainerId: 'trainer-1', trainerName: 'Roberto', value: 8, unit: 'repetitions', date: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }],
      }],
    });
    mocks.useActiveSession.mockReturnValue({ data: activeSession });

    render(<TrainerPage />);

    expect(screen.getByText(/más de 3 horas activa/)).toBeInTheDocument();
    expect(screen.getByText('1 ejercicios')).toBeInTheDocument();
    expect(screen.getByText('1 series')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Continuar entrenamiento/ }));

    expect(mocks.navigate).toHaveBeenCalledWith('/trainer/sessions/active-1');
  });

  it('updates and clears the active-session timer', () => {
    vi.useFakeTimers();
    const active = session({ status: 'ACTIVE', completedAt: null, startedAt: new Date(Date.now() - 1000).toISOString() });
    mocks.useActiveSession.mockReturnValue({ data: active });

    const view = render(<TrainerPage />);
    vi.advanceTimersByTime(1000);
    expect(screen.getByText(/00:00:0[12]/)).toBeInTheDocument();
    view.unmount();
    vi.useRealTimers();
  });

  it('opens recent clients and completed activity', async () => {
    const user = userEvent.setup();
    render(<TrainerPage />);

    const alexButtons = screen.getAllByRole('button', { name: /Alex Molina/ });
    await user.click(alexButtons[0]);
    await user.click(alexButtons[1]);

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, '/clients/client-1');
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, '/trainer/sessions/session-1');
  });
});
