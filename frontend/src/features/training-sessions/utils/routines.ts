import type { PerformanceRecord, SessionStartOptions, StartSessionMode, TrainingSessionExercise } from '@shared/types/api';

export interface SessionStartSelection {
  mode: StartSessionMode;
  templateId?: string;
}

/** Default choice: the next routine of the plan when there is one, otherwise a free session. */
export function defaultSelection(options?: SessionStartOptions): SessionStartSelection {
  return options?.nextRoutine ? { mode: 'plan' } : { mode: 'free' };
}

/** Whether there is anything to choose: without plan nor templates the session simply starts free. */
export function hasRoutineChoices(options?: SessionStartOptions): boolean {
  return Boolean(options && (options.nextRoutine || options.templates.length > 0));
}

/** Reference line shown in the series form: "Última vez, serie 2 · 60 kg × 10". */
export function lastTimeLabel(record: PerformanceRecord): string {
  const prefix = record.seriesNumber ? `Última vez, serie ${record.seriesNumber}` : 'Última vez';
  return `${prefix} · ${formatSeries(record)}`;
}

/** Plan position as a routine letter: 1 -> A, 2 -> B... */
export function routineLetter(position: number): string {
  return position >= 1 && position <= 26 ? String.fromCharCode(64 + position) : String(position);
}

const SHORT_UNITS: Record<string, string> = {
  kg: 'kg',
  seconds: 's',
  minutes: 'min',
  meters: 'm',
  calories: 'kcal',
};

function formatNumber(value: number | string): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(numeric) : String(value);
}

/** Compact text for one series: "60 kg × 10", "12 reps", "45 s +10 kg". */
export function formatSeries(record: PerformanceRecord): string {
  if (record.unit === 'kg') {
    const load = `${formatNumber(record.value)} kg`;
    return record.repetitions == null ? load : `${load} × ${record.repetitions}`;
  }
  if (record.unit === 'text') return String(record.value);
  const main = record.unit === 'repetitions' ? `${formatNumber(record.value)} reps` : `${formatNumber(record.value)} ${SHORT_UNITS[record.unit] ?? ''}`.trim();
  return record.weight ? `${main} +${formatNumber(record.weight)} kg` : main;
}

/**
 * Summary of what the client did last time on an exercise.
 * Straight sets collapse to "3×10 · 60 kg"; anything else lists each series.
 */
export function formatPreviousSeries(series: PerformanceRecord[]): string {
  if (series.length === 0) return '';
  const first = series[0];
  const uniform = series.every((record) => String(record.value) === String(first.value)
    && record.repetitions === first.repetitions && record.weight === first.weight && record.unit === first.unit);
  if (uniform && first.unit === 'kg' && first.repetitions != null) {
    return `${series.length}×${first.repetitions} · ${formatNumber(first.value)} kg`;
  }
  if (uniform) return `${series.length}× ${formatSeries(first)}`;
  return series.map(formatSeries).join(' · ');
}

/** Series of last time that matches the one about to be logged (n = series already logged). */
export function previousSeriesFor(item: TrainingSessionExercise): PerformanceRecord | undefined {
  const previous = item.previousSeries ?? [];
  return previous[item.series.length] ?? previous.at(-1);
}

/**
 * Record used to prefill a new series. Only a prefill: nothing is saved until the trainer confirms.
 * - First series of the day: what the client did in the same series last time.
 * - Following series: the last series of this session (it already reflects today's load, e.g. a
 *   weight increase); last time's matching series is still shown as a reference in the form.
 */
export function newSeriesPrefill(item: TrainingSessionExercise): { copyFrom?: PerformanceRecord; reference?: PerformanceRecord } {
  const reference = previousSeriesFor(item);
  return { copyFrom: item.series.at(-1) ?? reference, reference };
}
