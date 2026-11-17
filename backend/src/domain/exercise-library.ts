import { PerformanceUnit } from './shared/enums';

export const MuscleGroup = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  legs: 'legs',
  glutes: 'glutes',
  core: 'core',
  functional: 'functional',
  cardio: 'cardio',
} as const;

export type MuscleGroup = typeof MuscleGroup[keyof typeof MuscleGroup];

/** Display order and Spanish labels of the muscle groups. */
export const MUSCLE_GROUPS: ReadonlyArray<{ key: MuscleGroup; label: string }> = [
  { key: MuscleGroup.chest, label: 'Pecho' },
  { key: MuscleGroup.back, label: 'Espalda' },
  { key: MuscleGroup.shoulders, label: 'Hombros' },
  { key: MuscleGroup.biceps, label: 'Bíceps' },
  { key: MuscleGroup.triceps, label: 'Tríceps' },
  { key: MuscleGroup.legs, label: 'Piernas' },
  { key: MuscleGroup.glutes, label: 'Glúteos' },
  { key: MuscleGroup.core, label: 'Core' },
  { key: MuscleGroup.functional, label: 'Funcional y halterofilia' },
  { key: MuscleGroup.cardio, label: 'Cardio' },
];

export const MUSCLE_GROUP_KEYS: string[] = MUSCLE_GROUPS.map((group) => group.key);

export function isMuscleGroup(value: unknown): value is MuscleGroup {
  return typeof value === 'string' && MUSCLE_GROUP_KEYS.includes(value);
}

export interface LibraryMeasurementField {
  key: 'value' | 'weight' | 'repetitions' | 'duration' | 'distance';
  label: string;
  unit: PerformanceUnit;
  required: boolean;
  primary?: boolean;
}

export interface LibraryVariantGroup {
  key: string;
  label: string;
  options: string[];
  required: boolean;
}

/** An exercise a center can start from. `slug` is stable and identifies the exercise across imports. */
export interface LibraryExercise {
  slug: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: string;
  movementPattern: string;
  evaluationType: string;
  improvementDirection: 'higher' | 'lower';
  defaultUnit: PerformanceUnit;
  description: string;
  measurementFields: LibraryMeasurementField[];
  variantGroups: LibraryVariantGroup[];
  /** Part of the starter pack every new center begins with. */
  starter: boolean;
}

type ExerciseDefinition = Omit<LibraryExercise, 'muscleGroup' | 'starter'>;

/** The exercises the demo data is built on. Their definitions (variants included) are kept as they were. */
const ORIGINAL_EXERCISES: ExerciseDefinition[] = [
  {
    slug: 'dominadas',
    name: 'Dominadas',
    category: 'strength',
    movementPattern: 'pull',
    evaluationType: 'repetitions',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.repetitions,
    description: 'Dominadas estrictas con registro de agarre, asistencia y lastre.',
    measurementFields: [
      { key: 'value', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true, primary: true },
      { key: 'weight', label: 'Peso adicional', unit: PerformanceUnit.kg, required: false },
    ],
    variantGroups: [
      { key: 'agarre', label: 'Agarre', options: ['Prono', 'Supino', 'Neutro'], required: false },
      { key: 'asistencia', label: 'Asistencia', options: ['Libre', 'Banda', 'Máquina'], required: false },
    ],
  },
  {
    slug: 'peso_muerto',
    name: 'Peso muerto',
    category: 'strength',
    movementPattern: 'hinge',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    description: 'Peso muerto con variante y repeticiones.',
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'repetitions', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Convencional', 'Sumo', 'Rumano'], required: false },
    ],
  },
  {
    slug: 'sentadilla',
    name: 'Sentadilla',
    category: 'strength',
    movementPattern: 'squat',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    description: 'Sentadilla con variante y repeticiones.',
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'repetitions', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Trasera', 'Frontal', 'Goblet'], required: false },
    ],
  },
  {
    slug: 'zancadas',
    name: 'Zancadas',
    category: 'functional',
    movementPattern: 'lunge',
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    description: 'Zancadas con peso y repeticiones por pierna.',
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'repetitions', label: 'Reps por pierna', unit: PerformanceUnit.repetitions, required: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Caminando', 'Atrás', 'Búlgara'], required: false },
    ],
  },
  {
    slug: 'plancha_frontal',
    name: 'Plancha frontal',
    category: 'core',
    movementPattern: 'core',
    evaluationType: 'max_time',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.seconds,
    description: 'Tiempo máximo con técnica estable.',
    measurementFields: [
      { key: 'value', label: 'Tiempo', unit: PerformanceUnit.seconds, required: true, primary: true },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Frontal', 'Lateral izquierda', 'Lateral derecha'], required: false },
    ],
  },
  {
    slug: 'burpees',
    name: 'Burpees',
    category: 'functional',
    movementPattern: 'conditioning',
    evaluationType: 'repetitions',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.repetitions,
    description: 'Repeticiones completadas con estándar definido por el centro.',
    measurementFields: [
      { key: 'value', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true, primary: true },
      { key: 'duration', label: 'Tiempo límite', unit: PerformanceUnit.minutes, required: false },
    ],
    variantGroups: [
      { key: 'variante', label: 'Variante', options: ['Estándar', 'Over bar', 'Box-facing'], required: false },
    ],
  },
  {
    slug: 'carrera',
    name: 'Carrera',
    category: 'endurance',
    movementPattern: 'locomotion',
    evaluationType: 'time_to_complete',
    improvementDirection: 'lower',
    defaultUnit: PerformanceUnit.seconds,
    description: 'Tiempo para completar una distancia definida.',
    measurementFields: [
      { key: 'value', label: 'Tiempo', unit: PerformanceUnit.seconds, required: true, primary: true },
      { key: 'distance', label: 'Distancia', unit: PerformanceUnit.meters, required: true },
    ],
    variantGroups: [
      { key: 'distancia_objetivo', label: 'Distancia objetivo', options: ['400 m', '1 km', '5 km'], required: false },
    ],
  },
];

