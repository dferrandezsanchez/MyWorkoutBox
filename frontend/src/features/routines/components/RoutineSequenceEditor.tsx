import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { exerciseCountLabel, planLetter } from '@features/routines/utils/routine-labels';
import type { RoutineTemplate } from '@shared/types/api';

/** Maximum routines in a sequence (client plans and programs). */
export const MAX_SEQUENCE_ROUTINES = 10;

interface RoutineSequenceEditorProps {
  /** Templates in order; repeats are allowed (A → B → A). */
  value: RoutineTemplate[];
  onChange: (value: RoutineTemplate[]) => void;
  /** Active templates offered in the picker. */
  catalog: RoutineTemplate[];
  catalogLoading?: boolean;
  /** Noun used in hints: "serie" or "programa". */
  noun?: string;
  /** Accessible name of the ordered list. */
  listLabel?: string;
}

/**
 * Ordered, lettered list of routine templates with reorder/remove controls and
 * a picker to append more. Shared by client plans and routine programs.
 */
export function RoutineSequenceEditor({ value, onChange, catalog, catalogLoading = false, noun = 'serie', listLabel = 'Rutinas de la serie' }: RoutineSequenceEditorProps) {
  const full = value.length >= MAX_SEQUENCE_ROUTINES;

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div>
      <p className="eyebrow mb-2 text-xs text-text-muted">Orden</p>
      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.12] px-4 py-4 text-center text-sm text-text-secondary">Añade rutinas en el orden en que se alternarán.</p>
      ) : (
        <ol className="space-y-2" aria-label={listLabel}>
          {value.map((routine, index) => (
            <li key={`${routine.id}-${index}`} className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-background/60 py-1.5 pl-2 pr-1">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary-soft">{planLetter(index + 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text-primary">{routine.name}</span>
                {routine.status === 'INACTIVE' && <span className="text-xs text-warning">Archivada</span>}
              </span>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Subir ${planLetter(index + 1)}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-white/[0.05] disabled:opacity-30 focus-ring"><ArrowUp size={16} /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label={`Bajar ${planLetter(index + 1)}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-white/[0.05] disabled:opacity-30 focus-ring"><ArrowDown size={16} /></button>
              <button type="button" onClick={() => onChange(value.filter((_, position) => position !== index))} aria-label={`Quitar ${planLetter(index + 1)}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-danger/10 hover:text-red-200 focus-ring"><Trash2 size={16} /></button>
            </li>
          ))}
        </ol>
      )}

      <p className="eyebrow mb-1 mt-5 text-xs text-text-muted">Añadir rutina</p>
      {catalogLoading && <p className="text-sm text-text-secondary">Cargando rutinas...</p>}
      {!catalogLoading && catalog.length === 0 && <p className="text-sm text-text-secondary">No hay rutinas activas. Crea una en Rutinas.</p>}
      <div className="divide-y divide-white/[0.06]">
        {catalog.map((routine) => (
          <button
            key={routine.id}
            type="button"
            disabled={full}
            onClick={() => onChange([...value, routine])}
            aria-label={`Añadir ${routine.name}`}
            className="group flex min-h-14 w-full items-center justify-between gap-3 py-2.5 text-left disabled:opacity-40 focus-ring"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold text-text-primary">{routine.name}</span>
              <span className="tabular text-xs text-text-muted">{exerciseCountLabel(routine.exercises.length)}</span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-contrast"><Plus size={17} /></span>
          </button>
        ))}
      </div>
      {full && <p className="mt-2 text-xs text-text-muted">Máximo {MAX_SEQUENCE_ROUTINES} rutinas por {noun}.</p>}
    </div>
  );
}
