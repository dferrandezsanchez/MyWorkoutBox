import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCircle2, ChevronLeft, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import PerformanceForm from '@features/performances/components/PerformanceForm';
import { extractVariant } from '@features/performances/utils/exerciseTemplates';
import { useExercises } from '@features/exercises/hooks/useExercises';
import { CATEGORY_LABELS, UNIT_LABELS } from '@features/exercises/utils/labels';
import { useSessionActions, useTrainerSessions, useTrainingSession } from '@features/training-sessions/hooks/useTrainingSessions';
import { Button, ConfirmDialog, Dialog, EmptyState, Panel, TextInput } from '@shared/components/ui';
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

interface SeriesColumn {
  label: string;
  value: (record: PerformanceRecord) => string;
  unit?: string;
}

const SHORT_UNITS: Record<string, string> = {
  kg: 'kg',
  repetitions: 'reps',
  seconds: 's',
  minutes: 'min',
  meters: 'm',
  calories: 'kcal',
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
}

function getSeriesColumns(item: TrainingSessionExercise): SeriesColumn[] {
  const unit = item.series[0]?.unit ?? item.exercise.defaultUnit;
  if (unit === 'kg') {
    return [
      { label: 'Peso', value: (record) => String(record.value), unit: 'kg' },
      { label: 'Reps', value: (record) => (record.repetitions != null ? String(record.repetitions) : '—') },
    ];
  }
  const primary: SeriesColumn = {
    label: unit === 'repetitions' ? 'Reps' : UNIT_LABELS[unit] ?? 'Marca',
    value: (record) => String(record.value),
    unit: unit === 'repetitions' || unit === 'text' ? undefined : SHORT_UNITS[unit],
  };
  if (item.series.some((record) => record.weight)) {
    return [primary, { label: 'Lastre', value: (record) => (record.weight ? `+${record.weight}` : '—'), unit: 'kg' }];
  }
  return [primary];
}

