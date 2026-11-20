import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Archive, ArchiveRestore, ChevronLeft, Info } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { RoutineProgramClients } from '@features/routines/components/RoutineProgramClients';
import { RoutineProgramForm } from '@features/routines/components/RoutineProgramForm';
import {
  useCanManageRoutines,
  useRoutineProgram,
  useRoutines,
  useSaveRoutineProgram,
  useSetRoutineProgramStatus,
} from '@features/routines/hooks/useRoutines';
import { clientCountLabel, routineCountLabel, sortedProgramItems } from '@features/routines/utils/routine-labels';
import { Button, ConfirmDialog, PageHeader } from '@shared/components/ui';
import type { RoutineProgramInput } from '@shared/types/api';

function archiveDescription(followers: number): string {
  const base = 'Dejará de ofrecerse al asignar series.';
  if (followers === 0) return base;
  if (followers === 1) return `${base} El cliente que lo sigue lo mantiene.`;
  return `${base} Los ${followers} clientes que lo siguen lo mantienen.`;
}

export default function RoutineProgramEditorPage() {
  const { id = '' } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const modeQuery = location.search.includes('mode=admin') ? '?mode=admin' : '';
  const canManage = useCanManageRoutines();
  const { data: program, isLoading, isError } = useRoutineProgram(id);
  const { data: templates = [], isLoading: isLoadingTemplates } = useRoutines();
  const save = useSaveRoutineProgram();
  const setStatus = useSetRoutineProgramStatus();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const listPath = `/routines?${modeQuery ? 'mode=admin&' : ''}tab=programas`;
  const backToList = () => { void navigate(listPath); };
  const back = (
    <Button variant="ghost" onClick={backToList} className="-ml-2 inline-flex items-center gap-1.5 px-3">
      <ChevronLeft size={18} />
      Programas
    </Button>
  );

  if (isNew && !canManage) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          {back}
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">No tienes permiso para crear programas</p>
        </div>
      </AppShell>
    );
  }

  if (!isNew && isLoading) {
    return <AppShell><p className="text-text-secondary">Cargando programa...</p></AppShell>;
  }

  if (!isNew && (isError || !program)) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          {back}
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">No se pudo cargar el programa</p>
        </div>
      </AppShell>
    );
  }

  const archived = program?.status === 'INACTIVE';
  const followers = program?.activeClientCount ?? 0;

  const submit = async (data: RoutineProgramInput) => {
    await save.mutateAsync({ id: program?.id, data });
    backToList();
  };

  const changeStatus = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (!program) return;
    setStatusError(null);
    try {
      await setStatus.mutateAsync({ id: program.id, status });
    } catch {
      setStatusError(status === 'INACTIVE' ? 'No se pudo archivar el programa' : 'No se pudo restaurar el programa');
    } finally {
      setConfirmArchive(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <PageHeader
          eyebrow={archived ? 'Programa archivado' : 'Programa'}
          title={program?.name ?? 'Nuevo programa'}
          description={program
            ? `${routineCountLabel(program.items.length)} · ${clientCountLabel(followers)}`
            : 'Ordena las rutinas que alternarán los clientes que lo sigan.'}
        />

        {canManage && followers > 0 && (
          <p className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm text-text-secondary">
            <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-primary-soft" />
            {followers === 1 ? 'Los cambios se aplican a su cliente.' : `Los cambios se aplican a sus ${followers} clientes.`}
          </p>
        )}

        {statusError && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{statusError}</p>}

        <RoutineProgramForm
          key={program?.updatedAt ?? 'new'}
          initial={program}
          catalog={templates}
          catalogLoading={isLoadingTemplates}
          readOnly={!canManage}
          submitLabel={isNew ? 'Crear programa' : 'Guardar cambios'}
          onSubmit={submit}
          actions={program && canManage ? (
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

        {program && (
          <div className="pt-4">
            <RoutineProgramClients programId={program.id} items={sortedProgramItems(program)} linkSuffix={modeQuery} />
          </div>
        )}

        {confirmArchive && (
          <ConfirmDialog
            title="¿Archivar este programa?"
            description={archiveDescription(followers)}
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
