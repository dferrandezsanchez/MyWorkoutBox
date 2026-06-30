import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, Clock3, Dumbbell, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import PerformanceForm from '@features/performances/components/PerformanceForm';
import { formatPerformance } from '@features/performances/utils/exerciseTemplates';
import { useExercises } from '@features/exercises/hooks/useExercises';
import { useSessionActions, useTrainingSession } from '@features/training-sessions/hooks/useTrainingSessions';
import { Button, EmptyState, Panel, TextInput } from '@shared/components/ui';
import type { CreatePerformanceData, PerformanceRecord, TrainingSessionExercise } from '@shared/types/api';

function durationLabel(startedAt: string, completedAt?: string | null): string {
  const milliseconds = new Date(completedAt ?? Date.now()).getTime() - new Date(startedAt).getTime();
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export default function TrainingSessionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading, isError } = useTrainingSession(id);
  const { data: exercises = [] } = useExercises();
  const actions = useSessionActions(id);
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{ item: TrainingSessionExercise; record?: PerformanceRecord; copyFrom?: PerformanceRecord } | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  const availableExercises = useMemo(() => {
    const selected = new Set(session?.exercises.map((item) => item.exerciseId));
    const normalized = query.trim().toLowerCase();
    return exercises.filter((exercise) => !selected.has(exercise.id) && (!normalized || exercise.name.toLowerCase().includes(normalized)));
  }, [exercises, query, session?.exercises]);

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
        <Panel className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3">
              <ChevronLeft size={16} /> Volver
            </Button>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/15 text-primary'}`}>
              {active ? 'En curso' : 'Finalizada'}
            </span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Entrenamiento</p>
              <h1 className="mt-1 text-2xl font-semibold text-text-primary">{session.client.firstName} {session.client.lastName}</h1>
              <p className="mt-1 text-sm text-text-secondary">Entrenador: {session.trainerName}</p>
            </div>
            <div className="text-right text-sm text-text-secondary">
              <p className="inline-flex items-center gap-1.5"><Clock3 size={15} /> {durationLabel(session.startedAt, session.completedAt)}</p>
              <p className="mt-1">{session.exercises.length} ejercicios · {seriesTotal} series</p>
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
                        {active && <div className="flex gap-1"><button type="button" aria-label={`Editar serie ${record.seriesNumber}`} onClick={() => setEditor({ item, record })} className="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface focus-ring"><Pencil size={16} /></button><button type="button" aria-label={`Eliminar serie ${record.seriesNumber}`} onClick={() => confirm('¿Eliminar esta serie?') && actions.deleteSeries.mutate(record.id)} className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 focus-ring"><Trash2 size={16} /></button></div>}
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

        {active && <div className="sticky bottom-24 grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-elevated/95 p-2 shadow-xl backdrop-blur lg:bottom-4"><Button variant="primary" onClick={() => setShowPicker(true)} className="inline-flex items-center justify-center gap-2"><Plus size={17} /> Ejercicio</Button><Button onClick={() => seriesTotal > 0 ? setShowComplete(true) : confirm('¿Descartar esta sesión vacía?') && actions.discard.mutateAsync().then(() => navigate('/trainer'))} className="inline-flex items-center justify-center gap-2">{seriesTotal > 0 ? <><CheckCircle2 size={17} /> Finalizar</> : 'Descartar'}</Button></div>}
      </div>

      {showPicker && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center" role="dialog" aria-modal="true"><div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-elevated p-4 sm:rounded-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Añadir ejercicio</h2><button onClick={() => setShowPicker(false)} className="h-10 w-10 rounded-xl focus-ring" aria-label="Cerrar"><X className="mx-auto" size={18} /></button></div><label className="relative mt-3 block"><Search className="absolute left-3 top-3 text-text-secondary" size={18} /><TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ejercicio" className="w-full pl-10" autoFocus /></label><div className="mt-3 divide-y divide-border/60">{availableExercises.map((exercise) => <button key={exercise.id} onClick={() => void addExercise(exercise.id)} className="flex min-h-14 w-full items-center justify-between py-3 text-left focus-ring"><span><span className="block font-semibold">{exercise.name}</span><span className="text-xs text-text-secondary">{exercise.category}</span></span><Plus size={18} className="text-primary" /></button>)}</div></div></div>}

      {editor && <PerformanceForm key={`${editor.item.id}-${editor.record?.id ?? 'new'}-${editor.item.series.length}`} exerciseName={editor.item.exercise.name} defaultUnit={editor.item.exercise.defaultUnit} exercise={editor.item.exercise} initialRecord={editor.record ?? editor.copyFrom} copyMode={Boolean(editor.copyFrom)} onSave={saveSeries} onClose={() => setEditor(null)} />}

      {showComplete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-elevated p-5"><h2 className="text-xl font-semibold">Finalizar sesión</h2><p className="mt-2 text-sm text-text-secondary">Se bloquearán {session.exercises.length} ejercicios y {seriesTotal} series. Esta acción no se puede deshacer.</p><textarea value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} placeholder="Notas de la sesión (opcional)" rows={3} className="mt-4 w-full rounded-xl border border-border bg-surface p-3 focus-ring" /><div className="mt-4 flex justify-end gap-2"><Button onClick={() => setShowComplete(false)}>Cancelar</Button><Button variant="primary" onClick={() => actions.complete.mutateAsync(sessionNotes).then(() => setShowComplete(false))}>Confirmar finalización</Button></div></div></div>}
    </AppShell>
  );
}
