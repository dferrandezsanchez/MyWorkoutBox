import type { ClientMeasurement } from '@shared/types/api';

export type MetricKey = 'weight' | 'bodyFatPercentage' | 'muscleMass';

export const METRICS: Array<{ key: MetricKey; label: string; shortLabel: string; unit: string; min: number; max: number; step: number }> = [
  { key: 'weight', label: 'Peso', shortLabel: 'Peso', unit: 'kg', min: 20, max: 400, step: 0.1 },
  { key: 'bodyFatPercentage', label: 'Grasa corporal', shortLabel: 'Grasa', unit: '%', min: 2, max: 75, step: 0.1 },
  { key: 'muscleMass', label: 'Masa muscular', shortLabel: 'Músculo', unit: 'kg', min: 5, max: 150, step: 0.1 },
];

const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

export function formatMetric(value: number | null | undefined, unit: string): string {
  if (value == null) return '—';
  return `${numberFormat.format(value)} ${unit}`;
}

export function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '±';
  return `${sign}${numberFormat.format(Math.abs(delta))}`;
}

/** Latest value of a metric and its change against the previous measurement that has it. Input is newest first. */
export function latestWithDelta(measurements: ClientMeasurement[], key: MetricKey): { value: number | null; delta: number | null; measuredAt: string | null } {
  const withValue = measurements.filter((measurement) => measurement[key] != null);
  const [latest, previous] = withValue;
  if (!latest) return { value: null, delta: null, measuredAt: null };
  const value = latest[key] as number;
  return {
    value,
    delta: previous ? Math.round((value - (previous[key] as number)) * 10) / 10 : null,
    measuredAt: latest.measuredAt,
  };
}

export function toDateInput(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
}

export function formatDay(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return new Date(value).toLocaleDateString('es-ES', { ...options, timeZone: 'UTC' });
}
