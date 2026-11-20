import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientMeasurement } from '@shared/types/api';
import { MeasurementsSection } from './MeasurementsSection';

const mocks = vi.hoisted(() => ({
  useMeasurements: vi.fn(),
  saveAsync: vi.fn(),
  deleteMutate: vi.fn(),
}));

vi.mock('@features/measurements/hooks/useMeasurements', () => ({
  useMeasurements: mocks.useMeasurements,
  useSaveMeasurement: () => ({ mutateAsync: mocks.saveAsync }),
  useDeleteMeasurement: () => ({ mutate: mocks.deleteMutate, isPending: false }),
}));

function measurement(id: string, measuredAt: string, values: Partial<ClientMeasurement>): ClientMeasurement {
  return { id, clientId: 'c1', measuredAt: `${measuredAt}T12:00:00.000Z`, weight: null, bodyFatPercentage: null, muscleMass: null, notes: null, createdAt: '', updatedAt: '', ...values };
}

const history = [
  measurement('m3', '2026-11-17', { weight: 78.1, muscleMass: 33.2, notes: 'Báscula del box' }),
  measurement('m2', '2026-11-03', { weight: 78.5, bodyFatPercentage: 14.2, muscleMass: 33 }),
  measurement('m1', '2026-10-20', { weight: 79.4, bodyFatPercentage: 14.6, muscleMass: 32.8 }),
  measurement('m0', '2026-10-06', { weight: 79.9, bodyFatPercentage: 15, muscleMass: 32.6 }),
  measurement('mx', '2026-09-22', { weight: 80.3 }),
];

describe('MeasurementsSection', () => {
  beforeEach(() => {
    mocks.useMeasurements.mockReturnValue({ data: history, isLoading: false, isError: false });
    mocks.saveAsync.mockReset();
    mocks.deleteMutate.mockReset();
  });

  it('summarizes the latest values with their change and draws the evolution', () => {
    const { container } = render(<MeasurementsSection clientId="c1" clientName="Alex Molina" goalDate="2027-03-17T12:00:00.000Z" />);

    const summary = within(container.querySelector('dl')!);
    expect(summary.getByText('78,1 kg')).toBeInTheDocument();
    expect(summary.getByText('14,2 %')).toBeInTheDocument();
    expect(summary.getAllByText('−0,4')).toHaveLength(2);
    expect(screen.getByRole('img', { name: /Peso: de 80,3 kg .* a 78,1 kg .* fecha objetivo 17 mar 2027/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Grasa' })).toHaveAttribute('aria-selected', 'false');
  });

  it('shows a short history that expands', async () => {
    const user = userEvent.setup();
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);

    expect(screen.getAllByRole('button', { name: /Editar medición/ })).toHaveLength(4);
    expect(screen.getByText('Báscula del box')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver las 5 mediciones' }));
    expect(screen.getAllByRole('button', { name: /Editar medición/ })).toHaveLength(5);
  });

  it('adds a measurement with decimal commas', async () => {
    mocks.saveAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);

    await user.click(screen.getByRole('button', { name: /Añadir\s*medición/ }));
    const dialog = screen.getByRole('dialog', { name: 'Nueva medición' });
    await user.type(within(dialog).getByLabelText('Peso'), '77,9');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(mocks.saveAsync).toHaveBeenCalledWith({
      id: undefined,
      data: expect.objectContaining({ weight: 77.9, bodyFatPercentage: null, muscleMass: null, notes: null }),
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('validates the form before saving and shows server errors', async () => {
    mocks.saveAsync.mockRejectedValueOnce(new Error('network'));
    const user = userEvent.setup();
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);

    await user.click(screen.getByRole('button', { name: /Editar medición del 17 nov 2026/ }));
    const dialog = screen.getByRole('dialog', { name: 'Editar medición' });
    expect(within(dialog).getByLabelText('Peso')).toHaveValue('78,1');

    for (const label of ['Peso', 'Músculo']) await user.clear(within(dialog).getByLabelText(label));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Indica al menos');

    await user.type(within(dialog).getByLabelText('Peso'), 'abc');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Revisa los valores');

    await user.clear(within(dialog).getByLabelText('Peso'));
    await user.type(within(dialog).getByLabelText('Peso'), '78');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('No se pudo guardar la medición.');
    expect(mocks.saveAsync).toHaveBeenCalledWith({ id: 'm3', data: expect.objectContaining({ weight: 78 }) });
  });

  it('confirms before deleting', async () => {
    const user = userEvent.setup();
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);

    await user.click(screen.getByRole('button', { name: /Borrar medición del 3 nov 2026/ }));
    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    expect(mocks.deleteMutate).toHaveBeenCalledWith('m2', expect.any(Object));
  });

  it('shows empty, loading and error states', () => {
    mocks.useMeasurements.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { unmount } = render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);
    expect(screen.getByText('Sin mediciones todavía')).toBeInTheDocument();
    unmount();

    mocks.useMeasurements.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las mediciones.');
  });

  it('switches the plotted metric and adapts to the container width', () => {
    let resize: (() => void) | undefined;
    class FakeResizeObserver {
      constructor(callback: () => void) { resize = callback; }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);

    fireEvent.click(screen.getByRole('tab', { name: 'Grasa' }));
    expect(screen.getByRole('tab', { name: 'Grasa' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('img', { name: /Grasa corporal: de 15 % .* a 14,2 %/ })).toBeInTheDocument();
    act(() => resize?.());
  });

  it('saves the date and notes and surfaces the API message', async () => {
    mocks.saveAsync.mockRejectedValueOnce(
      new AxiosError('Bad Request', '400', undefined, undefined, {
        status: 400, statusText: 'Bad Request', headers: {}, config: { headers: new AxiosHeaders() },
        data: { error: 'La fecha de la medición no puede ser futura' },
      }),
    );
    const user = userEvent.setup();
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);

    await user.click(screen.getByRole('button', { name: /Añadir\s*medición/ }));
    const dialog = screen.getByRole('dialog', { name: 'Nueva medición' });
    fireEvent.change(within(dialog).getByLabelText('Fecha'), { target: { value: '2026-11-10' } });
    await user.type(within(dialog).getByLabelText('Músculo'), '33,4');
    await user.type(within(dialog).getByLabelText('Notas'), 'En ayunas');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(mocks.saveAsync).toHaveBeenCalledWith({ id: undefined, data: expect.objectContaining({ measuredAt: '2026-11-10', muscleMass: 33.4, notes: 'En ayunas' }) });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('La fecha de la medición no puede ser futura');
  });

  it('can cancel a deletion', async () => {
    const user = userEvent.setup();
    render(<MeasurementsSection clientId="c1" clientName="Alex Molina" />);
    await user.click(screen.getByRole('button', { name: /Borrar medición del 3 nov 2026/ }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(mocks.deleteMutate).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
