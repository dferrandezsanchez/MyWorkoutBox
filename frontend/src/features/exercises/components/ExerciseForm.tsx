import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui';
import type {
  CreateExerciseData,
  EvaluationType,
  ExerciseCategory,
  ImprovementDirection,
  MeasurementField,
  MovementPattern,
  PerformanceUnit,
  UpdateExerciseData,
  VariantGroup,
} from '@shared/types/api';

const CATEGORY_OPTIONS: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'functional', label: 'Funcional' },
  { value: 'core', label: 'Core' },
  { value: 'endurance', label: 'Resistencia' },
  { value: 'mobility', label: 'Movilidad' },
  { value: 'technique', label: 'Técnica' },
];

const PATTERN_OPTIONS: { value: MovementPattern; label: string }[] = [
  { value: 'push', label: 'Empuje' },
  { value: 'pull', label: 'Tracción' },
  { value: 'squat', label: 'Sentadilla' },
  { value: 'hinge', label: 'Bisagra' },
  { value: 'lunge', label: 'Zancada' },
  { value: 'core', label: 'Core' },
  { value: 'locomotion', label: 'Locomoción' },
  { value: 'carry', label: 'Carga/transporte' },
  { value: 'olympic', label: 'Olímpico' },
  { value: 'gymnastic', label: 'Gimnástico' },
  { value: 'conditioning', label: 'Condicionamiento' },
  { value: 'mobility', label: 'Movilidad' },
  { value: 'general', label: 'General' },
];

const EVALUATION_OPTIONS: { value: EvaluationType; label: string; description: string }[] = [
  { value: 'repetitions', label: 'Repeticiones', description: 'Dominadas, flexiones, fondos.' },
  { value: 'weight_reps', label: 'Peso + reps', description: 'Sentadilla, peso muerto, press.' },
  { value: 'max_time', label: 'Tiempo máximo', description: 'Plancha, hollow hold, wall sit.' },
  { value: 'distance', label: 'Distancia', description: 'Carrera, remo, farmer walk.' },
  { value: 'time_to_complete', label: 'Tiempo para completar', description: 'Tests y circuitos cerrados.' },
  { value: 'amrap', label: 'AMRAP', description: 'Trabajo en ventana de tiempo.' },
  { value: 'rounds_reps', label: 'Rondas + reps', description: 'WODs o bloques funcionales.' },
  { value: 'qualitative', label: 'Cualitativo', description: 'Técnica, movilidad, control.' },
];

const UNIT_OPTIONS: { value: PerformanceUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'repetitions', label: 'Repeticiones' },
  { value: 'seconds', label: 'Segundos' },
  { value: 'minutes', label: 'Minutos' },
  { value: 'meters', label: 'Metros' },
  { value: 'calories', label: 'Calorías' },
  { value: 'text', label: 'Texto' },
];

const FIELD_OPTIONS: MeasurementField[] = [
  { key: 'value', label: 'Valor principal', required: true, primary: true },
  { key: 'weight', label: 'Peso', unit: 'kg', required: false },
  { key: 'repetitions', label: 'Repeticiones', unit: 'repetitions', required: false },
  { key: 'duration', label: 'Duración', unit: 'seconds', required: false },
  { key: 'distance', label: 'Distancia', unit: 'meters', required: false },
];

