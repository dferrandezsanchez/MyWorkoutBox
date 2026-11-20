import type { ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Trainer } from '@shared/types/api';
import TrainersAdminPage from './TrainersAdminPage';

const mocks = vi.hoisted(() => ({
  useTrainers: vi.fn(),
  accessAsync: vi.fn(),
  accessState: { isPending: false, variables: undefined as { id: string } | undefined },
  activeMutate: vi.fn(),
  createAsync: vi.fn(),
  updateAsync: vi.fn(),
  resetAsync: vi.fn(),
}));

vi.mock('@app/layout/AppShell', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@features/auth/model/auth-store', () => ({ getAuthUser: () => ({ id: 'admin-me', role: 'ADMIN' }) }));
vi.mock('@features/trainers/hooks/useTrainers', () => ({
  useTrainers: mocks.useTrainers,
  useCreateTrainer: () => ({ mutateAsync: mocks.createAsync, isPending: false }),
  useUpdateTrainer: () => ({ mutateAsync: mocks.updateAsync, isPending: false }),
  useSetTrainerActive: () => ({ mutate: mocks.activeMutate }),
  useResetTrainerPassword: () => ({ mutateAsync: mocks.resetAsync, isPending: false }),
  useUpdateStaffAccess: () => ({ mutateAsync: mocks.accessAsync, ...mocks.accessState }),
}));

function staff(id: string, name: string, overrides: Partial<Trainer> = {}): Trainer {
  return {
    id, name, email: `${id}@gym.com`, role: 'TRAINER', canManageRoutines: false, active: true,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

const team = [
  staff('admin-me', 'Ana Admin', { role: 'ADMIN', canManageRoutines: true }),
  staff('admin-2', 'Berta Admin', { role: 'ADMIN', canManageRoutines: true }),
  staff('trainer-1', 'Carlos Entrenador'),
];

async function openActions(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: `Más acciones de ${name}` }));
  return { user, menu: screen.getByRole('dialog', { name: `Acciones de ${name}` }) };
}

