import type { Exercise, PerformanceRecord, PerformanceUnit } from '@shared/types/api';

export type ExerciseTemplateKind = 'pullups' | 'strength' | 'time' | 'distance' | 'reps';

export interface ExerciseTemplate {
  kind: ExerciseTemplateKind;
  primaryUnit: PerformanceUnit;
  label: string;
  variantLabel?: string;
  variantOptions?: string[];
  showWeight: boolean;
  showRepetitions: boolean;
  showDuration: boolean;
  showDistance: boolean;
}

const DEFAULT_TEMPLATE: ExerciseTemplate = {
  kind: 'reps',
  primaryUnit: 'repetitions',
  label: 'Repeticiones',
  showWeight: false,
  showRepetitions: true,
  showDuration: false,
  showDistance: false,
};

export function getExerciseTemplate(exerciseName = '', defaultUnit?: PerformanceUnit): ExerciseTemplate {
  const normalized = exerciseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('dominada')) {
    return {
      kind: 'pullups',
      primaryUnit: 'repetitions',
      label: 'Repeticiones',
      variantLabel: 'Agarre',
      variantOptions: ['Prono', 'Supino', 'Neutro'],
      showWeight: true,
      showRepetitions: true,
      showDuration: false,
      showDistance: false,
    };
  }

  if (
    normalized.includes('peso muerto') ||
    normalized.includes('press') ||
    normalized.includes('sentadilla') ||
    normalized.includes('zancada') ||
    normalized.includes('remo') ||
    normalized.includes('hip thrust')
  ) {
    return {
      kind: 'strength',
      primaryUnit: 'kg',
      label: 'Peso',
      showWeight: true,
      showRepetitions: true,
      showDuration: false,
      showDistance: false,
    };
  }

  if (defaultUnit === 'seconds' || defaultUnit === 'minutes' || normalized.includes('plancha')) {
    return {
      kind: 'time',
      primaryUnit: defaultUnit === 'minutes' ? 'minutes' : 'seconds',
      label: 'Tiempo',
      showWeight: false,
      showRepetitions: false,
      showDuration: true,
      showDistance: false,
    };
  }

  if (defaultUnit === 'meters' || normalized.includes('carrera')) {
    return {
      kind: 'distance',
      primaryUnit: 'meters',
      label: 'Distancia',
      showWeight: false,
      showRepetitions: false,
      showDuration: false,
      showDistance: true,
    };
  }

  return {
    ...DEFAULT_TEMPLATE,
    primaryUnit: defaultUnit ?? DEFAULT_TEMPLATE.primaryUnit,
  };
}

export function extractVariant(record?: PerformanceRecord | null): string | null {
  if (record?.variantValues) {
    try {
      const variants = JSON.parse(record.variantValues) as Record<string, unknown>;
      const values = Object.values(variants).filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));
      if (values.length) return values.join(' / ');
    } catch {
      // Preserve compatibility with malformed historical values by falling back to notes.
    }
  }
  if (!record?.notes) return null;
  const match = record.notes.match(/(?:Agarre|Variante):\s*([^|.\n]+)/i);
  return match?.[1]?.trim() ?? null;
}

export function formatPerformance(record?: PerformanceRecord | null): string {
  if (!record) return 'Sin marca';

  const variant = extractVariant(record);
  const reps = record.repetitions ? ` x ${record.repetitions}` : '';
  const weight = record.weight && record.unit !== 'kg' ? ` +${record.weight} kg` : '';
  const base = `${record.value} ${record.unit}${reps}${weight}`;

  return variant ? `${base} · ${variant}` : base;
}

export function getBestRecord(records: PerformanceRecord[] = [], exercise?: Pick<Exercise, 'improvementDirection'>): PerformanceRecord | null {
  if (!records.length) return null;
  if (exercise?.improvementDirection === 'qualitative') return records[0];

  return records.reduce((best, record) => {
    const bestValue = Number(best.value) || 0;
    const recordValue = Number(record.value) || 0;
    if (recordValue !== bestValue) {
      if (exercise?.improvementDirection === 'lower') {
        return recordValue < bestValue ? record : best;
      }
      return recordValue > bestValue ? record : best;
    }

    const bestReps = best.repetitions ?? 0;
    const recordReps = record.repetitions ?? 0;
    return recordReps > bestReps ? record : best;
  }, records[0]);
}
