import type { ReactElement } from 'react';
import { render as rtlRender, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exerciseFixture, planFixture, programFixture, programPlanFixture, routineFixture } from '@features/routines/test-fixtures';
import { ClientRoutinePlanSection } from './ClientRoutinePlanSection';

const mocks = vi.hoisted(() => ({
  useClientRoutinePlan: vi.fn(),
  useRoutines: vi.fn(),
  useRoutinePrograms: vi.fn(),
  assign: vi.fn(),
  setNext: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@features/routines/hooks/useRoutines', () => ({
  useClientRoutinePlan: mocks.useClientRoutinePlan,
  useRoutines: mocks.useRoutines,
  useRoutinePrograms: mocks.useRoutinePrograms,
  useClientRoutinePlanActions: () => ({
    assign: { mutateAsync: mocks.assign, isPending: false },
    setNext: { mutateAsync: mocks.setNext, isPending: false },
    remove: { mutateAsync: mocks.remove, isPending: false },
  }),
}));

const squat = exerciseFixture('ex-1', 'Sentadilla');
const routineA = routineFixture('tpl-a', 'Pierna', [squat]);
const routineB = routineFixture('tpl-b', 'Empuje', [squat]);
const routineC = routineFixture('tpl-c', 'Tirón', [squat]);
const strength = programFixture('prog-1', 'Fuerza 3 días', [routineA, routineB, routineC], { activeClientCount: 4 });
const mobility = programFixture('prog-2', 'Movilidad', [routineC, routineA]);

