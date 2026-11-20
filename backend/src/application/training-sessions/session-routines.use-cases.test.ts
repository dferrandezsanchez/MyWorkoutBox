import { describe, expect, it, vi } from 'vitest';
import type {
  AuditLogRepository,
  ClientRepository,
  ClientRoutinePlanRepository,
  RoutineTemplateRepository,
  TrainingSessionRepository,
} from '../../domain/repositories';
import type {
  ClientRoutinePlan,
  Exercise,
  PerformanceRecordWithTrainerName,
  RoutineTemplate,
  TrainingSessionDetail,
} from '../../domain/shared/entities';
import { Status, TrainingSessionStatus } from '../../domain/shared/enums';
import {
  CompleteTrainingSessionUseCase,
  DiscardTrainingSessionUseCase,
  GetSessionOptionsUseCase,
  GetTrainingSessionUseCase,
  StartTrainingSessionUseCase,
} from '.';

const now = new Date('2026-11-20T10:00:00.000Z');
const client = {
  id: 'client-1', tenantId: 'tenant-1', firstName: 'Ana', lastName: 'Test', birthDate: now,
  height: null, weight: null, bodyFatPercentage: null, notes: null, status: Status.ACTIVE,
  anonymizedAt: null, createdAt: now, updatedAt: now,
};

function exercise(id: string, status = Status.ACTIVE): Exercise {
  return {
    id, tenantId: 'tenant-1', name: `Ejercicio ${id}`, category: 'strength', movementPattern: 'push',
    evaluationType: 'weight_reps', improvementDirection: 'higher', defaultUnit: 'kg', measurementFields: '[]',
    variantGroups: '[]', description: null, status, createdAt: now, updatedAt: now,
  } as Exercise;
}

function template(id: string, exercises: Exercise[], status = Status.ACTIVE): RoutineTemplate {
  return {
    id, tenantId: 'tenant-1', name: `Rutina ${id}`, notes: null, status, createdById: 'admin-1',
    createdAt: now, updatedAt: now,
    exercises: exercises.map((item, index) => ({
      id: `${id}-row-${index}`, templateId: id, exerciseId: item.id, position: index + 1,
      targetSets: 3, targetReps: '10', notes: null, createdAt: now, exercise: item,
    })),
  };
}

function plan(templates: RoutineTemplate[], nextPosition = 1, active = true): ClientRoutinePlan {
  return {
    id: 'plan-1', tenantId: 'tenant-1', clientId: client.id, name: 'Plan', active, nextPosition,
    createdById: 'admin-1', createdAt: now, updatedAt: now,
    items: templates.map((item, index) => ({ id: `item-${index}`, planId: 'plan-1', templateId: item.id, position: index + 1, template: item })),
  };
}

const previous: PerformanceRecordWithTrainerName = {
  id: 'old-1', tenantId: 'tenant-1', clientId: client.id, exerciseId: 'ex-a', trainerId: 'trainer-1',
  value: '60', unit: 'kg', weight: 60, repetitions: 10, duration: null, distance: null, date: now, notes: null,
  variantValues: null, sessionExerciseId: 'old-item', seriesNumber: 1, createdAt: now, updatedAt: now, trainerName: 'Trainer',
} as PerformanceRecordWithTrainerName;

const allExercises = new Map(['ex-a', 'ex-b', 'ex-c', 'ex-off'].map((id) => [id, exercise(id, id === 'ex-off' ? Status.INACTIVE : Status.ACTIVE)]));

