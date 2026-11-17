import type { MeasurementValues } from '../../domain/repositories';
import { badRequest } from '../../domain/shared/errors';

/** Accepted ranges. Wide enough for real athletes, narrow enough to catch typos (e.g. 750 kg). */
export const MEASUREMENT_LIMITS = {
  weight: { min: 20, max: 400 },
  bodyFatPercentage: { min: 2, max: 75 },
  muscleMass: { min: 5, max: 150 },
} as const;
export const MEASUREMENT_NOTES_MAX_LENGTH = 1000;

type MetricRawValue = number | string | null;

export interface MeasurementInput {
  measuredAt?: string | Date;
  weight?: MetricRawValue;
  bodyFatPercentage?: MetricRawValue;
  muscleMass?: MetricRawValue;
  notes?: string | null;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Parses an ISO date or a `YYYY-MM-DD` day; days are pinned to midday UTC so time zones never shift them. */
export function parseDayOrDate(raw: string | Date): Date {
  if (raw instanceof Date) return raw;
  return new Date(DATE_ONLY.test(raw) ? `${raw}T12:00:00.000Z` : raw);
}

type MetricKey = keyof typeof MEASUREMENT_LIMITS;

const METRIC_LABELS: Record<MetricKey, string> = {
  weight: 'El peso',
  bodyFatPercentage: 'La grasa corporal',
  muscleMass: 'La masa muscular',
};

function parseMetric(key: MetricKey, raw: MeasurementInput[MetricKey]): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const value = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  const { min, max } = MEASUREMENT_LIMITS[key];
  if (!Number.isFinite(value) || value < min || value > max) {
    throw badRequest(`${METRIC_LABELS[key]} debe estar entre ${min} y ${max}`, [key]);
  }
  return Math.round(value * 10) / 10;
}

function parseDate(raw: MeasurementInput['measuredAt'], now: Date): Date {
  if (!raw) throw badRequest('La fecha de la medición es obligatoria', ['measuredAt']);
  const date = parseDayOrDate(raw);
  if (Number.isNaN(date.getTime())) throw badRequest('La fecha de la medición no es válida', ['measuredAt']);
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  if (date >= endOfToday) throw badRequest('La fecha de la medición no puede ser futura', ['measuredAt']);
  return date;
}

/** Validates and normalizes a measurement. At least one metric is required. */
export function normalizeMeasurement(input: MeasurementInput, now: Date): MeasurementValues {
  const weight = parseMetric('weight', input.weight);
  const bodyFatPercentage = parseMetric('bodyFatPercentage', input.bodyFatPercentage);
  const muscleMass = parseMetric('muscleMass', input.muscleMass);
  if (weight === null && bodyFatPercentage === null && muscleMass === null) {
    throw badRequest('Indica al menos el peso, la grasa corporal o la masa muscular', ['weight', 'bodyFatPercentage', 'muscleMass']);
  }
  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  if (notes.length > MEASUREMENT_NOTES_MAX_LENGTH) {
    throw badRequest(`Las notas no pueden superar ${MEASUREMENT_NOTES_MAX_LENGTH} caracteres`, ['notes']);
  }
  return { measuredAt: parseDate(input.measuredAt, now), weight, bodyFatPercentage, muscleMass, notes: notes || null };
}

/** True when the input carries any measurement value (used for the optional first measurement on client creation). */
export function hasMeasurementValues(input?: MeasurementInput | null): input is MeasurementInput {
  if (!input) return false;
  return [input.weight, input.bodyFatPercentage, input.muscleMass].some((value) => value !== undefined && value !== null && value !== '');
}
