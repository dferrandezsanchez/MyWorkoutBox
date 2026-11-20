import { describe, expect, it } from 'vitest';
import type { PerformanceRecord, TrainingSessionExercise } from '@shared/types/api';
import { formatPreviousSeries, formatSeries, newSeriesPrefill, routineLetter } from './routines';

const base: PerformanceRecord = {
  id: 'r', clientId: 'c', exerciseId: 'e', trainerId: 't', trainerName: 'T', value: 60, unit: 'kg', repetitions: 10,
  date: '2026-07-01', seriesNumber: 1, createdAt: '2026-07-01', updatedAt: '2026-07-01',
};
const rec = (id: string, overrides: Partial<PerformanceRecord> = {}): PerformanceRecord => ({ ...base, id, ...overrides });

function item(series: PerformanceRecord[], previousSeries?: PerformanceRecord[]): TrainingSessionExercise {
  return { id: 'i', sessionId: 's', exerciseId: 'e', position: 1, createdAt: '', exercise: {} as TrainingSessionExercise['exercise'], series, previousSeries };
}

describe('routine helpers', () => {
  it('maps plan positions to letters', () => {
    expect([1, 2, 3].map(routineLetter)).toEqual(['A', 'B', 'C']);
    expect(routineLetter(27)).toBe('27');
  });

  it('summarizes last time compactly', () => {
    expect(formatPreviousSeries([rec('1'), rec('2'), rec('3')])).toBe('3×10 · 60 kg');
    expect(formatPreviousSeries([rec('1'), rec('2', { value: 62.5, repetitions: 8 })])).toBe('60 kg × 10 · 62,5 kg × 8');
    expect(formatPreviousSeries([
      rec('1', { unit: 'repetitions', value: 8, repetitions: undefined }),
      rec('2', { unit: 'repetitions', value: 8, repetitions: undefined }),
    ])).toBe('2× 8 reps');
    expect(formatSeries(rec('1', { unit: 'seconds', value: 45, weight: 10 }))).toBe('45 s +10 kg');
    expect(formatPreviousSeries([])).toBe('');
  });

  it('prefills from last time first, then from today', () => {
    const previous = [rec('p1'), rec('p2', { value: 65 })];
    expect(newSeriesPrefill(item([], previous))).toEqual({ copyFrom: previous[0], reference: previous[0] });
    const today = rec('t1', { value: 62.5 });
    expect(newSeriesPrefill(item([today], previous))).toEqual({ copyFrom: today, reference: previous[1] });
    expect(newSeriesPrefill(item([today, today, today], previous)).reference).toBe(previous[1]);
    expect(newSeriesPrefill(item([]))).toEqual({ copyFrom: undefined, reference: undefined });
  });
});
