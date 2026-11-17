-- One-off: give the exercises that existed before the exercise library their
-- muscle group and library key, matching by name (case-insensitive).
-- Run manually once after deploying the exercise-library migration.
-- Idempotent: only rows without a library key are touched, nothing is deleted
-- and exercises with other names are left alone ("Sin grupo" in the catalog).

UPDATE exercises e
JOIN (
  SELECT 'dominadas' AS libraryKey, 'Dominadas' AS name, 'back' AS muscleGroup
  UNION ALL SELECT 'peso_muerto', 'Peso muerto', 'legs'
  UNION ALL SELECT 'sentadilla', 'Sentadilla', 'legs'
  UNION ALL SELECT 'zancadas', 'Zancadas', 'legs'
  UNION ALL SELECT 'plancha_frontal', 'Plancha frontal', 'core'
  UNION ALL SELECT 'burpees', 'Burpees', 'functional'
  UNION ALL SELECT 'carrera', 'Carrera', 'cardio'
) AS known ON LOWER(e.name) = LOWER(known.name)
SET e.libraryKey = known.libraryKey,
    e.muscleGroup = COALESCE(e.muscleGroup, known.muscleGroup)
WHERE e.libraryKey IS NULL;
