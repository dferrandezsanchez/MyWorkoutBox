import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { PerformanceRecord } from '@shared/types/api';
import { UNIT_LABELS } from '@features/exercises/utils/labels';

interface ExerciseRowProps {
  exerciseName: string;
  currentMark: PerformanceRecord | null;
  clientId: string;
  exerciseId: string;
}

export default function ExerciseRow({
  exerciseName,
  currentMark,
  clientId,
  exerciseId,
}: ExerciseRowProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/clients/${clientId}/exercises/${exerciseId}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group grid min-h-[60px] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-white/[0.06] px-4 py-3 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.03] focus-ring"
      aria-label={`Ver histórico de ${exerciseName}`}
    >
      <span className="min-w-0 truncate font-medium text-text-primary transition-colors duration-150 group-hover:text-primary-soft">{exerciseName}</span>

      <div className="flex min-w-0 items-center gap-2">
        {currentMark ? (
          <span className="tabular max-w-[8rem] truncate rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-display text-sm font-bold text-primary-soft">
            {currentMark.value} {UNIT_LABELS[currentMark.unit] ?? currentMark.unit}
          </span>
        ) : (
          <span className="hidden text-sm text-text-muted min-[380px]:inline">Sin marca registrada</span>
        )}
        <ChevronRight aria-hidden="true" size={16} className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" />
      </div>
    </div>
  );
}
