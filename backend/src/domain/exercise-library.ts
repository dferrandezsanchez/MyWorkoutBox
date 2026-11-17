import { PerformanceUnit } from './shared/enums';

export interface LibraryMeasurementField {
  key: string;
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

/** An exercise a new center can start from. `slug` is stable and identifies the exercise across imports. */
export interface LibraryExercise {
  slug: string;
  name: string;
  category: string;
  movementPattern: string;
  evaluationType: string;
  improvementDirection: 'higher' | 'lower';
  defaultUnit: PerformanceUnit;
  description: string;
  measurementFields: LibraryMeasurementField[];
  variantGroups: LibraryVariantGroup[];
}

/** Exercises every new center starts with. */
export const BASE_EXERCISES: LibraryExercise[] = [
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
