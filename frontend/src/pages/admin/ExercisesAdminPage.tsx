import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExercises, useCreateExercise, useUpdateExercise, useSetExerciseStatus } from '../../hooks/useExercises';
import ExerciseForm from '../../components/ExerciseForm';
import type { CreateExerciseData, Exercise } from '../../types/api';

export default function ExercisesAdminPage() {
  const navigate = useNavigate();
  const { data: exercises, isLoading, isError } = useExercises(true);
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const statusMutation = useSetExerciseStatus();

  const [showCreate, setShowCreate] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  if (isLoading) return <p className="text-text-secondary">Cargando ejercicios...</p>;
  if (isError) return <p className="text-red-500">Error al cargar ejercicios</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-text-primary">Administración — Ejercicios</h1>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => navigate('/')}
              className="min-h-[44px] px-4 py-2 border border-border rounded-md text-text-primary hover:bg-background"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/admin/clients')}
              className="min-h-[44px] px-4 py-2 border border-border rounded-md text-text-primary hover:bg-background"
            >
              Clientes
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md"
            >
              Nuevo ejercicio
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-3">
          {exercises?.map((ex) => (
            <div key={ex.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-text-primary font-semibold">{ex.name}</p>
                <p className="text-text-secondary text-sm">
                  {ex.category} · {ex.defaultUnit} · {ex.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="min-h-[44px] px-3 py-1 bg-white border border-border rounded-md text-sm" onClick={() => setEditingExercise(ex)}>Editar</button>
                <button className="min-h-[44px] px-3 py-1 bg-white border border-border rounded-md text-sm" onClick={() => statusMutation.mutate({ id: ex.id, status: ex.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>{ex.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}</button>
              </div>
            </div>
          ))}
        </div>

        {showCreate && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Crear ejercicio" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Crear ejercicio</h2>
              <ExerciseForm onSubmit={async (data) => { await createMutation.mutateAsync(data as CreateExerciseData); setShowCreate(false); }} submitLabel="Crear" />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {editingExercise && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Editar ejercicio" onClick={(e) => e.target === e.currentTarget && setEditingExercise(null)}>
            <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md">
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
                <button onClick={() => setEditingExercise(null)} className="px-4 py-2">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
