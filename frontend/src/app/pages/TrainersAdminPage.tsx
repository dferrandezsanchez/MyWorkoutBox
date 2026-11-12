import { FormEvent, useState } from 'react';
import { Eye, EyeOff, KeyRound, Pencil, Power, UserCheck, UserCog, UserX } from 'lucide-react';
import {
  useCreateTrainer,
  useResetTrainerPassword,
  useSetTrainerActive,
  useTrainers,
  useUpdateTrainer,
} from '@features/trainers/hooks/useTrainers';
import type { Trainer } from '@shared/types/api';
import AppShell from '@app/layout/AppShell';
import { AdminManagementHeader, IconAction, ManagementSection, ManagementSummary, RowActionsMenu, RowIcon } from '@app/components/AdminManagement';
import { Button, Dialog, EmptyState, StatusBadge, TextInput } from '@shared/components/ui';

interface TrainerFormState {
  name: string;
  email: string;
  password: string;
  active: boolean;
}

const emptyForm: TrainerFormState = {
  name: '',
  email: '',
  password: '',
  active: true,
};

const TEMPORARY_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generateTemporaryPassword(length = 12): string {
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += TEMPORARY_PASSWORD_CHARS[randomValues[i] % TEMPORARY_PASSWORD_CHARS.length];
  }
  return result;
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === 'string'
  ) {
    return (error as { response: { data: { error: string } } }).response.data.error;
  }
  return 'No se pudo completar la operación';
}

