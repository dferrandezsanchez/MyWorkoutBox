import { useNavigate } from 'react-router-dom';
import type { PerformanceRecord } from '../types/api';

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
      className="group flex min-h-[58px] cursor-pointer items-center justify-between gap-3 border-b border-border bg-elevated px-3 py-3 transition-colors last:border-b-0 hover:bg-primary/5"
      aria-label={`Ver histórico de ${exerciseName}`}
    >
      <span className="font-medium text-text-primary group-hover:text-primary">{exerciseName}</span>

      <div className="flex items-center gap-2">
        {currentMark ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
            {currentMark.value} {currentMark.unit}
          </span>
        ) : (
          <span className="text-text-muted text-sm">Sin marca registrada</span>
        )}
        <span className="text-text-muted group-hover:text-primary">›</span>
      </div>
    </div>
  );
}