function setup(options: { templates?: RoutineTemplate[]; plan?: ClientRoutinePlan | null; session?: Partial<TrainingSessionDetail> } = {}) {
  let current: TrainingSessionDetail | null = options.session
    ? {
      id: 'session-1', tenantId: 'tenant-1', clientId: client.id, trainerId: 'trainer-1', status: TrainingSessionStatus.ACTIVE,
      startedAt: now, completedAt: null, notes: null, routineTemplateId: null, routinePlanId: null, routinePlanPosition: null,
      createdAt: now, updatedAt: now, client, trainerName: 'Trainer', exercises: [], ...options.session,
    }
    : null;
  let activePlan = options.plan ?? null;
  const sessions = {
    findActiveByTrainer: vi.fn(async () => (current?.status === TrainingSessionStatus.ACTIVE ? current : null)),
    findDetail: vi.fn(async () => current),
    create: vi.fn(async (data) => {
      current = {
        id: 'session-1', status: TrainingSessionStatus.ACTIVE, completedAt: null, notes: null,
        routineTemplateId: null, routinePlanId: null, routinePlanPosition: null,
        createdAt: now, updatedAt: now, client, trainerName: 'Trainer', exercises: [], ...data,
      };
      return current;
    }),
    addExercise: vi.fn(async (sessionId: string, exerciseId: string) => {
      const item = { id: `row-${exerciseId}`, sessionId, exerciseId, position: current!.exercises.length + 1, createdAt: now };
      current = { ...current!, exercises: [...current!.exercises, { ...item, exercise: allExercises.get(exerciseId)!, series: [] }] };
      return item;
    }),
    complete: vi.fn(async (_id: string, completedAt: Date) => {
      current = { ...current!, status: TrainingSessionStatus.COMPLETED, completedAt };
      return current;
    }),
    delete: vi.fn(async () => { current = null; }),
    findPreviousSeries: vi.fn(async (_tenantId: string, _clientId: string, exerciseId: string) => (exerciseId === 'ex-a' ? [previous] : [])),
  } as unknown as TrainingSessionRepository;
  const templates = {
    list: vi.fn(async () => (options.templates ?? []).filter((item) => item.status === Status.ACTIVE)),
    findById: vi.fn(async (_tenantId: string, id: string) => (options.templates ?? []).find((item) => item.id === id) ?? null),
  } as unknown as RoutineTemplateRepository;
  const plans = {
    findActiveByClient: vi.fn(async () => (activePlan?.active ? activePlan : null)),
    findById: vi.fn(async () => activePlan),
    setNextPosition: vi.fn(async (_tenantId: string, _id: string, nextPosition: number) => { activePlan = { ...activePlan!, nextPosition }; }),
  } as unknown as ClientRoutinePlanRepository;
  const clients = { findById: vi.fn(async (_tenantId: string, id: string) => (id === client.id ? client : null)) } as unknown as ClientRepository;
  const auditLogs = { create: vi.fn() } as unknown as AuditLogRepository;
  const clock = { now: () => now };
  const start = new StartTrainingSessionUseCase(sessions, clients, auditLogs, clock, templates, plans);
  const complete = new CompleteTrainingSessionUseCase(sessions, auditLogs, clock, plans);
  return { sessions, templates, plans, auditLogs, start, complete, getPlan: () => activePlan };
}

const routineA = template('tpl-a', [allExercises.get('ex-a')!, allExercises.get('ex-off')!, allExercises.get('ex-b')!]);
const routineB = template('tpl-b', [allExercises.get('ex-c')!]);
const routineC = template('tpl-c', [allExercises.get('ex-b')!]);

