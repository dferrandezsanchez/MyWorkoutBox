import { planLetter } from '@features/routines/utils/routine-labels';
import type { RoutineTemplate } from '@shared/types/api';

export interface SequenceChipItem {
  id: string;
  /** 1-based position; drives the letter (1 → A). */
  position: number;
  template: RoutineTemplate;
}

interface RoutineSequenceChipsProps {
  items: SequenceChipItem[];
  /** Position highlighted as the next routine. */
  nextPosition?: number;
  /** When set, chips other than the next one become buttons to mark them as next. */
  onSelect?: (position: number) => void;
  disabled?: boolean;
  label?: string;
}

/** Lettered chips (A Pierna · B Tirón ...) with the next routine highlighted. */
export function RoutineSequenceChips({ items, nextPosition, onSelect, disabled = false, label = 'Orden de la serie' }: RoutineSequenceChipsProps) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((item) => {
        const isNext = item.position === nextPosition;
        const archived = item.template.status === 'INACTIVE';
        const letter = planLetter(item.position);
        const chipClass = `inline-flex min-h-[40px] max-w-full items-center gap-2 rounded-full border px-3 text-sm font-semibold ${
          isNext ? 'border-primary bg-primary/15 text-text-primary' : 'border-white/[0.11] text-text-secondary'
        }`;
        const content = (
          <>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isNext ? 'bg-primary text-primary-contrast' : 'bg-white/[0.06] text-text-secondary'}`}>{letter}</span>
            <span className="truncate">{item.template.name}</span>
            {archived && <span className="shrink-0 text-xs font-normal text-warning">archivada</span>}
            {isNext && <span className="sr-only">(siguiente)</span>}
          </>
        );
        return (
          <li key={item.id} className="max-w-full">
            {onSelect && !isNext ? (
              <button type="button" disabled={disabled} onClick={() => onSelect(item.position)} aria-label={`Marcar ${letter} · ${item.template.name} como siguiente`} className={`${chipClass} transition-colors hover:border-primary/50 hover:text-text-primary disabled:opacity-50 focus-ring`}>
                {content}
              </button>
            ) : (
              <span className={chipClass} aria-current={isNext ? 'step' : undefined}>{content}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
