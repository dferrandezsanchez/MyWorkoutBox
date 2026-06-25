import type { PerformanceRecord } from '../../domain/shared/entities';
import { PerformanceUnit, Status } from '../../domain/shared/enums';
import { badRequest, notFound } from '../../domain/shared/errors';
import type {
  AuditLogRepository,
  ClientRepository,
  ExerciseRepository,
  PerformanceRepository,
} from '../../domain/repositories';
import type { Clock } from '../ports';
import type { CreatePerformanceInput } from './performance-dtos';

export class CreatePerformanceUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly exercises: ExerciseRepository,
    private readonly performances: PerformanceRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    tenantId: string,
    clientId: string,
    exerciseId: string,
    trainerId: string,
    data: CreatePerformanceInput,
  ): Promise<PerformanceRecord> {
    const missingFields: string[] = [];
    if (data.value === undefined || data.value === null || String(data.value).trim() === '') {
      missingFields.push('value');
    }
    if (!data.unit || !Object.values(PerformanceUnit).includes(data.unit)) {
      missingFields.push('unit');
    }
    if (missingFields.length > 0) {
      throw badRequest('Campos requeridos faltantes', missingFields);
    }

    const [client, exercise] = await Promise.all([
      this.clients.findById(tenantId, clientId),
      this.exercises.findById(tenantId, exerciseId),
    ]);
    if (!client || !exercise) throw notFound();
    if (exercise.status !== Status.ACTIVE) throw badRequest('El ejercicio no está activo');

    const record = await this.performances.create({
      tenantId,
      clientId,
      exerciseId,
      trainerId,
      value: String(data.value),
      unit: data.unit,
      date: normalizePerformanceDate(data.date, this.clock),
      weight: data.weight,
      repetitions: data.repetitions,
      duration: data.duration,
      distance: data.distance,
      notes: data.notes,
    });

    await this.auditLogs.create({
      tenantId,
      userId: trainerId,
      action: 'CREATE',
      entityType: 'PerformanceRecord',
      entityId: record.id,
    });

    return record;
  }
}

function normalizePerformanceDate(date: Date | string | undefined, clock: Clock): Date {
  if (!date) return clock.now();
  return date instanceof Date ? date : new Date(`${date}T00:00:00.000Z`);
}
