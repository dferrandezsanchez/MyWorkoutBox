import { Exercise } from '@prisma/client';
import {
  EvaluationType,
  ExerciseCategory,
  ImprovementDirection,
  MovementPattern,
  PerformanceUnit,
  Status,
} from '../../types/domain';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';

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

function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? []);
}

function normalizeExerciseData(data: CreateExerciseInput | UpdateExerciseInput, mode: 'create' | 'update') {
  const { measurementFields, variantGroups, ...rest } = data;

  return {
    ...rest,
    ...(mode === 'create' || rest.movementPattern !== undefined
      ? { movementPattern: rest.movementPattern ?? MovementPattern.general }
      : {}),
    ...(mode === 'create' || rest.evaluationType !== undefined
      ? { evaluationType: rest.evaluationType ?? EvaluationType.repetitions }
      : {}),
    ...(mode === 'create' || rest.improvementDirection !== undefined
      ? { improvementDirection: rest.improvementDirection ?? ImprovementDirection.higher }
      : {}),
    ...(measurementFields !== undefined
      ? { measurementFields: serializeJson(measurementFields) }
      : mode === 'create'
        ? { measurementFields: serializeJson(DEFAULT_MEASUREMENT_FIELDS) }
        : {}),
    ...(variantGroups !== undefined
      ? { variantGroups: serializeJson(variantGroups) }
      : mode === 'create'
        ? { variantGroups: serializeJson([]) }
        : {}),
  };
}

function normalizeCreateExerciseData(data: CreateExerciseInput) {
  return normalizeExerciseData(data, 'create') as {
    name: string;
    category: string;
    movementPattern: string;
    evaluationType: string;
    improvementDirection: string;
    defaultUnit: string;
    measurementFields: string;
    variantGroups: string;
    description?: string;
    status?: string;
  };
}

function normalizeUpdateExerciseData(data: UpdateExerciseInput) {
  return normalizeExerciseData(data, 'update') as {
    name?: string;
    category?: string;
    movementPattern?: string;
    evaluationType?: string;
    improvementDirection?: string;
    defaultUnit?: string;
    measurementFields?: string;
    variantGroups?: string;
    description?: string;
    status?: string;
  };
}

export async function listExercises(tenantId: string, includeInactive = false): Promise<Exercise[]> {
  return prisma.exercise.findMany({
    where: {
      tenantId,
      ...(includeInactive ? {} : { status: Status.ACTIVE }),
    },
    orderBy: { name: 'asc' },
  });
}

export async function getExercise(tenantId: string, id: string): Promise<Exercise> {
  const exercise = await prisma.exercise.findFirst({ where: { id, tenantId } });

  if (!exercise) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return exercise;
}

export async function createExercise(tenantId: string, data: CreateExerciseInput): Promise<Exercise> {
  return prisma.exercise.create({
    data: {
      ...normalizeCreateExerciseData(data),
      tenantId,
    },
  });
}

export async function updateExercise(tenantId: string, id: string, data: UpdateExerciseInput): Promise<Exercise> {
  // Throws 404 if not found
  await getExercise(tenantId, id);

  return prisma.exercise.update({ where: { id }, data: normalizeUpdateExerciseData(data) });
}

export async function setExerciseStatus(tenantId: string, id: string, status: Status): Promise<Exercise> {
  // Throws 404 if not found
  await getExercise(tenantId, id);

  return prisma.exercise.update({ where: { id }, data: { status } });
}
