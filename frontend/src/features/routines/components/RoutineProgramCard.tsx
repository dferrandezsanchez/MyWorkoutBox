import { ChevronRight, Layers } from 'lucide-react';
import { clientCountLabel, planLetter, sortedProgramItems } from '@features/routines/utils/routine-labels';
import type { RoutineProgram } from '@shared/types/api';

export function RoutineProgramCard({ program, onOpen }: { program: RoutineProgram; onOpen: (program: RoutineProgram) => void }) {
  const archived = program.status === 'INACTIVE';
  return (
    <button
      type="button"
      onClick={() => onOpen(program)}
      aria-label={`Abrir ${program.name}`}
      className="group flex min-h-[104px] w-full items-start gap-3 rounded-2xl border border-white/[0.08] bg-surface p-4 text-left transition-[border-color,background-color] duration-150 ease-out hover:border-primary/40 hover:bg-primary/[0.04] focus-ring sm:p-5"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${archived ? 'border-white/[0.08] bg-white/[0.03] text-text-muted' : 'border-primary/25 bg-primary/10 text-primary-soft'}`}>
        <Layers size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-display text-base font-bold text-text-primary">{program.name}</span>
          {archived && <span className="shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-xs font-semibold text-text-secondary ring-1 ring-white/[0.08]">Archivado</span>}
        </span>
        <span className="tabular mt-0.5 block text-sm text-text-secondary">{clientCountLabel(program.activeClientCount)}</span>
        <span className="mt-2 flex flex-wrap gap-1.5">
          {sortedProgramItems(program).map((item) => (
            <span key={item.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/[0.09] py-0.5 pl-0.5 pr-2.5 text-xs font-semibold text-text-secondary">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.6875rem] font-bold text-primary-soft">{planLetter(item.position)}</span>
              <span className="truncate">{item.template.name}</span>
            </span>
          ))}
        </span>
      </span>
      <ChevronRight size={18} aria-hidden="true" className="mt-2.5 shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" />
    </button>
  );
}
