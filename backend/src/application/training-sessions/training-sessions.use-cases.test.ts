import { describe, expect, it, vi } from 'vitest';
import { Status, TrainingSessionStatus } from '../../domain/shared/enums';
import type { TrainingSessionDetail } from '../../domain/shared/entities';
import type {
  AuditLogRepository,
  ClientRepository,
  ExerciseRepository,
  PerformanceRepository,
  TrainingSessionRepository,
} from '../../domain/repositories';
import {
  AddSessionExerciseUseCase,
  CompleteTrainingSessionUseCase,
  CreateSessionSeriesUseCase,
  DeleteSessionSeriesUseCase,
  DiscardTrainingSessionUseCase,
  GetActiveTrainingSessionUseCase,
  GetTrainingSessionUseCase,
  ListClientTrainingSessionsUseCase,
  ListTrainerTrainingSessionsUseCase,
  RemoveSessionExerciseUseCase,
  StartTrainingSessionUseCase,
  UpdateSessionSeriesUseCase,
} from '.';

const now = new Date('2026-06-30T10:00:00.000Z');
const client = {
  id: 'client-1', tenantId: 'tenant-1', firstName: 'Ana', lastName: 'Test', birthDate: now,
  height: null, weight: null, bodyFatPercentage: null, notes: null, status: Status.ACTIVE,
  anonymizedAt: null, createdAt: now, updatedAt: now,
};
const exercise = {
  id: 'exercise-1', tenantId: 'tenant-1', name: 'Remo', category: 'strength', movementPattern: 'pull',
  evaluationType: 'weight_reps', improvementDirection: 'higher', defaultUnit: 'kg', measurementFields: '[]',
  variantGroups: '[]', description: null, status: Status.ACTIVE, createdAt: now, updatedAt: now,
};

function detail(overrides: Partial<TrainingSessionDetail> = {}): TrainingSessionDetail {
  return {
    id: 'session-1', tenantId: 'tenant-1', clientId: client.id, trainerId: 'trainer-1',
    status: TrainingSessionStatus.ACTIVE, startedAt: now, completedAt: null, notes: null,
    createdAt: now, updatedAt: now, client, trainerName: 'Trainer', exercises: [], ...overrides,
  };
}

function dependencies(initial = detail()) {
  let current: TrainingSessionDetail | null = initial;
  const sessions: TrainingSessionRepository = {
    findActiveByTrainer: vi.fn(async () => current?.status === TrainingSessionStatus.ACTIVE ? current : null),
    findById: vi.fn(async () => current),
    findDetail: vi.fn(async () => current),
    listByClient: vi.fn(async () => current ? [current] : []),
    listByTrainer: vi.fn(async () => current ? [current] : []),
    create: vi.fn(async (data) => { current = detail({ ...data }); return current; }),
    complete: vi.fn(async (_id, completedAt, notes) => {
      current = detail({ ...current!, status: TrainingSessionStatus.COMPLETED, completedAt, notes: notes ?? null });
      return current;
    }),
    delete: vi.fn(async () => { current = null; }),
    addExercise: vi.fn(async (sessionId, exerciseId) => {
      const item = { id: 'item-1', sessionId, exerciseId, position: 1, createdAt: now };
      current = detail({ ...current!, exercises: [{ ...item, exercise, series: [] }] });
      return item;
    }),
    findExercise: vi.fn(),
    removeExercise: vi.fn(async () => { current = detail({ ...current!, exercises: [] }); }),
  };
  const performances: PerformanceRepository = {
    findByClientAndExercise: vi.fn(), findLatestByClientExercise: vi.fn(), findByClient: vi.fn(), findByClientWithTrainer: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(async (data) => ({
      id: 'record-1', ...data, weight: data.weight ?? null, repetitions: data.repetitions ?? null,
      duration: data.duration ?? null, distance: data.distance ?? null, notes: data.notes ?? null,
      variantValues: data.variantValues ?? null, sessionExerciseId: data.sessionExerciseId ?? null,
      seriesNumber: data.seriesNumber ?? null, createdAt: now, updatedAt: now,
    })),
    update: vi.fn(async (id, data) => ({
      id, tenantId: 'tenant-1', clientId: client.id, exerciseId: exercise.id, trainerId: 'trainer-1',
      value: data.value ?? '40', unit: data.unit ?? 'kg', weight: data.weight ?? null,
      repetitions: data.repetitions ?? null, duration: data.duration ?? null, distance: data.distance ?? null,
      date: data.date ?? now, notes: data.notes ?? null, variantValues: data.variantValues ?? null,
      sessionExerciseId: 'item-1', seriesNumber: 1, createdAt: now, updatedAt: now,
    })),
    delete: vi.fn(), renumberSeries: vi.fn(),
  };
  const clients = { findById: vi.fn(async () => client) } as unknown as ClientRepository;
  const exercises = { findById: vi.fn(async () => exercise) } as unknown as ExerciseRepository;
  const auditLogs = { create: vi.fn() } as AuditLogRepository;
  const clock = { now: () => now };
  return { sessions, performances, clients, exercises, auditLogs, clock, getCurrent: () => current };
}

