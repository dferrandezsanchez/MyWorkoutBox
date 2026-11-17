import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Exercise, ExerciseLibraryImportResult } from '@shared/types/api';
import ExercisesAdminPage from './ExercisesAdminPage';

const mocks = vi.hoisted(() => ({
  useExercises: vi.fn(),
  createAsync: vi.fn(),
  updateAsync: vi.fn(),
  statusMutate: vi.fn(),
}));

vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/exercises/hooks/useExercises', () => ({
  useExercises: mocks.useExercises,
  useCreateExercise: () => ({ mutateAsync: mocks.createAsync }),
  useUpdateExercise: () => ({ mutateAsync: mocks.updateAsync }),
  useSetExerciseStatus: () => ({ mutate: mocks.statusMutate }),
}));
vi.mock('@features/exercises/components/ExerciseLibraryDialog', () => ({
  ExerciseLibraryDialog: ({ onClose, onImported }: { onClose: () => void; onImported: (result: ExerciseLibraryImportResult) => void }) => (
    <div role="dialog" aria-label="Biblioteca simulada">
      <button onClick={() => onImported({ created: 3, reactivated: 1, skipped: 0 })}>Importar simulado</button>
      <button onClick={() => onImported({ created: 1, reactivated: 0, skipped: 0 })}>Importar uno</button>
      <button onClick={() => onImported({ created: 0, reactivated: 0, skipped: 2 })}>Importar nada</button>
      <button onClick={onClose}>Cerrar biblioteca</button>
    </div>
  ),
}));

function exercise(id: string, name: string, muscleGroup: string | null, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id, name, category: 'strength', movementPattern: 'push', evaluationType: 'weight_reps', improvementDirection: 'higher', defaultUnit: 'kg',
    measurementFields: '[{"key":"value"},{"key":"repetitions"}]', variantGroups: '[]', muscleGroup, status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

const catalog = [
  exercise('1', 'Sentadilla', 'legs'),
  exercise('2', 'Press banca', 'chest'),
  exercise('3', 'Mi ejercicio', null),
  exercise('4', 'Zancadas', 'legs', { status: 'INACTIVE' }),
];

describe('ExercisesAdminPage', () => {
  beforeEach(() => {
    mocks.useExercises.mockReturnValue({ data: catalog, isLoading: false, isError: false });
    mocks.createAsync.mockReset();
    mocks.updateAsync.mockReset();
    mocks.statusMutate.mockReset();
  });

  it('groups the catalog by muscle group, leaving ungrouped exercises last', () => {
    render(<ExercisesAdminPage />);

    const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toEqual(expect.arrayContaining(['Pecho', 'Piernas', 'Sin grupo']));
    expect(headings.indexOf('Pecho')).toBeLessThan(headings.indexOf('Piernas'));
    expect(headings.indexOf('Piernas')).toBeLessThan(headings.indexOf('Sin grupo'));
    expect(screen.getByText('2 ejercicios')).toBeInTheDocument();
    expect(screen.getByText('4', { selector: 'strong' })).toBeInTheDocument();
  });

  it('searches by name across groups', async () => {
    const user = userEvent.setup();
    render(<ExercisesAdminPage />);

    await user.type(screen.getByPlaceholderText('Buscar ejercicio'), 'press');
    expect(screen.getByText('Press banca')).toBeInTheDocument();
    expect(screen.queryByText('Sentadilla')).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Buscar ejercicio'));
    await user.type(screen.getByPlaceholderText('Buscar ejercicio'), 'nada');
    expect(screen.getByText('No encontramos ejercicios con ese nombre')).toBeInTheDocument();
  });

  it('opens the library and reports what was added', async () => {
    const user = userEvent.setup();
    render(<ExercisesAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Añadir desde la biblioteca' }));
    await user.click(screen.getByRole('button', { name: 'Importar simulado' }));
    expect(screen.getByRole('status')).toHaveTextContent('Se añadieron 3 ejercicios y se reactivó 1.');
    await user.click(screen.getByRole('button', { name: 'Importar uno' }));
    expect(screen.getByRole('status')).toHaveTextContent('Se añadió 1 ejercicio.');
    await user.click(screen.getByRole('button', { name: 'Importar nada' }));
    expect(screen.getByRole('status')).toHaveTextContent('Ya tenías esos ejercicios: no se ha cambiado nada.');

    await user.click(screen.getByRole('button', { name: 'Cerrar biblioteca' }));
    expect(screen.queryByRole('dialog', { name: 'Biblioteca simulada' })).not.toBeInTheDocument();
  });

  it('points a center with no exercises to the library', async () => {
    mocks.useExercises.mockReturnValue({ data: [], isLoading: false, isError: false });
    const user = userEvent.setup();
    render(<ExercisesAdminPage />);

    expect(screen.getByText('Aún no hay ejercicios')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Añadir desde la biblioteca' });
    await user.click(buttons[buttons.length - 1]);
    expect(screen.getByRole('dialog', { name: 'Biblioteca simulada' })).toBeInTheDocument();
  });

  it('edits and toggles exercises from the grouped list', async () => {
    mocks.updateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ExercisesAdminPage />);

    const legs = within(screen.getByRole('heading', { name: 'Piernas' }).closest('section')!);
    await user.click(legs.getByRole('button', { name: 'Desactivar Sentadilla' }));
    expect(mocks.statusMutate).toHaveBeenCalledWith({ id: '1', status: 'INACTIVE' });
    await user.click(legs.getByRole('button', { name: 'Activar Zancadas' }));
    expect(mocks.statusMutate).toHaveBeenCalledWith({ id: '4', status: 'ACTIVE' });

    await user.click(legs.getByRole('button', { name: 'Editar Sentadilla' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar ejercicio' });
    expect(within(dialog).getByLabelText('Grupo muscular')).toHaveValue('legs');
    await user.selectOptions(within(dialog).getByLabelText('Grupo muscular'), 'glutes');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(mocks.updateAsync).toHaveBeenCalledWith({ id: '1', data: expect.objectContaining({ muscleGroup: 'glutes', name: 'Sentadilla' }) });
  });

  it('creates an exercise with a muscle group', async () => {
    mocks.createAsync.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ExercisesAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Nuevo ejercicio' }));
    const dialog = screen.getByRole('dialog', { name: 'Crear ejercicio' });
    await user.type(within(dialog).getByLabelText('Nombre'), 'Press Arnold');
    await user.selectOptions(within(dialog).getByLabelText('Grupo muscular'), 'shoulders');
    await user.click(within(dialog).getByRole('button', { name: 'Crear' }));

    expect(mocks.createAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Press Arnold', muscleGroup: 'shoulders' }));
  });

  it('shows loading and error states', () => {
    mocks.useExercises.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { unmount } = render(<ExercisesAdminPage />);
    expect(screen.getByText('Cargando ejercicios...')).toBeInTheDocument();
    unmount();

    mocks.useExercises.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ExercisesAdminPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar ejercicios');
  });
});
