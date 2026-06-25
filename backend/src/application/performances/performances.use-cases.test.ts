import { describe, expect, it } from 'vitest';
import { CreatePerformanceUseCase } from './create-performance.use-case';
import { GetCurrentMarksUseCase } from './get-current-marks.use-case';
import type {
  AuditLogRepository,
  ClientRepository,
  ExerciseRepository,
  PerformanceRepository,
} from '../../domain/repositories';
import type {
  AuditLog,
  Client,
  Exercise,
  PerformanceRecord,
  PerformanceRecordWithTrainerName,
} from '../../domain/shared/entities';
import { PerformanceUnit, Status } from '../../domain/shared/enums';

const tenantId = 'tenant-1';
const clientId = 'client-1';
const exerciseId = 'exercise-1';
const trainerId = 'trainer-1';

function createClient(overrides: Partial<Client> = {}): Client {
  return {
    id: clientId,
    tenantId,
    firstName: 'Client',
    lastName: 'Test',
    birthDate: new Date('1990-01-01T00:00:00.000Z'),
    height: null,
    weight: null,
    bodyFatPercentage: null,
    photoUrl: null,
    notes: null,
    status: Status.ACTIVE,
    anonymizedAt: null,
    photoConsentAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: exerciseId,
    tenantId,
    name: 'Back Squat',
    category: 'strength',
    movementPattern: 'squat',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    measurementFields: '[]',
    variantGroups: '[]',
    description: null,
    status: Status.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createRecord(overrides: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    id: `record-${Math.random()}`,
    tenantId,
    clientId,
    exerciseId,
    trainerId,
    value: '100',
    unit: PerformanceUnit.kg,
    weight: null,
    repetitions: null,
    duration: null,
    distance: null,
    date: new Date('2026-06-01T00:00:00.000Z'),
    notes: null,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createSut(options: { exercise?: Exercise | null; client?: Client | null } = {}) {
  const client = options.client === undefined ? createClient() : options.client;
  const exercise = options.exercise === undefined ? createExercise() : options.exercise;
  const records: PerformanceRecord[] = [];
  const auditLogs: AuditLog[] = [];

  const clients: ClientRepository = {
    list: async () => (client ? [client] : []),
    findById: async () => client,
    create: async () => {
      throw new Error('not used');
    },
    update: async () => {
      throw new Error('not used');
    },
  };

  const exercises: ExerciseRepository = {
    list: async () => (exercise ? [exercise] : []),
    findById: async () => exercise,
    create: async () => {
      throw new Error('not used');
    },
    update: async () => {
      throw new Error('not used');
    },
  };

  const performances: PerformanceRepository = {
    findByClientAndExercise: async () =>
      records
        .map((record): PerformanceRecordWithTrainerName => ({ ...record, trainerName: 'Trainer Test' }))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    findLatestByClientExercise: async () => {
      const latest = [...records].sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      return latest ? { ...latest, trainerName: 'Trainer Test' } : null;
    },
    findByClient: async () => records,
    create: async (data) => {
      const record = createRecord(data);
      records.push(record);
      return record;
    },
  };

  const audit: AuditLogRepository = {
    create: async (log) => {
      auditLogs.push(log);
    },
  };

  return {
    auditLogs,
    records,
    createPerformance: new CreatePerformanceUseCase(clients, exercises, performances, audit, {
      now: () => new Date('2026-06-15T12:00:00.000Z'),
    }),
    getCurrentMarks: new GetCurrentMarksUseCase(clients, exercises, performances),
  };
}

describe('PerformanceUseCases', () => {
  it('creates a performance using the authenticated trainer and writes audit', async () => {
    const { auditLogs, records, createPerformance } = createSut();

    const record = await createPerformance.execute(tenantId, clientId, exerciseId, trainerId, {
      value: 120,
      unit: PerformanceUnit.kg,
      date: '2026-06-10',
    });

    expect(record.trainerId).toBe(trainerId);
    expect(record.value).toBe('120');
    expect(record.date).toEqual(new Date('2026-06-10T00:00:00.000Z'));
    expect(records).toHaveLength(1);
    expect(auditLogs).toMatchObject([
      {
        tenantId,
        userId: trainerId,
        action: 'CREATE',
        entityType: 'PerformanceRecord',
        entityId: record.id,
      },
    ]);
  });

  it('rejects missing value and unit without creating a record', async () => {
    const { records, createPerformance } = createSut();

    await expect(
      createPerformance.execute(tenantId, clientId, exerciseId, trainerId, {
        value: '',
        unit: undefined as unknown as PerformanceUnit,
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      fields: ['value', 'unit'],
    });

    expect(records).toHaveLength(0);
  });

  it('rejects inactive exercises', async () => {
    const { createPerformance } = createSut({ exercise: createExercise({ status: Status.INACTIVE }) });

    await expect(
      createPerformance.execute(tenantId, clientId, exerciseId, trainerId, {
        value: 100,
        unit: PerformanceUnit.kg,
      }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'El ejercicio no está activo',
    });
  });

  it('returns current marks with the latest record per active exercise', async () => {
    const { records, getCurrentMarks } = createSut();
    records.push(
      createRecord({ id: 'old', value: '100', date: new Date('2026-06-01T00:00:00.000Z') }),
      createRecord({ id: 'latest', value: '120', date: new Date('2026-06-03T00:00:00.000Z') }),
    );

    const currentMarks = await getCurrentMarks.execute(tenantId, clientId);

    expect(currentMarks).toHaveLength(1);
    expect(currentMarks[0].record?.id).toBe('latest');
    expect(currentMarks[0].exercise.name).toBe('Back Squat');
  });
});