const EVALUATION_PRESETS: Record<EvaluationType, {
  defaultUnit: PerformanceUnit;
  improvementDirection: ImprovementDirection;
  fields: MeasurementField[];
}> = {
  repetitions: {
    defaultUnit: 'repetitions',
    improvementDirection: 'higher',
    fields: [
      { key: 'value', label: 'Repeticiones', unit: 'repetitions', required: true, primary: true },
      { key: 'weight', label: 'Peso adicional', unit: 'kg', required: false },
    ],
  },
  weight_reps: {
    defaultUnit: 'kg',
    improvementDirection: 'higher',
    fields: [
      { key: 'value', label: 'Peso', unit: 'kg', required: true, primary: true },
      { key: 'repetitions', label: 'Repeticiones', unit: 'repetitions', required: true },
    ],
  },
  max_time: {
    defaultUnit: 'seconds',
    improvementDirection: 'higher',
    fields: [{ key: 'value', label: 'Tiempo', unit: 'seconds', required: true, primary: true }],
  },
  distance: {
    defaultUnit: 'meters',
    improvementDirection: 'higher',
    fields: [{ key: 'value', label: 'Distancia', unit: 'meters', required: true, primary: true }],
  },
  time_to_complete: {
    defaultUnit: 'seconds',
    improvementDirection: 'lower',
    fields: [{ key: 'value', label: 'Tiempo', unit: 'seconds', required: true, primary: true }],
  },
  amrap: {
    defaultUnit: 'repetitions',
    improvementDirection: 'higher',
    fields: [
      { key: 'value', label: 'Reps totales', unit: 'repetitions', required: true, primary: true },
      { key: 'duration', label: 'Ventana de tiempo', unit: 'minutes', required: false },
    ],
  },
  rounds_reps: {
    defaultUnit: 'repetitions',
    improvementDirection: 'higher',
    fields: [{ key: 'value', label: 'Resultado', unit: 'repetitions', required: true, primary: true }],
  },
  qualitative: {
    defaultUnit: 'text',
    improvementDirection: 'qualitative',
    fields: [{ key: 'value', label: 'Valoración', unit: 'text', required: true, primary: true }],
  },
};

