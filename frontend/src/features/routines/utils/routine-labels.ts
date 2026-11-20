import type { RoutineTemplate, RoutineTemplateExercise } from '@shared/types/api';

/** Letter for a 1-based plan position: 1 → A, 2 → B, ... */
export function planLetter(position: number): string {
  return String.fromCharCode(64 + Math.min(Math.max(position, 1), 26));
}

/** "4 × 8-10", "4 series", "8-10 reps" or '' when there is no target. */
export function formatTarget(item: Pick<RoutineTemplateExercise, 'targetSets' | 'targetReps'>): string {
  if (item.targetSets && item.targetReps) return `${item.targetSets} × ${item.targetReps}`;
  if (item.targetSets) return `${item.targetSets} ${item.targetSets === 1 ? 'serie' : 'series'}`;
  if (item.targetReps) return `${item.targetReps} reps`;
  return '';
}

export function exerciseCountLabel(count: number): string {
  return count === 1 ? '1 ejercicio' : `${count} ejercicios`;
}

export function routinePreview(routine: RoutineTemplate, limit = 3): string {
  const names = routine.exercises.slice(0, limit).map((item) => item.exercise?.name ?? 'Ejercicio');
  const rest = routine.exercises.length - names.length;
  return rest > 0 ? `${names.join(' · ')} · +${rest}` : names.join(' · ');
}
