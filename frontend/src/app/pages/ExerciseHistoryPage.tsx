import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useClient } from '@features/clients/hooks/useClients';
import { useExercise } from '@features/exercises/hooks/useExercises';
import { usePerformanceHistory } from '@features/performances/hooks/usePerformances';
import ProgressChart from '@features/performances/components/ProgressChart';
import AppShell from '@app/layout/AppShell';
import { Button, EmptyState, Panel } from '@shared/components/ui';
import { extractVariant, formatPerformance } from '@features/performances/utils/exerciseTemplates';
import { UNIT_LABELS } from '@features/exercises/utils/labels';
import type { PerformanceRecord } from '@shared/types/api';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const SHORT_UNITS: Record<string, string> = {
  kg: 'kg',
  repetitions: 'reps',
  seconds: 's',
  minutes: 'min',
  meters: 'm',
  calories: 'kcal',
};

function getMarkDetails(record: PerformanceRecord): string {
  const parts: string[] = [];
  if (record.repetitions && record.unit !== 'repetitions') parts.push(`× ${record.repetitions} reps`);
  if (record.weight && record.unit !== 'kg') parts.push(`+${record.weight} kg`);
  const variant = extractVariant(record);
  if (variant) parts.push(variant);
  return parts.join(' · ');
}

function MarkValue({ record, size }: { record: PerformanceRecord; size: 'lg' | 'md' }) {
  const unit = record.unit === 'text' ? '' : SHORT_UNITS[record.unit] ?? UNIT_LABELS[record.unit] ?? record.unit;
  const details = getMarkDetails(record);
  return (
    <div className="min-w-0">
      <p className="flex items-baseline gap-1.5">
        <span className={`tabular font-display font-bold leading-none tracking-tight text-text-primary ${size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-2xl'}`}>{record.value}</span>
        {unit && <span className={`font-display font-semibold text-text-muted ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>{unit}</span>}
      </p>
      {details && <p className={`tabular truncate text-text-secondary ${size === 'lg' ? 'mt-2 text-sm' : 'mt-1 text-xs'}`}>{details}</p>}
    </div>
  );
}

export default function ExerciseHistoryPage() {
  const { id: clientId, exerciseId } = useParams<{ id: string; exerciseId: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: isLoadingClient, isError: isErrorClient } = useClient(clientId!);
  const { data: exercise, isLoading: isLoadingExercise, isError: isErrorExercise } = useExercise(exerciseId!);
  const {
    data: history,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
  } = usePerformanceHistory(clientId!, exerciseId!);

  const isLoading = isLoadingClient || isLoadingExercise || isLoadingHistory;
  const isError = isErrorClient || isErrorExercise || isErrorHistory;

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-text-secondary">Cargando...</p>
      </div>
    );
  }

  if (isError || !client || !exercise) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-danger">Error al cargar el histórico</p>
      </div>
    );
  }

  const clientFullName = `${client.firstName} ${client.lastName}`;
  const exerciseName = exercise.name;
  const current = history?.[0];

  return (
    <AppShell title="Histórico">
      <div className="mx-auto max-w-3xl space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 inline-flex items-center gap-1.5 px-3">
          <ChevronLeft size={18} />
          Volver
        </Button>

        <Panel className="relative overflow-hidden p-5 sm:p-6">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/70 via-primary/25 to-transparent" />
          <p className="eyebrow">{clientFullName}</p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">{exerciseName}</h1>

          <div className="mt-6 border-t border-white/[0.08] pt-5">
            <p className="eyebrow text-xs text-text-muted">Marca actual</p>
            <div className="mt-2">
              {current ? <MarkValue record={current} size="lg" /> : <p className="font-display text-3xl font-bold text-text-primary">{formatPerformance(current)}</p>}
            </div>
            <p className="tabular mt-2 text-sm text-text-muted">
              {current ? formatDate(current.date) : 'Sin marcas registradas'}
            </p>
          </div>
        </Panel>

        {!history || history.length === 0 ? (
          <EmptyState title="Sin marcas registradas" description="Crea la primera marca para este ejercicio." />
        ) : (
          <>
            <ProgressChart history={history} />
            <section>
              <h2 className="mb-3 px-1 text-lg font-bold text-text-primary">Registros</h2>
              <Panel className="overflow-hidden">
                <ul className="divide-y divide-white/[0.06]" aria-label="Histórico de marcas">
                  {history.map((record) => (
                    <li key={record.id} className="px-4 py-4 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <MarkValue record={record} size="md" />
                          <p className="mt-1.5 text-xs text-text-muted">
                            Registrado por {record.trainerName}
                          </p>
                        </div>
                        <span className="tabular shrink-0 font-display text-sm font-semibold text-text-secondary">
                          {formatDate(record.date)}
                        </span>
                      </div>

                      {record.notes && (
                        <p className="mt-3 whitespace-pre-line rounded-xl border border-white/[0.08] bg-background/60 p-3 text-sm text-text-secondary">
                          {record.notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