interface ExerciseFormProps {
  initial?: Partial<Omit<CreateExerciseData, 'measurementFields' | 'variantGroups'> & {
    measurementFields?: MeasurementField[] | string;
    variantGroups?: VariantGroup[] | string;
    status: 'ACTIVE' | 'INACTIVE';
  }>;
  onSubmit: (data: CreateExerciseData | UpdateExerciseData) => Promise<any> | void;
  submitLabel?: string;
  showStatus?: boolean;
}

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function slugifyLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function ExerciseForm({
  initial,
  onSubmit,
  submitLabel = 'Guardar',
  showStatus = false,
}: ExerciseFormProps) {
  const initialEvaluation = (initial?.evaluationType ?? 'repetitions') as EvaluationType;
  const initialPreset = EVALUATION_PRESETS[initialEvaluation] ?? EVALUATION_PRESETS.repetitions;
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<ExerciseCategory | string>(initial?.category ?? 'strength');
  const [movementPattern, setMovementPattern] = useState<MovementPattern | string>(
    initial?.movementPattern ?? 'general',
  );
  const [evaluationType, setEvaluationType] = useState<EvaluationType>(initialEvaluation);
  const [improvementDirection, setImprovementDirection] = useState<ImprovementDirection>(
    (initial?.improvementDirection as ImprovementDirection) ?? initialPreset.improvementDirection,
  );
  const [defaultUnit, setDefaultUnit] = useState<PerformanceUnit>(
    initial?.defaultUnit ?? initialPreset.defaultUnit,
  );
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>(
    parseJsonArray<MeasurementField>(initial?.measurementFields, initialPreset.fields),
  );
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>(
    parseJsonArray<VariantGroup>(initial?.variantGroups, []),
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEvaluationChange = (next: EvaluationType) => {
    const preset = EVALUATION_PRESETS[next];
    setEvaluationType(next);
    setDefaultUnit(preset.defaultUnit);
    setImprovementDirection(preset.improvementDirection);
    setMeasurementFields(preset.fields);
  };

  const toggleField = (field: MeasurementField) => {
    if (field.key === 'value') return;

    setMeasurementFields((current) => {
      const exists = current.some((item) => item.key === field.key);
      if (exists) return current.filter((item) => item.key !== field.key);
      return [...current, field];
    });
  };

  const updateVariantGroup = (index: number, patch: Partial<VariantGroup>) => {
    setVariantGroups((current) =>
      current.map((group, groupIndex) =>
        groupIndex === index
          ? {
              ...group,
              ...patch,
              key: patch.label ? slugifyLabel(patch.label) || group.key : group.key,
            }
          : group,
      ),
    );
  };

  const addVariantGroup = () => {
    setVariantGroups((current) => [
      ...current,
      { key: `variante_${current.length + 1}`, label: 'Variante', options: [], required: false },
    ]);
  };

  const removeVariantGroup = (index: number) => {
    setVariantGroups((current) => current.filter((_, groupIndex) => groupIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        movementPattern,
        evaluationType,
        improvementDirection,
        defaultUnit,
        measurementFields,
        variantGroups: variantGroups
          .map((group) => ({
            ...group,
            key: group.key || slugifyLabel(group.label),
            options: group.options.map((option) => option.trim()).filter(Boolean),
          }))
          .filter((group) => group.label.trim() && group.options.length > 0),
        description: description || undefined,
        ...(showStatus ? { status } : {}),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-border/70 bg-elevated/90 px-3 py-2 min-h-[46px] text-sm text-text-primary shadow-sm placeholder:text-text-muted focus-ring';
  const labelClass = 'mb-1.5 block text-sm font-semibold text-text-secondary';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <label className={labelClass} htmlFor="ex-name">Nombre</label>
          <input id="ex-name" autoFocus className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className={labelClass} htmlFor="ex-category">Categoría</label>
          <select id="ex-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ex-pattern">Patrón de movimiento</label>
          <select id="ex-pattern" className={inputClass} value={movementPattern} onChange={(e) => setMovementPattern(e.target.value)}>
            {PATTERN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="ex-unit">Unidad principal</label>
          <select id="ex-unit" className={inputClass} value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value as PerformanceUnit)}>
            {UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className={labelClass}>Tipo de evaluación</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {EVALUATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleEvaluationChange(option.value)}
              className={`min-h-[72px] rounded-2xl border px-3 py-2 text-left transition-colors focus-ring ${
                evaluationType === option.value
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border/70 bg-surface/70 text-text-secondary hover:bg-elevated'
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs opacity-80">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={labelClass}>Campos que pedirá la marca</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {FIELD_OPTIONS.map((field) => {
            const checked = measurementFields.some((item) => item.key === field.key);
            return (
              <label key={field.key} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-border/70 bg-surface/70 px-3 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={field.key === 'value'}
                  onChange={() => toggleField(field)}
                  className="h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-semibold text-text-primary">{field.label}</span>
                  <span className="text-xs">{field.required || field.key === 'value' ? 'Obligatorio' : 'Opcional'}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className={labelClass}>Variantes del ejercicio</span>
          <Button type="button" variant="secondary" onClick={addVariantGroup} className="inline-flex min-h-9 items-center gap-2 px-3">
            <Plus size={15} />
            Añadir
          </Button>
        </div>

        <div className="space-y-3">
          {variantGroups.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border/70 bg-surface/50 p-3 text-sm text-text-secondary">
              Añade variantes como agarre, asistencia, modalidad, lado o rango si este ejercicio lo necesita.
            </p>
          )}

          {variantGroups.map((group, index) => (
            <div key={`${group.key}-${index}`} className="rounded-2xl border border-border/70 bg-surface/70 p-3">
              <div className="grid gap-3 sm:grid-cols-[0.9fr_1.4fr_auto]">
                <div>
                  <label className={labelClass} htmlFor={`variant-label-${index}`}>Nombre</label>
                  <input
                    id={`variant-label-${index}`}
                    className={inputClass}
                    value={group.label}
                    onChange={(e) => updateVariantGroup(index, { label: e.target.value })}
                    placeholder="Agarre"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`variant-options-${index}`}>Opciones</label>
                  <input
                    id={`variant-options-${index}`}
                    className={inputClass}
                    value={group.options.join(', ')}
                    onChange={(e) =>
                      updateVariantGroup(index, {
                        options: e.target.value.split(',').map((option) => option.trim()),
                      })
                    }
                    placeholder="Prono, Supino, Neutro"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariantGroup(index)}
                  className="mt-6 flex min-h-[46px] items-center justify-center rounded-xl border border-red-300/40 px-3 text-red-600 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-500/10"
                  aria-label="Eliminar variante"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="ex-direction">Comparación de marca</label>
        <select id="ex-direction" className={inputClass} value={improvementDirection} onChange={(e) => setImprovementDirection(e.target.value as ImprovementDirection)}>
          <option value="higher">Más alto es mejor</option>
          <option value="lower">Más bajo es mejor</option>
          <option value="qualitative">Cualitativo</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="ex-desc">Descripción</label>
        <textarea id="ex-desc" className="w-full resize-none rounded-xl border border-border/70 bg-elevated/90 px-3 py-2 text-sm text-text-primary shadow-sm placeholder:text-text-muted focus-ring" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {showStatus && (
        <div>
          <label className={labelClass} htmlFor="ex-status">Estado</label>
          <select id="ex-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !name.trim()} variant="primary" className="w-full sm:w-auto">{isSubmitting ? 'Enviando...' : submitLabel}</Button>
      </div>
    </form>
  );
}
