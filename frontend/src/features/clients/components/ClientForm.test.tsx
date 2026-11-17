import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ClientForm from './ClientForm';

const tenantState = vi.hoisted(() => ({ measurementsEnabled: true }));
vi.mock('@shared/tenant/useActiveTenant', () => ({
  useActiveTenant: () => ({ tenant: { id: 't1', organizationId: 'o1', name: 'Box', slug: 'box', measurementsEnabled: tenantState.measurementsEnabled } }),
}));

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'Lucía');
  await user.type(screen.getByLabelText('Apellidos'), 'Pérez');
}

describe('ClientForm', () => {
  it('creates a client with goal and an optional first measurement', async () => {
    tenantState.measurementsEnabled = true;
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClientForm onSubmit={onSubmit} submitLabel="Crear" allowInitialMeasurement />);

    await fillBasics(user);
    await user.type(screen.getByLabelText('Motivo y meta'), 'Correr la San Silvestre');
    await user.click(screen.getByRole('button', { name: /Primera medición/ }));
    await user.type(screen.getByLabelText('Peso (kg)'), '64,5');
    await user.type(screen.getByLabelText('Grasa (%)'), '24');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      firstName: 'Lucía',
      goal: 'Correr la San Silvestre',
      goalDate: null,
      initialMeasurement: expect.objectContaining({ weight: 64.5, bodyFatPercentage: 24, muscleMass: null }),
    }));
  });

  it('skips the first measurement when it is empty', async () => {
    tenantState.measurementsEnabled = true;
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClientForm onSubmit={onSubmit} submitLabel="Crear" allowInitialMeasurement />);

    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('initialMeasurement');
  });

  it('hides goal and measurements when the center does not use them', async () => {
    tenantState.measurementsEnabled = false;
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClientForm onSubmit={onSubmit} submitLabel="Crear" allowInitialMeasurement />);

    expect(screen.queryByLabelText('Motivo y meta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Primera medición/ })).not.toBeInTheDocument();
    await fillBasics(user);
    await user.click(screen.getByRole('button', { name: 'Crear' }));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('goal');
  });

  it('edits every field, including status, dates and muscle mass', async () => {
    tenantState.measurementsEnabled = true;
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <ClientForm
        initial={{ firstName: 'Ana', lastName: 'Ruiz', birthDate: '1991-04-12T00:00:00.000Z', goal: 'Boda', goalDate: '2027-06-12T12:00:00.000Z' }}
        onSubmit={onSubmit}
        showStatus
        allowInitialMeasurement
      />,
    );

    expect(screen.getByLabelText('Motivo y meta')).toHaveValue('Boda');
    expect(screen.getByLabelText('Fecha objetivo')).toHaveValue('2027-06-12');
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), { target: { value: '1992-05-01' } });
    await user.type(screen.getByLabelText('Altura (cm)'), '168');
    fireEvent.change(screen.getByLabelText('Fecha objetivo'), { target: { value: '2027-07-01' } });
    await user.selectOptions(screen.getByLabelText('Estado'), 'INACTIVE');
    await user.type(screen.getByLabelText('Notas'), 'Rodilla izquierda');
    await user.click(screen.getByRole('button', { name: /Primera medición/ }));
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-10' } });
    await user.type(screen.getByLabelText('Músculo (kg)'), '29,8');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      birthDate: '1992-05-01',
      height: 168,
      status: 'INACTIVE',
      notes: 'Rodilla izquierda',
      goalDate: '2027-07-01',
      initialMeasurement: expect.objectContaining({ measuredAt: '2026-11-10', muscleMass: 29.8 }),
    }));
  });
});
