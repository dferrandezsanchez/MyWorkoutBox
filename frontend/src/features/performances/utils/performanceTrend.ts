import type { ImprovementDirection, PerformanceRecord } from '@shared/types/api';

export type PerformanceTrend = 'progressing' | 'stable' | 'unavailable';

export function getPerformanceTrend(
  records: PerformanceRecord[],
  direction: ImprovementDirection | string,
): PerformanceTrend {
  if (direction === 'qualitative') return 'unavailable';
  const values = records.map((record) => Number(record.value)).filter(Number.isFinite);
  if (values.length < 2) return 'unavailable';
  const first = values[0];
  const latest = values.at(-1)!;
  if (first === latest) return 'stable';
  const improved = direction === 'lower' ? latest < first : latest > first;
  return improved ? 'progressing' : 'stable';
}

export function getTrendBars(records: PerformanceRecord[]): number[] {
  const values = records.map((record) => Number(record.value)).filter(Number.isFinite);
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.map(() => 55);
  return values.map((value) => 28 + ((value - min) / (max - min)) * 72);
}
