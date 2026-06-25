import {
  EvaluationType,
  ExerciseCategory,
  ImprovementDirection,
  MovementPattern,
  PerformanceUnit,
  Status,
} from '../../domain/shared/enums';

export interface MeasurementField {
  key: 'value' | 'weight' | 'repetitions' | 'duration' | 'distance';
  label: string;
  unit?: PerformanceUnit;
  required: boolean;
  primary?: boolean;
}

export interface VariantGroup {
  key: string;
  label: string;
  options: string[];
  required: boolean;
}

export interface CreateExerciseInput {
  name: string;
  category: ExerciseCategory | string;
  movementPattern?: MovementPattern | string;
  evaluationType?: EvaluationType | string;
  improvementDirection?: ImprovementDirection | string;
  defaultUnit: PerformanceUnit;
  measurementFields?: MeasurementField[];
  variantGroups?: VariantGroup[];
  description?: string;
  status?: Status;
}

export interface UpdateExerciseInput {
  name?: string;
  category?: ExerciseCategory | string;
  movementPattern?: MovementPattern | string;
  evaluationType?: EvaluationType | string;
  improvementDirection?: ImprovementDirection | string;
  defaultUnit?: PerformanceUnit;
  measurementFields?: MeasurementField[];
  variantGroups?: VariantGroup[];
  description?: string;
  status?: Status;
}

const DEFAULT_MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: 'value', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true, primary: true },
];

export function normalizeCreateExerciseData(data: CreateExerciseInput) {
  return {
    name: data.name,
    category: data.category,
    movementPattern: data.movementPattern ?? MovementPattern.general,
    evaluationType: data.evaluationType ?? EvaluationType.repetitions,
    improvementDirection: data.improvementDirection ?? ImprovementDirection.higher,
    defaultUnit: data.defaultUnit,
    measurementFields: serializeJson(data.measurementFields ?? DEFAULT_MEASUREMENT_FIELDS),
    variantGroups: serializeJson(data.variantGroups ?? []),
    description: data.description,
    status: data.status,
  };
}

export function normalizeUpdateExerciseData(data: UpdateExerciseInput) {
  const { measurementFields, variantGroups, ...rest } = data;
  return {
    ...rest,
    ...(measurementFields !== undefined ? { measurementFields: serializeJson(measurementFields) } : {}),
    ...(variantGroups !== undefined ? { variantGroups: serializeJson(variantGroups) } : {}),
  };
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? []);
}
