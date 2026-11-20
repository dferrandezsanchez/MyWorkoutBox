import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exerciseFixture, programFixture, routineFixture } from '@features/routines/test-fixtures';
import RoutinesPage from './RoutinesPage';

const mocks = vi.hoisted(() => ({
  useRoutines: vi.fn(),
  useRoutinePrograms: vi.fn(),
  canManage: vi.fn(),
}));

vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/routines/hooks/useRoutines', () => ({
  useRoutines: mocks.useRoutines,
  useRoutinePrograms: mocks.useRoutinePrograms,
  useCanManageRoutines: mocks.canManage,
}));

const squat = exerciseFixture('ex-1', 'Sentadilla');
const bench = exerciseFixture('ex-2', 'Press banca');
const routines = [
  routineFixture('tpl-a', 'Rutina A · Pierna', [squat, bench]),
  routineFixture('tpl-b', 'Rutina B · Empuje', [bench]),
  routineFixture('tpl-old', 'Rutina vieja', [squat], { status: 'INACTIVE' }),
];

const programs = [
  programFixture('prog-1', 'Fuerza 3 días', [routines[0], routines[1], routines[0]], { activeClientCount: 4 }),
  programFixture('prog-2', 'Iniciación', [routines[1]], { activeClientCount: 1 }),
  programFixture('prog-old', 'Programa viejo', [routines[0]], { status: 'INACTIVE' }),
];

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function SearchProbe() {
  return <p data-testid="search">{useLocation().search}</p>;
}

function renderPage(path = '/routines') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/routines" element={<><RoutinesPage /><SearchProbe /></>} />
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
    mocks.useRoutinePrograms.mockImplementation((includeInactive: boolean) => ({
      data: includeInactive ? programs : programs.filter((program) => program.status === 'ACTIVE'),
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
  it('switches to the Programas tab and keeps it in the URL with the admin mode', async () => {
    const user = userEvent.setup();
    renderPage('/routines?mode=admin');
    expect(screen.getByRole('tab', { name: 'Rutinas' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Programas' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?mode=admin&tab=programas');
    expect(screen.getByRole('tab', { name: 'Programas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'routines-tab-programas');

    await user.click(screen.getByRole('tab', { name: 'Programas' }));
    await user.click(screen.getByRole('tab', { name: 'Rutinas' }));
    expect(screen.getByTestId('search')).toHaveTextContent('?mode=admin');
    expect(screen.getByRole('button', { name: 'Abrir Rutina A · Pierna' })).toBeInTheDocument();
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    renderPage();
    screen.getByRole('tab', { name: 'Rutinas' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Programas' })).toHaveFocus();
    expect(screen.getByTestId('search')).toHaveTextContent('?tab=programas');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Rutinas' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('search')).toHaveTextContent('');
  });

  it('lists programs with lettered sequence and client count, and opens them', async () => {
    const user = userEvent.setup();
    renderPage('/routines?tab=programas');
    const card = screen.getByRole('button', { name: 'Abrir Fuerza 3 días' });
    expect(card).toHaveTextContent('4 clientes');
    expect(card).toHaveTextContent('ARutina A · PiernaBRutina B · EmpujeCRutina A · Pierna');
    expect(screen.getByRole('button', { name: 'Abrir Iniciación' })).toHaveTextContent('1 cliente');
    expect(screen.queryByText('Programa viejo')).not.toBeInTheDocument();
    await user.click(card);
    expect(screen.getByTestId('location')).toHaveTextContent('/routines/programs/prog-1');
  });

  it('creates programs only for managers', async () => {
    const user = userEvent.setup();
    const { unmount } = renderPage('/routines?mode=admin&tab=programas');
    expect(screen.queryByRole('button', { name: 'Nueva rutina' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Nuevo programa' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/routines/programs/new?mode=admin');
    unmount();

    mocks.canManage.mockReturnValue(false);
    renderPage('/routines?tab=programas');
    expect(screen.queryByRole('button', { name: 'Nuevo programa' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir Fuerza 3 días' })).toBeInTheDocument();
  });

  it('searches programs by name or routine and toggles archived programs', async () => {
    const user = userEvent.setup();
    renderPage('/routines?tab=programas');
    await user.type(screen.getByPlaceholderText('Buscar programa o rutina'), 'pierna');
    expect(screen.getByText('Fuerza 3 días')).toBeInTheDocument();
    expect(screen.queryByText('Iniciación')).not.toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Buscar programa o rutina'));
    await user.type(screen.getByPlaceholderText('Buscar programa o rutina'), 'zzz');
    expect(screen.getByText('No encontramos programas con ese nombre')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Buscar programa o rutina'));

    await user.click(screen.getByRole('button', { name: 'Archivados' }));
    expect(screen.getByRole('button', { name: 'Archivados' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Programa viejo')).toBeInTheDocument();
    expect(screen.getByText('Archivado')).toBeInTheDocument();
    expect(screen.queryByText('Fuerza 3 días')).not.toBeInTheDocument();
  });

  it('shows program empty, loading and error states', async () => {
    const refetch = vi.fn();
    mocks.useRoutinePrograms.mockReturnValue({ data: [], isLoading: false, isError: false, refetch });
    const { unmount } = renderPage('/routines?tab=programas');
    expect(screen.getByText('Aún no hay programas')).toBeInTheDocument();
    unmount();

    mocks.canManage.mockReturnValue(false);
    const readOnly = renderPage('/routines?tab=programas');
    expect(screen.getByText('Cuando el centro prepare programas aparecerán aquí.')).toBeInTheDocument();
    readOnly.unmount();

    mocks.useRoutinePrograms.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch });
    const loading = renderPage('/routines?tab=programas');
    expect(screen.getByText('Cargando programas...')).toBeInTheDocument();
    loading.unmount();

    mocks.useRoutinePrograms.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    renderPage('/routines?tab=programas');
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los programas');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalled();
  });
});
