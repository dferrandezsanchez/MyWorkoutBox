import { useState, useEffect, useRef } from 'react';
import type { CreatePerformanceData, Exercise, MeasurementField, PerformanceRecord, PerformanceUnit, VariantGroup } from '@shared/types/api';
import { Button } from '@shared/components/ui';
import { getExerciseTemplate } from '@features/performances/utils/exerciseTemplates';

interface PerformanceFormProps {
  exerciseName?: string;
  defaultUnit?: PerformanceUnit;
  exercise?: Exercise;
  initialRecord?: PerformanceRecord;
  copyMode?: boolean;
  onSave: (data: CreatePerformanceData) => Promise<unknown>;
  onClose: () => void;
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
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

function parseVariantValues(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, string> : {};
  } catch {
    return {};
  }
}

function getFallbackFields(exerciseName?: string, defaultUnit?: PerformanceUnit): MeasurementField[] {
  const template = getExerciseTemplate(exerciseName, defaultUnit);
  const fields: MeasurementField[] = [
    {
      key: 'value',
      label: template.label,
      unit: template.primaryUnit,
      required: true,
      primary: true,
    },
  ];

  if (template.showRepetitions && template.kind !== 'pullups' && template.kind !== 'reps') {
    fields.push({ key: 'repetitions', label: 'Repeticiones', unit: 'repetitions', required: false });
  }

  if (template.showWeight && template.kind !== 'strength') {
    fields.push({ key: 'weight', label: 'Peso adicional', unit: 'kg', required: false });
  }

  return fields;
}

function getFallbackVariants(exerciseName?: string, defaultUnit?: PerformanceUnit): VariantGroup[] {
  const template = getExerciseTemplate(exerciseName, defaultUnit);
  if (!template.variantOptions?.length) return [];

  return [
    {
      key: (template.variantLabel ?? 'variante').toLowerCase(),
      label: template.variantLabel ?? 'Variante',
      options: template.variantOptions,
      required: false,
    },
  ];
}

function getFieldUnit(field: MeasurementField, fallbackUnit?: PerformanceUnit): PerformanceUnit | undefined {
  return field.unit ?? (field.key === 'value' ? fallbackUnit : undefined);
}

function getPlaceholder(field: MeasurementField): string {
  if (field.unit === 'kg') return 'Ej: 100';
  if (field.unit === 'repetitions') return 'Ej: 7';
  if (field.unit === 'seconds') return 'Ej: 60';
  if (field.unit === 'meters') return 'Ej: 500';
  if (field.unit === 'text') return 'Ej: Buena técnica';
  return 'Valor';
}

