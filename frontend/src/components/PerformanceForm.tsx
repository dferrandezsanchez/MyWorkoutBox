import { useState, useEffect, useRef } from 'react';
import type { PerformanceUnit } from '../types/api';
import { useCreatePerformance } from '../hooks/usePerformances';

interface PerformanceFormProps {
  clientId: string;
  exerciseId: string;
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

export default function PerformanceForm({ clientId, exerciseId, onClose }: PerformanceFormProps) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<PerformanceUnit>('kg');
  const [date, setDate] = useState(getTodayISO());
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
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

    createPerformance(
      {
        value: unit === 'text' ? value : Number(value),
        unit,
        date,
        repetitions: repetitions ? Number(repetitions) : undefined,
        weight: weight ? Number(weight) : undefined,
        duration: duration ? Number(duration) : undefined,
        distance: distance ? Number(distance) : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  const inputClass =
    'w-full border border-border rounded-md px-3 py-2 min-h-[44px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1';
  const errorClass = 'text-red-500 text-xs mt-1';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Formulario de nueva marca"
    >
      {/* Content card */}
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Nueva marca</h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Value */}
          <div className="mb-4">
            <label htmlFor="perf-value" className={labelClass}>
              Valor <span aria-hidden="true">*</span>
            </label>
            <input
              id="perf-value"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              ref={firstInputRef}
              autoFocus
              placeholder="Ej: 100"
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

          {/* Unit */}
          <div className="mb-4">
            <label htmlFor="perf-unit" className={labelClass}>
              Unidad <span aria-hidden="true">*</span>
            </label>
            <select
              id="perf-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as PerformanceUnit)}
              className={inputClass}
              aria-required="true"
              aria-describedby={errors.unit ? 'perf-unit-error' : undefined}
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.unit && (
              <p id="perf-unit-error" className={errorClass} role="alert">
                {errors.unit}
              </p>
            )}
          </div>

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

          {/* Repetitions */}
          <div className="mb-4">
            <label htmlFor="perf-repetitions" className={labelClass}>
              Repeticiones
            </label>
            <input
              id="perf-repetitions"
              type="number"
              value={repetitions}
              onChange={(e) => setRepetitions(e.target.value)}
              placeholder="Opcional"
              min="0"
              className={inputClass}
            />
          </div>

          {/* Weight */}
          <div className="mb-4">
            <label htmlFor="perf-weight" className={labelClass}>
              Peso (kg)
            </label>
            <input
              id="perf-weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Opcional"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </div>

          {/* Duration */}
          <div className="mb-4">
            <label htmlFor="perf-duration" className={labelClass}>
              Duración (segundos)
            </label>
            <input
              id="perf-duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Opcional"
              min="0"
              className={inputClass}
            />
          </div>

          {/* Distance */}
          <div className="mb-4">
            <label htmlFor="perf-distance" className={labelClass}>
              Distancia (metros)
            </label>
            <input
              id="perf-distance"
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="Opcional"
              min="0"
              step="0.1"
              className={inputClass}
            />
          </div>

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
              className="w-full border border-border rounded-md px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] rounded-md border border-border text-text-primary hover:bg-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !value.trim()}
              className="px-4 py-2 min-h-[44px] rounded-md bg-primary hover:bg-primary-hover text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
