import { PerformanceRecord } from '@prisma/client';
import { PerformanceUnit, Status } from '../../types/domain';
import prisma from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

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

function normalizePerformanceDate(date?: Date | string): Date {
  if (!date) return new Date();
  return date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`);
}

export interface CurrentMarkResult {
  exerciseId: string;
  exerciseName: string;
  record: (PerformanceRecord & { trainerName: string }) | null;
}

// ---------------------------------------------------------------------------
// Pure helper — exported for unit testing
// ---------------------------------------------------------------------------

/**
 * Given a non-empty array of PerformanceRecords, return the record with the
 * maximum `date` value.
 *
 * This is a pure function with no side effects so it can be unit-tested
 * independently of the database.
 */
export function getCurrentMark(records: PerformanceRecord[]): PerformanceRecord {
  return records.reduce((latest, current) =>
    new Date(current.date).getTime() > new Date(latest.date).getTime() ? current : latest
  );
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * For each ACTIVE exercise, fetch the most recent PerformanceRecord for the
 * given clientId. Returns an array with one entry per active exercise (record
 * may be null when no mark has been registered yet).
 */
export async function getCurrentMarks(tenantId: string, clientId: string): Promise<CurrentMarkResult[]> {
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
  if (!client) {
    throw new AppError('Recurso no encontrado', 404);
  }

  const exercises = await prisma.exercise.findMany({
    where: { tenantId, status: Status.ACTIVE },
    orderBy: { name: 'asc' },
  });

  const results: CurrentMarkResult[] = await Promise.all(
    exercises.map(async (exercise) => {
      const records = await prisma.performanceRecord.findMany({
        where: { tenantId, clientId, exerciseId: exercise.id },
        orderBy: { date: 'desc' },
        take: 1,
        include: {
          trainer: { select: { name: true } },
        },
      });

      if (records.length === 0) {
        return { exerciseId: exercise.id, exerciseName: exercise.name, record: null };
      }

      const raw = records[0];
      const record: PerformanceRecord & { trainerName: string } = {
        ...raw,
        trainerName: raw.trainer.name,
      };
      // Remove the nested trainer object from the spread to keep the shape clean
      delete (record as unknown as Record<string, unknown>)['trainer'];

      return { exerciseId: exercise.id, exerciseName: exercise.name, record };
    })
  );

  return results;
}

/**
 * Return the full history for a (clientId, exerciseId) pair, ordered by
 * date descending. Each record includes the trainer's name.
 */
export async function getHistory(
  tenantId: string,
  clientId: string,
  exerciseId: string
): Promise<(PerformanceRecord & { trainerName: string })[]> {
  const [client, exercise] = await Promise.all([
    prisma.client.findFirst({ where: { id: clientId, tenantId } }),
    prisma.exercise.findFirst({ where: { id: exerciseId, tenantId } }),
  ]);

  if (!client || !exercise) {
    throw new AppError('Recurso no encontrado', 404);
  }

  const records = await prisma.performanceRecord.findMany({
    where: { tenantId, clientId, exerciseId },
    orderBy: { date: 'desc' },
    include: {
      trainer: { select: { name: true } },
    },
  });

  return records.map((raw) => {
    const record: PerformanceRecord & { trainerName: string } = {
      ...raw,
      trainerName: raw.trainer.name,
    };
    delete (record as unknown as Record<string, unknown>)['trainer'];
    return record;
  });
}

/**
 * Create a new PerformanceRecord.
 *
 * Validates:
 * - `value` is defined and `unit` is a valid PerformanceUnit (400 with fields array)
 * - clientId exists (404 if not)
 * - exerciseId exists and is ACTIVE (404 if not found, 400 if inactive)
 *
 * trainerId is taken from the parameter (extracted from JWT in the router) —
 * it is NEVER read from the data payload.
 *
 * Creates an AuditLog entry after a successful insert.
 */
export async function createPerformance(
  tenantId: string,
  clientId: string,
  exerciseId: string,
  trainerId: string,
  data: CreatePerformanceInput
): Promise<PerformanceRecord> {
  // --- Input validation ---
  const missingFields: string[] = [];

  if (data.value === undefined || data.value === null || String(data.value).trim() === '') {
    missingFields.push('value');
  }

  const validUnits = Object.values(PerformanceUnit);
  if (!data.unit || !validUnits.includes(data.unit)) {
    missingFields.push('unit');
  }

  if (missingFields.length > 0) {
    throw new AppError('Campos requeridos faltantes', 400, missingFields);
  }

  // --- Validate client exists ---
  const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
  if (!client) {
    throw new AppError('Recurso no encontrado', 404);
  }

  // --- Validate exercise exists and is ACTIVE ---
  const exercise = await prisma.exercise.findFirst({ where: { id: exerciseId, tenantId } });
  if (!exercise) {
    throw new AppError('Recurso no encontrado', 404);
  }
  if (exercise.status !== Status.ACTIVE) {
    throw new AppError('El ejercicio no está activo', 400);
  }

  // --- Create the record ---
  const record = await prisma.performanceRecord.create({
    data: {
      tenantId,
      clientId,
      exerciseId,
      trainerId,          // from JWT, not from request body
      value: String(data.value),
      unit: data.unit,
      date: normalizePerformanceDate(data.date),
      weight: data.weight,
      repetitions: data.repetitions,
      duration: data.duration,
      distance: data.distance,
      notes: data.notes,
    },
  });

  // --- Audit log ---
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: trainerId,
      action: 'CREATE',
      entityType: 'PerformanceRecord',
      entityId: record.id,
    },
  });

  return record;
}