export default function TrainersAdminPage() {
  const { data: trainers, isLoading, isError } = useTrainers(true);
  const createMutation = useCreateTrainer();
  const updateMutation = useUpdateTrainer();
  const activeMutation = useSetTrainerActive();
  const resetPasswordMutation = useResetTrainerPassword();

  const [showCreate, setShowCreate] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [passwordTrainer, setPasswordTrainer] = useState<Trainer | null>(null);
  const [form, setForm] = useState<TrainerFormState>(emptyForm);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const activeCount = trainers?.filter((trainer) => trainer.active).length ?? 0;
  const inactiveCount = trainers?.filter((trainer) => !trainer.active).length ?? 0;

  const openCreate = () => {
    setForm(emptyForm);
    setError(null);
    setShowCreate(true);
  };

  const openEdit = (trainer: Trainer) => {
    setForm({
      name: trainer.name,
      email: trainer.email,
      password: '',
      active: trainer.active,
    });
    setError(null);
    setEditingTrainer(trainer);
  };

  const closeDialogs = () => {
    setShowCreate(false);
    setEditingTrainer(null);
    setPasswordTrainer(null);
    setPassword('');
    setError(null);
    setShowCreatePassword(false);
    setShowResetPassword(false);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        active: form.active,
      });
      closeDialogs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingTrainer) return;
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: editingTrainer.id,
        data: {
          name: form.name,
          email: form.email,
          active: form.active,
        },
      });
      closeDialogs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordTrainer) return;
    setError(null);
    try {
      await resetPasswordMutation.mutateAsync({ id: passwordTrainer.id, password });
      closeDialogs();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-text-secondary">Cargando entrenadores...</p>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">Error al cargar entrenadores</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
      <AdminManagementHeader
        eyebrow="Gestión del centro"
        title="Entrenadores"
        description="Gestiona accesos del equipo técnico que actualiza las marcas de clientes."
        actionLabel="Nuevo entrenador"
        onAction={openCreate}
      />

      <ManagementSummary items={[
        { label: 'Total', value: trainers?.length ?? 0, icon: UserCog, tone: 'primary' },
        { label: 'Activos', value: activeCount, icon: UserCheck, tone: 'primary' },
        { label: 'Inactivos', value: inactiveCount, icon: UserX, tone: 'muted' },
      ]} />

      <ManagementSection title="Equipo técnico" meta={`${trainers?.length ?? 0} accesos`}>
        {!trainers || trainers.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay entrenadores" description="Crea el primer acceso para el equipo técnico." />
          </div>
        ) : (
          trainers.map((trainer) => (
            <div key={trainer.id} className="flex items-center gap-2 py-2.5 pl-3 pr-2 transition-colors duration-150 hover:bg-white/[0.02] sm:gap-3 sm:px-5 sm:py-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <RowIcon icon={UserCog} tone={trainer.active ? 'primary' : 'muted'} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-primary">{trainer.name}</p>
                  <p className="truncate text-sm text-text-secondary">{trainer.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StatusBadge status={trainer.active ? 'ACTIVE' : 'INACTIVE'} />
                    <span className="tabular text-xs text-text-muted">Alta {new Date(trainer.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <IconAction label={`Editar ${trainer.name}`} onClick={() => openEdit(trainer)}><Pencil size={16} /></IconAction>
                <RowActionsMenu
                  subject={trainer.name}
                  actions={[
                    { label: 'Cambiar contraseña', icon: KeyRound, onSelect: () => { setPasswordTrainer(trainer); setPassword(''); setError(null); } },
                    {
                      label: trainer.active ? 'Desactivar acceso' : 'Activar acceso',
                      icon: Power,
                      tone: trainer.active ? 'danger' : 'default',
                      onSelect: () => activeMutation.mutate({ id: trainer.id, active: !trainer.active }),
                    },
                  ]}
                />
              </div>
            </div>
          ))
        )}
      </ManagementSection>

      {(showCreate || editingTrainer) && (
        <Dialog label={showCreate ? 'Crear entrenador' : 'Editar entrenador'} onClose={closeDialogs} className="max-w-md">
          <form
            onSubmit={showCreate ? handleCreate : handleUpdate}
          >
            <p className="eyebrow mb-2">Equipo técnico</p>
            <h2 className="text-xl font-bold text-text-primary">
              {showCreate ? 'Crear entrenador' : 'Editar entrenador'}
            </h2>

            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p>
            )}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Nombre</span>
                <TextInput
                  className="w-full"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-text-secondary">Email</span>
                <TextInput
                  className="w-full"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>

              {showCreate && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-text-secondary">
                    Contraseña temporal
                  </span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TextInput
                        type={showCreatePassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                        minLength={8}
                        className="w-full pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword((current) => !current)}
                        aria-label={showCreatePassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors duration-150 hover:bg-white/[0.05] hover:text-text-primary focus-ring"
                      >
                        {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setForm((current) => ({ ...current, password: generateTemporaryPassword() }));
                        setShowCreatePassword(true);
                      }}
                    >
                      Generar
                    </Button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    Es una contraseña temporal: compártesela tú mismo con el entrenador. Podrá cambiarla después desde su cuenta.
                  </p>
                </label>
              )}

              <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-border bg-background/60 px-3.5 transition-colors duration-150 hover:border-border-strong">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-medium text-text-secondary">Acceso activo</span>
              </label>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button type="button" variant="ghost" onClick={closeDialogs}>Cancelar</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {showCreate ? 'Crear' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {passwordTrainer && (
        <Dialog label="Cambiar contraseña" onClose={closeDialogs} className="max-w-md">
          <form
            onSubmit={handlePasswordReset}
          >
            <p className="eyebrow mb-2">Acceso</p>
            <h2 className="text-xl font-bold text-text-primary">Cambiar contraseña</h2>
            <p className="mt-1 text-sm text-text-secondary">{passwordTrainer.name}</p>

            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p>
            )}

            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-text-secondary">
                Nueva contraseña
              </span>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TextInput
                    type={showResetPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    className="w-full pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((current) => !current)}
                    aria-label={showResetPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors duration-150 hover:bg-white/[0.05] hover:text-text-primary focus-ring"
                  >
                    {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setPassword(generateTemporaryPassword());
                    setShowResetPassword(true);
                  }}
                >
                  Generar
                </Button>
              </div>
              <p className="mt-2 text-xs leading-5 text-text-muted">
                Es una contraseña temporal: compártesela tú mismo con el entrenador. Podrá cambiarla después desde su cuenta.
              </p>
            </label>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button type="button" variant="ghost" onClick={closeDialogs}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={resetPasswordMutation.isPending}>
                Guardar
              </Button>
            </div>
          </form>
        </Dialog>
      )}
      </div>
    </AppShell>
  );
}
