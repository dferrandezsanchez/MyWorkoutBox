import { useState } from 'react';
import { Dumbbell, Pencil, Power, ToggleLeft, ToggleRight } from 'lucide-react';
import { useExercises, useCreateExercise, useUpdateExercise, useSetExerciseStatus } from '@features/exercises/hooks/useExercises';
import ExerciseForm from '@features/exercises/components/ExerciseForm';
import { CATEGORY_LABELS, EVALUATION_LABELS, UNIT_LABELS } from '@features/exercises/utils/labels';
import type { CreateExerciseData, Exercise } from '@shared/types/api';
import AppShell from '@app/layout/AppShell';
import { AdminManagementHeader, IconAction, ManagementSection, ManagementSummary, RowIcon } from '@app/components/AdminManagement';
import { Dialog, EmptyState, StatusBadge } from '@shared/components/ui';

function countJsonItems(value?: string) {
  if (!value) return 0;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function ExercisesAdminPage() {
  const { data: exercises, isLoading, isError } = useExercises(true);
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const statusMutation = useSetExerciseStatus();

  const [showCreate, setShowCreate] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-text-secondary">Cargando ejercicios...</p>
      </AppShell>
    );
  }
  if (isError) {
    return (
      <AppShell>
        <p className="text-red-500">Error al cargar ejercicios</p>
      </AppShell>
    );
  }

  const activeCount = exercises?.filter((exercise) => exercise.status === 'ACTIVE').length ?? 0;
  const inactiveCount = exercises?.filter((exercise) => exercise.status === 'INACTIVE').length ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
      <AdminManagementHeader
        eyebrow="Gestión del centro"
        title="Ejercicios"
        description="Mantén el catálogo que se muestra en los perfiles de cliente."
        actionLabel="Nuevo ejercicio"
        onAction={() => setShowCreate(true)}
      />

      <ManagementSummary items={[
        { label: 'Total', value: exercises?.length ?? 0, icon: Dumbbell, tone: 'primary' },
        { label: 'Activos', value: activeCount, icon: ToggleRight, tone: 'green' },
        { label: 'Inactivos', value: inactiveCount, icon: ToggleLeft, tone: 'amber' },
      ]} />

      <ManagementSection title="Catálogo de ejercicios" meta={`${exercises?.length ?? 0} ejercicios`}>
        {!exercises || exercises.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay ejercicios" />
          </div>
        ) : (
          exercises.map((ex) => (
            <div key={ex.id} className="flex flex-col gap-3 border-b border-border/70 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <RowIcon icon={Dumbbell} tone={ex.status === 'ACTIVE' ? 'violet' : 'amber'} />
                <div className="min-w-0">
                <p className="font-semibold text-text-primary">{ex.name}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {CATEGORY_LABELS[ex.category] ?? ex.category} · {EVALUATION_LABELS[ex.evaluationType] ?? ex.evaluationType} · {UNIT_LABELS[ex.defaultUnit] ?? ex.defaultUnit}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {countJsonItems(ex.measurementFields)} campos de marca · {countJsonItems(ex.variantGroups)} grupos de variantes
                </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <StatusBadge status={ex.status} />
                <div className="flex gap-1.5">
                  <IconAction label={`Editar ${ex.name}`} onClick={() => setEditingExercise(ex)}><Pencil size={16} /></IconAction>
                  <IconAction label={ex.status === 'ACTIVE' ? `Desactivar ${ex.name}` : `Activar ${ex.name}`} tone={ex.status === 'ACTIVE' ? 'danger' : 'default'} onClick={() => statusMutation.mutate({ id: ex.id, status: ex.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}><Power size={16} /></IconAction>
                </div>
              </div>
            </div>
          ))
        )}
      </ManagementSection>

        {showCreate && (
          <Dialog label="Crear ejercicio" onClose={() => setShowCreate(false)} className="max-w-3xl">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Crear ejercicio</h2>
              <ExerciseForm onSubmit={async (data) => { await createMutation.mutateAsync(data as CreateExerciseData); setShowCreate(false); }} submitLabel="Crear" />
          </Dialog>
        )}

        {editingExercise && (
          <Dialog label="Editar ejercicio" onClose={() => setEditingExercise(null)} className="max-w-3xl">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Editar ejercicio</h2>
              <ExerciseForm
                initial={editingExercise}
                onSubmit={async (data) => {
                  await updateMutation.mutateAsync({ id: editingExercise.id, data });
                  setEditingExercise(null);
                }}
                submitLabel="Guardar"
                showStatus
              />
          </Dialog>
        )}
      </div>
    </AppShell>
  );
}
