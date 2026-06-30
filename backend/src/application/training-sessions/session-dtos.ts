import type { TrainingSessionDetail } from '../../domain/shared/entities';
import type { PerformanceUnit } from '../../domain/shared/enums';

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

export type TrainingSessionResult = TrainingSessionDetail;