describe('training session use cases', () => {
  it('starts, resumes, gets and lists sessions', async () => {
    const deps = dependencies();
    (deps.sessions.findActiveByTrainer as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await expect(new StartTrainingSessionUseCase(deps.sessions, deps.clients, deps.auditLogs, deps.clock).execute('tenant-1', 'trainer-1', client.id)).resolves.toMatchObject({ id: 'session-1' });
    await expect(new GetActiveTrainingSessionUseCase(deps.sessions).execute('tenant-1', 'trainer-1')).resolves.toMatchObject({ id: 'session-1' });
    await expect(new GetTrainingSessionUseCase(deps.sessions).execute('tenant-1', 'trainer-1', 'session-1')).resolves.toMatchObject({ id: 'session-1' });
    await expect(new ListClientTrainingSessionsUseCase(deps.sessions, deps.clients).execute('tenant-1', client.id)).resolves.toHaveLength(1);
    await expect(new ListTrainerTrainingSessionsUseCase(deps.sessions).execute('tenant-1', 'trainer-1', 500)).resolves.toHaveLength(1);
    expect(deps.sessions.listByTrainer).toHaveBeenCalledWith('tenant-1', 'trainer-1', 50);
  });

  it('adds and removes an exercise without series', async () => {
    const deps = dependencies();
    const added = await new AddSessionExerciseUseCase(deps.sessions, deps.exercises).execute('tenant-1', 'trainer-1', 'session-1', exercise.id);
    expect(added?.exercises).toHaveLength(1);
    const removed = await new RemoveSessionExerciseUseCase(deps.sessions).execute('tenant-1', 'trainer-1', 'session-1', 'item-1');
    expect(removed?.exercises).toHaveLength(0);
  });

  it('creates, updates and deletes numbered series', async () => {
    const deps = dependencies(detail({ exercises: [{ id: 'item-1', sessionId: 'session-1', exerciseId: exercise.id, position: 1, createdAt: now, exercise, series: [] }] }));
    const input = { value: 40, unit: 'kg' as const, repetitions: 10, variants: { grip: 'Prono' } };
    await expect(new CreateSessionSeriesUseCase(deps.sessions, deps.performances, deps.auditLogs, deps.clock).execute('tenant-1', 'trainer-1', 'session-1', 'item-1', input)).resolves.toMatchObject({ seriesNumber: 1 });
    (deps.performances.findById as ReturnType<typeof vi.fn>).mockResolvedValue({ sessionExerciseId: 'item-1' });
    await expect(new UpdateSessionSeriesUseCase(deps.sessions, deps.performances, deps.auditLogs, deps.clock).execute('tenant-1', 'trainer-1', 'session-1', 'record-1', input)).resolves.toMatchObject({ value: '40' });
    await new DeleteSessionSeriesUseCase(deps.sessions, deps.performances, deps.auditLogs).execute('tenant-1', 'trainer-1', 'session-1', 'record-1');
    expect(deps.performances.renumberSeries).toHaveBeenCalledWith('item-1');
  });

  it('completes sessions with series and discards empty sessions', async () => {
    const record = await dependencies().performances.create({ tenantId: 'tenant-1', clientId: client.id, exerciseId: exercise.id, trainerId: 'trainer-1', value: '40', unit: 'kg', date: now, sessionExerciseId: 'item-1', seriesNumber: 1 });
    const deps = dependencies(detail({ exercises: [{ id: 'item-1', sessionId: 'session-1', exerciseId: exercise.id, position: 1, createdAt: now, exercise, series: [{ ...record, trainerName: 'Trainer' }] }] }));
    await expect(new CompleteTrainingSessionUseCase(deps.sessions, deps.auditLogs, deps.clock).execute('tenant-1', 'trainer-1', 'session-1', { notes: 'Bien' })).resolves.toMatchObject({ status: TrainingSessionStatus.COMPLETED });

    const empty = dependencies();
    await new DiscardTrainingSessionUseCase(empty.sessions, empty.auditLogs).execute('tenant-1', 'trainer-1', 'session-1');
    expect(empty.getCurrent()).toBeNull();
  });

  it('rejects a second active session and finalizing an empty one', async () => {
    const deps = dependencies();
    await expect(new StartTrainingSessionUseCase(deps.sessions, deps.clients, deps.auditLogs, deps.clock).execute('tenant-1', 'trainer-1', client.id)).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(new CompleteTrainingSessionUseCase(deps.sessions, deps.auditLogs, deps.clock).execute('tenant-1', 'trainer-1', 'session-1', {})).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects mutations after a session has been completed', async () => {
    const deps = dependencies(detail({
      status: TrainingSessionStatus.COMPLETED,
      completedAt: now,
    }));

    await expect(
      new AddSessionExerciseUseCase(deps.sessions, deps.exercises).execute(
        'tenant-1',
        'trainer-1',
        'session-1',
        exercise.id,
      ),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'La sesión ya está finalizada' });

    await expect(
      new DiscardTrainingSessionUseCase(deps.sessions, deps.auditLogs).execute(
        'tenant-1',
        'trainer-1',
        'session-1',
      ),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'La sesión ya está finalizada' });
  });

  it('propagates repository failures without masking them', async () => {
    const deps = dependencies();
    const lookupFailure = new Error('repository unavailable');
    vi.mocked(deps.sessions.findDetail).mockRejectedValueOnce(lookupFailure);

    await expect(
      new GetTrainingSessionUseCase(deps.sessions).execute('tenant-1', 'trainer-1', 'session-1'),
    ).rejects.toBe(lookupFailure);

    const writeFailure = new Error('write failed');
    vi.mocked(deps.sessions.complete).mockRejectedValueOnce(writeFailure);
    const record = await deps.performances.create({
      tenantId: 'tenant-1', clientId: client.id, exerciseId: exercise.id,
      trainerId: 'trainer-1', value: '40', unit: 'kg', date: now,
      sessionExerciseId: 'item-1', seriesNumber: 1,
    });
    vi.mocked(deps.sessions.findDetail).mockResolvedValueOnce(detail({
      exercises: [{
        id: 'item-1', sessionId: 'session-1', exerciseId: exercise.id,
        position: 1, createdAt: now, exercise,
        series: [{ ...record, trainerName: 'Trainer' }],
      }],
    }));

    await expect(
      new CompleteTrainingSessionUseCase(deps.sessions, deps.auditLogs, deps.clock).execute(
        'tenant-1', 'trainer-1', 'session-1', {},
      ),
    ).rejects.toBe(writeFailure);
    expect(deps.auditLogs.create).not.toHaveBeenCalled();
  });
});
