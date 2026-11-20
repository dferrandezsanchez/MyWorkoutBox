import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Dumbbell, Search, Shuffle } from 'lucide-react';
import { TextInput } from '@shared/components/ui';
import type { RoutineTemplate, SessionStartOptions } from '@shared/types/api';
import { routineLetter } from '@features/training-sessions/utils/routines';
import type { SessionStartSelection } from '@features/training-sessions/utils/routines';

function exerciseCount(template: RoutineTemplate): string {
  const count = template.exercises.length;
  return `${count} ${count === 1 ? 'ejercicio' : 'ejercicios'}`;
}

export default function SessionStartChoice({
  options,
  value,
  onChange,
}: {
  options: SessionStartOptions;
  value: SessionStartSelection;
  onChange: (selection: SessionStartSelection) => void;
}) {
  const [query, setQuery] = useState('');
  const { nextRoutine } = options;
  const otherOpen = value.mode === 'template';
  const normalized = query.trim().toLowerCase();
  const templates = options.templates.filter((template) => !normalized || template.name.toLowerCase().includes(normalized));

  return (
    <div role="radiogroup" aria-label="Cómo entrenar" className="space-y-2">
      {nextRoutine && (
        <ChoiceCard
          checked={value.mode === 'plan'}
          onSelect={() => onChange({ mode: 'plan' })}
          icon={<span className="font-display text-lg font-bold">{routineLetter(nextRoutine.position)}</span>}
          title={nextRoutine.template.name}
          subtitle={`Siguiente de su serie · ${exerciseCount(nextRoutine.template)}`}
        />
      )}
      <ChoiceCard
        checked={value.mode === 'free'}
        onSelect={() => onChange({ mode: 'free' })}
        icon={<Dumbbell size={18} />}
        title="Entreno libre"
        subtitle="Añade los ejercicios sobre la marcha"
      />
      {options.templates.length > 0 && (
        <div className={`rounded-2xl border transition-colors duration-150 ${otherOpen ? 'border-primary/50 bg-primary/[0.06]' : 'border-white/[0.08]'}`}>
          <button
            type="button"
            role="radio"
            aria-checked={otherOpen}
            onClick={() => onChange({ mode: 'template', templateId: value.mode === 'template' ? value.templateId : undefined })}
            className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left focus-ring"
          >
            <ChoiceIcon checked={otherOpen}><Shuffle size={18} /></ChoiceIcon>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-text-primary">Otra rutina</span>
              <span className="block text-xs text-text-muted">{options.templates.length} disponibles</span>
            </span>
            <ChevronDown size={18} className={`shrink-0 text-text-muted transition-transform duration-150 ${otherOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {otherOpen && (
            <div className="px-3 pb-3">
              {options.templates.length > 5 && (
                <label className="relative block">
                  <span className="sr-only">Buscar rutina</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar rutina" className="h-10 w-full rounded-full pl-10 text-sm" />
                </label>
              )}
              <div role="radiogroup" aria-label="Rutinas" className="mt-2 max-h-56 divide-y divide-white/[0.06] overflow-y-auto">
                {templates.map((template) => {
                  const checked = value.templateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => onChange({ mode: 'template', templateId: template.id })}
                      className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left focus-ring"
                    >
                      <span className="min-w-0">
                        <span className={`block truncate text-sm font-semibold ${checked ? 'text-primary-soft' : 'text-text-primary'}`}>{template.name}</span>
                        <span className="tabular block text-xs text-text-muted">{exerciseCount(template)}</span>
                      </span>
                      <RadioDot checked={checked} />
                    </button>
                  );
                })}
                {templates.length === 0 && <p className="py-3 text-sm text-text-muted">Sin resultados</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChoiceCard({ checked, onSelect, icon, title, subtitle }: { checked: boolean; onSelect: () => void; icon: ReactNode; title: string; subtitle: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex min-h-[60px] w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors duration-150 focus-ring ${
        checked ? 'border-primary/50 bg-primary/[0.06]' : 'border-white/[0.08] hover:border-white/20'
      }`}
    >
      <ChoiceIcon checked={checked}>{icon}</ChoiceIcon>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-text-primary">{title}</span>
        <span className="tabular block truncate text-xs text-text-muted">{subtitle}</span>
      </span>
      <RadioDot checked={checked} />
    </button>
  );
}

function ChoiceIcon({ checked, children }: { checked: boolean; children: ReactNode }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${checked ? 'border-primary/40 bg-primary/15 text-primary-soft' : 'border-white/[0.08] bg-background/60 text-text-secondary'}`}>
      {children}
    </span>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${checked ? 'border-primary' : 'border-white/20'}`}>
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
    </span>
  );
}
