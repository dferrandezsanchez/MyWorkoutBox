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

export const ExerciseCategory = {
  strength: 'strength',
  functional: 'functional',
  core: 'core',
  endurance: 'endurance',
  mobility: 'mobility',
  technique: 'technique',
} as const;

export type ExerciseCategory = typeof ExerciseCategory[keyof typeof ExerciseCategory];

export const MovementPattern = {
  push: 'push',
  pull: 'pull',
  squat: 'squat',
  hinge: 'hinge',
  lunge: 'lunge',
  core: 'core',
  locomotion: 'locomotion',
  carry: 'carry',
  olympic: 'olympic',
  gymnastic: 'gymnastic',
  conditioning: 'conditioning',
  mobility: 'mobility',
  general: 'general',
} as const;

export type MovementPattern = typeof MovementPattern[keyof typeof MovementPattern];

export const EvaluationType = {
  repetitions: 'repetitions',
  weightReps: 'weight_reps',
  maxTime: 'max_time',
  distance: 'distance',
  timeToComplete: 'time_to_complete',
  amrap: 'amrap',
  roundsReps: 'rounds_reps',
  qualitative: 'qualitative',
} as const;

export type EvaluationType = typeof EvaluationType[keyof typeof EvaluationType];

export const ImprovementDirection = {
  higher: 'higher',
  lower: 'lower',
  qualitative: 'qualitative',
} as const;

export type ImprovementDirection = typeof ImprovementDirection[keyof typeof ImprovementDirection];
