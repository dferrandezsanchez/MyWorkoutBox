import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client, CreatePerformanceData, Exercise, PerformanceRecord, TrainingSession } from '@shared/types/api';
import TrainingSessionPage from './TrainingSessionPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useTrainingSession: vi.fn(),
  useTrainerSessions: vi.fn(),
  useExercises: vi.fn(),
  addExercise: vi.fn(),
  deleteSeries: vi.fn(),
  discard: vi.fn(),
  removeExercise: vi.fn(),
  createSeries: vi.fn(),
  updateSeries: vi.fn(),
  complete: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate, useParams: () => ({ id: 'session-1' }) }));
vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/performances/components/PerformanceForm', () => ({
  default: ({ onSave, onClose }: { onSave: (data: CreatePerformanceData) => Promise<unknown>; onClose: () => void }) => (
    <div>
      <span>Nueva serie abierta</span>
      <button onClick={() => void onSave({ value: 10, unit: 'repetitions', date: '2026-07-01' })}>Guardar serie simulada</button>
      <button onClick={onClose}>Cerrar serie simulada</button>
    </div>
  ),
}));
vi.mock('@features/exercises/hooks/useExercises', () => ({ useExercises: mocks.useExercises }));
vi.mock('@features/training-sessions/hooks/useTrainingSessions', () => ({
  useTrainingSession: mocks.useTrainingSession,
  useTrainerSessions: mocks.useTrainerSessions,
  useSessionActions: () => ({
    addExercise: { mutateAsync: mocks.addExercise },
    removeExercise: { mutate: mocks.removeExercise },
    createSeries: { mutateAsync: mocks.createSeries },
    updateSeries: { mutateAsync: mocks.updateSeries },
    deleteSeries: { mutateAsync: mocks.deleteSeries, isPending: false },
    complete: { mutateAsync: mocks.complete },
    discard: { mutateAsync: mocks.discard, isPending: false },
  }),
}));

