import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, History, Play, TrendingUp, Trophy } from 'lucide-react';
import Avatar from '@shared/components/Avatar';
import AppShell from '@app/layout/AppShell';
import { Button, EmptyState, Panel, StatusBadge } from '@shared/components/ui';
import { useClient } from '@features/clients/hooks/useClients';
import { useCurrentPerformances } from '@features/performances/hooks/usePerformances';
import { formatPerformance } from '@features/performances/utils/exerciseTemplates';
import { getPerformanceTrend, getTrendBars } from '@features/performances/utils/performanceTrend';
import { useActiveSession, useClientSessions, useStartSession } from '@features/training-sessions/hooks/useTrainingSessions';
import type { CurrentMark } from '@shared/types/api';

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function formatAge(birthDate: string): string {
  const age = calculateAge(birthDate);
  return age >= 12 && age <= 90 ? `${age} años` : 'Edad pendiente';
}

export default function ClientProfilePage() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: isLoadingClient, isError: isErrorClient } = useClient(clientId!);
  const {
    data: currentPerformances,
    isLoading: isLoadingPerformances,
    isError: isErrorPerformances,
  } = useCurrentPerformances(clientId!);
  const { data: activeSession } = useActiveSession();
  const { data: clientSessions = [] } = useClientSessions(clientId!);
  const startSession = useStartSession();

  const isLoading = isLoadingClient || isLoadingPerformances;
  const isError = isErrorClient || isErrorPerformances;

  const openSession = async () => {
    if (activeSession) {
      void navigate(`/trainer/sessions/${activeSession.id}`);
      return;
    }
    const session = await startSession.mutateAsync(clientId!);
    void navigate(`/trainer/sessions/${session.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-text-secondary">Cargando cliente...</p>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-danger">Error al cargar el cliente</p>
      </div>
    );
  }

  return (
    <AppShell title="Ficha cliente">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 inline-flex items-center gap-1.5 px-3">
            <ChevronLeft size={18} />
            Volver
          </Button>
          <StatusBadge status={client.status} />
        </div>

        <Panel className="relative overflow-hidden p-5 sm:p-7">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/70 via-primary/25 to-transparent" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar
                firstName={client.firstName}
                lastName={client.lastName}
                size="lg"
              />
              <div className="min-w-0">
                <p className="eyebrow">Cliente activo</p>
                <h1 className="mt-1.5 truncate text-2xl font-bold text-text-primary sm:text-[2.25rem] sm:leading-[1.1]">
                  {client.firstName} {client.lastName}
                </h1>
                <p className="tabular mt-1 text-sm text-text-secondary">
                  {formatAge(client.birthDate)}
                  {client.height != null ? ` · ${client.height} cm` : ''}
                  {client.weight != null ? ` · ${client.weight} kg` : ''}
                </p>
              </div>
            </div>

            <Button variant="primary" onClick={() => void openSession()} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 sm:w-auto">
              <Play size={16} fill="currentColor" />
              {activeSession ? `Continuar sesión de ${activeSession.client.firstName}` : 'Iniciar entrenamiento'}
            </Button>
          </div>
        </Panel>

        <section>
          <p className="eyebrow mb-3 flex items-center gap-2 px-1"><ClipboardList size={14} />Notas importantes</p>
          <Panel className="border-l-2 border-l-primary/70 p-4 sm:p-5">
            <p className="leading-7 text-text-secondary">{client.notes || 'No hay observaciones registradas para este cliente.'}</p>
          </Panel>
        </section>

        <section>
          <div className="mb-3 px-1">
            <p className="eyebrow">Marcas</p>
            <h2 className="mt-1.5 text-xl font-bold text-text-primary">Ejercicios de referencia</h2>
            <p className="mt-0.5 text-sm text-text-muted">Última marca, mejor registro e histórico.</p>
          </div>

          {!currentPerformances || currentPerformances.length === 0 ? (
            <EmptyState title="No hay ejercicios activos" />
          ) : (
            <Panel className="divide-y divide-white/[0.06] overflow-hidden">
              {currentPerformances.map((item) => (
                <ExerciseMarkRow
                  key={item.exerciseId}
                  item={item}
                  clientId={clientId!}
                />
              ))}
            </Panel>
          )}
        </section>

        <section>
          <div className="mb-3 px-1">
            <p className="eyebrow">Entrenamientos</p>
            <h2 className="mt-1.5 text-xl font-bold text-text-primary">Sesiones anteriores</h2>
          </div>
          {clientSessions.length === 0 ? <EmptyState title="Sin sesiones finalizadas" /> : (
            <Panel className="overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {clientSessions.map((session) => {
                  const series = session.exercises.reduce((total, item) => total + item.series.length, 0);
                  return (
                    <button key={session.id} onClick={() => navigate(`/trainer/sessions/${session.id}`)} className="group flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-white/[0.03] focus-ring sm:px-5">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-background/60 text-text-secondary"><CalendarDays size={17} /></span>
                        <span className="min-w-0">
                          <span className="tabular block font-display font-bold text-text-primary">{new Date(session.startedAt).toLocaleDateString('es-ES')}</span>
                          <span className="tabular text-xs text-text-muted">{session.exercises.length} ejercicios · {series} series</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-sm text-text-secondary">
                        <span className="hidden truncate min-[380px]:inline">{session.trainerName}</span>
                        <ChevronRight size={18} className="text-text-muted transition-colors duration-150 group-hover:text-primary-soft" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ExerciseMarkRow({
  item,
  clientId,
}: {
  item: CurrentMark;
  clientId: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const records = item.recentRecords ?? [];
  const trend = getPerformanceTrend(records, item.exercise.improvementDirection);
  const bars = getTrendBars(records);
  const progressing = trend === 'progressing';
  const hasRecord = Boolean(item.record);

  return (
    <button
      type="button"
      onClick={() => navigate(`/clients/${clientId}/exercises/${item.exerciseId}${location.search}`)}
      aria-label={`Ver histórico de ${item.exerciseName}`}
      className="group flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-white/[0.03] active:bg-white/[0.05] focus-ring sm:px-5"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-display text-base font-bold text-text-primary">{item.exerciseName}</span>
          {progressing && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success ring-1 ring-success/25">
              <TrendingUp size={12} aria-hidden="true" />
              Progresa
            </span>
          )}
        </span>
        {hasRecord ? (
          <>
            <span className="tabular mt-1 flex items-center gap-1.5 truncate text-sm text-text-secondary">
              <History size={13} className="shrink-0 text-text-muted" aria-hidden="true" />
              <span className="sr-only">Última:</span>
              <span className="truncate">{formatPerformance(item.record)}</span>
            </span>
            <span className="tabular mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold text-primary-soft">
              <Trophy size={13} className="shrink-0" aria-hidden="true" />
              <span className="sr-only">Mejor:</span>
              <span className="truncate">{formatPerformance(item.bestRecord)}</span>
            </span>
          </>
        ) : (
          <span className="mt-1 block text-sm text-text-muted">Sin marcas todavía</span>
        )}
      </span>

      {bars.length > 1 && (
        <span aria-hidden="true" className="flex h-9 w-16 shrink-0 items-end gap-[3px]">
          {bars.map((height, index) => (
            <span key={`${item.exerciseId}-${index}`} className="min-w-0 flex-1 rounded-t-[2px] bg-primary/25 last:bg-primary" style={{ height: `${Math.max(height, 8)}%` }} />
          ))}
        </span>
      )}
      <ChevronRight size={18} className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" aria-hidden="true" />
    </button>
  );
}
