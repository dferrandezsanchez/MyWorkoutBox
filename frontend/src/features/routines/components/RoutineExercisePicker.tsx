import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { NO_GROUP, groupByMuscle } from '@features/exercises/utils/muscle-groups';
import { CATEGORY_LABELS } from '@features/exercises/utils/labels';
import { Dialog, EmptyState, TextInput } from '@shared/components/ui';
import type { Exercise } from '@shared/types/api';

interface RoutineExercisePickerProps {
  exercises: Exercise[];
  /** Exercises already in the routine; they are hidden from the picker. */
  excludedIds: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

/** Search + muscle-group picker, same pattern as the training session picker. */
export function RoutineExercisePicker({ exercises, excludedIds, onSelect, onClose }: RoutineExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');

  const searchable = useMemo(() => {
    const excluded = new Set(excludedIds);
    const normalized = query.trim().toLowerCase();
    return exercises.filter((exercise) => exercise.status === 'ACTIVE'
      && !excluded.has(exercise.id)
      && (!normalized || exercise.name.toLowerCase().includes(normalized)));
  }, [exercises, excludedIds, query]);
  const groups = useMemo(() => groupByMuscle(searchable), [searchable]);
  const hasGroups = groups.some((section) => section.key !== NO_GROUP.key);
  const sections = group === 'all' ? groups : groups.filter((section) => section.key === group);

  return (
    <Dialog label="Añadir ejercicio a la rutina" onClose={onClose} className="max-w-lg">
      <h2 className="pr-10 text-xl font-bold text-text-primary">Añadir ejercicio</h2>
      <label className="relative mt-4 block">
        <span className="sr-only">Buscar ejercicio</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ejercicio" className="w-full rounded-full pl-11" autoFocus />
      </label>
      {hasGroups && groups.length > 1 && (
        <div role="tablist" aria-label="Grupo muscular" className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
          {[{ key: 'all', label: 'Todos' }, ...groups].map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={group === option.key}
              onClick={() => setGroup(option.key)}
              className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 focus-ring ${
                group === option.key ? 'border-primary bg-primary text-primary-contrast' : 'border-white/[0.11] text-text-secondary hover:text-text-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {sections.map((section) => (
        <section key={section.key} className="mt-5">
          {hasGroups && <h3 className="eyebrow mb-1 text-xs text-text-muted">{section.label}</h3>}
          <div className="divide-y divide-white/[0.06]">
            {section.items.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => onSelect(exercise)}
                aria-label={`Añadir ${exercise.name}`}
                className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-lg py-3 text-left focus-ring"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-text-primary">{exercise.name}</span>
                  <span className="text-xs text-text-muted">{CATEGORY_LABELS[exercise.category] ?? exercise.category}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-contrast"><Plus size={17} /></span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {searchable.length === 0 && (
        <div className="mt-4">
          <EmptyState title={query.trim() ? 'No encontramos ejercicios con ese nombre' : 'No quedan ejercicios activos por añadir'} />
        </div>
      )}
    </Dialog>
  );
}
