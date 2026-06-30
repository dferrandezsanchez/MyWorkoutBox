import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PerformanceForm from '@features/performances/components/PerformanceForm';

const onSave = vi.fn(async () => undefined);

describe('PerformanceForm', () => {
  beforeEach(() => {
    onSave.mockClear();
  });

  it('disables submit while the required value is empty', () => {
    render(<PerformanceForm onSave={onSave} onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('enables submit when the required value has content', async () => {
    render(<PerformanceForm onSave={onSave} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/Repeticiones/), '100');

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('submits structured fields, variants and notes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <PerformanceForm
        exerciseName="Peso muerto"
        exercise={{
          id: 'exercise-1',
          name: 'Peso muerto',
          category: 'strength',
          movementPattern: 'hinge',
          evaluationType: 'weight_reps',
          improvementDirection: 'higher',
          defaultUnit: 'kg',
          measurementFields: JSON.stringify([
            { key: 'value', label: 'Peso', unit: 'kg', required: true, primary: true },
            { key: 'repetitions', label: 'Repeticiones', unit: 'repetitions', required: false },
            { key: 'duration', label: 'Tiempo', unit: 'seconds', required: false },
            { key: 'distance', label: 'Distancia', unit: 'meters', required: false },
          ]),
          variantGroups: JSON.stringify([
            { key: 'variante', label: 'Variante', options: ['Convencional', 'Sumo'], required: true },
          ]),
          description: undefined,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }}
        onClose={onClose}
        onSave={onSave}
      />,
    );

    await user.type(screen.getByLabelText(/Peso/), '120');
    await user.type(screen.getByLabelText(/Repeticiones/), '5');
    await user.type(screen.getByLabelText(/Tiempo/), '60');
    await user.type(screen.getByLabelText(/Distancia/), '10');
    await user.click(screen.getByRole('button', { name: 'Sumo' }));
    await user.clear(screen.getByLabelText('Fecha'));
    await user.type(screen.getByLabelText('Fecha'), '2026-06-30');
    await user.type(screen.getByLabelText('Notas'), 'RPE 8');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 120,
        unit: 'kg',
        date: '2026-06-30',
        repetitions: 5,
        weight: 120,
        duration: 60,
        distance: 10,
        notes: 'RPE 8',
        variants: { variante: 'Sumo' },
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('keeps the form open and reports save failures', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const failingSave = vi.fn(async () => Promise.reject(new Error('failed')));
    render(<PerformanceForm onSave={failingSave} onClose={onClose} />);

    await user.type(screen.getByLabelText(/Repeticiones/), '8');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar la serie');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes from overlay, cancel button and escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PerformanceForm onSave={onSave} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('falls back gracefully when exercise JSON config is invalid', async () => {
    render(
      <PerformanceForm
        exerciseName="Dominadas"
        exercise={{
          id: 'exercise-1',
          name: 'Dominadas',
          category: 'strength',
          movementPattern: 'pull',
          evaluationType: 'repetitions',
          improvementDirection: 'higher',
          defaultUnit: 'repetitions',
          measurementFields: 'not-json',
          variantGroups: 'not-json',
          description: undefined,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.getByLabelText(/Repeticiones/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prono' })).toBeInTheDocument();
  });
});