describe('TrainersAdminPage staff access', () => {
  beforeEach(() => {
    mocks.useTrainers.mockReturnValue({ data: team, isLoading: false, isError: false });
    mocks.accessAsync.mockReset().mockResolvedValue(undefined);
    mocks.activeMutate.mockReset();
    mocks.createAsync.mockReset().mockResolvedValue(undefined);
    mocks.updateAsync.mockReset().mockResolvedValue(undefined);
    mocks.resetAsync.mockReset().mockResolvedValue(undefined);
    mocks.accessState.isPending = false;
    mocks.accessState.variables = undefined;
  });

  it('lists admins and trainers with their role badge', () => {
    render(<TrainersAdminPage />);

    expect(screen.getByRole('heading', { name: 'Equipo' })).toBeInTheDocument();
    expect(screen.getAllByText('Administrador')).toHaveLength(2);
    expect(screen.getAllByText('Entrenador')).toHaveLength(1);
    expect(screen.getByText('(tú)')).toBeInTheDocument();
  });

  it('shows the routine permission always on for admins and toggles it for trainers', async () => {
    const user = userEvent.setup();
    render(<TrainersAdminPage />);

    const adminSwitch = screen.getByRole('switch', { name: 'Gestiona rutinas: Berta Admin' });
    expect(adminSwitch).toBeChecked();
    expect(adminSwitch).toBeDisabled();

    const trainerSwitch = screen.getByRole('switch', { name: 'Gestiona rutinas: Carlos Entrenador' });
    expect(trainerSwitch).not.toBeChecked();
    await user.click(trainerSwitch);

    expect(mocks.accessAsync).toHaveBeenCalledWith({ id: 'trainer-1', data: { canManageRoutines: true } });
  });

  it('disables the switch of the trainer whose access is being saved', () => {
    mocks.accessState.isPending = true;
    mocks.accessState.variables = { id: 'trainer-1' };
    render(<TrainersAdminPage />);

    expect(screen.getByRole('switch', { name: 'Gestiona rutinas: Carlos Entrenador' })).toBeDisabled();
  });

  it('promotes a trainer after confirming', async () => {
    render(<TrainersAdminPage />);
    const { user, menu } = await openActions('Carlos Entrenador');

    await user.click(within(menu).getByRole('button', { name: 'Hacer administrador' }));
    const confirm = screen.getByRole('dialog', { name: 'Hacer administrador' });
    expect(confirm).toHaveTextContent('Carlos Entrenador podrá gestionar el centro');
    await user.click(within(confirm).getByRole('button', { name: 'Hacer administrador' }));

    expect(mocks.accessAsync).toHaveBeenCalledWith({ id: 'trainer-1', data: { role: 'ADMIN' } });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Hacer administrador' })).not.toBeInTheDocument());
  });

  it('cancels a demotion without calling the API', async () => {
    render(<TrainersAdminPage />);
    const { user, menu } = await openActions('Berta Admin');

    await user.click(within(menu).getByRole('button', { name: 'Quitar administrador' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Quitar administrador' })).getByRole('button', { name: 'Cancelar' }));

    expect(mocks.accessAsync).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Quitar administrador' })).not.toBeInTheDocument();
  });

  it('shows the API error when the demotion is rejected', async () => {
    mocks.accessAsync.mockRejectedValueOnce({ response: { data: { error: 'El centro necesita al menos un administrador activo' } } });
    render(<TrainersAdminPage />);
    const { user, menu } = await openActions('Berta Admin');

    await user.click(within(menu).getByRole('button', { name: 'Quitar administrador' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Quitar administrador' })).getByRole('button', { name: 'Quitar administrador' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El centro necesita al menos un administrador activo');
    expect(mocks.accessAsync).toHaveBeenCalledWith({ id: 'admin-2', data: { role: 'TRAINER' } });
  });

  it('hides role and deactivation actions on your own row', async () => {
    render(<TrainersAdminPage />);
    const { menu } = await openActions('Ana Admin');

    expect(within(menu).getByRole('button', { name: 'Cambiar contraseña' })).toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: 'Quitar administrador' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('button', { name: 'Desactivar acceso' })).not.toBeInTheDocument();
  });

  it('keeps deactivation available for other staff', async () => {
    render(<TrainersAdminPage />);
    const { user, menu } = await openActions('Carlos Entrenador');

    await user.click(within(menu).getByRole('button', { name: 'Desactivar acceso' }));

    expect(mocks.activeMutate).toHaveBeenCalledWith({ id: 'trainer-1', active: false });
  });

  it('renders loading and error states', () => {
    mocks.useTrainers.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { unmount } = render(<TrainersAdminPage />);
    expect(screen.getByText('Cargando equipo...')).toBeInTheDocument();
    unmount();

    mocks.useTrainers.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<TrainersAdminPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar el equipo');
  });
});

describe('TrainersAdminPage account management', () => {
  beforeEach(() => {
    mocks.useTrainers.mockReturnValue({ data: team, isLoading: false, isError: false });
    mocks.createAsync.mockReset().mockResolvedValue(undefined);
    mocks.updateAsync.mockReset().mockResolvedValue(undefined);
    mocks.resetAsync.mockReset().mockResolvedValue(undefined);
    mocks.accessState.isPending = false;
  });

  it('creates a trainer with a generated temporary password', async () => {
    const user = userEvent.setup();
    render(<TrainersAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Nuevo entrenador' }));
    const dialog = screen.getByRole('dialog', { name: 'Crear entrenador' });
    const [name, email] = within(dialog).getAllByRole('textbox');
    await user.type(name, 'Diana');
    await user.type(email, 'diana@gym.com');
    await user.click(within(dialog).getByRole('button', { name: 'Generar' }));
    await user.click(within(dialog).getByRole('button', { name: 'Ocultar contraseña' }));
    await user.click(within(dialog).getByRole('checkbox'));
    await user.click(within(dialog).getByRole('button', { name: 'Crear' }));

    expect(mocks.createAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Diana', email: 'diana@gym.com', active: false }));
    expect(mocks.createAsync.mock.calls[0][0].password).toHaveLength(12);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Crear entrenador' })).not.toBeInTheDocument());
  });

  it('edits a staff member and shows API errors in the dialog', async () => {
    mocks.updateAsync.mockRejectedValueOnce({ response: { data: { error: 'Ya existe un usuario con ese email' } } });
    const user = userEvent.setup();
    render(<TrainersAdminPage />);

    await user.click(screen.getByRole('button', { name: 'Editar Carlos Entrenador' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar entrenador' });
    const [name] = within(dialog).getAllByRole('textbox');
    await user.clear(name);
    await user.type(name, 'Carlos E.');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Ya existe un usuario con ese email');
    expect(mocks.updateAsync).toHaveBeenCalledWith({
      id: 'trainer-1',
      data: { name: 'Carlos E.', email: 'trainer-1@gym.com', active: true },
    });

    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Editar entrenador' })).not.toBeInTheDocument());
  });

  it('resets a password and reports failures generically', async () => {
    mocks.resetAsync.mockRejectedValueOnce(new Error('network'));
    render(<TrainersAdminPage />);
    const { user, menu } = await openActions('Carlos Entrenador');

    await user.click(within(menu).getByRole('button', { name: 'Cambiar contraseña' }));
    const dialog = screen.getByRole('dialog', { name: 'Cambiar contraseña' });
    await user.click(within(dialog).getByRole('button', { name: 'Mostrar contraseña' }));
    await user.type(within(dialog).getByRole('textbox'), 'Nueva12345');
    await user.click(within(dialog).getByRole('button', { name: 'Generar' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('No se pudo completar la operación');

    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(mocks.resetAsync).toHaveBeenLastCalledWith({ id: 'trainer-1', password: expect.stringMatching(/^\S{12}$/) });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Cambiar contraseña' })).not.toBeInTheDocument());
  });

  it('shows an empty state without staff', () => {
    mocks.useTrainers.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<TrainersAdminPage />);
    expect(screen.getByText('No hay entrenadores')).toBeInTheDocument();
  });
});
