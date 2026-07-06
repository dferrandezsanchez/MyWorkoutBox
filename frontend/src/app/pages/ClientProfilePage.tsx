import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ClipboardList, Dumbbell, History, Play, Trophy } from 'lucide-react';
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
      navigate(`/trainer/sessions/${activeSession.id}`);
      return;
    }
    const session = await startSession.mutateAsync(clientId!);
    navigate(`/trainer/sessions/${session.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-text-secondary">Cargando cliente...</p>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-red-500">Error al cargar el cliente</p>
      </div>
    );
  }

  return (
    <AppShell title="Ficha cliente">
      <div className="mx-auto max-w-4xl space-y-4">
        <Panel className="p-4 sm:p-6">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <Button onClick={() => navigate(-1)} className="inline-flex min-h-10 items-center gap-2 px-3">
                <ChevronLeft size={16} />
                Volver
              </Button>
              <StatusBadge status={client.status} />
            </div>

            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
              <Avatar
                firstName={client.firstName}
                lastName={client.lastName}
                size="lg"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Cliente activo
                </p>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                  {client.firstName} {client.lastName}
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                  {formatAge(client.birthDate)}
                  {client.height != null ? ` · ${client.height} cm` : ''}
                  {client.weight != null ? ` · ${client.weight} kg` : ''}
                </p>
              </div>
            </div>

            <Button variant="primary" onClick={() => void openSession()} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 sm:w-auto">
              <Play size={17} fill="currentColor" />
              {activeSession ? `Continuar sesión de ${activeSession.client.firstName}` : 'Iniciar entrenamiento'}
            </Button>
          </div>
        </Panel>

        <section>
          <div className="mb-3 flex items-center gap-2"><ClipboardList size={18} className="text-primary" /><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Notas importantes</p></div>
          <Panel className="border-l-4 border-l-primary p-4 sm:p-5">
            <p className="leading-7 text-text-secondary">{client.notes || 'No hay observaciones registradas para este cliente.'}</p>
          </Panel>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Marcas
              </p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">Ejercicios de referencia</h2>
              <p className="text-sm text-text-secondary">Última marca, mejor registro e histórico.</p>
            </div>
          </div>

          {!currentPerformances || currentPerformances.length === 0 ? (
            <EmptyState title="No hay ejercicios activos" />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {currentPerformances.map((item) => (
                <ExerciseMarkCard
                  key={item.exerciseId}
                  item={item}
                  clientId={clientId!}
                />
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Entrenamientos</p><h2 className="mt-1 text-xl font-semibold text-text-primary">Sesiones anteriores</h2></div>
          {clientSessions.length === 0 ? <EmptyState title="Sin sesiones finalizadas" /> : (
            <Panel className="overflow-hidden p-0"><div className="divide-y divide-border/70">{clientSessions.map((session) => {
              const series = session.exercises.reduce((total, item) => total + item.series.length, 0);
              return <button key={session.id} onClick={() => navigate(`/trainer/sessions/${session.id}`)} className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10 focus-ring"><span className="flex items-center gap-3"><CalendarDays size={18} className="text-primary" /><span><span className="block font-semibold text-text-primary">{new Date(session.startedAt).toLocaleDateString('es-ES')}</span><span className="text-xs text-text-secondary">{session.exercises.length} ejercicios · {series} series</span></span></span><span className="text-sm text-text-secondary">{session.trainerName}</span></button>;
            })}</div></Panel>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ExerciseMarkCard({
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
  const trendLabel = trend === 'progressing' ? 'Progresando' : trend === 'stable' ? 'Estable' : 'Sin tendencia';

  return (
    <Panel className="max-w-full overflow-hidden p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Dumbbell size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-text-primary">
              {item.exerciseName}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Última: <span className="font-semibold text-text-primary">{formatPerformance(item.record)}</span>
            </p>
          </div>
        </div>
        <span className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${trend === 'progressing' ? 'bg-emerald-500/12 text-emerald-600' : 'bg-surface text-text-secondary'}`}>
          {trendLabel}
        </span>
      </div>

      {bars.length > 0 && (
        <div className="mt-4 flex h-16 items-end gap-1.5 rounded-xl bg-surface/60 px-3 pt-3" aria-label={`Evolución de ${item.exerciseName}`}>
          {bars.map((height, index) => <span key={`${item.exerciseId}-${index}`} className="min-w-0 flex-1 rounded-t-sm bg-primary/35 last:bg-primary" style={{ height: `${height}%` }} />)}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-surface/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <History size={13} />
            Última
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text-primary">{formatPerformance(item.record)}</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-border/70 bg-surface/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <Trophy size={13} />
            Mejor
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text-primary">{formatPerformance(item.bestRecord)}</p>
        </div>
      </div>

      <div className="mt-4">
        <Button
          variant="secondary"
          onClick={() => navigate(`/clients/${clientId}/exercises/${item.exerciseId}${location.search}`)}
          className="inline-flex w-full items-center justify-center gap-2"
        >
          <History size={16} />
          Histórico
        </Button>
      </div>
    </Panel>
  );
}