describe('starting sessions from routines', () => {
  it('keeps the free mode as default and adds no exercises', async () => {
    const deps = setup();
    const session = await deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id });
    expect(session?.exercises).toEqual([]);
    expect(deps.sessions.create).toHaveBeenCalledWith({ tenantId: 'tenant-1', clientId: client.id, trainerId: 'trainer-1', startedAt: now });
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({ metadata: JSON.stringify({ mode: 'free' }) }));
  });

  it('starts from the next routine of the plan, in order and skipping inactive exercises', async () => {
    const deps = setup({ templates: [routineA, routineB], plan: plan([routineA, routineB], 1) });
    const session = await deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'plan' });
    expect(deps.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ routineTemplateId: 'tpl-a', routinePlanId: 'plan-1', routinePlanPosition: 1 }));
    expect(session?.exercises.map((item) => item.exerciseId)).toEqual(['ex-a', 'ex-b']);
    expect(session?.exercises[0].previousSeries).toEqual([previous]);
    expect(session?.exercises[1].previousSeries).toEqual([]);
    expect(deps.auditLogs.create).toHaveBeenCalledWith(expect.objectContaining({
      metadata: JSON.stringify({ mode: 'plan', templateId: 'tpl-a', routinePlanId: 'plan-1', routinePlanPosition: 1 }),
    }));
  });

  it('clamps an out of range plan position to the first routine', async () => {
    const deps = setup({ templates: [routineA, routineB], plan: plan([routineA, routineB], 7) });
    await deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'plan' });
    expect(deps.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ routineTemplateId: 'tpl-a', routinePlanPosition: 1 }));
  });

  it('rejects plan mode without an active plan or with an inactive routine', async () => {
    await expect(setup().start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'plan' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    const inactive = template('tpl-x', [allExercises.get('ex-a')!], Status.INACTIVE);
    const deps = setup({ templates: [inactive], plan: plan([inactive]) });
    await expect(deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'plan' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(deps.sessions.create).not.toHaveBeenCalled();
  });

  it('starts from any active template without plan origin', async () => {
    const deps = setup({ templates: [routineA, routineB] });
    const session = await deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'template', templateId: 'tpl-b' });
    expect(deps.sessions.create).toHaveBeenCalledWith({ tenantId: 'tenant-1', clientId: client.id, trainerId: 'trainer-1', startedAt: now, routineTemplateId: 'tpl-b' });
    expect(session?.exercises.map((item) => item.exerciseId)).toEqual(['ex-c']);
  });

  it('validates template mode and unknown modes', async () => {
    const inactive = template('tpl-x', [], Status.INACTIVE);
    const deps = setup({ templates: [inactive] });
    await expect(deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'template' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'template', templateId: 'missing' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'template', templateId: 'tpl-x' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'other' as never })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(deps.start.execute('tenant-1', 'trainer-1', { clientId: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('keeps rejecting a second active session', async () => {
    const deps = setup({ templates: [routineA], session: {} });
    await expect(deps.start.execute('tenant-1', 'trainer-1', { clientId: client.id, mode: 'template', templateId: 'tpl-a' })).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('advancing the client plan', () => {
  const series = [{ ...previous, id: 'new-1' }];
  const withSeries = (position: number) => ({
    routinePlanId: 'plan-1', routinePlanPosition: position,
    exercises: [{ id: 'row-ex-a', sessionId: 'session-1', exerciseId: 'ex-a', position: 1, createdAt: now, exercise: allExercises.get('ex-a')!, series }],
  });

  it('advances A -> B -> C -> A on completion', async () => {
    const plans = [plan([routineA, routineB, routineC], 2), plan([routineA, routineB, routineC], 3)];
    const toB = setup({ plan: plans[0], session: withSeries(2) });
    await toB.complete.execute('tenant-1', 'trainer-1', 'session-1', {});
    expect(toB.getPlan()?.nextPosition).toBe(3);

    const wrap = setup({ plan: plans[1], session: withSeries(3) });
    const completed = await wrap.complete.execute('tenant-1', 'trainer-1', 'session-1', {});
    expect(wrap.getPlan()?.nextPosition).toBe(1);
    expect(completed?.status).toBe(TrainingSessionStatus.COMPLETED);
  });

  it('does not advance twice, nor inactive plans, nor free sessions', async () => {
    const already = setup({ plan: plan([routineA, routineB], 2), session: withSeries(1) });
    await already.complete.execute('tenant-1', 'trainer-1', 'session-1', {});
    expect(already.plans.setNextPosition).not.toHaveBeenCalled();

    const inactive = setup({ plan: plan([routineA, routineB], 1, false), session: withSeries(1) });
    await inactive.complete.execute('tenant-1', 'trainer-1', 'session-1', {});
    expect(inactive.plans.setNextPosition).not.toHaveBeenCalled();

    const free = setup({ plan: plan([routineA, routineB], 1), session: { ...withSeries(1), routinePlanId: null, routinePlanPosition: null } });
    await free.complete.execute('tenant-1', 'trainer-1', 'session-1', {});
    expect(free.plans.setNextPosition).not.toHaveBeenCalled();
  });

  it('never advances when discarding', async () => {
    const deps = setup({ plan: plan([routineA, routineB], 1), session: { routinePlanId: 'plan-1', routinePlanPosition: 1 } });
    await new DiscardTrainingSessionUseCase(deps.sessions, deps.auditLogs).execute('tenant-1', 'trainer-1', 'session-1');
    expect(deps.plans.setNextPosition).not.toHaveBeenCalled();
    expect(deps.getPlan()?.nextPosition).toBe(1);
  });
});

describe('session options and previous series', () => {
  it('returns the next routine and active templates', async () => {
    const inactive = template('tpl-x', [], Status.INACTIVE);
    const deps = setup({ templates: [routineA, routineB, inactive], plan: plan([routineA, routineB], 2) });
    const clients = { findById: vi.fn(async () => client) } as unknown as ClientRepository;
    const options = await new GetSessionOptionsUseCase(clients, deps.templates, deps.plans).execute('tenant-1', client.id);
    expect(options.nextRoutine).toMatchObject({ position: 2, template: { id: 'tpl-b' } });
    expect(options.templates.map((item) => item.id)).toEqual(['tpl-a', 'tpl-b']);
    expect(options.plan?.id).toBe('plan-1');
  });

  it('returns no next routine without plan and 404 for unknown clients', async () => {
    const deps = setup({ templates: [routineA] });
    const clients = { findById: vi.fn(async () => null) } as unknown as ClientRepository;
    await expect(new GetSessionOptionsUseCase(clients, deps.templates, deps.plans).execute('tenant-1', 'nope')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const found = { findById: vi.fn(async () => client) } as unknown as ClientRepository;
    await expect(new GetSessionOptionsUseCase(found, deps.templates, deps.plans).execute('tenant-1', client.id)).resolves.toMatchObject({ plan: null, nextRoutine: null });
  });

  it('enriches session detail with previous series excluding the current session', async () => {
    const deps = setup({ session: withSeriesFor('ex-a') });
    const session = await new GetTrainingSessionUseCase(deps.sessions).execute('tenant-1', 'trainer-1', 'session-1');
    expect(session.exercises[0].previousSeries).toEqual([previous]);
    expect(deps.sessions.findPreviousSeries).toHaveBeenCalledWith('tenant-1', client.id, 'ex-a', 'session-1');
  });
});

function withSeriesFor(exerciseId: string): Partial<TrainingSessionDetail> {
  return { exercises: [{ id: 'row', sessionId: 'session-1', exerciseId, position: 1, createdAt: now, exercise: allExercises.get(exerciseId)!, series: [] }] };
}
