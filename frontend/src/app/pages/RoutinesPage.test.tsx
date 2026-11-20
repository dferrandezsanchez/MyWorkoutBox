import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exerciseFixture, routineFixture } from '@features/routines/test-fixtures';
import RoutinesPage from './RoutinesPage';

const mocks = vi.hoisted(() => ({
  useRoutines: vi.fn(),
  canManage: vi.fn(),
}));

vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/routines/hooks/useRoutines', () => ({
  useRoutines: mocks.useRoutines,
  useCanManageRoutines: mocks.canManage,
}));

const squat = exerciseFixture('ex-1', 'Sentadilla');
const bench = exerciseFixture('ex-2', 'Press banca');
const routines = [
  routineFixture('tpl-a', 'Rutina A · Pierna', [squat, bench]),
  routineFixture('tpl-b', 'Rutina B · Empuje', [bench]),
  routineFixture('tpl-old', 'Rutina vieja', [squat], { status: 'INACTIVE' }),
];

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderPage(path = '/routines') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoutinesPage', () => {
  beforeEach(() => {
    mocks.useRoutines.mockImplementation((includeInactive: boolean) => ({
      data: includeInactive ? routines : routines.filter((routine) => routine.status === 'ACTIVE'),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }));
    mocks.canManage.mockReturnValue(true);
  });

  it('lists active routines as cards with exercise count and preview', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Abrir Rutina A · Pierna' })).toHaveTextContent('2 ejercicios');
    expect(screen.getByText('Sentadilla · Press banca')).toBeInTheDocument();
    expect(screen.queryByText('Rutina vieja')).not.toBeInTheDocument();
  });

  it('lets managers create routines and keeps the admin mode', async () => {
    const user = userEvent.setup();
    renderPage('/routines?mode=admin');
    await user.click(screen.getByRole('button', { name: 'Nueva rutina' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/routines/new?mode=admin');
  });

  it('hides the create action for trainers without permission but lets them open routines', async () => {
    mocks.canManage.mockReturnValue(false);
    const user = userEvent.setup();
    renderPage();
    expect(screen.queryByRole('button', { name: 'Nueva rutina' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abrir Rutina B · Empuje' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/routines/tpl-b');
  });

  it('searches by routine or exercise name and toggles archived routines', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText('Buscar rutina o ejercicio'), 'sentadilla');
    expect(screen.getByText('Rutina A · Pierna')).toBeInTheDocument();
    expect(screen.queryByText('Rutina B · Empuje')).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Buscar rutina o ejercicio'));
    await user.type(screen.getByPlaceholderText('Buscar rutina o ejercicio'), 'zzz');
    expect(screen.getByText('No encontramos rutinas con ese nombre')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Buscar rutina o ejercicio'));

    await user.click(screen.getByRole('button', { name: 'Archivadas' }));
    expect(screen.getByRole('button', { name: 'Archivadas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Rutina vieja')).toBeInTheDocument();
    expect(screen.getByText('Archivada')).toBeInTheDocument();
    expect(screen.queryByText('Rutina A · Pierna')).not.toBeInTheDocument();
  });

  it('shows empty, loading and error states', () => {
    mocks.useRoutines.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    const { unmount } = renderPage();
    expect(screen.getByText('Aún no hay rutinas')).toBeInTheDocument();
    unmount();

    mocks.useRoutines.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() });
    const loading = renderPage();
    expect(screen.getByText('Cargando rutinas...')).toBeInTheDocument();
    loading.unmount();

    mocks.useRoutines.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: vi.fn() });
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar las rutinas');
  });
});
