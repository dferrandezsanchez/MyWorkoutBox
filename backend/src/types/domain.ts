export const Role = {
  ADMIN: 'ADMIN',
  TRAINER: 'TRAINER',
} as const;

export type Role = typeof Role[keyof typeof Role];

export const Status = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type Status = typeof Status[keyof typeof Status];

export const PerformanceUnit = {
  kg: 'kg',
  repetitions: 'repetitions',
  seconds: 'seconds',
  minutes: 'minutes',
  meters: 'meters',
  calories: 'calories',
  text: 'text',
} as const;

export type PerformanceUnit = typeof PerformanceUnit[keyof typeof PerformanceUnit];
export const PERFORMANCE_UNITS: PerformanceUnit[] = Object.values(PerformanceUnit);
