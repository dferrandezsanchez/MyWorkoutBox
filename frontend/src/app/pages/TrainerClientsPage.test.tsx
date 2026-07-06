import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client } from '@shared/types/api';
import TrainerClientsPage from './TrainerClientsPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  useClients: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/clients/hooks/useClients', () => ({ useClients: mocks.useClients }));

const clientA: Client = {
  id: 'client-1',
  firstName: 'Alex',
  lastName: 'Molina',
  birthDate: '1990-01-01',
  height: 178,
  weight: 78.5,
  notes: '',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const clientB: Client = {
  ...clientA,
  id: 'client-2',
  firstName: 'Marta',
  lastName: 'Ruiz',
};

describe('TrainerClientsPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.useClients.mockReturnValue({ data: [clientA, clientB], isLoading: false, isError: false });
  });

  it('lists every active client, not just recently worked-with ones', () => {
    render(<TrainerClientsPage />);

    expect(screen.getByRole('button', { name: /Alex Molina/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marta Ruiz/ })).toBeInTheDocument();
  });

  it('filters the list as the trainer searches', async () => {
    const user = userEvent.setup();
    render(<TrainerClientsPage />);

    await user.type(screen.getByPlaceholderText('Buscar cliente'), 'Marta');

    expect(screen.queryByRole('button', { name: /Alex Molina/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marta Ruiz/ })).toBeInTheDocument();
  });

  it('navigates straight to the client profile without starting a session', async () => {
    const user = userEvent.setup();
    render(<TrainerClientsPage />);

    await user.click(screen.getByRole('button', { name: /Alex Molina/ }));

    expect(mocks.navigate).toHaveBeenCalledWith('/clients/client-1');
  });

  it('returns to the trainer home', async () => {
    const user = userEvent.setup();
    render(<TrainerClientsPage />);

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(mocks.navigate).toHaveBeenCalledWith('/trainer');
  });

  it('shows an empty state when no client matches the search', async () => {
    const user = userEvent.setup();
    render(<TrainerClientsPage />);

    await user.type(screen.getByPlaceholderText('Buscar cliente'), 'Nadie');

    expect(screen.getByText('No se encontraron clientes')).toBeInTheDocument();
  });
});