const client: Client = {
  id: 'client-1',
  firstName: 'Alex',
  lastName: 'Molina',
  birthDate: '1990-01-01',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const exercises: Exercise[] = [
  {
    id: 'exercise-1', name: 'Dominadas', category: 'strength', movementPattern: 'pull', evaluationType: 'repetitions', improvementDirection: 'higher', defaultUnit: 'repetitions', measurementFields: '[]', variantGroups: '[]', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-2', name: 'Peso muerto', category: 'strength', movementPattern: 'hinge', evaluationType: 'weight_reps', improvementDirection: 'higher', defaultUnit: 'kg', measurementFields: '[]', variantGroups: '[]', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const record: PerformanceRecord = {
  id: 'record-1', clientId: client.id, exerciseId: 'exercise-1', trainerId: 'trainer-1', trainerName: 'Roberto', value: 8, unit: 'repetitions', repetitions: 8, date: '2026-07-01T10:00:00.000Z', seriesNumber: 1, createdAt: '2026-07-01T10:00:00.000Z', updatedAt: '2026-07-01T10:00:00.000Z',
};

function activeSession(exerciseItems: TrainingSession['exercises'] = []): TrainingSession {
  return {
    id: 'session-1', tenantId: 'tenant-1', clientId: client.id, trainerId: 'trainer-1', trainerName: 'Roberto', status: 'ACTIVE', startedAt: '2026-07-01T10:00:00.000Z', createdAt: '2026-07-01T10:00:00.000Z', updatedAt: '2026-07-01T10:00:00.000Z', client, exercises: exerciseItems,
  };
}

const sessionWithSeries = activeSession([{
  id: 'item-1', sessionId: 'session-1', exerciseId: 'exercise-1', position: 1, createdAt: '2026-07-01T10:00:00.000Z', exercise: exercises[0], series: [record],
}]);

describe('TrainingSessionPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.addExercise.mockReset();
    mocks.deleteSeries.mockReset();
    mocks.discard.mockReset();
    mocks.removeExercise.mockReset();
    mocks.createSeries.mockReset();
    mocks.updateSeries.mockReset();
    mocks.complete.mockReset();
    mocks.deleteSeries.mockResolvedValue(undefined);
    mocks.discard.mockResolvedValue(undefined);
    mocks.createSeries.mockResolvedValue(undefined);
    mocks.updateSeries.mockResolvedValue(undefined);
    mocks.complete.mockResolvedValue(undefined);
    mocks.useExercises.mockReturnValue({ data: exercises });
    mocks.useTrainerSessions.mockReturnValue({ data: [{ ...activeSession([{ id: 'recent-item', sessionId: 'old', exerciseId: 'exercise-2', position: 1, createdAt: '2026-06-30T10:00:00.000Z', exercise: exercises[1], series: [] }]), id: 'old', status: 'COMPLETED' }] });
    mocks.useTrainingSession.mockReturnValue({ data: sessionWithSeries, isLoading: false, isError: false });
  });

  it('shows recent exercises in the picker and opens the full row', async () => {
    const user = userEvent.setup();
    mocks.addExercise.mockResolvedValue(activeSession([{ id: 'item-2', sessionId: 'session-1', exerciseId: 'exercise-2', position: 2, createdAt: '2026-07-01T10:00:00.000Z', exercise: exercises[1], series: [] }]));
    render(<TrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: /Ejercicio/ }));
    expect(screen.getByText('Recientes')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Peso muerto/ }));

    expect(mocks.addExercise).toHaveBeenCalledWith('exercise-2');
    await user.click(screen.getByRole('button', { name: 'Guardar serie simulada' }));
    expect(mocks.createSeries).toHaveBeenCalledWith(expect.objectContaining({ itemId: 'item-2' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar serie simulada' }));
  });

  it('edits and copies existing series', async () => {
    const user = userEvent.setup();
    render(<TrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Editar serie 1' }));
    await user.click(screen.getByRole('button', { name: 'Guardar serie simulada' }));
    expect(mocks.updateSeries).toHaveBeenCalledWith(expect.objectContaining({ recordId: 'record-1' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar serie simulada' }));

    await user.click(screen.getByRole('button', { name: 'Añadir serie' }));
    expect(screen.getByText('Nueva serie abierta')).toBeInTheDocument();
  });

  it('removes an exercise without series and can close the picker', async () => {
    const user = userEvent.setup();
    const itemWithoutSeries = { ...sessionWithSeries.exercises[0], series: [] };
    mocks.useTrainingSession.mockReturnValue({ data: activeSession([itemWithoutSeries]), isLoading: false, isError: false });
    render(<TrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Quitar ejercicio' }));
    expect(mocks.removeExercise).toHaveBeenCalledWith('item-1');
    await user.click(screen.getByRole('button', { name: /Ejercicio/ }));
    await user.type(screen.getByPlaceholderText('Buscar ejercicio'), 'Nada');
    expect(screen.getByText('No encontramos ejercicios con ese nombre')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog', { name: 'Añadir ejercicio' })).not.toBeInTheDocument();
  });

  it('finalizes a session with notes and supports canceling first', async () => {
    const user = userEvent.setup();
    render(<TrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Finalizar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Finalizar' }));
    await user.type(screen.getByPlaceholderText('Notas de la sesión (opcional)'), 'Buen trabajo');
    await user.click(screen.getByRole('button', { name: 'Confirmar finalización' }));

    expect(mocks.complete).toHaveBeenCalledWith('Buen trabajo');
  });

  it('uses an accessible confirmation before deleting a series', async () => {
    const user = userEvent.setup();
    render(<TrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Eliminar serie 1' }));
    expect(screen.getByRole('dialog', { name: 'Eliminar serie' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(mocks.deleteSeries).toHaveBeenCalledWith('record-1');
  });

  it('confirms discarding an empty session', async () => {
    const user = userEvent.setup();
    mocks.useTrainingSession.mockReturnValue({ data: activeSession(), isLoading: false, isError: false });
    render(<TrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Descartar' }));
    const dialog = screen.getByRole('dialog', { name: 'Descartar sesión' });
    await user.click(within(dialog).getByRole('button', { name: 'Descartar' }));

    expect(mocks.discard).toHaveBeenCalledOnce();
  });

  it('cancels destructive dialogs without calling their APIs', async () => {
    const user = userEvent.setup();
    render(<TrainingSessionPage />);

    await user.click(screen.getByRole('button', { name: 'Eliminar serie 1' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Eliminar serie' })).getByRole('button', { name: 'Cancelar' }));

    expect(mocks.deleteSeries).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Eliminar serie' })).not.toBeInTheDocument();
  });

  it('renders a completed session without mutation controls', () => {
    mocks.useTrainingSession.mockReturnValue({
      data: { ...sessionWithSeries, status: 'COMPLETED', completedAt: '2026-07-01T11:00:00.000Z' },
      isLoading: false,
      isError: false,
    });
    render(<TrainingSessionPage />);

    expect(screen.getByText('Finalizada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Añadir serie' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Finalizar' })).not.toBeInTheDocument();
  });

  it('renders loading and error states', () => {
    mocks.useTrainingSession.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const loading = render(<TrainingSessionPage />);
    expect(screen.getByText('Cargando sesión...')).toBeInTheDocument();
    loading.unmount();

    mocks.useTrainingSession.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    const failed = render(<TrainingSessionPage />);
    expect(screen.getByText('No se pudo cargar la sesión')).toBeInTheDocument();

    mocks.useTrainingSession.mockReturnValue({ data: sessionWithSeries, isLoading: false, isError: false });
    failed.rerender(<TrainingSessionPage />);
    expect(screen.getByText('Alex Molina')).toBeInTheDocument();
    expect(screen.queryByText('No se pudo cargar la sesión')).not.toBeInTheDocument();
  });
});
