import { describe, expect, it } from 'vitest';
import type { PerformanceRecord } from '@shared/types/api';
import { getPerformanceTrend, getTrendBars } from './performanceTrend';

const record = (value: string): PerformanceRecord => ({
  id: value, clientId: 'client', exerciseId: 'exercise', trainerId: 'trainer', trainerName: 'Trainer',
  value, unit: 'kg', date: '2026-01-01', createdAt: '2026-01-01', updatedAt: '2026-01-01',
});

describe('performanceTrend', () => {
  it('detects higher and lower improvements', () => {
    expect(getPerformanceTrend([record('10'), record('12')], 'higher')).toBe('progressing');
    expect(getPerformanceTrend([record('12'), record('10')], 'lower')).toBe('progressing');
  });

  it('returns stable or unavailable when no defensible trend exists', () => {
    expect(getPerformanceTrend([record('10'), record('10')], 'higher')).toBe('stable');
    expect(getPerformanceTrend([record('10')], 'higher')).toBe('unavailable');
    expect(getPerformanceTrend([record('10'), record('12')], 'qualitative')).toBe('unavailable');
  });

  it('normalizes chart bars without inventing missing values', () => {
    expect(getTrendBars([record('10'), record('20')])).toEqual([28, 100]);
    expect(getTrendBars([record('10'), record('10')])).toEqual([55, 55]);
    expect(getTrendBars([record('text')])).toEqual([]);
  });
});
