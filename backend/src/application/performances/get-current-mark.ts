import type { PerformanceRecord } from '../../domain/shared/entities';

export function getCurrentMark(records: PerformanceRecord[]): PerformanceRecord {
  return records.reduce((latest, current) =>
    new Date(current.date).getTime() > new Date(latest.date).getTime() ? current : latest,
  );
}
