import { badRequest } from '../../domain/shared/errors';
import { parseDayOrDate } from '../measurements/measurement-rules';

export const CLIENT_GOAL_MAX_LENGTH = 500;

export interface ClientGoalInput {
  goal?: string | null;
  goalDate?: string | Date | null;
}

/** Free-text goal (reason and target, e.g. a race or a wedding) plus an optional target date. */
export function normalizeClientGoal(input: ClientGoalInput): { goal: string | null; goalDate: Date | null } {
  const goal = typeof input.goal === 'string' ? input.goal.trim() : '';
  if (goal.length > CLIENT_GOAL_MAX_LENGTH) {
    throw badRequest(`El objetivo no puede superar ${CLIENT_GOAL_MAX_LENGTH} caracteres`, ['goal']);
  }
  let goalDate: Date | null = null;
  if (input.goalDate) {
    goalDate = parseDayOrDate(input.goalDate);
    if (Number.isNaN(goalDate.getTime())) throw badRequest('La fecha objetivo no es válida', ['goalDate']);
  }
  return { goal: goal || null, goalDate };
}
