/** Display order and labels of the muscle groups. Mirrors the API library. */
export const MUSCLE_GROUPS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'chest', label: 'Pecho' },
  { key: 'back', label: 'Espalda' },
  { key: 'shoulders', label: 'Hombros' },
  { key: 'biceps', label: 'Bíceps' },
  { key: 'triceps', label: 'Tríceps' },
  { key: 'legs', label: 'Piernas' },
  { key: 'glutes', label: 'Glúteos' },
  { key: 'core', label: 'Core' },
  { key: 'functional', label: 'Funcional y halterofilia' },
  { key: 'cardio', label: 'Cardio' },
];

export const NO_GROUP = { key: 'none', label: 'Sin grupo' } as const;

export interface MuscleGroupSection<T> {
  key: string;
  label: string;
  items: T[];
}

/** Groups items by muscle group in display order. Items without a known group go last under "Sin grupo". */
export function groupByMuscle<T extends { muscleGroup?: string | null }>(items: T[]): Array<MuscleGroupSection<T>> {
  const known = new Set(MUSCLE_GROUPS.map((group) => group.key));
  const sections = [...MUSCLE_GROUPS, NO_GROUP].map((group) => ({
    key: group.key,
    label: group.label,
    items: items.filter((item) => {
      const key = item.muscleGroup && known.has(item.muscleGroup) ? item.muscleGroup : NO_GROUP.key;
      return key === group.key;
    }),
  }));
  return sections.filter((section) => section.items.length > 0);
}