function getSessionVolume(items: TrainingSessionExercise[]): number {
  return items.reduce((total, item) => total + item.series.reduce((itemTotal, record) => {
    if (record.unit === 'kg') return itemTotal + (Number(record.value) || 0) * (record.repetitions ?? 1);
    if (record.weight && record.repetitions) return itemTotal + record.weight * record.repetitions;
    return itemTotal;
  }, 0), 0);
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
  if (isError || !session) return <AppShell title="Sesión"><p className="text-danger">No se pudo cargar la sesión</p></AppShell>;

  const active = session.status === 'ACTIVE';
  const seriesTotal = session.exercises.reduce((total, item) => total + item.series.length, 0);
  const sessionVolume = getSessionVolume(session.exercises);

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
          <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 inline-flex items-center gap-1.5 px-3"><ChevronLeft size={18} /> Volver</Button>
          {active ? (
            <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              En curso
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
              <CheckCircle2 size={14} className="text-primary-soft" />
              Finalizada
            </span>
          )}
        </div>

        <Panel className="relative overflow-hidden p-5 sm:p-6">
          {active && <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary via-primary/40 to-transparent" />}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-text-primary sm:text-3xl">{session.client.firstName} {session.client.lastName}</h1>
              <p className="mt-1 text-sm text-text-muted">Entrenador: {session.trainerName}</p>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="eyebrow text-xs text-text-muted">{active ? 'Tiempo' : 'Duración'}</p>
              <p className="tabular mt-1 font-display text-5xl font-bold leading-none tracking-tight text-text-primary sm:text-6xl">{elapsed}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="tabular rounded-full border border-white/[0.08] bg-background/60 px-3 py-1.5 font-display text-sm font-semibold text-text-primary">{session.exercises.length} ejercicios</span>
            <span className="tabular rounded-full border border-white/[0.08] bg-background/60 px-3 py-1.5 font-display text-sm font-semibold text-text-primary">{seriesTotal} series</span>
          </div>
          {session.client.notes && <p className="mt-4 rounded-xl border border-white/[0.08] bg-background/60 p-3 text-sm leading-6 text-text-secondary">{session.client.notes}</p>}
        </Panel>

        {session.exercises.length === 0 ? (
          <EmptyState title="Aún no hay ejercicios" description="Añade el primer ejercicio conforme comience el entrenamiento." />
        ) : (
          <div className="space-y-4">
            {session.exercises.map((item, index) => (
              <ExerciseCard
                key={item.id}
                item={item}
                position={index + 1}
                active={active}
                onRemove={() => actions.removeExercise.mutate(item.id)}
                onEdit={(record) => setEditor({ item, record })}
                onDelete={setRecordToDelete}
                onAdd={() => setEditor({ item, copyFrom: item.series.at(-1) })}
              />
            ))}
          </div>
        )}

        {sessionVolume > 0 && (
          <Panel className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="eyebrow text-xs text-text-muted">Volumen de la sesión</p>
              <p className="tabular mt-1.5 font-display text-3xl font-bold leading-none tracking-tight text-text-primary">
                {formatNumber(sessionVolume)}
                <span className="ml-1.5 text-base font-semibold text-text-muted">kg</span>
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-xs text-text-muted">Series</p>
              <p className="tabular mt-1.5 font-display text-3xl font-bold leading-none tracking-tight text-text-primary">{seriesTotal}</p>
            </div>
          </Panel>
        )}

        {session.notes && (
          <Panel className="p-4 sm:p-5">
            <p className="eyebrow text-xs text-text-muted">Notas de la sesión</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{session.notes}</p>
          </Panel>
        )}

        {active && (
          <div className="sticky bottom-24 z-20 grid grid-cols-2 gap-2 rounded-full border border-white/[0.08] bg-surface p-1.5 shadow-panel lg:bottom-4">
            <Button variant={session.exercises.length === 0 ? 'primary' : 'secondary'} onClick={() => setShowPicker(true)} className="inline-flex items-center justify-center gap-2">
              <Plus size={17} /> Ejercicio
            </Button>
            {seriesTotal > 0 ? (
              <Button onClick={() => setShowComplete(true)} className="inline-flex items-center justify-center gap-2">
                <CheckCircle2 size={17} /> Finalizar
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setShowDiscard(true)} className="text-danger hover:bg-danger/10 hover:text-danger">
                Descartar
              </Button>
            )}
          </div>
        )}
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Añadir ejercicio">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-surface p-5 shadow-panel sm:rounded-3xl sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-text-primary">Añadir ejercicio</h2>
              <button onClick={() => setShowPicker(false)} className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary focus-ring" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <label className="relative mt-4 block">
              <span className="sr-only">Buscar ejercicio</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ejercicio" className="w-full rounded-full pl-11" autoFocus />
            </label>
            {recentExercises.length > 0 && <ExercisePickerSection title="Recientes" exercises={recentExercises} onSelect={addExercise} />}
            <ExercisePickerSection title={recentExercises.length > 0 ? 'Todos los ejercicios' : undefined} exercises={otherExercises} onSelect={addExercise} />
            {availableExercises.length === 0 && <div className="mt-4"><EmptyState title="No encontramos ejercicios con ese nombre" /></div>}
          </div>
        </div>
      )}

      {editor && <PerformanceForm key={`${editor.item.id}-${editor.record?.id ?? 'new'}-${editor.item.series.length}`} context="session" exerciseName={editor.item.exercise.name} defaultUnit={editor.item.exercise.defaultUnit} exercise={editor.item.exercise} initialRecord={editor.record ?? editor.copyFrom} copyMode={Boolean(editor.copyFrom)} onSave={saveSeries} onClose={() => setEditor(null)} />}

      {showComplete && (
        <Dialog label="Finalizar sesión" onClose={() => setShowComplete(false)} className="max-w-md">
          <h2 className="pr-10 text-xl font-bold text-text-primary">Finalizar sesión</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">Se bloquearán <span className="tabular font-semibold text-text-primary">{session.exercises.length} ejercicios</span> y <span className="tabular font-semibold text-text-primary">{seriesTotal} series</span>. Esta acción no se puede deshacer.</p>
          <label htmlFor="session-notes" className="sr-only">Notas de la sesión</label>
          <textarea id="session-notes" value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} placeholder="Notas de la sesión (opcional)" rows={3} className="mt-4 w-full resize-none rounded-xl border border-border bg-background/60 p-3 text-sm text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25" />
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setShowComplete(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => actions.complete.mutateAsync(sessionNotes).then(() => setShowComplete(false))}>Confirmar finalización</Button>
          </div>
        </Dialog>
      )}

      {showDiscard && <ConfirmDialog title="Descartar sesión" description="Se eliminarán los ejercicios y series registrados en esta sesión. Esta acción no se puede deshacer." confirmLabel="Descartar" pending={actions.discard.isPending} onCancel={() => setShowDiscard(false)} onConfirm={() => void actions.discard.mutateAsync().then(() => navigate('/trainer'))} />}

      {recordToDelete && <ConfirmDialog title="Eliminar serie" description="Esta serie dejará de formar parte del entrenamiento." confirmLabel="Eliminar" pending={actions.deleteSeries.isPending} onCancel={() => setRecordToDelete(null)} onConfirm={() => void actions.deleteSeries.mutateAsync(recordToDelete.id).then(() => setRecordToDelete(null))} />}
    </AppShell>
  );
}

