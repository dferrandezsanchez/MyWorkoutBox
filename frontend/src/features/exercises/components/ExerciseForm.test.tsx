import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ExerciseForm from './ExerciseForm';

function lastSubmit(onSubmit: ReturnType<typeof vi.fn>) {
  return onSubmit.mock.calls.at(-1)![0];
}

describe('ExerciseForm', () => {
  it('creates an exercise with its muscle group and the preset of the chosen evaluation', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ExerciseForm onSubmit={onSubmit} submitLabel="Crear" />);

    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled();
    await user.type(screen.getByLabelText('Nombre'), '  Press Arnold  ');
    await user.selectOptions(screen.getByLabelText('Grupo muscular'), 'shoulders');
    await user.click(screen.getByRole('button', { name: /Peso \+ reps/ }));
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(lastSubmit(onSubmit)).toMatchObject({
      name: 'Press Arnold',
      muscleGroup: 'shoulders',
      evaluationType: 'weight_reps',
      defaultUnit: 'kg',
      improvementDirection: 'higher',
      measurementFields: [expect.objectContaining({ key: 'value' }), expect.objectContaining({ key: 'repetitions' })],
    });
  });

  it('treats "Sin grupo" as no muscle group', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ExerciseForm initial={{ name: 'Mío', muscleGroup: 'chest' }} onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Grupo muscular')).toHaveValue('chest');
    await user.selectOptions(screen.getByLabelText('Grupo muscular'), '');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(lastSubmit(onSubmit).muscleGroup).toBeNull();
  });

  it('adds and removes optional measurement fields, but never the main value', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ExerciseForm initial={{ name: 'Carrera' }} onSubmit={onSubmit} />);

    expect(screen.getByRole('checkbox', { name: /Valor principal/ })).toBeDisabled();
    // The default preset already asks for the extra weight: turn it off and ask for distance instead.
    await user.click(screen.getByRole('checkbox', { name: /Distancia/ }));
    await user.click(screen.getByRole('checkbox', { name: /^Peso/ }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    const keys = lastSubmit(onSubmit).measurementFields.map((field: { key: string }) => field.key);
    expect(keys).toEqual(['value', 'distance']);
  });

  it('manages variant groups and drops the incomplete ones', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ExerciseForm initial={{ name: 'Dominadas' }} onSubmit={onSubmit} />);

    expect(screen.getByText(/Añade variantes como agarre/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Añadir' }));
    await user.clear(screen.getByLabelText('Nombre', { selector: '#variant-label-0' }));
    await user.type(screen.getByLabelText('Nombre', { selector: '#variant-label-0' }), 'Agarre amplio');
    expect(screen.getByLabelText('Nombre', { selector: '#variant-label-0' })).toHaveValue('Agarre amplio');
    await user.type(screen.getByLabelText('Opciones'), 'Prono, Supino, ,Neutro');

    await user.click(screen.getByRole('button', { name: 'Añadir' }));
    await user.click(screen.getAllByRole('button', { name: 'Eliminar variante' })[1]);
    await user.click(screen.getByRole('button', { name: 'Añadir' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(lastSubmit(onSubmit).variantGroups).toEqual([
      { key: 'agarre_amplio', label: 'Agarre amplio', options: ['Prono', 'Supino', 'Neutro'], required: false },
    ]);

    await user.click(screen.getAllByRole('button', { name: 'Eliminar variante' })[0]);
    expect(screen.getAllByRole('button', { name: 'Eliminar variante' })).toHaveLength(1);
  });

  it('keeps the existing definition when editing and exposes status and comparison', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ExerciseForm
        initial={{
          name: 'Carrera', category: 'endurance', evaluationType: 'time_to_complete', improvementDirection: 'lower', defaultUnit: 'seconds',
          measurementFields: JSON.stringify([{ key: 'value', label: 'Tiempo', unit: 'seconds', required: true, primary: true }]),
          variantGroups: JSON.stringify([{ key: 'distancia', label: 'Distancia', options: ['1 km'], required: false }]),
          description: 'Tiempo en una distancia.', status: 'ACTIVE',
        }}
        onSubmit={onSubmit}
        showStatus
      />,
    );

    expect(screen.getByLabelText('Comparación de marca')).toHaveValue('lower');
    expect(screen.getByLabelText('Descripción')).toHaveValue('Tiempo en una distancia.');
    await user.selectOptions(screen.getByLabelText('Estado'), 'INACTIVE');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'functional');
    await user.selectOptions(screen.getByLabelText('Patrón de movimiento'), 'conditioning');
    await user.selectOptions(screen.getByLabelText('Unidad principal'), 'minutes');
    await user.selectOptions(screen.getByLabelText('Comparación de marca'), 'higher');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(lastSubmit(onSubmit)).toMatchObject({
      status: 'INACTIVE', category: 'functional', movementPattern: 'conditioning', defaultUnit: 'minutes', improvementDirection: 'higher',
      variantGroups: [expect.objectContaining({ key: 'distancia', options: ['1 km'] })],
    });
  });
});
