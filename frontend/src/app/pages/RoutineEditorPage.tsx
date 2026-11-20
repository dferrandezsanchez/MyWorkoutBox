import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Archive, ArchiveRestore, ChevronLeft } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { useExercises } from '@features/exercises/hooks/useExercises';
import { RoutineEditorForm } from '@features/routines/components/RoutineEditorForm';
import { useCanManageRoutines, useRoutine, useSaveRoutine, useSetRoutineStatus } from '@features/routines/hooks/useRoutines';
import { exerciseCountLabel } from '@features/routines/utils/routine-labels';
import { Button, ConfirmDialog, PageHeader } from '@shared/components/ui';
import type { RoutineTemplateInput } from '@shared/types/api';

export default function RoutineEditorPage() {
  const { id = '' } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const modeQuery = location.search.includes('mode=admin') ? '?mode=admin' : '';
  const canManage = useCanManageRoutines();
  const { data: routine, isLoading, isError } = useRoutine(id);
  const { data: exercises = [], isLoading: isLoadingExercises } = useExercises(canManage);
  const save = useSaveRoutine();
  const setStatus = useSetRoutineStatus();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const backToList = () => { void navigate(`/routines${modeQuery}`); };
  const back = (
    <Button variant="ghost" onClick={backToList} className="-ml-2 inline-flex items-center gap-1.5 px-3">
      <ChevronLeft size={18} />
      Rutinas
    </Button>
  );

  if (isNew && !canManage) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          {back}
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">No tienes permiso para crear rutinas</p>
        </div>
      </AppShell>
    );
  }

  if ((!isNew && isLoading) || (canManage && isLoadingExercises)) {
    return <AppShell><p className="text-text-secondary">Cargando rutina...</p></AppShell>;
  }

  if (!isNew && (isError || !routine)) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          {back}
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">No se pudo cargar la rutina</p>
        </div>
      </AppShell>
    );
  }

  const archived = routine?.status === 'INACTIVE';

  const submit = async (data: RoutineTemplateInput) => {
    await save.mutateAsync({ id: routine?.id, data });
    backToList();
  };

  const changeStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (!routine) return;
    setStatusError(null);
    try {
      await setStatus.mutateAsync({ id: routine.id, status });
      setConfirmArchive(false);
    } catch {
      setStatusError(status === 'INACTIVE' ? 'No se pudo archivar la rutina' : 'No se pudo restaurar la rutina');
      setConfirmArchive(false);
    }
  };

  let title = 'Nueva rutina';
  if (routine) title = routine.name;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <PageHeader
          eyebrow={archived ? 'Rutina archivada' : 'Rutina'}
          title={title}
          description={routine ? exerciseCountLabel(routine.exercises.length) : 'Añade los ejercicios en el orden en que se harán.'}
        />

        {statusError && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{statusError}</p>}

        <RoutineEditorForm
          key={routine?.updatedAt ?? 'new'}
          initial={routine}
          exercises={exercises}
          readOnly={!canManage}
          submitLabel={isNew ? 'Crear rutina' : 'Guardar cambios'}
          onSubmit={submit}
          actions={routine && canManage ? (
            archived ? (
              <Button type="button" variant="secondary" onClick={() => void changeStatus('ACTIVE')} disabled={setStatus.isPending} className="inline-flex items-center justify-center gap-2">
                <ArchiveRestore size={16} />
                Restaurar
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirmArchive(true)} className="inline-flex items-center justify-center gap-2">
                <Archive size={16} />
                Archivar
              </Button>
            )
          ) : undefined}
        />

        {confirmArchive && (
          <ConfirmDialog
            title="¿Archivar esta rutina?"
            description="Dejará de aparecer al preparar nuevas series. Las series de clientes que ya la usan no cambian."
            confirmLabel="Archivar"
            pending={setStatus.isPending}
            onCancel={() => setConfirmArchive(false)}
            onConfirm={() => void changeStatus('INACTIVE')}
          />
        )}
      </div>
    </AppShell>
  );
}
