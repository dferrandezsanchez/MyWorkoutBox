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
      className="flex justify-between items-center py-3 border-b border-border min-h-[44px] cursor-pointer hover:bg-surface transition-colors px-1"
      aria-label={`Ver histórico de ${exerciseName}`}
    >
      <span className="text-text-primary font-medium">{exerciseName}</span>

      <div className="flex items-center">
        {currentMark ? (
          <span className="bg-primary-soft text-primary text-sm font-semibold px-2 py-0.5 rounded-full">
            {currentMark.value} {currentMark.unit}
          </span>
        ) : (
          <span className="text-text-muted text-sm">Sin marca registrada</span>
        )}
      </div>
    </div>
  );
}
