import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PerformanceForm from '@features/performances/components/PerformanceForm';

vi.mock('../hooks/usePerformances', () => ({
  useCreatePerformance: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('PerformanceForm', () => {
  it('disables submit while the required value is empty', () => {
    render(<PerformanceForm clientId="client-1" exerciseId="exercise-1" onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('enables submit when the required value has content', async () => {
    render(<PerformanceForm clientId="client-1" exerciseId="exercise-1" onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/Repeticiones/), '100');

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });
});
