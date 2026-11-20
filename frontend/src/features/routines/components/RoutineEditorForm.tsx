import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { RoutineExercisePicker } from '@features/routines/components/RoutineExercisePicker';
import { formatTarget } from '@features/routines/utils/routine-labels';
import { Button, EmptyState, Panel, TextInput } from '@shared/components/ui';
import type { Exercise, RoutineTemplate, RoutineTemplateInput } from '@shared/types/api';

interface EditorItem {
  key: string;
  exerciseId: string;
  exercise?: Exercise;
  targetSets: string;
  targetReps: string;
  notes: string | null;
}

interface RoutineEditorFormProps {
  initial?: RoutineTemplate;
  /** Catalog used by the picker and to resolve names. */
  exercises: Exercise[];
  readOnly?: boolean;
  submitLabel?: string;
  onSubmit: (data: RoutineTemplateInput) => Promise<void>;
  /** Extra actions rendered next to the submit button (e.g. archive). */
  actions?: ReactNode;
}

const MAX_SETS = 20;
let keySequence = 0;
const nextKey = () => `item-${++keySequence}`;

function toItems(template?: RoutineTemplate): EditorItem[] {
  return (template?.exercises ?? []).map((item) => ({
    key: nextKey(),
    exerciseId: item.exerciseId,
    exercise: item.exercise,
    targetSets: item.targetSets != null ? String(item.targetSets) : '',
    targetReps: item.targetReps ?? '',
    notes: item.notes,
  }));
}

export function RoutineEditorForm({ initial, exercises, readOnly = false, submitLabel = 'Guardar rutina', onSubmit, actions }: RoutineEditorFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [items, setItems] = useState<EditorItem[]>(() => toItems(initial));
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const catalog = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const resolve = (item: EditorItem) => catalog.get(item.exerciseId) ?? item.exercise;
  const archivedCount = items.filter((item) => resolve(item)?.status === 'INACTIVE').length;

  const move = (index: number, offset: -1 | 1) => {
    setItems((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const update = (key: string, patch: Partial<EditorItem>) => {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const addExercise = (exercise: Exercise) => {
    setItems((current) => [...current, { key: nextKey(), exerciseId: exercise.id, exercise, targetSets: '', targetReps: '', notes: null }]);
    setShowPicker(false);
    setError(null);
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Pon un nombre a la rutina';
    if (items.length === 0) return 'Añade al menos un ejercicio';
    if (archivedCount > 0) return 'Quita los ejercicios archivados para guardar';
    const invalidSets = items.some((item) => {
      if (!item.targetSets.trim()) return false;
      const sets = Number(item.targetSets);
      return !Number.isInteger(sets) || sets < 1 || sets > MAX_SETS;
    });
    if (invalidSets) return `Las series deben estar entre 1 y ${MAX_SETS}`;
    return null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        notes: notes.trim() || null,
        exercises: items.map((item) => ({
          exerciseId: item.exerciseId,
          targetSets: item.targetSets.trim() ? Number(item.targetSets) : null,
          targetReps: item.targetReps.trim() || null,
          notes: item.notes,
        })),
      });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? 'No se pudo guardar la rutina');
    } finally {
      setSaving(false);
    }
  };

  if (readOnly) {
    return (
      <div className="space-y-4">
        {initial?.notes && <Panel className="border-l-2 border-l-primary/70 p-4 text-sm leading-6 text-text-secondary">{initial.notes}</Panel>}
        <Panel className="overflow-hidden">
          <ol className="divide-y divide-white/[0.06]">
            {items.map((item, index) => {
              const target = formatTarget({ targetSets: item.targetSets ? Number(item.targetSets) : null, targetReps: item.targetReps || null });
              return (
                <li key={item.key} className="flex min-h-14 items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-background/60 text-sm font-bold text-text-secondary">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-text-primary">{resolve(item)?.name ?? 'Ejercicio'}</span>
                  {target && <span className="tabular shrink-0 text-sm text-text-secondary">{target}</span>}
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5" noValidate>
      <Panel className="space-y-4 p-4 sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-text-primary">Nombre</span>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={191} placeholder="Ej. Rutina A · Empuje" className="w-full" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-text-primary">Notas <span className="font-normal text-text-muted">(opcional)</span></span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Calentamiento, descansos, indicaciones..."
            className="w-full resize-none rounded-xl border border-border bg-background/60 p-3 text-sm text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </label>
      </Panel>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="eyebrow">Orden</p>
            <h2 className="mt-1.5 text-lg font-bold text-text-primary">Ejercicios</h2>
          </div>
          <span className="tabular text-sm text-text-muted">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <EmptyState title="Aún no hay ejercicios" description="Añádelos en el orden en que se harán." />
        ) : (
          <ol className="space-y-2" aria-label="Ejercicios de la rutina">
            {items.map((item, index) => {
              const exercise = resolve(item);
              const exerciseName = exercise?.name ?? 'Ejercicio';
              return (
                <li key={item.key}>
                  <Panel className="p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <span className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-sm font-bold text-primary-soft">{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-text-primary">{exerciseName}</span>
                        {exercise?.status === 'INACTIVE' && <span className="text-xs font-semibold text-warning">Ejercicio archivado</span>}
                      </span>
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${exerciseName}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary disabled:opacity-30 focus-ring"><ArrowUp size={17} /></button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Bajar ${exerciseName}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary disabled:opacity-30 focus-ring"><ArrowDown size={17} /></button>
                      <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))} aria-label={`Quitar ${exerciseName}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-danger/10 hover:text-red-200 focus-ring"><Trash2 size={17} /></button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 pl-10">
                      <label className="block">
                        <span className="mb-1 block text-xs text-text-muted">Series</span>
                        <TextInput
                          inputMode="numeric"
                          value={item.targetSets}
                          onChange={(event) => update(item.key, { targetSets: event.target.value.replace(/\D/g, '').slice(0, 2) })}
                          placeholder="—"
                          aria-label={`Series de ${exerciseName}`}
                          className="tabular w-full"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs text-text-muted">Repeticiones</span>
                        <TextInput
                          value={item.targetReps}
                          onChange={(event) => update(item.key, { targetReps: event.target.value.slice(0, 64) })}
                          placeholder="8-10"
                          aria-label={`Repeticiones de ${exerciseName}`}
                          className="tabular w-full"
                        />
                      </label>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ol>
        )}

        <Button type="button" variant="secondary" onClick={() => setShowPicker(true)} className="mt-3 inline-flex w-full items-center justify-center gap-2">
          <Plus size={17} />
          Añadir ejercicio
        </Button>
      </section>

      {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {actions}
        <Button type="submit" variant="primary" disabled={saving} className="sm:min-w-[180px]">
          {saving ? 'Guardando...' : submitLabel}
        </Button>
      </div>

      {showPicker && (
        <RoutineExercisePicker
          exercises={exercises}
          excludedIds={items.map((item) => item.exerciseId)}
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </form>
  );
}
