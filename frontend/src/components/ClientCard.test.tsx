import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { Client } from '../types/api';
import ClientCard from './ClientCard';

const client: Client = {
  id: 'client-1',
  firstName: 'Ana',
  lastName: 'Lopez',
  birthDate: '1990-01-01T00:00:00.000Z',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('ClientCard', () => {
  it('navigates to the client profile when clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ClientCard client={client} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver perfil de Ana Lopez' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/clients/client-1');
  });
});
