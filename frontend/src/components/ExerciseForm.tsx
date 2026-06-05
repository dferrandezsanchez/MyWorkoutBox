import { useState } from 'react';
import type { CreateExerciseData, UpdateExerciseData } from '../types/api';
import type { PerformanceUnit } from '../types/api';

const UNIT_OPTIONS: { value: PerformanceUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'repetitions', label: 'Repeticiones' },
  { value: 'seconds', label: 'Segundos' },
  { value: 'minutes', label: 'Minutos' },
  { value: 'meters', label: 'Metros' },
  { value: 'calories', label: 'Calorías' },
  { value: 'text', label: 'Texto' },
];

interface ExerciseFormProps {
  initial?: Partial<CreateExerciseData & { status: 'ACTIVE' | 'INACTIVE' }>;
  onSubmit: (data: CreateExerciseData | UpdateExerciseData) => Promise<any> | void;
  submitLabel?: string;
  showStatus?: boolean;
}

export default function ExerciseForm({
  initial,
  onSubmit,
  submitLabel = 'Guardar',
  showStatus = false,
}: ExerciseFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'General');
  const [defaultUnit, setDefaultUnit] = useState(initial?.defaultUnit ?? 'repetitions');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        category,
        defaultUnit,
        description: description || undefined,
        ...(showStatus ? { status } : {}),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full border border-border rounded-md px-3 py-2 min-h-[44px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="ex-name">Nombre</label>
        <input id="ex-name" autoFocus className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label className={labelClass} htmlFor="ex-category">Categoría</label>
        <input id="ex-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>

      <div>
        <label className={labelClass} htmlFor="ex-unit">Unidad por defecto</label>
        <select id="ex-unit" className={inputClass} value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value as PerformanceUnit)}>
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="ex-desc">Descripción</label>
        <textarea id="ex-desc" className="w-full border border-border rounded-md px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 min-h-[44px] bg-primary hover:bg-primary-hover text-white rounded-md">{isSubmitting ? 'Enviando...' : submitLabel}</button>
      </div>
    </form>
  );
}
