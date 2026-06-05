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

export async function listExercises(includeInactive = false): Promise<Exercise[]> {
  return prisma.exercise.findMany({
    where: includeInactive ? undefined : { status: Status.ACTIVE },
    orderBy: { name: 'asc' },
  });
}

export async function getExercise(id: string): Promise<Exercise> {
  const exercise = await prisma.exercise.findUnique({ where: { id } });

  if (!exercise) {
    throw new AppError('Recurso no encontrado', 404);
  }

  return exercise;
}

export async function createExercise(data: CreateExerciseInput): Promise<Exercise> {
  return prisma.exercise.create({ data });
}

export async function updateExercise(id: string, data: UpdateExerciseInput): Promise<Exercise> {
  // Throws 404 if not found
  await getExercise(id);

  return prisma.exercise.update({ where: { id }, data });
}

export async function setExerciseStatus(id: string, status: Status): Promise<Exercise> {
  // Throws 404 if not found
  await getExercise(id);

  return prisma.exercise.update({ where: { id }, data: { status } });
}
