import { describe, expect, it } from 'vitest';
import { extractVariant, formatPerformance, getBestRecord, getExerciseTemplate } from './exerciseTemplates';
import type { PerformanceRecord } from '@shared/types/api';

const baseRecord: PerformanceRecord = {
  id: 'record-1',
  clientId: 'client-1',
  exerciseId: 'exercise-1',
  trainerId: 'trainer-1',
  trainerName: 'Trainer',
  value: '100',
  unit: 'kg',
  repetitions: 5,
  date: '2026-06-26T00:00:00.000Z',
  notes: 'Variante: Sumo',
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z',
};

describe('exerciseTemplates', () => {
  it('selects templates by exercise name and unit', () => {
    expect(getExerciseTemplate('Dominadas estrictas')).toMatchObject({
      kind: 'pullups',
      variantLabel: 'Agarre',
      showWeight: true,
    });
    expect(getExerciseTemplate('Peso muerto')).toMatchObject({ kind: 'strength', primaryUnit: 'kg' });
    expect(getExerciseTemplate('Plancha frontal')).toMatchObject({ kind: 'time', primaryUnit: 'seconds' });
    expect(getExerciseTemplate('Carrera 5K')).toMatchObject({ kind: 'distance', primaryUnit: 'meters' });
    expect(getExerciseTemplate('Custom reps', 'minutes')).toMatchObject({ kind: 'time', primaryUnit: 'minutes' });
    expect(getExerciseTemplate('Custom', 'calories')).toMatchObject({ kind: 'reps', primaryUnit: 'calories' });
  });

  it('extracts and formats variants from performance records', () => {
    expect(extractVariant(baseRecord)).toBe('Sumo');
    expect(extractVariant({ ...baseRecord, variantValues: '{"stance":"Convencional","grip":"Mixto"}' })).toBe(
      'Convencional / Mixto',
    );
    expect(extractVariant({ ...baseRecord, variantValues: 'invalid' })).toBe('Sumo');
    expect(extractVariant({ ...baseRecord, notes: 'Agarre: Prono | buena técnica' })).toBe('Prono');
    expect(extractVariant({ ...baseRecord, notes: undefined })).toBeNull();
    expect(formatPerformance(baseRecord)).toBe('100 kg x 5 · Sumo');
    expect(formatPerformance({ ...baseRecord, unit: 'repetitions', weight: 12 })).toBe('100 Repeticiones x 5 +12 kg · Sumo');
    expect(formatPerformance(null)).toBe('Sin marca');
  });

  it('selects best records respecting improvement direction and repetitions tie breakers', () => {
    const records = [
      { ...baseRecord, id: 'a', value: '100', repetitions: 5 },
      { ...baseRecord, id: 'b', value: '120', repetitions: 3 },
      { ...baseRecord, id: 'c', value: '120', repetitions: 8 },
    ];

    expect(getBestRecord(records, { improvementDirection: 'higher' })?.id).toBe('c');
    expect(getBestRecord(records, { improvementDirection: 'lower' })?.id).toBe('a');
    expect(getBestRecord(records, { improvementDirection: 'qualitative' })?.id).toBe('a');
    expect(getBestRecord([])).toBeNull();
  });
});