// ---- Measurement shapes shared by most exercises ----------------------------------------------

type Kind = 'weightReps' | 'bodyweightReps' | 'holdTime' | 'distanceTime' | 'weightDistance';

const SHAPES: Record<Kind, Pick<ExerciseDefinition, 'evaluationType' | 'improvementDirection' | 'defaultUnit' | 'measurementFields'>> = {
  weightReps: {
    evaluationType: 'weight_reps',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'repetitions', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true },
    ],
  },
  bodyweightReps: {
    evaluationType: 'repetitions',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.repetitions,
    measurementFields: [
      { key: 'value', label: 'Repeticiones', unit: PerformanceUnit.repetitions, required: true, primary: true },
      { key: 'weight', label: 'Peso adicional', unit: PerformanceUnit.kg, required: false },
    ],
  },
  holdTime: {
    evaluationType: 'max_time',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.seconds,
    measurementFields: [{ key: 'value', label: 'Tiempo', unit: PerformanceUnit.seconds, required: true, primary: true }],
  },
  distanceTime: {
    evaluationType: 'time_to_complete',
    improvementDirection: 'lower',
    defaultUnit: PerformanceUnit.seconds,
    measurementFields: [
      { key: 'value', label: 'Tiempo', unit: PerformanceUnit.seconds, required: true, primary: true },
      { key: 'distance', label: 'Distancia', unit: PerformanceUnit.meters, required: true },
    ],
  },
  weightDistance: {
    evaluationType: 'distance',
    improvementDirection: 'higher',
    defaultUnit: PerformanceUnit.kg,
    measurementFields: [
      { key: 'value', label: 'Peso', unit: PerformanceUnit.kg, required: true, primary: true },
      { key: 'distance', label: 'Distancia', unit: PerformanceUnit.meters, required: true },
    ],
  },
};

interface NewExercise {
  slug: string;
  name: string;
  kind: Kind;
  /** MovementPattern. */
  pattern: string;
  /** Training type. Defaults to strength. */
  category?: string;
}

function define({ slug, name, kind, pattern, category = 'strength' }: NewExercise): ExerciseDefinition {
  return { slug, name, category, movementPattern: pattern, description: '', variantGroups: [], ...SHAPES[kind] };
}

/** Starter pack: what a center gets when it is created. */
const STARTER_SLUGS = new Set([
  'press_banca_barra',
  'flexiones',
  'dominadas',
  'jalon_pecho',
  'remo_barra',
  'press_militar_barra',
  'curl_barra',
  'fondos_paralelas',
  'sentadilla',
  'peso_muerto',
  'zancadas',
  'hip_thrust',
  'plancha_frontal',
  'burpees',
  'carrera',
]);

