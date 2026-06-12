import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useExercises, useCreateExercise, useUpdateExercise, useSetExerciseStatus } from '../../hooks/useExercises';
import ExerciseForm from '../../components/ExerciseForm';
import type { CreateExerciseData, Exercise } from '../../types/api';
import { AppShell, Button, EmptyState, MetricChip, PageHeader, StatusBadge } from '../../components/ui';

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Fuerza',
  functional: 'Funcional',
  core: 'Core',
  endurance: 'Resistencia',
  mobility: 'Movilidad',
  technique: 'Técnica',
};

const EVALUATION_LABELS: Record<string, string> = {
  repetitions: 'Repeticiones',
  weight_reps: 'Peso + reps',
  max_time: 'Tiempo máximo',
  distance: 'Distancia',
  time_to_complete: 'Tiempo para completar',
  amrap: 'AMRAP',
  rounds_reps: 'Rondas + reps',
  qualitative: 'Cualitativo',
};

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
  const navigate = useNavigate();
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
      <PageHeader
        eyebrow="Administración"
        title="Ejercicios"
        description="Mantén el catálogo que se muestra en los perfiles de cliente."
        actions={
          <>
            <Button onClick={() => navigate('/admin/clients')}>
              Clientes
            </Button>
            <Button variant="primary" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2">
              <Plus size={16} />
              Nuevo ejercicio
            </Button>
          </>
        }
      />

      <section className="mb-5 grid grid-cols-3 gap-3">
        <MetricChip label="Total" value={exercises?.length ?? 0} />
        <MetricChip label="Activos" value={activeCount} />
        <MetricChip label="Inactivos" value={inactiveCount} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-elevated/85 shadow-panel backdrop-blur">
        {!exercises || exercises.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay ejercicios" />
          </div>
        ) : (
          exercises.map((ex) => (
            <div key={ex.id} className="flex flex-col gap-3 border-b border-border/70 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-text-primary">{ex.name}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {CATEGORY_LABELS[ex.category] ?? ex.category} · {EVALUATION_LABELS[ex.evaluationType] ?? ex.evaluationType} · {ex.defaultUnit}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  {countJsonItems(ex.measurementFields)} campos de marca · {countJsonItems(ex.variantGroups)} grupos de variantes
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={ex.status} />
                <Button onClick={() => setEditingExercise(ex)}>Editar</Button>
                <Button onClick={() => statusMutation.mutate({ id: ex.id, status: ex.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                  {ex.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Crear ejercicio" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border/70 bg-elevated/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Crear ejercicio</h2>
              <ExerciseForm onSubmit={async (data) => { await createMutation.mutateAsync(data as CreateExerciseData); setShowCreate(false); }} submitLabel="Crear" />
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setShowCreate(false)}>Cerrar</Button>
              </div>
            </div>
          </div>
        )}

        {editingExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Editar ejercicio" onClick={(e) => e.target === e.currentTarget && setEditingExercise(null)}>
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border/70 bg-elevated/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
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
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setEditingExercise(null)}>Cerrar</Button>
              </div>
            </div>
          </div>
        )}
    </AppShell>
  );
}
