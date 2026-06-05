import { useState } from 'react';
import type { CreateClientData, UpdateClientData } from '../types/api';

interface ClientFormProps {
  initial?: Partial<CreateClientData>;
  onSubmit: (data: CreateClientData | UpdateClientData) => Promise<any> | void;
  submitLabel?: string;
  showStatus?: boolean;
}

function toDateInputValue(value?: string) {
  if (!value) return new Date().toISOString().split('T')[0];
  return value.split('T')[0];
}

export default function ClientForm({
  initial,
  onSubmit,
  submitLabel = 'Guardar',
  showStatus = false,
}: ClientFormProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [birthDate, setBirthDate] = useState(toDateInputValue(initial?.birthDate));
  const [height, setHeight] = useState(initial?.height?.toString() ?? '');
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? '');
  const [bodyFatPercentage, setBodyFatPercentage] = useState(
    initial?.bodyFatPercentage?.toString() ?? '',
  );
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        firstName,
        lastName,
        birthDate,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : undefined,
        ...(showStatus ? { status } : {}),
        notes: notes || undefined,
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
        <label className={labelClass} htmlFor="firstName">Nombre</label>
        <input id="firstName" autoFocus className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>

      <div>
        <label className={labelClass} htmlFor="lastName">Apellidos</label>
        <input id="lastName" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      </div>

      <div>
        <label className={labelClass} htmlFor="birthDate">Fecha de nacimiento</label>
        <input id="birthDate" type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
      </div>

      <div>
        <label className={labelClass} htmlFor="height">Altura (cm)</label>
        <input id="height" type="number" className={inputClass} value={height} onChange={(e) => setHeight(e.target.value)} />
      </div>

      <div>
        <label className={labelClass} htmlFor="weight">Peso (kg)</label>
        <input id="weight" type="number" step="0.1" className={inputClass} value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>

      <div>
        <label className={labelClass} htmlFor="bodyFatPercentage">% Grasa corporal</label>
        <input id="bodyFatPercentage" type="number" step="0.1" min="0" max="100" className={inputClass} value={bodyFatPercentage} onChange={(e) => setBodyFatPercentage(e.target.value)} />
      </div>

      {showStatus && (
        <div>
          <label className={labelClass} htmlFor="status">Estado</label>
          <select id="status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="notes">Notas</label>
        <textarea id="notes" className="w-full border border-border rounded-md px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 min-h-[44px] bg-primary hover:bg-primary-hover text-white rounded-md">
          {isSubmitting ? 'Enviando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
