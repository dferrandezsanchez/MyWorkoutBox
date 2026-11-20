import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { exerciseFixture, routineFixture } from '@features/routines/test-fixtures';
import { RoutineEditorForm } from './RoutineEditorForm';

const squat = exerciseFixture('ex-1', 'Sentadilla', { muscleGroup: 'legs' });
const bench = exerciseFixture('ex-2', 'Press banca', { muscleGroup: 'chest' });
const row = exerciseFixture('ex-3', 'Remo', { muscleGroup: 'back' });
const archived = exerciseFixture('ex-4', 'Zancadas', { status: 'INACTIVE' });
const catalog = [squat, bench, row, archived];

function listedNames() {
  const list = screen.getByRole('list', { name: 'Ejercicios de la rutina' });
  return within(list).getAllByRole('listitem').map((item) => item.querySelector('.truncate')?.textContent);
}

describe('RoutineEditorForm', () => {
  it('adds exercises from the picker, reorders them and saves the ordered payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);
    render(<RoutineEditorForm exercises={catalog} onSubmit={onSubmit} submitLabel="Crear rutina" />);

    await user.type(screen.getByPlaceholderText('Ej. Rutina A · Empuje'), '  Rutina A  ');
    await user.click(screen.getByRole('button', { name: 'Añadir ejercicio' }));
    const picker = screen.getByRole('dialog', { name: 'Añadir ejercicio a la rutina' });
    expect(within(picker).queryByRole('button', { name: 'Añadir Zancadas' })).not.toBeInTheDocument();
    await user.click(within(picker).getByRole('button', { name: 'Añadir Sentadilla' }));

    await user.click(screen.getByRole('button', { name: 'Añadir ejercicio' }));
    await user.type(screen.getByPlaceholderText('Buscar ejercicio'), 'press');
    expect(screen.queryByRole('button', { name: 'Añadir Sentadilla' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Añadir Press banca' }));

    expect(listedNames()).toEqual(['Sentadilla', 'Press banca']);
    await user.click(screen.getByRole('button', { name: 'Subir Press banca' }));
    expect(listedNames()).toEqual(['Press banca', 'Sentadilla']);

    await user.type(screen.getByRole('textbox', { name: 'Series de Press banca' }), '4x');
    await user.type(screen.getByRole('textbox', { name: 'Repeticiones de Press banca' }), '8-10');
    await user.click(screen.getByRole('button', { name: 'Crear rutina' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Rutina A',
      notes: null,
      exercises: [
        { exerciseId: 'ex-2', targetSets: 4, targetReps: '8-10', notes: null },
        { exerciseId: 'ex-1', targetSets: null, targetReps: null, notes: null },
      ],
    });
  });

  it('edits an existing routine: remove and move down', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);
    const initial = routineFixture('tpl-1', 'Rutina B', [squat, bench, row], { notes: 'Calentar 10 min' });
    initial.exercises[0].targetSets = 3;
    render(<RoutineEditorForm initial={initial} exercises={catalog} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Bajar Sentadilla' }));
    await user.click(screen.getByRole('button', { name: 'Quitar Remo' }));
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Rutina B',
      notes: 'Calentar 10 min',
      exercises: [
        { exerciseId: 'ex-2', targetSets: null, targetReps: null, notes: null },
        { exerciseId: 'ex-1', targetSets: 3, targetReps: null, notes: null },
      ],
    });
  });

  it('validates name, exercises, archived exercises and target sets', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);
    const { unmount } = render(<RoutineEditorForm exercises={catalog} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pon un nombre a la rutina');
    await user.type(screen.getByPlaceholderText('Ej. Rutina A · Empuje'), 'Rutina C');
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Añade al menos un ejercicio');
    unmount();

    render(<RoutineEditorForm initial={routineFixture('tpl-2', 'Vieja', [archived, squat])} exercises={catalog} onSubmit={onSubmit} />);
    expect(screen.getByText('Ejercicio archivado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Quita los ejercicios archivados');
    await user.click(screen.getByRole('button', { name: 'Quitar Zancadas' }));
    await user.type(screen.getByRole('textbox', { name: 'Series de Sentadilla' }), '25');
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));
    expect(screen.getByRole('alert')).toHaveTextContent('entre 1 y 20');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the API error when saving fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw Object.assign(new Error('fail'), { response: { data: { error: 'No tienes permiso para gestionar rutinas' } } });
    });
    render(<RoutineEditorForm initial={routineFixture('tpl-1', 'Rutina A', [squat])} exercises={catalog} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para gestionar rutinas');
  });

  it('renders a read-only ordered list with targets', () => {
    const initial = routineFixture('tpl-1', 'Rutina A', [squat, bench], { notes: 'Técnica primero' });
    initial.exercises[1].targetSets = 4;
    initial.exercises[1].targetReps = '6-8';
    render(<RoutineEditorForm initial={initial} exercises={[]} readOnly onSubmit={vi.fn()} />);

    expect(screen.getByText('Técnica primero')).toBeInTheDocument();
    expect(screen.getByText('4 × 6-8')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
