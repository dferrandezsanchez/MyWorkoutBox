import { Exercise } from '@prisma/client';
import { PerformanceUnit, Status } from '../../types/domain';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';

export interface CreateExerciseInput {
  name: string;
  category: string;
  defaultUnit: PerformanceUnit;
  description?: string;
  status?: Status;
}

export interface UpdateExerciseInput {
  name?: string;
  category?: string;
  defaultUnit?: PerformanceUnit;
  description?: string;
  status?: Status;
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
      ...data,
      tenantId,
    },
  });
}

export async function updateExercise(tenantId: string, id: string, data: UpdateExerciseInput): Promise<Exercise> {
  // Throws 404 if not found
  await getExercise(tenantId, id);

  return prisma.exercise.update({ where: { id }, data });
}

export async function setExerciseStatus(tenantId: string, id: string, status: Status): Promise<Exercise> {
  // Throws 404 if not found
  await getExercise(tenantId, id);

  return prisma.exercise.update({ where: { id }, data: { status } });
}
