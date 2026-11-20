import type { ClientRoutinePlan, RoutineTemplate } from '../../domain/shared/entities';
import type { PerformanceUnit } from '../../domain/shared/enums';
import type { TrainingSessionDetailWithPrevious } from './session-detail';

export interface SeriesInput {
  value: number | string;
  unit: PerformanceUnit;
  date?: Date | string;
  weight?: number;
  repetitions?: number;
  duration?: number;
  distance?: number;
  notes?: string;
  variants?: Record<string, string>;
}

export interface CompleteSessionInput {
  notes?: string;
}

export type StartSessionMode = 'free' | 'plan' | 'template';

export interface StartSessionInput {
  clientId: string;
  /** Defaults to `free` when omitted (backward compatible). */
  mode?: StartSessionMode;
  /** Required when `mode` is `template`. */
  templateId?: string;
}

export interface SessionStartOptions {
  plan: ClientRoutinePlan | null;
  /** Routine that corresponds next in the client's active plan, if any. */
  nextRoutine: { position: number; template: RoutineTemplate } | null;
  /** Active routine templates of the tenant. */
  templates: RoutineTemplate[];
}

export type TrainingSessionResult = TrainingSessionDetailWithPrevious;
