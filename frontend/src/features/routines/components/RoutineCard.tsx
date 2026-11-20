import { ChevronRight, ClipboardList } from 'lucide-react';
import { exerciseCountLabel, routinePreview } from '@features/routines/utils/routine-labels';
import type { RoutineTemplate } from '@shared/types/api';

export function RoutineCard({ routine, onOpen }: { routine: RoutineTemplate; onOpen: (routine: RoutineTemplate) => void }) {
  const archived = routine.status === 'INACTIVE';
  return (
    <button
      type="button"
      onClick={() => onOpen(routine)}
      aria-label={`Abrir ${routine.name}`}
      className="group flex min-h-[104px] w-full items-start gap-3 rounded-2xl border border-white/[0.08] bg-surface p-4 text-left transition-[border-color,background-color] duration-150 ease-out hover:border-primary/40 hover:bg-primary/[0.04] focus-ring sm:p-5"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${archived ? 'border-white/[0.08] bg-white/[0.03] text-text-muted' : 'border-primary/25 bg-primary/10 text-primary-soft'}`}>
        <ClipboardList size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-display text-base font-bold text-text-primary">{routine.name}</span>
          {archived && <span className="shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-xs font-semibold text-text-secondary ring-1 ring-white/[0.08]">Archivada</span>}
        </span>
        <span className="tabular mt-0.5 block text-sm text-text-secondary">{exerciseCountLabel(routine.exercises.length)}</span>
        {routine.exercises.length > 0 && <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-text-muted">{routinePreview(routine)}</span>}
      </span>
      <ChevronRight size={18} aria-hidden="true" className="mt-2.5 shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" />
    </button>
  );
}
