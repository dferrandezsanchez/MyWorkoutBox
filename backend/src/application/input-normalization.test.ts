import { describe, expect, it } from 'vitest';
import { normalizeClientData } from './clients/client-inputs';
import {
  normalizeCreateExerciseData,
  normalizeUpdateExerciseData,
  type UpdateExerciseInput,
} from './exercises/exercise-inputs';
import { EvaluationType, ImprovementDirection, MovementPattern, PerformanceUnit } from '../domain/shared/enums';

describe('optional backend input normalization', () => {
  it('leaves an omitted client birth date untouched', () => {
    expect(normalizeClientData({ notes: 'No date change' })).toEqual({ notes: 'No date change' });
  });

  it('preserves an already parsed client birth date', () => {
    const birthDate = new Date('1990-01-02T00:00:00.000Z');
    expect(normalizeClientData({ birthDate }).birthDate).toBe(birthDate);
  });

  it('applies exercise defaults when optional configuration is omitted', () => {
    expect(normalizeCreateExerciseData({
      name: 'Plancha', category: 'core', defaultUnit: PerformanceUnit.seconds,
    })).toMatchObject({
      movementPattern: MovementPattern.general,
      evaluationType: EvaluationType.repetitions,
      improvementDirection: ImprovementDirection.higher,
      measurementFields: expect.stringContaining('Repeticiones'),
      variantGroups: '[]',
    });
  });

  it('serializes optional exercise arrays only when they are provided', () => {
    expect(normalizeUpdateExerciseData({ description: 'Updated' })).toEqual({ description: 'Updated' });

    expect(normalizeUpdateExerciseData({
      measurementFields: [],
      variantGroups: [{ key: 'grip', label: 'Agarre', options: ['Prono'], required: false }],
    })).toEqual({
      measurementFields: '[]',
      variantGroups: JSON.stringify([{ key: 'grip', label: 'Agarre', options: ['Prono'], required: false }]),
    });
  });

  it('normalizes explicit null exercise collections to empty arrays', () => {
    const input = {
      measurementFields: null,
      variantGroups: null,
    } as unknown as UpdateExerciseInput;

    expect(normalizeUpdateExerciseData(input)).toEqual({
      measurementFields: '[]',
      variantGroups: '[]',
    });
  });
});
