import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExerciseLibrary, ExerciseLibraryItem } from '@shared/types/api';
import { ExerciseLibraryDialog } from './ExerciseLibraryDialog';

const mocks = vi.hoisted(() => ({ useExerciseLibrary: vi.fn(), importAsync: vi.fn() }));

vi.mock('@features/exercises/hooks/useExercises', () => ({
  useExerciseLibrary: mocks.useExerciseLibrary,
  useImportExerciseLibrary: () => ({ mutateAsync: mocks.importAsync, isPending: false }),
}));

function item(slug: string, name: string, muscleGroup: string, overrides: Partial<ExerciseLibraryItem> = {}): ExerciseLibraryItem {
  return { slug, name, muscleGroup, category: 'strength', evaluationType: 'weight_reps', defaultUnit: 'kg', starter: false, added: false, ...overrides };
}

const library: ExerciseLibrary = {
  groups: [
    { key: 'chest', label: 'Pecho' },
    { key: 'back', label: 'Espalda' },
    { key: 'legs', label: 'Piernas' },
  ],
  exercises: [
    item('press_banca_barra', 'Press banca con barra', 'chest', { starter: true }),
    item('aperturas', 'Aperturas con mancuernas', 'chest'),
    item('dominadas', 'Dominadas', 'back', { added: true, evaluationType: 'repetitions' }),
    item('remo_barra', 'Remo con barra', 'back'),
    item('sentadilla', 'Sentadilla', 'legs'),
  ],
};

function renderDialog() {
  const onClose = vi.fn();
  const onImported = vi.fn();
  render(<ExerciseLibraryDialog onClose={onClose} onImported={onImported} />);
  return { onClose, onImported };
}

describe('ExerciseLibraryDialog', () => {
  beforeEach(() => {
    mocks.useExerciseLibrary.mockReturnValue({ data: library, isLoading: false, isError: false });
    mocks.importAsync.mockReset();
  });

  it('lists the library by muscle group and shows what is already added', () => {
    renderDialog();

    expect(screen.getByText('4 ejercicios disponibles para añadir.')).toBeInTheDocument();
    for (const group of ['Pecho', 'Espalda', 'Piernas']) expect(screen.getByRole('region', { name: group })).toBeInTheDocument();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByText('Ya lo tienes')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Dominadas/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Dominadas/ })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Elige ejercicios para añadir' })).toBeDisabled();
  });

  it('filters by search text and by muscle group', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText('Buscar ejercicio'), 'remo');
    expect(screen.getByText('Remo con barra')).toBeInTheDocument();
    expect(screen.queryByText('Sentadilla')).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Buscar ejercicio'));

    await user.click(screen.getByRole('tab', { name: 'Piernas' }));
    expect(screen.getByRole('tab', { name: 'Piernas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Sentadilla')).toBeInTheDocument();
    expect(screen.queryByText('Aperturas con mancuernas')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Buscar ejercicio'), 'zzz');
    expect(screen.getByText('No encontramos ejercicios con ese nombre')).toBeInTheDocument();
  });

  it('selects single exercises and whole groups, skipping those already added', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('checkbox', { name: /Sentadilla/ }));
    expect(screen.getByRole('button', { name: 'Añadir 1 ejercicio' })).toBeEnabled();

    const chest = within(screen.getByRole('region', { name: 'Pecho' }));
    await user.click(chest.getByRole('button', { name: 'Seleccionar todos (2)' }));
    expect(screen.getByRole('button', { name: 'Añadir 3 ejercicios' })).toBeInTheDocument();
    await user.click(chest.getByRole('button', { name: 'Quitar selección' }));
    expect(screen.getByRole('button', { name: 'Añadir 1 ejercicio' })).toBeInTheDocument();

    // "Espalda" has one pending exercise: the added one does not count.
    expect(within(screen.getByRole('region', { name: 'Espalda' })).getByRole('button', { name: 'Seleccionar todos (1)' })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Sentadilla/ }));
    expect(screen.getByRole('button', { name: 'Elige ejercicios para añadir' })).toBeDisabled();
  });

  it('imports the selection, reports the result and closes', async () => {
    mocks.importAsync.mockResolvedValueOnce({ created: 2, reactivated: 0, skipped: 0 });
    const user = userEvent.setup();
    const { onClose, onImported } = renderDialog();

    await user.click(screen.getByRole('checkbox', { name: /Remo con barra/ }));
    await user.click(screen.getByRole('checkbox', { name: /Sentadilla/ }));
    await user.click(screen.getByRole('button', { name: 'Añadir 2 ejercicios' }));

    expect(mocks.importAsync).toHaveBeenCalledWith(['remo_barra', 'sentadilla']);
    expect(onImported).toHaveBeenCalledWith({ created: 2, reactivated: 0, skipped: 0 });
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open and explains when the import fails', async () => {
    mocks.importAsync
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(
        new AxiosError('Bad', '400', undefined, undefined, {
          status: 400, statusText: 'Bad', headers: {}, config: { headers: new AxiosHeaders() }, data: { error: 'El ejercicio de la biblioteca no existe: x' },
        }),
      );
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole('checkbox', { name: /Sentadilla/ }));
    await user.click(screen.getByRole('button', { name: 'Añadir 1 ejercicio' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron añadir los ejercicios.');
    await user.click(screen.getByRole('button', { name: 'Añadir 1 ejercicio' }));
    expect(await screen.findByText('El ejercicio de la biblioteca no existe: x')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows loading and error states', () => {
    mocks.useExerciseLibrary.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { unmount } = render(<ExerciseLibraryDialog onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.getByText('Cargando biblioteca...')).toBeInTheDocument();
    unmount();

    mocks.useExerciseLibrary.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ExerciseLibraryDialog onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la biblioteca.');
  });
});
