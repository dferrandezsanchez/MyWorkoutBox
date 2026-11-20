import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exerciseFixture, programFixture, routineFixture } from '@features/routines/test-fixtures';
import RoutineProgramEditorPage from './RoutineProgramEditorPage';

const mocks = vi.hoisted(() => ({
  useRoutineProgram: vi.fn(),
  useRoutineProgramClients: vi.fn(),
  canManage: vi.fn(),
  save: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/routines/hooks/useRoutines', () => ({
  useRoutineProgram: mocks.useRoutineProgram,
  useRoutineProgramClients: mocks.useRoutineProgramClients,
  useRoutines: () => ({ data: [legs, pull, archivedRoutine].filter((routine) => routine.status === 'ACTIVE'), isLoading: false }),
  useCanManageRoutines: mocks.canManage,
  useSaveRoutineProgram: () => ({ mutateAsync: mocks.save }),
  useSetRoutineProgramStatus: () => ({ mutateAsync: mocks.setStatus, isPending: false }),
}));

const squat = exerciseFixture('ex-1', 'Sentadilla');
const legs = routineFixture('tpl-a', 'Pierna y core', [squat]);
const pull = routineFixture('tpl-b', 'Tirón', [squat]);
const archivedRoutine = routineFixture('tpl-old', 'Vieja', [squat], { status: 'INACTIVE' });
const program = programFixture('prog-1', 'Fuerza 3 días', [legs, pull], { activeClientCount: 2, notes: 'Lunes, miércoles y viernes' });
const followers = [
  { clientId: 'client-1', firstName: 'Ana', lastName: 'Ruiz', nextPosition: 2 },
  { clientId: 'client-2', firstName: 'Luis', lastName: 'Gómez', nextPosition: 1 },
];

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/routines/programs/new" element={<RoutineProgramEditorPage />} />
        <Route path="/routines/programs/:id" element={<RoutineProgramEditorPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoutineProgramEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canManage.mockReturnValue(true);
    mocks.useRoutineProgram.mockImplementation((id: string) => (id
      ? { data: program, isLoading: false, isError: false }
      : { data: undefined, isLoading: false, isError: false }));
    mocks.useRoutineProgramClients.mockReturnValue({ data: followers, isLoading: false, isError: false });
    mocks.save.mockResolvedValue(program);
    mocks.setStatus.mockResolvedValue({ ...program, status: 'INACTIVE' });
  });

  it('creates a program with repeated and reordered routines and returns to the Programas tab', async () => {
    const user = userEvent.setup();
    renderAt('/routines/programs/new?mode=admin');
    expect(screen.getByRole('heading', { name: 'Nuevo programa' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Añadir Vieja' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear programa' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Pon un nombre al programa');
    await user.type(screen.getByPlaceholderText('Ej. Fuerza 3 días'), 'Fuerza 3 días');
    await user.click(screen.getByRole('button', { name: 'Crear programa' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Añade al menos una rutina');

    await user.type(screen.getByPlaceholderText('Objetivo, frecuencia, indicaciones...'), '  L-X-V  ');
    await user.click(screen.getByRole('button', { name: 'Añadir Tirón' }));
    await user.click(screen.getByRole('button', { name: 'Añadir Pierna y core' }));
    await user.click(screen.getByRole('button', { name: 'Añadir Tirón' }));
    await user.click(screen.getByRole('button', { name: 'Subir B' }));
    const sequence = within(screen.getByRole('list', { name: 'Rutinas del programa' })).getAllByRole('listitem');
    expect(sequence.map((item) => item.textContent)).toEqual(['APierna y core', 'BTirón', 'CTirón']);
    await user.click(screen.getByRole('button', { name: 'Quitar C' }));
    await user.click(screen.getByRole('button', { name: 'Añadir Pierna y core' }));
    await user.click(screen.getByRole('button', { name: 'Crear programa' }));

    expect(mocks.save).toHaveBeenCalledWith({
      id: undefined,
      data: { name: 'Fuerza 3 días', notes: 'L-X-V', templateIds: ['tpl-a', 'tpl-b', 'tpl-a'] },
    });
    expect(await screen.findByTestId('location')).toHaveTextContent('/routines?mode=admin&tab=programas');
  });

  it('caps a program at 10 routines', async () => {
    const user = userEvent.setup();
    renderAt('/routines/programs/new');
    for (let index = 0; index < 10; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Añadir Tirón' }));
    }
    expect(screen.getByRole('button', { name: 'Añadir Tirón' })).toBeDisabled();
    expect(screen.getByText('Máximo 10 rutinas por programa.')).toBeInTheDocument();
  });

  it('edits a program followed by clients and lists who follows it', async () => {
    const user = userEvent.setup();
    renderAt('/routines/programs/prog-1?mode=admin');
    expect(screen.getByRole('heading', { name: 'Fuerza 3 días' })).toBeInTheDocument();
    expect(screen.getByText('2 rutinas · 2 clientes')).toBeInTheDocument();
    expect(screen.getByText('Los cambios se aplican a sus 2 clientes.')).toBeInTheDocument();

    const ana = screen.getByRole('link', { name: /Ana Ruiz/ });
    expect(ana).toHaveAttribute('href', '/clients/client-1?mode=admin');
    expect(ana).toHaveTextContent('Siguiente: B · Tirón');
    expect(screen.getByRole('link', { name: /Luis Gómez/ })).toHaveTextContent('Siguiente: A · Pierna y core');

    await user.click(screen.getByRole('button', { name: 'Bajar A' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(mocks.save).toHaveBeenCalledWith({
      id: 'prog-1',
      data: { name: 'Fuerza 3 días', notes: 'Lunes, miércoles y viernes', templateIds: ['tpl-b', 'tpl-a'] },
    });
  });

  it('surfaces save errors from the API', async () => {
    mocks.save.mockRejectedValue({ response: { data: { error: 'No tienes permiso para gestionar rutinas' } } });
    const user = userEvent.setup();
    renderAt('/routines/programs/prog-1');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para gestionar rutinas');
  });

  it('blocks saving while the program contains archived routines', async () => {
    mocks.useRoutineProgram.mockReturnValue({ data: programFixture('prog-1', 'Viejo', [archivedRoutine]), isLoading: false, isError: false });
    const user = userEvent.setup();
    renderAt('/routines/programs/prog-1');
    expect(screen.queryByText(/Los cambios se aplican/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Quita las rutinas archivadas para guardar');
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('archives after confirmation and restores archived programs', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt('/routines/programs/prog-1');
    await user.click(screen.getByRole('button', { name: 'Archivar' }));
    expect(within(screen.getByRole('dialog')).getByText(/Los 2 clientes que lo siguen lo mantienen/)).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archivar' }));
    expect(mocks.setStatus).toHaveBeenCalledWith({ id: 'prog-1', status: 'INACTIVE' });
    unmount();

    mocks.useRoutineProgram.mockReturnValue({ data: { ...program, status: 'INACTIVE' }, isLoading: false, isError: false });
    mocks.setStatus.mockRejectedValue(new Error('boom'));
    renderAt('/routines/programs/prog-1');
    expect(screen.getByText('Programa archivado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(mocks.setStatus).toHaveBeenCalledWith({ id: 'prog-1', status: 'ACTIVE' });
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo restaurar el programa');
  });

  it('is read-only for staff without routine permission', async () => {
    mocks.canManage.mockReturnValue(false);
    const user = userEvent.setup();
    renderAt('/routines/programs/prog-1');
    expect(screen.getByRole('heading', { name: 'Fuerza 3 días' })).toBeInTheDocument();
    expect(screen.getByText('Lunes, miércoles y viernes')).toBeInTheDocument();
    const chips = within(screen.getByRole('list', { name: 'Rutinas del programa' })).getAllByRole('listitem');
    expect(chips.map((chip) => chip.textContent)).toEqual(['APierna y core', 'BTirón']);
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archivar' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Los cambios se aplican/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ana Ruiz/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Programas' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/routines?tab=programas');
  });

  it('blocks creation without permission and reports load errors', () => {
    mocks.canManage.mockReturnValue(false);
    const { unmount } = renderAt('/routines/programs/new');
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso para crear programas');
    unmount();

    mocks.canManage.mockReturnValue(true);
    mocks.useRoutineProgram.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const loading = renderAt('/routines/programs/prog-1');
    expect(screen.getByText('Cargando programa...')).toBeInTheDocument();
    loading.unmount();

    mocks.useRoutineProgram.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderAt('/routines/programs/missing');
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el programa');
  });

  it('shows the followers empty, loading and error states', () => {
    mocks.useRoutineProgram.mockReturnValue({ data: { ...program, activeClientCount: 1 }, isLoading: false, isError: false });
    mocks.useRoutineProgramClients.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { unmount } = renderAt('/routines/programs/prog-1');
    expect(screen.getByText('Ningún cliente sigue este programa')).toBeInTheDocument();
    expect(screen.getByText('Los cambios se aplican a su cliente.')).toBeInTheDocument();
    unmount();

    mocks.useRoutineProgramClients.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const loading = renderAt('/routines/programs/prog-1');
    expect(screen.getByText('Cargando clientes...')).toBeInTheDocument();
    loading.unmount();

    mocks.useRoutineProgramClients.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderAt('/routines/programs/prog-1');
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudieron cargar los clientes');
  });
});
