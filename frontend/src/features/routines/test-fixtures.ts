import type { ClientRoutinePlan, Exercise, RoutineProgram, RoutineTemplate } from '@shared/types/api';

export function exerciseFixture(id: string, name: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id,
    name,
    category: 'strength',
    movementPattern: 'push',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: 'kg',
    measurementFields: '[]',
    variantGroups: '[]',
    muscleGroup: null,
    status: 'ACTIVE',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

export function routineFixture(id: string, name: string, exercises: Exercise[] = [], overrides: Partial<RoutineTemplate> = {}): RoutineTemplate {
  return {
    id,
    tenantId: 'tenant-1',
    name,
    notes: null,
    status: 'ACTIVE',
    createdById: 'admin-1',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    exercises: exercises.map((exercise, index) => ({
      id: `${id}-item-${index}`,
      templateId: id,
      exerciseId: exercise.id,
      position: index + 1,
      targetSets: null,
      targetReps: null,
      notes: null,
      exercise,
    })),
    ...overrides,
  };
}

export function programFixture(id: string, name: string, templates: RoutineTemplate[], overrides: Partial<RoutineProgram> = {}): RoutineProgram {
  return {
    id,
    tenantId: 'tenant-1',
    name,
    notes: null,
    status: 'ACTIVE',
    createdById: 'admin-1',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    activeClientCount: 0,
    items: templates.map((template, index) => ({
      id: `${id}-item-${index}`,
      programId: id,
      templateId: template.id,
      position: index + 1,
      template,
    })),
    ...overrides,
  };
}

/** Plan following `program` live: items mirror the program. */
export function programPlanFixture(program: RoutineProgram, nextPosition = 1): ClientRoutinePlan {
  return {
    ...planFixture(program.items.map((item) => item.template), nextPosition),
    name: program.name,
    programId: program.id,
    program: { id: program.id, name: program.name, status: program.status },
  };
}

export function planFixture(templates: RoutineTemplate[], nextPosition = 1): ClientRoutinePlan {
  return {
    id: 'plan-1',
    clientId: 'client-1',
    name: 'Serie de rutinas',
    active: true,
    nextPosition,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    items: templates.map((template, index) => ({
      id: `plan-item-${index}`,
      planId: 'plan-1',
      templateId: template.id,
      position: index + 1,
      template,
    })),
  };
}
