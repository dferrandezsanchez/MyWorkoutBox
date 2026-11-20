import { describe, expect, it } from 'vitest';
import { MUSCLE_GROUPS, groupByMuscle } from './muscle-groups';

describe('groupByMuscle', () => {
  it('orders groups as displayed and drops empty ones', () => {
    const sections = groupByMuscle([
      { name: 'Sentadilla', muscleGroup: 'legs' },
      { name: 'Press banca', muscleGroup: 'chest' },
      { name: 'Prensa', muscleGroup: 'legs' },
    ]);

    expect(sections.map((section) => section.label)).toEqual(['Pecho', 'Piernas']);
    expect(sections[1].items.map((item) => item.name)).toEqual(['Sentadilla', 'Prensa']);
  });

  it('puts missing or unknown groups last under "Sin grupo"', () => {
    const sections = groupByMuscle([
      { name: 'A', muscleGroup: null },
      { name: 'B' },
      { name: 'C', muscleGroup: 'brazos' },
      { name: 'D', muscleGroup: 'core' },
    ]);

    expect(sections.map((section) => section.key)).toEqual(['core', 'none']);
    expect(sections[1].items.map((item) => item.name)).toEqual(['A', 'B', 'C']);
  });

  it('lists ten muscle groups', () => {
    expect(MUSCLE_GROUPS).toHaveLength(10);
  });
});
