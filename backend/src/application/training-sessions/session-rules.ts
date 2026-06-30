import type { TrainingSession, TrainingSessionDetail } from '../../domain/shared/entities';
import { PerformanceUnit, TrainingSessionStatus } from '../../domain/shared/enums';
import { badRequest, forbidden } from '../../domain/shared/errors';
import type { Clock } from '../ports';
import type { SeriesInput } from './session-dtos';

export function requireOwnedActiveSession(session: TrainingSession, userId: string): void {
  if (session.trainerId !== userId) throw forbidden();
  if (session.status !== TrainingSessionStatus.ACTIVE) throw badRequest('La sesión ya está finalizada');
}

export function seriesCount(session: TrainingSessionDetail): number {
  return session.exercises.reduce((total, item) => total + item.series.length, 0);
}

export function normalizeSeriesInput(data: SeriesInput, clock: Clock) {
  if (data.value === undefined || data.value === null || String(data.value).trim() === '') {
    throw badRequest('El valor es obligatorio', ['value']);
  }
  if (!data.unit || !Object.values(PerformanceUnit).includes(data.unit)) {
    throw badRequest('La unidad no es válida', ['unit']);
  }

  let date = clock.now();
  if (data.date instanceof Date) {
    date = data.date;
  } else if (data.date) {
    date = new Date(`${data.date}T00:00:00.000Z`);
  }
  if (Number.isNaN(date.getTime())) throw badRequest('La fecha no es válida', ['date']);

  return {
    value: String(data.value),
    unit: data.unit,
    date,
    weight: data.weight,
    repetitions: data.repetitions,
    duration: data.duration,
    distance: data.distance,
    notes: data.notes?.trim() || undefined,
    variantValues: data.variants ? JSON.stringify(data.variants) : undefined,
  };
}
