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
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">Error al cargar ejercicios</p>
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
        { label: 'Activos', value: activeCount, icon: ToggleRight, tone: 'primary' },
        { label: 'Inactivos', value: inactiveCount, icon: ToggleLeft, tone: 'muted' },
      ]} />

      <ManagementSection title="Catálogo de ejercicios" meta={`${exercises?.length ?? 0} ejercicios`}>
        {!exercises || exercises.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay ejercicios" />
          </div>
        ) : (
          exercises.map((ex) => {
            const evaluation = EVALUATION_LABELS[ex.evaluationType] ?? ex.evaluationType;
            const unit = UNIT_LABELS[ex.defaultUnit] ?? ex.defaultUnit;
            return (
              <div key={ex.id} className="flex items-center gap-2 py-2.5 pl-3 pr-2 transition-colors duration-150 hover:bg-white/[0.02] sm:gap-3 sm:px-5 sm:py-3">
                <button type="button" onClick={() => setEditingExercise(ex)} className="group flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-ring">
                  <RowIcon icon={Dumbbell} tone={ex.status === 'ACTIVE' ? 'primary' : 'muted'} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text-primary transition-colors duration-150 group-hover:text-primary-soft">{ex.name}</span>
                    <span className="block truncate text-sm text-text-secondary">
                      {CATEGORY_LABELS[ex.category] ?? ex.category} · {evaluation === unit ? evaluation : `${evaluation} · ${unit}`}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <StatusBadge status={ex.status} />
                      <span className="tabular hidden text-xs text-text-muted sm:inline">
                        {countJsonItems(ex.measurementFields)} campos · {countJsonItems(ex.variantGroups)} variantes
                      </span>
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 gap-2">
                  <IconAction label={`Editar ${ex.name}`} onClick={() => setEditingExercise(ex)}><Pencil size={16} /></IconAction>
                  <IconAction label={ex.status === 'ACTIVE' ? `Desactivar ${ex.name}` : `Activar ${ex.name}`} tone={ex.status === 'ACTIVE' ? 'danger' : 'default'} onClick={() => statusMutation.mutate({ id: ex.id, status: ex.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}><Power size={16} /></IconAction>
                </div>
              </div>
            );
          })
        )}
      </ManagementSection>

        {showCreate && (
          <Dialog label="Crear ejercicio" onClose={() => setShowCreate(false)} className="max-w-3xl">
              <p className="eyebrow mb-2">Catálogo</p>
              <h2 className="mb-5 text-xl font-bold text-text-primary">Crear ejercicio</h2>
              <ExerciseForm onSubmit={async (data) => { await createMutation.mutateAsync(data as CreateExerciseData); setShowCreate(false); }} submitLabel="Crear" />
          </Dialog>
        )}

        {editingExercise && (
          <Dialog label="Editar ejercicio" onClose={() => setEditingExercise(null)} className="max-w-3xl">
              <p className="eyebrow mb-2">Catálogo</p>
              <h2 className="mb-5 text-xl font-bold text-text-primary">Editar ejercicio</h2>
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
