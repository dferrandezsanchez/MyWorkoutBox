import { describe, expect, it } from 'vitest';
import {
  BASE_EXERCISES,
  EXERCISE_LIBRARY,
  MUSCLE_GROUPS,
  STARTER_EXERCISES,
  findLibraryExercise,
  isMuscleGroup,
} from './exercise-library';
import { EvaluationType, ExerciseCategory, MovementPattern, PerformanceUnit } from './shared/enums';

const valuesOf = (record: Record<string, string>) => Object.values(record);

describe('exercise library', () => {
  it('has unique slugs and names, and stable slug format', () => {
    const slugs = EXERCISE_LIBRARY.map((exercise) => exercise.slug);
    const names = EXERCISE_LIBRARY.map((exercise) => exercise.name.toLowerCase());
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(names).size).toBe(names.length);
    for (const slug of slugs) expect(slug, slug).toMatch(/^[a-z0-9_]+$/);
  });

  it('puts every exercise in a known muscle group and keeps the groups in display order', () => {
    const order = MUSCLE_GROUPS.map((group) => group.key);
    for (const exercise of EXERCISE_LIBRARY) expect(isMuscleGroup(exercise.muscleGroup), exercise.slug).toBe(true);
    for (const group of order) expect(EXERCISE_LIBRARY.some((exercise) => exercise.muscleGroup === group), group).toBe(true);
    const positions = EXERCISE_LIBRARY.map((exercise) => order.indexOf(exercise.muscleGroup));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('defines every exercise with valid types, one primary field and consistent units', () => {
    for (const exercise of EXERCISE_LIBRARY) {
      const label = exercise.slug;
      expect(valuesOf(ExerciseCategory), label).toContain(exercise.category);
      expect(valuesOf(MovementPattern), label).toContain(exercise.movementPattern);
      expect(valuesOf(EvaluationType), label).toContain(exercise.evaluationType);
      expect(['higher', 'lower'], label).toContain(exercise.improvementDirection);
      expect(exercise.name.trim(), label).not.toBe('');

      const primary = exercise.measurementFields.filter((field) => field.primary);
      expect(primary, label).toHaveLength(1);
      expect(primary[0].key, label).toBe('value');
      expect(primary[0].required, label).toBe(true);
      expect(primary[0].unit, label).toBe(exercise.defaultUnit);
      expect(new Set(exercise.measurementFields.map((field) => field.key)).size, label).toBe(exercise.measurementFields.length);
      for (const field of exercise.measurementFields) expect(valuesOf(PerformanceUnit), label).toContain(field.unit);
      expect(() => JSON.stringify([exercise.measurementFields, exercise.variantGroups]), label).not.toThrow();
    }
  });

  it('ships 66 exercises with a 15-exercise starter pack', () => {
    expect(EXERCISE_LIBRARY).toHaveLength(66);
    expect(STARTER_EXERCISES).toHaveLength(15);
    expect(STARTER_EXERCISES.every((exercise) => exercise.starter)).toBe(true);
    expect(new Set(STARTER_EXERCISES.map((exercise) => exercise.muscleGroup)).size).toBeGreaterThanOrEqual(8);
  });

  it('keeps the seven exercises the demo data depends on, with their variants', () => {
    expect(BASE_EXERCISES.map((exercise) => exercise.slug)).toEqual(
      expect.arrayContaining(['dominadas', 'peso_muerto', 'sentadilla', 'zancadas', 'plancha_frontal', 'burpees', 'carrera']),
    );
    expect(BASE_EXERCISES).toHaveLength(7);
    expect(findLibraryExercise('dominadas')?.variantGroups.map((group) => group.key)).toEqual(['agarre', 'asistencia']);
    expect(findLibraryExercise('carrera')?.improvementDirection).toBe('lower');
    expect(findLibraryExercise('no-existe')).toBeUndefined();
  });

  it('measures what each kind of exercise needs', () => {
    const fieldsOf = (slug: string) => findLibraryExercise(slug)!.measurementFields.map((field) => field.key);
    expect(fieldsOf('press_banca_barra')).toEqual(['value', 'repetitions']);
    expect(fieldsOf('flexiones')).toEqual(['value', 'weight']);
    expect(fieldsOf('plancha_lateral')).toEqual(['value']);
    expect(fieldsOf('remo_maquina')).toEqual(['value', 'distance']);
    expect(findLibraryExercise('remo_maquina')?.improvementDirection).toBe('lower');
    expect(fieldsOf('paseo_granjero')).toEqual(['value', 'distance']);
  });
});
