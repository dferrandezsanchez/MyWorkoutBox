import { useNavigate } from 'react-router-dom';
import type { PerformanceRecord } from '@shared/types/api';

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
      className="group grid min-h-[64px] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 bg-elevated/75 px-3 py-3 transition-colors last:border-b-0 hover:bg-primary/8 focus-ring"
      aria-label={`Ver histórico de ${exerciseName}`}
    >
      <span className="min-w-0 truncate font-medium text-text-primary group-hover:text-primary">{exerciseName}</span>

      <div className="flex min-w-0 items-center gap-2">
        {currentMark ? (
          <span className="max-w-[8rem] truncate rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
            {currentMark.value} {currentMark.unit}
          </span>
        ) : (
          <span className="hidden text-sm text-text-muted min-[380px]:inline">Sin marca registrada</span>
        )}
        <span className="text-text-muted group-hover:text-primary">›</span>
      </div>
    </div>
  );
}
