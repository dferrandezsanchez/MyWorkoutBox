import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Clock3, Dumbbell, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import PerformanceForm from '@features/performances/components/PerformanceForm';
import { formatPerformance } from '@features/performances/utils/exerciseTemplates';
import { useExercises } from '@features/exercises/hooks/useExercises';
import { useSessionActions, useTrainerSessions, useTrainingSession } from '@features/training-sessions/hooks/useTrainingSessions';
import { Button, ConfirmDialog, EmptyState, Panel, TextInput } from '@shared/components/ui';
import type { CreatePerformanceData, PerformanceRecord, TrainingSessionExercise } from '@shared/types/api';

function formatElapsed(startedAt?: string, completedAt?: string | null): string {
  if (!startedAt) return '00:00:00';
  const seconds = Math.max(0, Math.floor((new Date(completedAt ?? Date.now()).getTime() - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours, minutes, seconds % 60].map((value) => String(value).padStart(2, '0')).join(':');
}

function useElapsedTime(startedAt?: string, completedAt?: string | null, active = false): string {
  const [elapsed, setElapsed] = useState(() => formatElapsed(startedAt, completedAt));
  useEffect(() => {
    setElapsed(formatElapsed(startedAt, completedAt));
    if (!active) return undefined;
    const timer = window.setInterval(() => setElapsed(formatElapsed(startedAt)), 1000);
    return () => window.clearInterval(timer);
  }, [active, completedAt, startedAt]);
  return elapsed;
}

export default function TrainingSessionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading, isError } = useTrainingSession(id);
  const { data: recentSessions = [] } = useTrainerSessions(20);
  const { data: exercises = [] } = useExercises();
  const actions = useSessionActions(id);
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ item: TrainingSessionExercise; record?: PerformanceRecord; copyFrom?: PerformanceRecord } | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PerformanceRecord | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const elapsed = useElapsedTime(session?.startedAt, session?.completedAt, session?.status === 'ACTIVE');

  const availableExercises = useMemo(() => {
    const selected = new Set(session?.exercises.map((item) => item.exerciseId));
    const normalized = query.trim().toLowerCase();
    return exercises.filter((exercise) => !selected.has(exercise.id) && (!normalized || exercise.name.toLowerCase().includes(normalized)));
  }, [exercises, query, session?.exercises]);
  const recentExerciseIds = useMemo(() => {
    const availableIds = new Set(availableExercises.map((exercise) => exercise.id));
    const ids: string[] = [];
    recentSessions.forEach((recentSession) => {
      recentSession.exercises.forEach((item) => {
        if (availableIds.has(item.exerciseId) && !ids.includes(item.exerciseId)) ids.push(item.exerciseId);
      });
    });
    return ids.slice(0, 4);
  }, [availableExercises, recentSessions]);
  const recentExercises = recentExerciseIds
    .map((exerciseId) => availableExercises.find((exercise) => exercise.id === exerciseId))
    .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise));
  const otherExercises = availableExercises.filter((exercise) => !recentExerciseIds.includes(exercise.id));

  if (isLoading) return <AppShell title="Sesión"><p className="text-text-secondary">Cargando sesión...</p></AppShell>;
  if (isError || !session) return <AppShell title="Sesión"><p className="text-red-500">No se pudo cargar la sesión</p></AppShell>;

  const active = session.status === 'ACTIVE';
  const seriesTotal = session.exercises.reduce((total, item) => total + item.series.length, 0);

  const addExercise = async (exerciseId: string) => {
    const updated = await actions.addExercise.mutateAsync(exerciseId);
    const item = updated.exercises.find((entry) => entry.exerciseId === exerciseId);
    setShowPicker(false);
    setQuery('');
    if (item) setEditor({ item });
  };

  const saveSeries = async (data: CreatePerformanceData) => {
    if (!editor) return;
    if (editor.record) {
      await actions.updateSeries.mutateAsync({ recordId: editor.record.id, data });
    } else {
      await actions.createSeries.mutateAsync({ itemId: editor.item.id, data });
    }
  };

  return (
    <AppShell title={active ? 'Sesión activa' : 'Detalle de sesión'}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3"><ChevronLeft size={16} /> Volver</Button>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${active ? 'bg-emerald-500/12 text-emerald-600' : 'bg-primary/15 text-primary'}`}><span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-primary'}`} />{active ? 'En curso' : 'Finalizada'}</span>
        </div>
        <Panel className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="mt-1 text-2xl font-semibold text-text-primary">{session.client.firstName} {session.client.lastName}</h1>
              <p className="mt-1 text-sm text-text-secondary">Entrenador: {session.trainerName}</p>
            </div>
            <div className="shrink-0 rounded-xl border border-border/70 bg-surface/70 px-3 py-2 text-right">
              <p className="inline-flex items-center gap-1.5 font-mono text-base font-semibold text-text-primary"><Clock3 size={15} /> {elapsed}</p>
              <p className="mt-1 text-xs text-text-secondary">{session.exercises.length} ejercicios · {seriesTotal} series</p>
            </div>
          </div>
          {session.client.notes && <p className="mt-4 rounded-xl bg-surface/70 p-3 text-sm text-text-secondary">{session.client.notes}</p>}
        </Panel>

        {session.exercises.length === 0 ? (
          <EmptyState title="Aún no hay ejercicios" description="Añade el primer ejercicio conforme comience el entrenamiento." />
        ) : (
          <div className="space-y-3">
            {session.exercises.map((item) => (
              <Panel key={item.id} className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><Dumbbell size={19} /></span>
                    <div className="min-w-0"><h2 className="truncate font-semibold text-text-primary">{item.exercise.name}</h2><p className="text-xs text-text-secondary">{item.series.length} series</p></div>
                  </div>
                  {active && item.series.length === 0 && (
                    <button type="button" aria-label="Quitar ejercicio" onClick={() => actions.removeExercise.mutate(item.id)} className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 focus-ring"><X size={18} /></button>
                  )}
                </div>
                {item.series.length > 0 && (
                  <div className="divide-y divide-border/60">
                    {item.series.map((record) => (
                      <div key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div><p className="text-xs font-semibold uppercase text-text-secondary">Serie {record.seriesNumber}</p><p className="mt-0.5 font-semibold text-text-primary">{formatPerformance(record)}</p></div>
                        {active && <div className="flex gap-1"><button type="button" aria-label={`Editar serie ${record.seriesNumber}`} onClick={() => setEditor({ item, record })} className="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface focus-ring"><Pencil size={16} /></button><button type="button" aria-label={`Eliminar serie ${record.seriesNumber}`} onClick={() => setRecordToDelete(record)} className="flex h-10 w-10 items-center justify-center rounded-xl text-danger hover:bg-danger/10 focus-ring"><Trash2 size={16} /></button></div>}
                      </div>
                    ))}
                  </div>
                )}
                {active && <div className="p-3"><Button variant="primary" onClick={() => setEditor({ item, copyFrom: item.series.at(-1) })} className="inline-flex w-full items-center justify-center gap-2"><Plus size={16} /> Añadir serie</Button></div>}
              </Panel>
            ))}
          </div>
        )}

        {session.notes && <Panel className="p-4"><p className="text-sm font-semibold text-text-primary">Notas de la sesión</p><p className="mt-2 text-sm text-text-secondary">{session.notes}</p></Panel>}

        {active && (
          <div className="sticky bottom-24 z-20 grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-elevated/95 p-2 shadow-xl backdrop-blur lg:bottom-4">
            <Button variant="primary" onClick={() => setShowPicker(true)} className="inline-flex items-center justify-center gap-2">
              <Plus size={17} /> Ejercicio
            </Button>
            {seriesTotal > 0 ? (
              <Button onClick={() => setShowComplete(true)} className="inline-flex items-center justify-center gap-2">
                <CheckCircle2 size={17} /> Finalizar
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setShowDiscard(true)} className="text-danger hover:text-danger">
                Descartar
              </Button>
            )}
          </div>
        )}
      </div>

      {showPicker && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center" role="dialog" aria-modal="true" aria-label="Añadir ejercicio"><div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-elevated p-4 sm:rounded-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Añadir ejercicio</h2><button onClick={() => setShowPicker(false)} className="h-10 w-10 rounded-xl focus-ring" aria-label="Cerrar"><X className="mx-auto" size={18} /></button></div><label className="relative mt-3 block"><Search className="absolute left-3 top-3 text-text-secondary" size={18} /><TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ejercicio" className="w-full pl-10" autoFocus /></label>{recentExercises.length > 0 && <ExercisePickerSection title="Recientes" exercises={recentExercises} onSelect={addExercise} />}<ExercisePickerSection title={recentExercises.length > 0 ? 'Todos los ejercicios' : undefined} exercises={otherExercises} onSelect={addExercise} />{availableExercises.length === 0 && <div className="mt-4"><EmptyState title="No encontramos ejercicios con ese nombre" /></div>}</div></div>}

      {editor && <PerformanceForm key={`${editor.item.id}-${editor.record?.id ?? 'new'}-${editor.item.series.length}`} context="session" exerciseName={editor.item.exercise.name} defaultUnit={editor.item.exercise.defaultUnit} exercise={editor.item.exercise} initialRecord={editor.record ?? editor.copyFrom} copyMode={Boolean(editor.copyFrom)} onSave={saveSeries} onClose={() => setEditor(null)} />}

      {showComplete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-elevated p-5"><h2 className="text-xl font-semibold">Finalizar sesión</h2><p className="mt-2 text-sm text-text-secondary">Se bloquearán {session.exercises.length} ejercicios y {seriesTotal} series. Esta acción no se puede deshacer.</p><textarea value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} placeholder="Notas de la sesión (opcional)" rows={3} className="mt-4 w-full rounded-xl border border-border bg-surface p-3 focus-ring" /><div className="mt-4 flex justify-end gap-2"><Button onClick={() => setShowComplete(false)}>Cancelar</Button><Button variant="primary" onClick={() => actions.complete.mutateAsync(sessionNotes).then(() => setShowComplete(false))}>Confirmar finalización</Button></div></div></div>}

      {showDiscard && <ConfirmDialog title="Descartar sesión" description="Se eliminarán los ejercicios y series registrados en esta sesión. Esta acción no se puede deshacer." confirmLabel="Descartar" pending={actions.discard.isPending} onCancel={() => setShowDiscard(false)} onConfirm={() => void actions.discard.mutateAsync().then(() => navigate('/trainer'))} />}

      {recordToDelete && <ConfirmDialog title="Eliminar serie" description="Esta serie dejará de formar parte del entrenamiento." confirmLabel="Eliminar" pending={actions.deleteSeries.isPending} onCancel={() => setRecordToDelete(null)} onConfirm={() => void actions.deleteSeries.mutateAsync(recordToDelete.id).then(() => setRecordToDelete(null))} />}
    </AppShell>
  );
}

function ExercisePickerSection({ title, exercises, onSelect }: { title?: string; exercises: { id: string; name: string; category: string }[]; onSelect: (exerciseId: string) => Promise<void> }) {
  if (exercises.length === 0) return null;
  return (
    <section className="mt-4">
      {title && <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>}
      <div className="divide-y divide-border/60">
        {exercises.map((exercise) => <button key={exercise.id} onClick={() => void onSelect(exercise.id)} className="flex min-h-14 w-full items-center justify-between py-3 text-left focus-ring"><span><span className="block font-semibold">{exercise.name}</span><span className="text-xs text-text-secondary">{exercise.category}</span></span><Plus size={18} className="text-primary" /></button>)}
      </div>
    </section>
  );
}
