import { useMemo, useState } from 'react';
import axios from 'axios';
import { Check, Search } from 'lucide-react';
import { Button, Dialog, EmptyState, TextInput } from '@shared/components/ui';
import type { ExerciseLibraryImportResult, ExerciseLibraryItem } from '@shared/types/api';
import { useExerciseLibrary, useImportExerciseLibrary } from '@features/exercises/hooks/useExercises';
import { EVALUATION_LABELS } from '@features/exercises/utils/labels';
import { groupByMuscle } from '@features/exercises/utils/muscle-groups';

interface ExerciseLibraryDialogProps {
  onClose: () => void;
  onImported: (result: ExerciseLibraryImportResult) => void;
}

const ALL = 'all';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return 'No se pudieron añadir los ejercicios.';
}

function matches(item: ExerciseLibraryItem, query: string): boolean {
  return !query || item.name.toLowerCase().includes(query);
}

export function ExerciseLibraryDialog({ onClose, onImported }: ExerciseLibraryDialogProps) {
  const { data: library, isLoading, isError } = useExerciseLibrary();
  const importMutation = useImportExerciseLibrary();
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState(ALL);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const sections = useMemo(() => {
    const items = (library?.exercises ?? []).filter((item) => matches(item, normalizedQuery));
    const grouped = groupByMuscle(items);
    return activeGroup === ALL ? grouped : grouped.filter((section) => section.key === activeGroup);
  }, [library, normalizedQuery, activeGroup]);

  const labelOf = new Map((library?.groups ?? []).map((group) => [group.key, group.label]));
  const missingCount = (library?.exercises ?? []).filter((item) => !item.added).length;

  const toggle = (slug: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleSection = (items: ExerciseLibraryItem[]) => {
    const pending = items.filter((item) => !item.added).map((item) => item.slug);
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = pending.every((slug) => next.has(slug));
      for (const slug of pending) {
        if (allSelected) next.delete(slug);
        else next.add(slug);
      }
      return next;
    });
  };

  const handleImport = async () => {
    setError(null);
    try {
      const result = await importMutation.mutateAsync([...selected]);
      onImported(result);
      onClose();
    } catch (importError) {
      setError(getErrorMessage(importError));
    }
  };

  return (
    <Dialog label="Añadir desde la biblioteca" onClose={onClose} className="max-w-2xl">
      <p className="eyebrow mb-1">Catálogo</p>
      <h2 className="pr-10 text-xl font-bold text-text-primary">Añadir desde la biblioteca</h2>
      <p className="mt-1 text-sm text-text-muted">
        {library ? `${missingCount} ejercicios disponibles para añadir.` : 'Elige los ejercicios que usa tu centro.'}
      </p>

      <label className="relative mt-4 block">
        <span className="sr-only">Buscar en la biblioteca</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ejercicio" className="w-full rounded-full pl-11" />
      </label>

      {library && (
        <div role="tablist" aria-label="Grupo muscular" className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
          {[{ key: ALL, label: 'Todos' }, ...library.groups].map((group) => {
            const active = activeGroup === group.key;
            return (
              <button
                key={group.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveGroup(group.key)}
                className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 focus-ring ${
                  active ? 'border-primary bg-primary text-primary-contrast' : 'border-white/[0.11] text-text-secondary hover:text-text-primary'
                }`}
              >
                {group.label}
              </button>
            );
          })}
        </div>
      )}

      {isLoading && <p className="mt-6 text-sm text-text-secondary">Cargando biblioteca...</p>}
      {isError && <p role="alert" className="mt-6 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-red-200">No se pudo cargar la biblioteca.</p>}
      {library && sections.length === 0 && <div className="mt-6"><EmptyState title="No encontramos ejercicios con ese nombre" /></div>}

      {sections.map((section) => {
        const pending = section.items.filter((item) => !item.added);
        const allSelected = pending.length > 0 && pending.every((item) => selected.has(item.slug));
        return (
          <section key={section.key} className="mt-5" aria-label={labelOf.get(section.key) ?? section.label}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="eyebrow text-xs text-text-muted">{labelOf.get(section.key) ?? section.label}</h3>
              {pending.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.items)}
                  className="min-h-[40px] rounded-full px-3 text-xs font-semibold text-primary-soft transition-colors hover:bg-white/[0.04] focus-ring"
                >
                  {allSelected ? 'Quitar selección' : `Seleccionar todos (${pending.length})`}
                </button>
              )}
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {section.items.map((item) => {
                const checked = item.added || selected.has(item.slug);
                return (
                  <li key={item.slug}>
                    <label className={`flex min-h-[56px] items-center gap-3 py-2 ${item.added ? 'opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={checked}
                        disabled={item.added}
                        onChange={() => toggle(item.slug)}
                      />
                      <span
                        aria-hidden="true"
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/60 ${
                          checked ? 'border-primary bg-primary text-primary-contrast' : 'border-white/[0.2] text-transparent'
                        }`}
                      >
                        <Check size={15} strokeWidth={3} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-text-primary">{item.name}</span>
                        <span className="block truncate text-xs text-text-muted">{EVALUATION_LABELS[item.evaluationType] ?? item.evaluationType}</span>
                      </span>
                      {item.added && <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-text-secondary">Ya lo tienes</span>}
                      {!item.added && item.starter && <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-soft">Básico</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {error && <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p>}

      <div className="sticky -bottom-5 -mx-5 -mb-5 mt-5 border-t border-white/[0.08] bg-surface px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6">
        <Button type="button" variant="primary" className="w-full" disabled={selected.size === 0 || importMutation.isPending} onClick={() => void handleImport()}>
          {importMutation.isPending ? 'Añadiendo...' : selected.size === 0 ? 'Elige ejercicios para añadir' : `Añadir ${selected.size} ${selected.size === 1 ? 'ejercicio' : 'ejercicios'}`}
        </Button>
      </div>
    </Dialog>
  );
}
