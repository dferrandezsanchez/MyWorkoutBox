import type { PerformanceRecordWithTrainerName } from '../../domain/shared/entities';
import type { PerformanceUnit } from '../../domain/shared/enums';

export interface CreatePerformanceInput {
  value: number | string;
  unit: PerformanceUnit;
  date?: Date | string;
  weight?: number;
  repetitions?: number;
  duration?: number;
  distance?: number;
  notes?: string;
}

export interface CurrentMarkResult {
  exerciseId: string;
  exerciseName: string;
  exercise: {
    id: string;
    name: string;
    category: string;
    movementPattern: string;
    evaluationType: string;
    improvementDirection: string;
    defaultUnit: string;
    measurementFields: string;
    variantGroups: string;
  };
  record: PerformanceRecordWithTrainerName | null;
  bestRecord: PerformanceRecordWithTrainerName | null;
  recentRecords: PerformanceRecordWithTrainerName[];
}