function ExerciseCard({
  item,
  position,
  active,
  onRemove,
  onEdit,
  onDelete,
  onAdd,
}: {
  item: TrainingSessionExercise;
  position: number;
  active: boolean;
  onRemove: () => void;
  onEdit: (record: PerformanceRecord) => void;
  onDelete: (record: PerformanceRecord) => void;
  onAdd: () => void;
}) {
  const columns = getSeriesColumns(item);

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="eyebrow text-xs text-text-muted">
            <span className="tabular">Ejercicio {String(position).padStart(2, '0')}</span>
            {CATEGORY_LABELS[item.exercise.category] ? ` · ${CATEGORY_LABELS[item.exercise.category]}` : ''}
          </p>
          <h2 className="mt-1.5 truncate text-xl font-bold text-text-primary">{item.exercise.name}</h2>
          <p className="tabular mt-0.5 text-xs text-text-muted">{item.series.length} series</p>
        </div>
        {active && item.series.length === 0 && (
          <button type="button" aria-label="Quitar ejercicio" onClick={onRemove} className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-ring"><X size={18} /></button>
        )}
      </div>

      {item.series.length > 0 && (
        <div className="px-2 sm:px-3">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                <th scope="col" className="w-12 px-1.5 pb-2 sm:px-2 font-semibold">Serie</th>
                {columns.map((column) => <th key={column.label} scope="col" className="px-1.5 pb-2 sm:px-2 font-semibold">{column.label}</th>)}
                <th scope="col" className="w-12 px-1.5 pb-2 sm:px-2 text-center font-semibold">Hecha</th>
                {active && <th scope="col" className="w-[92px] px-0 pb-2"><span className="sr-only">Acciones</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
              {item.series.map((record, index) => {
                const seriesNumber = record.seriesNumber ?? index + 1;
                const variant = extractVariant(record);
                return (
                  <tr key={record.id} className="align-middle">
                    <td className="px-1.5 py-3 sm:px-2">
                      <span className="tabular flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-background/60 font-display text-sm font-bold text-text-secondary">{seriesNumber}</span>
                    </td>
                    {columns.map((column, columnIndex) => {
                      const value = column.value(record);
                      return (
                        <td key={column.label} className="px-1.5 py-3 sm:px-2">
                          <span className="tabular font-display text-lg font-bold text-text-primary sm:text-xl">{value}</span>
                          {column.unit && value !== '—' && <span className="ml-1 text-xs font-semibold text-text-muted">{column.unit}</span>}
                          {columnIndex === 0 && variant && <span className="block truncate text-xs text-text-muted">{variant}</span>}
                        </td>
                      );
                    })}
                    <td className="px-1.5 py-3 sm:px-2">
                      <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-contrast">
                        <Check size={15} strokeWidth={3} aria-hidden="true" />
                        <span className="sr-only">Registrada</span>
                      </span>
                    </td>
                    {active && (
                      <td className="py-2 pl-0 pr-1">
                        <div className="flex justify-end">
                          <button type="button" aria-label={`Editar serie ${seriesNumber}`} onClick={() => onEdit(record)} className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/[0.05] hover:text-text-primary focus-ring"><Pencil size={16} /></button>
                          <button type="button" aria-label={`Eliminar serie ${seriesNumber}`} onClick={() => onDelete(record)} className="flex h-11 w-11 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-ring"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="p-4 pt-3 sm:p-5 sm:pt-3">
          <Button variant="primary" onClick={onAdd} className="inline-flex min-h-12 w-full items-center justify-center gap-2"><Plus size={18} /> Añadir serie</Button>
        </div>
      )}
      {!active && item.series.length > 0 && <div className="h-2" />}
    </Panel>
  );
}

function ExercisePickerSection({ title, exercises, onSelect }: { title?: string; exercises: { id: string; name: string; category: string }[]; onSelect: (exerciseId: string) => Promise<void> }) {
  if (exercises.length === 0) return null;
  return (
    <section className="mt-5">
      {title && <h3 className="eyebrow mb-1 text-xs text-text-muted">{title}</h3>}
      <div className="divide-y divide-white/[0.06]">
        {exercises.map((exercise) => (
          <button key={exercise.id} onClick={() => void onSelect(exercise.id)} className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-lg py-3 text-left focus-ring">
            <span className="min-w-0">
              <span className="block truncate font-semibold text-text-primary">{exercise.name}</span>
              <span className="text-xs text-text-muted">{CATEGORY_LABELS[exercise.category] ?? exercise.category}</span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-contrast"><Plus size={17} /></span>
          </button>
        ))}
      </div>
    </section>
  );
}
