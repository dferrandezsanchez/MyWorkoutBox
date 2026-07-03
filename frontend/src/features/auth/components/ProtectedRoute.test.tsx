import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { removeToken, setToken } from '@features/auth/model/auth-store';
import ProtectedRoute from './ProtectedRoute';

function createToken(role: 'ADMIN' | 'TRAINER'): string {
  const payload = {
    sub: 'user-1',
    tenantId: 'tenant-1',
    organizationId: 'org-1',
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('ProtectedRoute role redirects', () => {
  afterEach(() => removeToken());

  it('returns a trainer to trainer mode when admin access is denied', () => {
    setToken(createToken('TRAINER'));

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            <Route path="/admin" element={<div>Administración</div>} />
          </Route>
          <Route path="/trainer" element={<div>Modo entrenador</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Modo entrenador')).toBeInTheDocument();
    expect(screen.queryByText('Administración')).not.toBeInTheDocument();
  });
});
