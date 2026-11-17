import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client } from '@shared/types/api';
import { ClientGoalCard } from './ClientGoalCard';

const mutateAsync = vi.fn();
vi.mock('@features/clients/hooks/useClients', () => ({
  useUpdateClientGoal: () => ({ mutateAsync, isPending: false }),
}));

const client: Client = {
  id: 'c1', firstName: 'Alex', lastName: 'Molina', birthDate: '1990-01-01', status: 'ACTIVE', createdAt: '', updatedAt: '',
};

describe('ClientGoalCard', () => {
  beforeEach(() => mutateAsync.mockReset());

  it('invites to add a goal and saves it', async () => {
    mutateAsync.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<ClientGoalCard client={client} />);

    await user.click(screen.getByRole('button', { name: /Añadir objetivo/ }));
    await user.type(screen.getByLabelText('Motivo y meta'), '  Boda en junio  ');
    await user.type(screen.getByLabelText(/Fecha objetivo/), '2027-06-12');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mutateAsync).toHaveBeenCalledWith({ goal: 'Boda en junio', goalDate: '2027-06-12' });
  });

  it('shows the goal with its countdown and can remove it', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<ClientGoalCard client={{ ...client, goal: 'Media maratón', goalDate: '2099-03-17T12:00:00.000Z' }} />);

    expect(screen.getByText('Media maratón')).toBeInTheDocument();
    expect(screen.getByText(/Faltan \d+ semanas/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar objetivo' }));
    await user.click(screen.getByRole('button', { name: 'Quitar objetivo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar el objetivo.');
    await user.click(screen.getByRole('button', { name: 'Quitar objetivo' }));
    expect(mutateAsync).toHaveBeenLastCalledWith({ goal: null, goalDate: null });
  });
});
