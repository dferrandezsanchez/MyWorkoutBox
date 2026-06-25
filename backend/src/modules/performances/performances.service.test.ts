import { describe, expect, it } from 'vitest';
import type { PerformanceRecord } from '../../domain/shared/entities';
import { getCurrentMark } from '../../application/performances';

function record(id: string, date: string): PerformanceRecord {
  return {
    id,
    clientId: 'client-1',
    exerciseId: 'exercise-1',
    trainerId: 'trainer-1',
    tenantId: 'tenant-1',
    value: '10',
    unit: 'kg',
    weight: null,
    repetitions: null,
    duration: null,
    distance: null,
    date: new Date(date),
    notes: null,
    createdAt: new Date(date),
    updatedAt: new Date(date),
  };
}

describe('getCurrentMark', () => {
  it('returns the record with the latest date', () => {
    // Feature: control-marcas-entrenamiento, Property 2: Current_Mark es siempre el registro más reciente
    const latest = record('latest', '2026-06-03T10:00:00.000Z');
    const records = [
      record('oldest', '2026-06-01T10:00:00.000Z'),
      latest,
      record('middle', '2026-06-02T10:00:00.000Z'),
    ];

    expect(getCurrentMark(records)).toBe(latest);
  });
});
