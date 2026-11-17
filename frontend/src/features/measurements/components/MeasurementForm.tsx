import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Button, Dialog } from '@shared/components/ui';
import type { ClientMeasurement, MeasurementInput } from '@shared/types/api';
import { METRICS, toDateInput, type MetricKey } from '@features/measurements/utils/metrics';

interface MeasurementFormProps {
  clientName: string;
  initial?: ClientMeasurement;
  onSave: (data: MeasurementInput) => Promise<unknown>;
  onClose: () => void;
}

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return 'No se pudo guardar la medición.';
}

const inputClass =
  'min-h-[48px] w-full rounded-xl border border-border bg-background/60 px-3.5 py-2 text-base text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';
const labelClass = 'mb-1.5 block text-sm font-medium text-text-secondary';

export function MeasurementForm({ clientName, initial, onSave, onClose }: MeasurementFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [measuredAt, setMeasuredAt] = useState(toDateInput(initial?.measuredAt));
  const [values, setValues] = useState<Record<MetricKey, string>>({
    weight: initial?.weight?.toString().replace('.', ',') ?? '',
    bodyFatPercentage: initial?.bodyFatPercentage?.toString().replace('.', ',') ?? '',
    muscleMass: initial?.muscleMass?.toString().replace('.', ',') ?? '',
  });
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Object.fromEntries(METRICS.map(({ key }) => [key, parseDecimal(values[key])])) as Record<MetricKey, number | null>;

    if (Object.values(parsed).some((value) => Number.isNaN(value))) {
      setError('Revisa los valores: usa solo números, con coma o punto para los decimales.');
      return;
    }
    if (Object.values(parsed).every((value) => value === null)) {
      setError('Indica al menos el peso, la grasa corporal o la masa muscular.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave({ measuredAt, ...parsed, notes: notes.trim() || null });
      onClose();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog label={initial ? 'Editar medición' : 'Nueva medición'} onClose={onClose} className="max-w-md">
      <p className="eyebrow mb-1">{clientName}</p>
      <h2 className="pr-10 text-xl font-bold text-text-primary">{initial ? 'Editar medición' : 'Nueva medición'}</h2>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="measuredAt" className={labelClass}>Fecha</label>
          <input id="measuredAt" type="date" max={today} required className={inputClass} value={measuredAt} onChange={(event) => setMeasuredAt(event.target.value)} />
        </div>

        <fieldset>
          <legend className="sr-only">Valores medidos</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {METRICS.map((metric) => (
              <div key={metric.key}>
                <label htmlFor={`measurement-${metric.key}`} className={labelClass}>
                  {metric.shortLabel}
                </label>
                <div className="relative">
                  <input
                    id={`measurement-${metric.key}`}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="—"
                    aria-describedby={`measurement-${metric.key}-unit`}
                    className={`${inputClass} tabular pr-9 text-center font-display font-bold`}
                    value={values[metric.key]}
                    onChange={(event) => setValues((current) => ({ ...current, [metric.key]: event.target.value }))}
                  />
                  <span id={`measurement-${metric.key}-unit`} className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-text-muted">
                    {metric.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted">Rellena solo lo que hayas medido.</p>
        </fieldset>

        <div>
          <label htmlFor="measurement-notes" className={labelClass}>Notas</label>
          <textarea id="measurement-notes" rows={2} maxLength={1000} placeholder="Opcional" className={`${inputClass} resize-none py-2.5`} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
