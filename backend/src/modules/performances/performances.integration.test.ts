import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import prisma from '../../prisma/client';
import { PerformanceUnit, Role, Status } from '../../types/domain';
import { listExercises } from '../exercises/exercises.service';
import { createPerformance, getCurrentMarks, getHistory } from './performances.service';

let clientId: string;
let exerciseId: string;
let trainerId: string;

beforeAll(async () => {
  const trainer = await prisma.user.upsert({
    where: { email: 'performances-test@gym.com' },
    update: { role: Role.TRAINER, active: true },
    create: {
      name: 'Performances Test',
      email: 'performances-test@gym.com',
      passwordHash: await bcrypt.hash('Performances1234!', 10),
      role: Role.TRAINER,
      active: true,
    },
  });
  trainerId = trainer.id;

  const client = await prisma.client.create({
    data: {
      firstName: 'Performance',
      lastName: 'Client',
      birthDate: new Date('1990-01-01T00:00:00.000Z'),
      status: Status.ACTIVE,
    },
  });
  clientId = client.id;

  const exercise = await prisma.exercise.create({
    data: {
      name: `Performance Exercise ${Date.now()}`,
      category: 'Test',
      defaultUnit: PerformanceUnit.kg,
      status: Status.ACTIVE,
    },
  });
  exerciseId = exercise.id;
});

describe('performances.service integration', () => {
  it('preserves history and orders it newest first', async () => {
    // Feature: control-marcas-entrenamiento, Property 3: Creación de marca preserva el histórico
    await createPerformance(clientId, exerciseId, trainerId, {
      value: 80,
      unit: PerformanceUnit.kg,
      date: '2026-06-01',
    });
    await createPerformance(clientId, exerciseId, trainerId, {
      value: 90,
      unit: PerformanceUnit.kg,
      date: '2026-06-03',
    });
    await createPerformance(clientId, exerciseId, trainerId, {
      value: 85,
      unit: PerformanceUnit.kg,
      date: '2026-06-02',
    });

    const history = await getHistory(clientId, exerciseId);

    // Feature: control-marcas-entrenamiento, Property 4: Histórico ordenado de más reciente a más antiguo
    expect(history).toHaveLength(3);
    expect(history.map((record) => record.value)).toEqual(['90', '85', '80']);
  });

  it('rejects missing required value or unit without creating a record', async () => {
    const countBefore = await prisma.performanceRecord.count({
      where: { clientId, exerciseId },
    });

    // Feature: control-marcas-entrenamiento, Property 5: Marca rechazada sin campos obligatorios
    await expect(
      createPerformance(clientId, exerciseId, trainerId, {
        value: '',
        unit: undefined as unknown as PerformanceUnit,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      fields: ['value', 'unit'],
    });

    const countAfter = await prisma.performanceRecord.count({
      where: { clientId, exerciseId },
    });
    expect(countAfter).toBe(countBefore);
  });

  it('always stores the authenticated trainerId', async () => {
    // Feature: control-marcas-entrenamiento, Property 7: El trainerId coincide con el usuario autenticado
    const record = await createPerformance(clientId, exerciseId, trainerId, {
      value: 100,
      unit: PerformanceUnit.kg,
      date: '2026-06-04',
    });

    expect(record.trainerId).toBe(trainerId);
  });

  it('excludes inactive exercises from listings and current marks', async () => {
    // Feature: control-marcas-entrenamiento, Property 8: Ejercicios INACTIVE excluidos de listados y Current_Mark
    const inactiveExercise = await prisma.exercise.create({
      data: {
        name: `Inactive Performance Exercise ${Date.now()}`,
        category: 'Test',
        defaultUnit: PerformanceUnit.kg,
        status: Status.INACTIVE,
      },
    });

    await prisma.performanceRecord.create({
      data: {
        clientId,
        exerciseId: inactiveExercise.id,
        trainerId,
        value: '999',
        unit: PerformanceUnit.kg,
        date: new Date('2026-06-05T00:00:00.000Z'),
      },
    });

    const exercises = await listExercises();
    const currentMarks = await getCurrentMarks(clientId);

    expect(exercises.some((exercise) => exercise.id === inactiveExercise.id)).toBe(false);
    expect(currentMarks.some((mark) => mark.exerciseId === inactiveExercise.id)).toBe(false);
  });
});