/** Each group lists its exercises in display order. A string refers to one of the original definitions. */
const SECTIONS: Array<{ group: MuscleGroup; items: Array<string | NewExercise> }> = [
  {
    group: MuscleGroup.chest,
    items: [
      { slug: 'press_banca_barra', name: 'Press banca con barra', kind: 'weightReps', pattern: 'push' },
      { slug: 'press_banca_mancuernas', name: 'Press banca con mancuernas', kind: 'weightReps', pattern: 'push' },
      { slug: 'press_inclinado_mancuernas', name: 'Press inclinado con mancuernas', kind: 'weightReps', pattern: 'push' },
      { slug: 'aperturas_mancuernas', name: 'Aperturas con mancuernas', kind: 'weightReps', pattern: 'push' },
      { slug: 'cruces_polea', name: 'Cruces en polea', kind: 'weightReps', pattern: 'push' },
      { slug: 'flexiones', name: 'Flexiones', kind: 'bodyweightReps', pattern: 'push' },
    ],
  },
  {
    group: MuscleGroup.back,
    items: [
      'dominadas',
      { slug: 'jalon_pecho', name: 'Jalón al pecho', kind: 'weightReps', pattern: 'pull' },
      { slug: 'remo_barra', name: 'Remo con barra', kind: 'weightReps', pattern: 'pull' },
      { slug: 'remo_mancuerna', name: 'Remo con mancuerna', kind: 'weightReps', pattern: 'pull' },
      { slug: 'remo_polea_baja', name: 'Remo en polea baja', kind: 'weightReps', pattern: 'pull' },
      { slug: 'remo_invertido', name: 'Remo invertido', kind: 'bodyweightReps', pattern: 'pull' },
      { slug: 'face_pull', name: 'Face pull', kind: 'weightReps', pattern: 'pull' },
      { slug: 'hiperextensiones', name: 'Hiperextensiones', kind: 'bodyweightReps', pattern: 'hinge' },
    ],
  },
  {
    group: MuscleGroup.shoulders,
    items: [
      { slug: 'press_militar_barra', name: 'Press militar con barra', kind: 'weightReps', pattern: 'push' },
      { slug: 'press_hombro_mancuernas', name: 'Press de hombro con mancuernas', kind: 'weightReps', pattern: 'push' },
      { slug: 'elevaciones_laterales', name: 'Elevaciones laterales', kind: 'weightReps', pattern: 'general' },
      { slug: 'elevaciones_frontales', name: 'Elevaciones frontales', kind: 'weightReps', pattern: 'general' },
      { slug: 'pajaros', name: 'Pájaros / vuelos posteriores', kind: 'weightReps', pattern: 'general' },
      { slug: 'encogimientos', name: 'Encogimientos', kind: 'weightReps', pattern: 'general' },
    ],
  },
  {
    group: MuscleGroup.biceps,
    items: [
      { slug: 'curl_barra', name: 'Curl con barra', kind: 'weightReps', pattern: 'pull' },
      { slug: 'curl_mancuernas', name: 'Curl con mancuernas', kind: 'weightReps', pattern: 'pull' },
      { slug: 'curl_martillo', name: 'Curl martillo', kind: 'weightReps', pattern: 'pull' },
      { slug: 'curl_predicador', name: 'Curl predicador', kind: 'weightReps', pattern: 'pull' },
    ],
  },
  {
    group: MuscleGroup.triceps,
    items: [
      { slug: 'fondos_paralelas', name: 'Fondos en paralelas', kind: 'bodyweightReps', pattern: 'push' },
      { slug: 'press_frances', name: 'Press francés', kind: 'weightReps', pattern: 'push' },
      { slug: 'extension_triceps_polea', name: 'Extensión de tríceps en polea', kind: 'weightReps', pattern: 'push' },
      { slug: 'fondos_banco', name: 'Fondos en banco', kind: 'bodyweightReps', pattern: 'push' },
      { slug: 'press_banca_agarre_cerrado', name: 'Press banca agarre cerrado', kind: 'weightReps', pattern: 'push' },
    ],
  },
  {
    group: MuscleGroup.legs,
    items: [
      'sentadilla',
      { slug: 'sentadilla_frontal', name: 'Sentadilla frontal', kind: 'weightReps', pattern: 'squat' },
      { slug: 'sentadilla_goblet', name: 'Sentadilla goblet', kind: 'weightReps', pattern: 'squat' },
      'peso_muerto',
      { slug: 'peso_muerto_rumano', name: 'Peso muerto rumano', kind: 'weightReps', pattern: 'hinge' },
      { slug: 'prensa_piernas', name: 'Prensa de piernas', kind: 'weightReps', pattern: 'squat' },
      'zancadas',
      { slug: 'zancada_bulgara', name: 'Zancada búlgara', kind: 'weightReps', pattern: 'lunge' },
      { slug: 'extension_cuadriceps', name: 'Extensión de cuádriceps', kind: 'weightReps', pattern: 'squat' },
      { slug: 'curl_femoral', name: 'Curl femoral', kind: 'weightReps', pattern: 'hinge' },
      { slug: 'elevacion_gemelos', name: 'Elevación de gemelos', kind: 'weightReps', pattern: 'general' },
    ],
  },
  {
    group: MuscleGroup.glutes,
    items: [
      { slug: 'hip_thrust', name: 'Hip thrust', kind: 'weightReps', pattern: 'hinge' },
      { slug: 'puente_gluteo', name: 'Puente de glúteo', kind: 'bodyweightReps', pattern: 'hinge' },
      { slug: 'patada_gluteo_polea', name: 'Patada de glúteo en polea', kind: 'weightReps', pattern: 'general' },
      { slug: 'abduccion_maquina', name: 'Abducción en máquina', kind: 'weightReps', pattern: 'general' },
    ],
  },
  {
    group: MuscleGroup.core,
    items: [
      'plancha_frontal',
      { slug: 'plancha_lateral', name: 'Plancha lateral', kind: 'holdTime', pattern: 'core', category: 'core' },
      { slug: 'elevacion_piernas_colgado', name: 'Elevación de piernas colgado', kind: 'bodyweightReps', pattern: 'core', category: 'core' },
      { slug: 'crunch_abdominal', name: 'Crunch abdominal', kind: 'bodyweightReps', pattern: 'core', category: 'core' },
      { slug: 'rueda_abdominal', name: 'Rueda abdominal', kind: 'bodyweightReps', pattern: 'core', category: 'core' },
      { slug: 'russian_twist', name: 'Russian twist', kind: 'weightReps', pattern: 'core', category: 'core' },
      { slug: 'dead_bug', name: 'Dead bug', kind: 'bodyweightReps', pattern: 'core', category: 'core' },
    ],
  },
  {
    group: MuscleGroup.functional,
    items: [
      'burpees',
      { slug: 'kettlebell_swing', name: 'Kettlebell swing', kind: 'weightReps', pattern: 'conditioning', category: 'functional' },
      { slug: 'thruster', name: 'Thruster', kind: 'weightReps', pattern: 'conditioning', category: 'functional' },
      { slug: 'wall_ball', name: 'Wall ball', kind: 'weightReps', pattern: 'conditioning', category: 'functional' },
      { slug: 'box_jump', name: 'Box jump', kind: 'bodyweightReps', pattern: 'conditioning', category: 'functional' },
      { slug: 'toes_to_bar', name: 'Toes to bar', kind: 'bodyweightReps', pattern: 'gymnastic', category: 'functional' },
      { slug: 'muscle_up', name: 'Muscle-up', kind: 'bodyweightReps', pattern: 'gymnastic', category: 'functional' },
      { slug: 'comba_doble', name: 'Comba doble', kind: 'bodyweightReps', pattern: 'conditioning', category: 'functional' },
      { slug: 'arrancada', name: 'Arrancada', kind: 'weightReps', pattern: 'olympic', category: 'functional' },
      { slug: 'cargada', name: 'Cargada', kind: 'weightReps', pattern: 'olympic', category: 'functional' },
      { slug: 'dos_tiempos', name: 'Dos tiempos', kind: 'weightReps', pattern: 'olympic', category: 'functional' },
      { slug: 'paseo_granjero', name: 'Paseo del granjero', kind: 'weightDistance', pattern: 'carry', category: 'functional' },
    ],
  },
  {
    group: MuscleGroup.cardio,
    items: [
      'carrera',
      { slug: 'remo_maquina', name: 'Remo en máquina', kind: 'distanceTime', pattern: 'conditioning', category: 'endurance' },
      { slug: 'bicicleta', name: 'Bicicleta', kind: 'distanceTime', pattern: 'locomotion', category: 'endurance' },
    ],
  },
];

