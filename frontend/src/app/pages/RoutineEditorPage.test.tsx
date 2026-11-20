import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exerciseFixture, routineFixture } from '@features/routines/test-fixtures';
import RoutineEditorPage from './RoutineEditorPage';

const mocks = vi.hoisted(() => ({
  useRoutine: vi.fn(),
  canManage: vi.fn(),
  save: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/exercises/hooks/useExercises', () => ({
  useExercises: () => ({ data: [squat], isLoading: false }),
}));
vi.mock('@features/routines/hooks/useRoutines', () => ({
  useRoutine: mocks.useRoutine,
  useCanManageRoutines: mocks.canManage,
  useSaveRoutine: () => ({ mutateAsync: mocks.save }),
  useSetRoutineStatus: () => ({ mutateAsync: mocks.setStatus, isPending: false }),
}));

const squat = exerciseFixture('ex-1', 'Sentadilla');
const routine = routineFixture('tpl-a', 'Rutina A', [squat]);

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/routines/new" element={<RoutineEditorPage />} />
        <Route path="/routines/:id" element={<RoutineEditorPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoutineEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canManage.mockReturnValue(true);
    mocks.useRoutine.mockImplementation((id: string) => (id
      ? { data: routine, isLoading: false, isError: false }
      : { data: undefined, isLoading: false, isError: false }));
    mocks.save.mockResolvedValue(routine);
    mocks.setStatus.mockResolvedValue({ ...routine, status: 'INACTIVE' });
  });

  it('creates a routine and returns to the list keeping the mode', async () => {
    const user = userEvent.setup();
    renderAt('/routines/new?mode=admin');
    await user.type(screen.getByPlaceholderText('Ej. Rutina A · Empuje'), 'Rutina nueva');
    await user.click(screen.getByRole('button', { name: 'Añadir ejercicio' }));
    await user.click(screen.getByRole('button', { name: 'Añadir Sentadilla' }));
    await user.click(screen.getByRole('button', { name: 'Crear rutina' }));

    expect(mocks.save).toHaveBeenCalledWith({
      id: undefined,
      data: { name: 'Rutina nueva', notes: null, exercises: [{ exerciseId: 'ex-1', targetSets: null, targetReps: null, notes: null }] },
    });
    expect(await screen.findByTestId('location')).toHaveTextContent('/routines?mode=admin');
  });

  it('archives an existing routine after confirmation', async () => {
    const user = userEvent.setup();
    renderAt('/routines/tpl-a');
    await user.click(screen.getByRole('button', { name: 'Archivar' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archivar' }));
    expect(mocks.setStatus).toHaveBeenCalledWith({ id: 'tpl-a', status: 'INACTIVE' });
  });

  it('restores archived routines', async () => {
    mocks.useRoutine.mockReturnValue({ data: { ...routine, status: 'INACTIVE' }, isLoading: false, isError: false });
    const user = userEvent.setup();
    renderAt('/routines/tpl-a');
    expect(screen.getByText('Rutina archivada')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(mocks.setStatus).toHaveBeenCalledWith({ id: 'tpl-a', status: 'ACTIVE' });
  });

  it('is read-only for staff without routine permission', () => {
    mocks.canManage.mockReturnValue(false);
    renderAt('/routines/tpl-a');
    expect(screen.getByRole('heading', { name: 'Rutina A' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument();
    expect(screen.getByText('Sentadilla')).toBeInTheDocument();
  });

  it('blocks creation without permission and reports load errors', () => {
    mocks.canManage.mockReturnValue(false);
    const { unmount } = renderAt('/routines/new');
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso para crear rutinas');
    unmount();

    mocks.canManage.mockReturnValue(true);
    mocks.useRoutine.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderAt('/routines/missing');
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la rutina');
  });
});
