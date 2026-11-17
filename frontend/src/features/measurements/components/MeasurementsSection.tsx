import { useState } from 'react';
import { ChevronDown, Pencil, Plus, Scale, Trash2 } from 'lucide-react';
import { Button, ConfirmDialog, Panel } from '@shared/components/ui';
import type { ClientMeasurement } from '@shared/types/api';
import { MeasurementChart } from '@features/measurements/components/MeasurementChart';
import { MeasurementForm } from '@features/measurements/components/MeasurementForm';
import { useDeleteMeasurement, useMeasurements, useSaveMeasurement } from '@features/measurements/hooks/useMeasurements';
import { METRICS, formatDay, formatDelta, formatMetric, latestWithDelta } from '@features/measurements/utils/metrics';

interface MeasurementsSectionProps {
  clientId: string;
  clientName: string;
  goalDate?: string | null;
}

const HISTORY_PREVIEW = 4;

export function MeasurementsSection({ clientId, clientName, goalDate }: MeasurementsSectionProps) {
  const { data: measurements = [], isLoading, isError } = useMeasurements(clientId);
  const saveMutation = useSaveMeasurement(clientId);
  const deleteMutation = useDeleteMeasurement(clientId);
  const [editing, setEditing] = useState<ClientMeasurement | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<ClientMeasurement | null>(null);
  const [showAll, setShowAll] = useState(false);

  const lastDate = measurements[0]?.measuredAt;
  const visibleHistory = showAll ? measurements : measurements.slice(0, HISTORY_PREVIEW);

  return (
    <section aria-labelledby="measurements-title">
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="eyebrow">Seguimiento</p>
          <h2 id="measurements-title" className="mt-1.5 text-xl font-bold text-text-primary">Mediciones</h2>
          {lastDate && <p className="mt-0.5 text-sm text-text-muted">Última: {formatDay(lastDate)}</p>}
        </div>
        <Button variant="secondary" onClick={() => setEditing('new')} className="inline-flex shrink-0 items-center gap-1.5 px-4">
          <Plus size={16} />
          Añadir
          <span className="sr-only">medición</span>
        </Button>
      </div>

      <Panel className="overflow-hidden">
        {isLoading && <p className="p-5 text-sm text-text-secondary">Cargando mediciones...</p>}
        {isError && <p role="alert" className="p-5 text-sm text-red-300">No se pudieron cargar las mediciones.</p>}

        {!isLoading && !isError && measurements.length === 0 && (
          <div className="flex items-start gap-3 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
              <Scale size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-text-primary">Sin mediciones todavía</p>
              <p className="mt-0.5 text-sm text-text-muted">Registra peso, grasa corporal y masa muscular para ver su evolución.</p>
            </div>
          </div>
        )}

        {measurements.length > 0 && (
          <>
            <dl className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
              {METRICS.map((metric) => {
                const { value, delta } = latestWithDelta(measurements, metric.key);
                return (
                  <div key={metric.key} className="min-w-0 px-3 py-4 sm:px-5">
                    <dt className="truncate text-xs font-medium text-text-secondary sm:text-sm">{metric.label}</dt>
                    <dd className="tabular mt-1.5 font-display text-xl font-bold leading-none text-text-primary sm:text-2xl">
                      {formatMetric(value, metric.unit)}
                    </dd>
                    {delta !== null && (
                      <dd className="tabular mt-1.5 text-xs text-text-muted">
                        <span className="font-semibold text-text-secondary">{formatDelta(delta)}</span>
                        <span className="sr-only sm:not-sr-only"> desde la anterior</span>
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>

            <div className="p-4 sm:p-5">
              <MeasurementChart measurements={measurements} goalDate={goalDate} />
            </div>

            <div className="border-t border-white/[0.06]">
              <h3 className="px-4 pt-4 font-display text-sm font-bold text-text-secondary sm:px-5">Historial</h3>
              <ul className="divide-y divide-white/[0.06]">
                {visibleHistory.map((measurement) => (
                  <li key={measurement.id} className="flex items-center gap-2 py-2 pl-4 pr-2 sm:pl-5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary">{formatDay(measurement.measuredAt)}</p>
                      <p className="tabular truncate text-sm text-text-secondary">
                        {METRICS.filter((metric) => measurement[metric.key] != null)
                          .map((metric) => formatMetric(measurement[metric.key], metric.unit))
                          .join(' · ')}
                      </p>
                      {measurement.notes && <p className="truncate text-xs text-text-muted">{measurement.notes}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(measurement)}
                      aria-label={`Editar medición del ${formatDay(measurement.measuredAt)}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white/[0.05] hover:text-text-primary focus-ring"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(measurement)}
                      aria-label={`Borrar medición del ${formatDay(measurement.measuredAt)}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger/10 hover:text-red-300 focus-ring"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              {measurements.length > HISTORY_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  aria-expanded={showAll}
                  className="flex min-h-[48px] w-full items-center justify-center gap-1.5 border-t border-white/[0.06] text-sm font-semibold text-primary-soft transition-colors hover:bg-white/[0.03] focus-ring"
                >
                  {showAll ? 'Ver menos' : `Ver las ${measurements.length} mediciones`}
                  <ChevronDown size={16} className={`transition-transform duration-150 ${showAll ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              )}
            </div>
          </>
        )}
      </Panel>

      {editing && (
        <MeasurementForm
          clientName={clientName}
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => saveMutation.mutateAsync({ id: editing === 'new' ? undefined : editing.id, data })}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Borrar medición"
          description={`Se borrará la medición del ${formatDay(toDelete.measuredAt)}. Esta acción no se puede deshacer.`}
          confirmLabel="Borrar"
          pending={deleteMutation.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => deleteMutation.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        />
      )}
    </section>
  );
}
