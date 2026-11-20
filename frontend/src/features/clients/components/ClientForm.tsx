import { useState } from 'react';
import { ChevronDown, Scale } from 'lucide-react';
import { Button } from '@shared/components/ui';
import { useActiveTenant } from '@shared/tenant/useActiveTenant';
import type { CreateClientData, MeasurementInput, UpdateClientData } from '@shared/types/api';
import { METRICS, type MetricKey } from '@features/measurements/utils/metrics';

interface ClientFormProps {
  initial?: Partial<CreateClientData>;
  onSubmit: (data: CreateClientData | UpdateClientData) => Promise<unknown> | void;
  submitLabel?: string;
  showStatus?: boolean;
  /** Client creation: offers an optional first measurement stored as the start of the history. */
  allowInitialMeasurement?: boolean;
}

function toDateInputValue(value?: string | null) {
  if (!value) return new Date().toISOString().split('T')[0];
  return value.split('T')[0];
}

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  return normalized ? Number(normalized) : null;
}

const inputClass =
  'min-h-[46px] w-full rounded-xl border border-border bg-background/60 px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';
const labelClass = 'mb-1.5 block text-sm font-medium text-text-secondary';

export default function ClientForm({
  initial,
  onSubmit,
  submitLabel = 'Guardar',
  showStatus = false,
  allowInitialMeasurement = false,
}: ClientFormProps) {
  const { tenant } = useActiveTenant();
  const measurementsEnabled = tenant?.measurementsEnabled ?? false;

  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [birthDate, setBirthDate] = useState(toDateInputValue(initial?.birthDate));
  const [height, setHeight] = useState(initial?.height?.toString() ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(initial?.status ?? 'ACTIVE');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? '');
  const [goalDate, setGoalDate] = useState(initial?.goalDate ? initial.goalDate.slice(0, 10) : '');
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 10));
  const [measurement, setMeasurement] = useState<Record<MetricKey, string>>({ weight: '', bodyFatPercentage: '', muscleMass: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const measurementValues = Object.fromEntries(METRICS.map(({ key }) => [key, parseDecimal(measurement[key])])) as Record<MetricKey, number | null>;
    const hasMeasurement = Object.values(measurementValues).some((value) => value !== null);
    const initialMeasurement: MeasurementInput | undefined =
      allowInitialMeasurement && measurementsEnabled && hasMeasurement ? { measuredAt, ...measurementValues } : undefined;

    try {
      await onSubmit({
        firstName,
        lastName,
        birthDate,
        height: height ? Number(height) : undefined,
        ...(showStatus ? { status } : {}),
        notes: notes || undefined,
        ...(measurementsEnabled ? { goal: goal.trim() || null, goalDate: goalDate || null } : {}),
        ...(initialMeasurement ? { initialMeasurement } : {}),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="firstName">Nombre</label>
          <input id="firstName" autoFocus autoComplete="off" className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div>
          <label className={labelClass} htmlFor="lastName">Apellidos</label>
          <input id="lastName" autoComplete="off" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="birthDate">Fecha de nacimiento</label>
          <input id="birthDate" type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
        </div>

        <div>
          <label className={labelClass} htmlFor="height">Altura (cm)</label>
          <input id="height" type="number" inputMode="numeric" className={inputClass} value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>
      </div>

      {measurementsEnabled && (
        <fieldset className="space-y-4 rounded-2xl border border-white/[0.08] bg-background/40 p-4">
          <legend className="px-1 font-display text-sm font-bold text-text-secondary">Objetivo <span className="font-sans font-normal text-text-muted">(opcional)</span></legend>
          <div>
            <label className={labelClass} htmlFor="goal">Motivo y meta</label>
            <textarea id="goal" rows={2} maxLength={500} placeholder="Ej.: preparar la media maratón de Valencia" className={`${inputClass} resize-none py-2.5`} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="goalDate">Fecha objetivo</label>
            <input id="goalDate" type="date" className={inputClass} value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
          </div>
        </fieldset>
      )}

      {allowInitialMeasurement && measurementsEnabled && (
        <div className="rounded-2xl border border-white/[0.08] bg-background/40">
          <button
            type="button"
            onClick={() => setShowMeasurement((current) => !current)}
            aria-expanded={showMeasurement}
            aria-controls="initial-measurement"
            className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-4 text-left focus-ring"
          >
            <Scale size={18} className="shrink-0 text-primary-soft" aria-hidden="true" />
            <span className="flex-1">
              <span className="block font-display text-sm font-bold text-text-primary">Primera medición</span>
              <span className="block text-xs text-text-muted">Opcional. Será el punto de partida de su evolución.</span>
            </span>
            <ChevronDown size={18} className={`shrink-0 text-text-muted transition-transform duration-150 ${showMeasurement ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {showMeasurement && (
            <div id="initial-measurement" className="space-y-4 border-t border-white/[0.06] p-4">
              <div>
                <label className={labelClass} htmlFor="initialMeasuredAt">Fecha</label>
                <input id="initialMeasuredAt" type="date" max={new Date().toISOString().slice(0, 10)} className={inputClass} value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {METRICS.map((metric) => (
                  <div key={metric.key}>
                    <label className={labelClass} htmlFor={`initial-${metric.key}`}>{metric.shortLabel} ({metric.unit})</label>
                    <input
                      id={`initial-${metric.key}`}
                      inputMode="decimal"
                      autoComplete="off"
                      className={`${inputClass} tabular text-center`}
                      value={measurement[metric.key]}
                      onChange={(e) => setMeasurement((current) => ({ ...current, [metric.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
        <textarea id="notes" className={`${inputClass} resize-none py-2.5`} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-5">
        <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full sm:w-auto">
          {isSubmitting ? 'Enviando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
