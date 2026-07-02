import { FormEvent, useState } from 'react';
import { KeyRound, Pencil, Power, UserCheck, UserCog, UserX } from 'lucide-react';
import {
  useCreateTrainer,
  useResetTrainerPassword,
  useSetTrainerActive,
  useTrainers,
  useUpdateTrainer,
} from '@features/trainers/hooks/useTrainers';
import type { Trainer } from '@shared/types/api';
import AppShell from '@app/layout/AppShell';
import { AdminManagementHeader, IconAction, ManagementSection, ManagementSummary, RowIcon } from '@app/components/AdminManagement';
import { Button, EmptyState, StatusBadge, TextInput } from '@shared/components/ui';

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
        <p className="text-red-500">Error al cargar entrenadores</p>
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
        { label: 'Activos', value: activeCount, icon: UserCheck, tone: 'green' },
        { label: 'Inactivos', value: inactiveCount, icon: UserX, tone: 'amber' },
      ]} />

      <ManagementSection title="Equipo técnico" meta={`${trainers?.length ?? 0} accesos`}>
        {!trainers || trainers.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay entrenadores" description="Crea el primer acceso para el equipo técnico." />
          </div>
        ) : (
          trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="flex flex-col gap-3 border-b border-border/70 p-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <RowIcon icon={UserCog} tone={trainer.active ? 'green' : 'amber'} />
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary">{trainer.name}</p>
                  <p className="mt-1 break-all text-sm text-text-secondary">{trainer.email}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Alta {new Date(trainer.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <StatusBadge status={trainer.active ? 'ACTIVE' : 'INACTIVE'} />
                <div className="flex gap-1.5">
                  <IconAction label={`Editar ${trainer.name}`} onClick={() => openEdit(trainer)}><Pencil size={16} /></IconAction>
                  <IconAction label={`Cambiar contraseña de ${trainer.name}`} onClick={() => { setPasswordTrainer(trainer); setPassword(''); setError(null); }}><KeyRound size={16} /></IconAction>
                  <IconAction label={trainer.active ? `Desactivar ${trainer.name}` : `Activar ${trainer.name}`} tone={trainer.active ? 'danger' : 'default'} onClick={() => activeMutation.mutate({ id: trainer.id, active: !trainer.active })}><Power size={16} /></IconAction>
                </div>
              </div>
            </div>
          ))
        )}
      </ManagementSection>

      {(showCreate || editingTrainer) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={showCreate ? 'Crear entrenador' : 'Editar entrenador'}
          onClick={(event) => event.target === event.currentTarget && closeDialogs()}
        >
          <form
            onSubmit={showCreate ? handleCreate : handleUpdate}
            className="w-full max-w-md rounded-2xl border border-border/70 bg-elevated/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
          >
            <h2 className="text-lg font-semibold text-text-primary">
              {showCreate ? 'Crear entrenador' : 'Editar entrenador'}
            </h2>

            {error && (
              <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</p>
            )}

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text-primary">Nombre</span>
                <TextInput
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text-primary">Email</span>
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>

              {showCreate && (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-text-primary">
                    Contraseña temporal
                  </span>
                  <TextInput
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    minLength={8}
                    required
                  />
                </label>
              )}

              <label className="flex min-h-[44px] items-center gap-3 rounded-md border border-border px-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-medium text-text-primary">Acceso activo</span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" onClick={closeDialogs}>Cancelar</Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {showCreate ? 'Crear' : 'Guardar'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {passwordTrainer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar contraseña"
          onClick={(event) => event.target === event.currentTarget && closeDialogs()}
        >
          <form
            onSubmit={handlePasswordReset}
            className="w-full max-w-md rounded-2xl border border-border/70 bg-elevated/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
          >
            <h2 className="text-lg font-semibold text-text-primary">Cambiar contraseña</h2>
            <p className="mt-1 text-sm text-text-secondary">{passwordTrainer.name}</p>

            {error && (
              <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error}</p>
            )}

            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-text-primary">
                Nueva contraseña
              </span>
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" onClick={closeDialogs}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={resetPasswordMutation.isPending}>
                Guardar
              </Button>
            </div>
          </form>
        </div>
      )}
      </div>
    </AppShell>
  );
}
