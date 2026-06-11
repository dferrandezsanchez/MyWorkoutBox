import { useState, useEffect, useRef } from 'react';
import type { PerformanceUnit } from '../types/api';
import { useCreatePerformance } from '../hooks/usePerformances';
import { Button } from './ui';
import { getExerciseTemplate } from '../utils/exerciseTemplates';

interface PerformanceFormProps {
  clientId: string;
  exerciseId: string;
  exerciseName?: string;
  defaultUnit?: PerformanceUnit;
  onClose: () => void;
}

const UNIT_OPTIONS: { value: PerformanceUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'repetitions', label: 'Repeticiones' },
  { value: 'seconds', label: 'Segundos' },
  { value: 'minutes', label: 'Minutos' },
  { value: 'meters', label: 'Metros' },
  { value: 'calories', label: 'Calorías' },
  { value: 'text', label: 'Texto' },
];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function PerformanceForm({
  clientId,
  exerciseId,
  exerciseName,
  defaultUnit,
  onClose,
}: PerformanceFormProps) {
  const template = getExerciseTemplate(exerciseName, defaultUnit);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<PerformanceUnit>(template.primaryUnit);
  const [date, setDate] = useState(getTodayISO());
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [variant, setVariant] = useState(template.variantOptions?.[0] ?? '');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createPerformance, isPending: isLoading } = useCreatePerformance(
    clientId,
    exerciseId,
  );

  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // focus first input when opened
    firstInputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!value.trim()) {
      newErrors.value = 'El valor es obligatorio';
    }
    if (!unit) {
      newErrors.unit = 'La unidad es obligatoria';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedValue = unit === 'text' ? value : Number(value);
    const mergedNotes = [
      variant ? `${template.variantLabel ?? 'Variante'}: ${variant}` : '',
      notes.trim(),
    ].filter(Boolean).join(' | ') || undefined;

    createPerformance(
      {
        value: parsedValue,
        unit,
        date,
        repetitions: repetitions
          ? Number(repetitions)
          : template.kind === 'pullups' || template.kind === 'reps'
            ? Number(value)
            : undefined,
        weight: weight ? Number(weight) : template.kind === 'strength' ? Number(value) : undefined,
        duration: duration ? Number(duration) : template.kind === 'time' ? Number(value) : undefined,
        distance: distance ? Number(distance) : template.kind === 'distance' ? Number(value) : undefined,
        notes: mergedNotes,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const inputClass =
    'w-full border border-border/70 bg-elevated/90 rounded-xl px-3 py-2 min-h-[46px] text-text-primary placeholder:text-text-muted shadow-sm focus-ring';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Formulario de nueva marca"
    >
      {/* Content card */}
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border/70 bg-elevated/95 p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-2xl sm:p-6">
        <div className="mb-5 border-b border-border/70 pb-4">
          <h2 className="text-lg font-semibold text-text-primary">Nueva marca</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {exerciseName
              ? `${exerciseName}: registra solo los datos necesarios.`
              : 'Registra el valor actual sin modificar el histórico anterior.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Value */}
          <div className="mb-4">
            <label htmlFor="perf-value" className={labelClass}>
              {template.label} <span aria-hidden="true">*</span>
            </label>
            <input
              id="perf-value"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              ref={firstInputRef}
              autoFocus
              placeholder={template.kind === 'strength' ? 'Ej: 100' : 'Ej: 7'}
              className={inputClass}
              aria-required="true"
              aria-describedby={errors.value ? 'perf-value-error' : undefined}
            />
            {errors.value && (
              <p id="perf-value-error" className={errorClass} role="alert">
                {errors.value}
              </p>
            )}
          </div>

          <input type="hidden" value={unit} readOnly />

          {template.variantOptions && (
            <div className="mb-4">
              <span className={labelClass}>{template.variantLabel ?? 'Variante'}</span>
              <div className="grid grid-cols-3 gap-2">
                {template.variantOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVariant(option)}
                    className={`min-h-[44px] rounded-xl border px-3 text-sm font-semibold transition-colors ${
                      variant === option
                        ? 'border-primary/60 bg-primary/15 text-primary'
                        : 'border-border/70 bg-elevated/80 text-text-secondary hover:bg-surface'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="mb-4">
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

          {template.showRepetitions && template.kind !== 'pullups' && template.kind !== 'reps' && (
            <div className="mb-4">
              <label htmlFor="perf-repetitions" className={labelClass}>
                Repeticiones
              </label>
              <input
                id="perf-repetitions"
                type="number"
                value={repetitions}
                onChange={(e) => setRepetitions(e.target.value)}
                placeholder="Ej: 5"
                min="0"
                className={inputClass}
              />
            </div>
          )}

          {template.showWeight && template.kind !== 'strength' && (
            <div className="mb-4">
              <label htmlFor="perf-weight" className={labelClass}>
                Peso adicional (kg)
              </label>
              <input
                id="perf-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                min="0"
                step="0.5"
                className={inputClass}
              />
            </div>
          )}

          <details className="mb-4 rounded-2xl border border-border/70 bg-surface/70 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-text-primary">
              Campos avanzados
            </summary>
            <div className="mt-4 space-y-4">
              {template.kind !== 'strength' && template.kind !== 'pullups' && (
                <div>
                  <label htmlFor="perf-weight" className={labelClass}>Peso (kg)</label>
                  <input id="perf-weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Opcional" min="0" step="0.1" className={inputClass} />
                </div>
              )}
              {template.kind !== 'time' && (
                <div>
                  <label htmlFor="perf-duration" className={labelClass}>Duración (segundos)</label>
                  <input id="perf-duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Opcional" min="0" className={inputClass} />
                </div>
              )}
              {template.kind !== 'distance' && (
                <div>
                  <label htmlFor="perf-distance" className={labelClass}>Distancia (metros)</label>
                  <input id="perf-distance" type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="Opcional" min="0" step="0.1" className={inputClass} />
                </div>
              )}
            </div>
          </details>

          {/* Notes */}
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
              disabled={isLoading || !value.trim()}
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