export default function PerformanceForm({
  exerciseName,
  defaultUnit,
  exercise,
  initialRecord,
  copyMode = false,
  onSave,
  onClose,
}: PerformanceFormProps) {
  const fields = parseJsonArray<MeasurementField>(
    exercise?.measurementFields,
    getFallbackFields(exerciseName, defaultUnit),
  );
  const variantGroups = parseJsonArray<VariantGroup>(
    exercise?.variantGroups,
    getFallbackVariants(exerciseName, defaultUnit),
  );
  const primaryField = fields.find((field) => field.primary) ?? fields[0];
  const primaryUnit = (primaryField ? getFieldUnit(primaryField, exercise?.defaultUnit ?? defaultUnit) : defaultUnit) ?? 'repetitions';
  const [values, setValues] = useState<Record<string, string>>(() => initialRecord ? {
    value: String(initialRecord.value),
    ...(initialRecord.weight != null ? { weight: String(initialRecord.weight) } : {}),
    ...(initialRecord.repetitions != null ? { repetitions: String(initialRecord.repetitions) } : {}),
    ...(initialRecord.duration != null ? { duration: String(initialRecord.duration) } : {}),
    ...(initialRecord.distance != null ? { distance: String(initialRecord.distance) } : {}),
  } : {});
  const [date, setDate] = useState(!copyMode && initialRecord?.date ? initialRecord.date.slice(0, 10) : getTodayISO());
  const [variants, setVariants] = useState<Record<string, string>>(() =>
    initialRecord?.variantValues
      ? parseVariantValues(initialRecord.variantValues)
      : Object.fromEntries(variantGroups.map((group) => [group.key, group.required ? group.options[0] ?? '' : ''])),
  );
  const [notes, setNotes] = useState(copyMode ? '' : initialRecord?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    firstInputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setFieldValue = (key: MeasurementField['key'], value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const hasMissingRequiredField = fields.some((field) => field.required && !values[field.key]?.trim());

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      if (field.required && !values[field.key]?.trim()) {
        newErrors[field.key] = `${field.label} es obligatorio`;
      }
    }

    for (const group of variantGroups) {
      if (group.required && !variants[group.key]) {
        newErrors[group.key] = `${group.label} es obligatorio`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const mainValue = values.value ?? '';
    const unit = primaryUnit;
    setIsLoading(true);
    setSubmitError('');
    try {
      await onSave({
        value: unit === 'text' ? mainValue : Number(mainValue),
        unit,
        date,
        repetitions: values.repetitions ? Number(values.repetitions) : unit === 'repetitions' ? Number(mainValue) : undefined,
        weight: values.weight ? Number(values.weight) : unit === 'kg' ? Number(mainValue) : undefined,
        duration: values.duration ? Number(values.duration) : unit === 'seconds' || unit === 'minutes' ? Number(mainValue) : undefined,
        distance: values.distance ? Number(values.distance) : unit === 'meters' ? Number(mainValue) : undefined,
        notes: notes.trim() || undefined,
        variants,
      });
      onClose();
    } catch {
      setSubmitError('No se pudo guardar la serie. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full border border-border/70 bg-elevated/90 rounded-xl px-3 py-2 min-h-[46px] text-text-primary placeholder:text-text-muted shadow-sm focus-ring';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Formulario de nueva marca"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border/70 bg-elevated/95 p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 border-b border-border/70 pb-4">
          <h2 className="text-lg font-semibold text-text-primary">Nueva marca</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {exerciseName
              ? `${exerciseName}: completa los campos definidos para este ejercicio.`
              : 'Registra el valor actual sin modificar el histórico anterior.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const unit = getFieldUnit(field, exercise?.defaultUnit ?? defaultUnit);
              return (
                <div key={field.key}>
                  <label htmlFor={`perf-${field.key}`} className={labelClass}>
                    {field.label} {unit && unit !== 'text' ? `(${unit})` : ''} {field.required && <span aria-hidden="true">*</span>}
                  </label>
                  <input
                    id={`perf-${field.key}`}
                    type={unit === 'text' ? 'text' : 'number'}
                    value={values[field.key] ?? ''}
                    onChange={(event) => setFieldValue(field.key, event.target.value)}
                    ref={index === 0 ? firstInputRef : undefined}
                    autoFocus={index === 0}
                    placeholder={getPlaceholder({ ...field, unit })}
                    min={unit === 'text' ? undefined : '0'}
                    step={unit === 'kg' || unit === 'meters' ? '0.5' : '1'}
                    className={inputClass}
                    aria-required={field.required}
                    aria-describedby={errors[field.key] ? `perf-${field.key}-error` : undefined}
                  />
                  {errors[field.key] && (
                    <p id={`perf-${field.key}-error`} className={errorClass} role="alert">
                      {errors[field.key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {variantGroups.length > 0 && (
            <div className="mt-5 space-y-4">
              {variantGroups.map((group) => (
                <div key={group.key}>
                  <span className={labelClass}>
                    {group.label} {group.required && <span aria-hidden="true">*</span>}
                  </span>
                  <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
                    {group.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setVariants((current) => ({ ...current, [group.key]: option }))}
                        className={`min-h-[44px] rounded-xl border px-3 text-sm font-semibold transition-colors ${
                          variants[group.key] === option
                            ? 'border-primary/60 bg-primary/15 text-primary'
                            : 'border-border/70 bg-elevated/80 text-text-secondary hover:bg-surface'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {errors[group.key] && (
                    <p className={errorClass} role="alert">
                      {errors[group.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 mb-4">
            <label htmlFor="perf-date" className={labelClass}>
              Fecha
            </label>
            <input
              id="perf-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="perf-notes" className={labelClass}>
              Notas
            </label>
            <textarea
              id="perf-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              rows={3}
              className="w-full resize-none rounded-xl border border-border/70 bg-elevated/90 px-3 py-2 text-text-primary placeholder:text-text-muted focus-ring"
            />
          </div>

          {submitError && <p className="mb-4 text-sm text-red-500" role="alert">{submitError}</p>}

          <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-border/70 bg-elevated/95 px-5 pb-[max(env(safe-area-inset-bottom),0rem)] pt-4 backdrop-blur-xl sm:static sm:mx-0 sm:justify-end sm:px-0 sm:pb-0">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || hasMissingRequiredField}
              variant="primary"
              className="flex-1 sm:flex-none"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