function resolve(item: string | NewExercise): ExerciseDefinition {
  if (typeof item !== 'string') return define(item);
  const original = ORIGINAL_EXERCISES.find((exercise) => exercise.slug === item);
  if (!original) throw new Error(`Unknown original exercise: ${item}`);
  return original;
}

/** The full library, grouped by muscle group in display order. */
export const EXERCISE_LIBRARY: LibraryExercise[] = SECTIONS.flatMap(({ group, items }) =>
  items.map((item) => {
    const definition = resolve(item);
    return { ...definition, muscleGroup: group, starter: STARTER_SLUGS.has(definition.slug) };
  }),
);

/** What every new center starts with. */
export const STARTER_EXERCISES: LibraryExercise[] = EXERCISE_LIBRARY.filter((exercise) => exercise.starter);

const ORIGINAL_SLUGS = ORIGINAL_EXERCISES.map((exercise) => exercise.slug);

/** The seven exercises the demo data (sessions and series) is built on. */
export const BASE_EXERCISES: LibraryExercise[] = EXERCISE_LIBRARY.filter((exercise) => ORIGINAL_SLUGS.includes(exercise.slug));

export function findLibraryExercise(slug: string): LibraryExercise | undefined {
  return EXERCISE_LIBRARY.find((exercise) => exercise.slug === slug);
}