function render(ui: ReactElement, path = '/clients/client-1') {
  return rtlRender(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

describe('ClientRoutinePlanSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useClientRoutinePlan.mockReturnValue({ data: planFixture([routineA, routineB, routineC], 2), isLoading: false, isError: false });
    mocks.useRoutines.mockReturnValue({ data: [routineA, routineB, routineC], isLoading: false });
    mocks.useRoutinePrograms.mockReturnValue({ data: [strength, mobility], isLoading: false });
    mocks.assign.mockResolvedValue(undefined);
    mocks.setNext.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it('shows the plan as lettered chips and highlights the next routine', () => {
    render(<ClientRoutinePlanSection clientId="client-1" canManage={false} />);
    const chips = within(screen.getByRole('list', { name: 'Orden de la serie' })).getAllByRole('listitem');
    expect(chips.map((chip) => chip.textContent)).toEqual(['APierna', 'BEmpuje(siguiente)', 'CTirón']);
    expect(screen.getByText(/Siguiente:/)).toHaveTextContent('Siguiente: B · Empuje');
  });

  it('is read-only for staff without routine permission', () => {
    render(<ClientRoutinePlanSection clientId="client-1" canManage={false} />);
    expect(screen.queryByRole('button', { name: 'Editar serie' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /como siguiente/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar serie' })).not.toBeInTheDocument();
  });

  it('lets managers change the next routine and remove the plan', async () => {
    const user = userEvent.setup();
    render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    await user.click(screen.getByRole('button', { name: 'Marcar C · Tirón como siguiente' }));
    expect(mocks.setNext).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Quitar serie' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Quitar serie' }));
    expect(mocks.remove).toHaveBeenCalled();
  });

  it('edits a custom plan: reorder, remove, repeat a routine and keep the next position', async () => {
    const user = userEvent.setup();
    render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    await user.click(screen.getByRole('button', { name: 'Editar serie' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar serie de rutinas' });
    expect(within(dialog).getByRole('radio', { name: 'Serie personalizada' })).toHaveAttribute('aria-checked', 'true');

    await user.click(within(dialog).getByRole('button', { name: 'Quitar C' }));
    await user.click(within(dialog).getByRole('button', { name: 'Subir B' }));
    await user.click(within(dialog).getByRole('button', { name: 'Bajar A' }));
    await user.click(within(dialog).getByRole('button', { name: 'Subir B' }));
    await user.click(within(dialog).getByRole('button', { name: 'Añadir Empuje' }));
    await user.clear(within(dialog).getByRole('textbox'));
    await user.type(within(dialog).getByRole('textbox'), 'Bloque fuerza');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar serie' }));

    expect(mocks.assign).toHaveBeenCalledWith({ name: 'Bloque fuerza', templateIds: ['tpl-b', 'tpl-a', 'tpl-b'], nextPosition: 2 });
  });

  it('assigns a first custom plan when the client has none', async () => {
    mocks.useClientRoutinePlan.mockReturnValue({ data: null, isLoading: false, isError: false });
    const user = userEvent.setup();
    render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    expect(screen.getByText('Sin serie de rutinas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Asignar serie' }));
    const dialog = screen.getByRole('dialog', { name: 'Asignar serie de rutinas' });
    await user.click(within(dialog).getByRole('radio', { name: 'Serie personalizada' }));

    await user.click(within(dialog).getByRole('button', { name: 'Guardar serie' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Elige al menos una rutina');

    await user.click(within(dialog).getByRole('button', { name: 'Añadir Pierna' }));
    await user.click(within(dialog).getByRole('button', { name: 'Añadir Tirón' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar serie' }));
    expect(mocks.assign).toHaveBeenCalledWith({ name: 'Serie de rutinas', templateIds: ['tpl-a', 'tpl-c'], nextPosition: 1 });
  });

  it('assigns a program and lets the manager choose which letter comes next', async () => {
    mocks.useClientRoutinePlan.mockReturnValue({ data: null, isLoading: false, isError: false });
    const user = userEvent.setup();
    render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    await user.click(screen.getByRole('button', { name: 'Asignar serie' }));
    const dialog = screen.getByRole('dialog', { name: 'Asignar serie de rutinas' });
    expect(within(dialog).getByRole('radio', { name: 'Seguir un programa' })).toHaveAttribute('aria-checked', 'true');
    expect(within(dialog).getByRole('radio', { name: 'Fuerza 3 días' })).toHaveTextContent('A Pierna · B Empuje · C Tirón');

    await user.click(within(dialog).getByRole('button', { name: 'Seguir programa' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Elige un programa');

    await user.click(within(dialog).getByRole('radio', { name: 'Fuerza 3 días' }));
    await user.click(within(dialog).getByRole('button', { name: 'Marcar B · Empuje como siguiente' }));
    await user.click(within(dialog).getByRole('button', { name: 'Seguir programa' }));
    expect(mocks.assign).toHaveBeenCalledWith({ programId: 'prog-1', nextPosition: 2 });
  });

  it('shows an empty hint when there are no active programs and surfaces assign errors', async () => {
    mocks.useClientRoutinePlan.mockReturnValue({ data: null, isLoading: false, isError: false });
    mocks.useRoutinePrograms.mockReturnValue({ data: [], isLoading: false });
    const user = userEvent.setup();
    const { unmount } = render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    await user.click(screen.getByRole('button', { name: 'Asignar serie' }));
    expect(screen.getByText(/No hay programas activos/)).toBeInTheDocument();
    unmount();

    mocks.useRoutinePrograms.mockReturnValue({ data: [mobility], isLoading: false });
    mocks.assign.mockRejectedValue({ response: { data: { error: 'Programa archivado' } } });
    render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    await user.click(screen.getByRole('button', { name: 'Asignar serie' }));
    await user.click(screen.getByRole('radio', { name: 'Movilidad' }));
    await user.click(screen.getByRole('button', { name: 'Seguir programa' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Programa archivado');
    expect(mocks.assign).toHaveBeenCalledWith({ programId: 'prog-2', nextPosition: 1 });
  });

  it('shows a program plan with a link to the program, next chip and Cambiar/Quitar actions', async () => {
    mocks.useClientRoutinePlan.mockReturnValue({ data: programPlanFixture(strength, 3), isLoading: false, isError: false });
    const user = userEvent.setup();
    render(<ClientRoutinePlanSection clientId="client-1" canManage />, '/clients/client-1?mode=admin');

    expect(screen.getByRole('link', { name: 'Fuerza 3 días' })).toHaveAttribute('href', '/routines/programs/prog-1?mode=admin');
    expect(screen.getByText(/Siguiente:/)).toHaveTextContent('Siguiente: C · Tirón');
    expect(screen.queryByText('Programa archivado')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar serie' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Marcar A · Pierna como siguiente' }));
    expect(mocks.setNext).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Cambiar' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar serie de rutinas' });
    expect(within(dialog).getByRole('radio', { name: 'Fuerza 3 días' })).toHaveAttribute('aria-checked', 'true');
    await user.click(within(dialog).getByRole('radio', { name: 'Movilidad' }));
    await user.click(within(dialog).getByRole('radio', { name: 'Fuerza 3 días' }));
    await user.click(within(dialog).getByRole('button', { name: 'Seguir programa' }));
    expect(mocks.assign).toHaveBeenCalledWith({ programId: 'prog-1', nextPosition: 3 });

    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(screen.getByText('¿Dejar de seguir el programa?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quitar programa' }));
    expect(mocks.remove).toHaveBeenCalled();
  });

  it('switches a program plan to a custom series prefilled with its routines', async () => {
    mocks.useClientRoutinePlan.mockReturnValue({ data: programPlanFixture(strength, 2), isLoading: false, isError: false });
    const user = userEvent.setup();
    render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    await user.click(screen.getByRole('button', { name: 'Cambiar' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: 'Serie personalizada' }));
    await user.click(within(dialog).getByRole('button', { name: 'Quitar C' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar serie' }));
    expect(mocks.assign).toHaveBeenCalledWith({ name: 'Fuerza 3 días', templateIds: ['tpl-a', 'tpl-b'], nextPosition: 2 });
  });

  it('flags archived programs and stays read-only without permission', () => {
    mocks.useClientRoutinePlan.mockReturnValue({ data: programPlanFixture({ ...strength, status: 'INACTIVE' }, 1), isLoading: false, isError: false });
    render(<ClientRoutinePlanSection clientId="client-1" canManage={false} />);
    expect(screen.getByText('Programa archivado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Fuerza 3 días' })).toHaveAttribute('href', '/routines/programs/prog-1');
    expect(screen.queryByRole('button', { name: 'Cambiar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /como siguiente/ })).not.toBeInTheDocument();
  });

  it('shows the no-plan state read-only and loading/error states', () => {
    mocks.useClientRoutinePlan.mockReturnValue({ data: null, isLoading: false, isError: false });
    const { unmount } = render(<ClientRoutinePlanSection clientId="client-1" canManage={false} />);
    expect(screen.getByText('Sin serie de rutinas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Asignar serie' })).not.toBeInTheDocument();
    unmount();

    mocks.useClientRoutinePlan.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const loading = render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    expect(screen.getByText('Cargando serie de rutinas...')).toBeInTheDocument();
    loading.unmount();

    mocks.useClientRoutinePlan.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ClientRoutinePlanSection clientId="client-1" canManage />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la serie de rutinas');
  });

  it('surfaces API errors when changing the next routine', async () => {
    mocks.setNext.mockRejectedValue({ response: { data: { error: 'No tienes permiso para gestionar rutinas' } } });
    const user = userEvent.setup();
    render(<ClientRoutinePlanSection clientId="client-1" canManage onOpenRoutines={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Marcar A · Pierna como siguiente' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para gestionar rutinas');
    expect(screen.getByRole('button', { name: 'Ver rutinas' })).toBeInTheDocument();
  });
});
