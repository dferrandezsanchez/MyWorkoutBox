import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Plus,
  Repeat,
  ShieldCheck,
  Timer,
  UserCog,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { useAuthUser } from '@features/auth/hooks/useAuthUser';
import { useClients } from '@features/clients/hooks/useClients';
import { ActivityChart } from '@features/dashboard/components/ActivityChart';
import { Sparkline } from '@features/dashboard/components/Sparkline';
import { useDashboardOverview } from '@features/dashboard/hooks/useDashboardOverview';
import { useExercises } from '@features/exercises/hooks/useExercises';
import { useTrainers } from '@features/trainers/hooks/useTrainers';
import Avatar from '@shared/components/Avatar';
import { Button, PageHeader, Panel } from '@shared/components/ui';
import { useActiveTenant } from '@shared/tenant/useActiveTenant';
import type { Client, DashboardOverview } from '@shared/types/api';

function calculateAge(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function hasDataIssue(client: Client): boolean {
  const age = calculateAge(client.birthDate);
  return age < 12 || age > 90 || (client.height == null && client.weight == null);
}

function splitName(name: string): [string, string] {
  const [first = '', ...rest] = name.split(' ');
  return [first, rest.join(' ')];
}

function formatElapsed(startedAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

type DeltaTone = 'up' | 'down' | 'flat';

function getDelta(current: number, previous: number): { value: string; tone: DeltaTone } {
  if (current === previous) return { value: '=', tone: 'flat' };
  if (previous === 0) return { value: `+${current}`, tone: 'up' };
  const percent = Math.round(((current - previous) / previous) * 100);
  const sign = percent > 0 ? '+' : '';
  return { value: `${sign}${percent}%`, tone: percent >= 0 ? 'up' : 'down' };
}

const deltaTone: Record<DeltaTone, string> = {
  up: 'text-success',
  down: 'text-red-300',
  flat: 'text-text-muted',
};

const rowButton = 'flex w-full items-center gap-3 rounded-xl px-2 text-left transition-colors duration-150 hover:bg-white/[0.03] focus-ring';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { tenant } = useActiveTenant();
  const { data: user } = useAuthUser();
  const { data: overview, isLoading: overviewLoading, isError: overviewError } = useDashboardOverview();
  const { data: clients, isLoading: clientsLoading, isError: clientsError } = useClients(undefined, true);
  const { data: exercises, isLoading: exercisesLoading, isError: exercisesError } = useExercises(true);
  const { data: trainers, isLoading: trainersLoading, isError: trainersError } = useTrainers(true);

  const activeClients = useMemo(() => clients?.filter((client) => client.status === 'ACTIVE') ?? [], [clients]);
  const activeExercises = useMemo(() => exercises?.filter((exercise) => exercise.status === 'ACTIVE') ?? [], [exercises]);
  const activeTrainers = useMemo(() => trainers?.filter((trainer) => trainer.active) ?? [], [trainers]);
  const dataIssues = useMemo(() => activeClients.filter(hasDataIssue).slice(0, 6), [activeClients]);
  const hasLoadError = overviewError || clientsError || exercisesError || trainersError;
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AppShell title="Control del centro">
      <div className="mx-auto max-w-7xl space-y-5 pb-4 lg:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <PageHeader eyebrow={tenant?.name ?? 'Administración'} title={`Hola, ${user?.name || 'Admin'}`} description={`Así va tu centro · ${today}`} />
          <div className="hidden shrink-0 gap-2 lg:mb-8 lg:flex">
            <Button variant="secondary" onClick={() => navigate('/trainer')} className="inline-flex items-center gap-2">
              <Dumbbell size={16} />
              Modo entrenador
            </Button>
            <Button variant="primary" onClick={() => navigate('/admin/clients')} className="inline-flex items-center gap-2">
              <Plus size={16} />
              Gestionar clientes
            </Button>
          </div>
        </div>

        {hasLoadError && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">
            No se pudo cargar todo el resumen operativo.
          </p>
        )}

        <KpiGrid overview={overview} loading={overviewLoading} activeClientCount={clientsLoading ? null : activeClients.length} />

        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          <Panel className="p-5 lg:col-span-2 lg:p-6">
            <CardHeader eyebrow="Actividad" title="Series registradas" meta={overview ? `Últimos ${overview.period.days} días` : undefined} />
            <div className="mt-5">
              {overviewLoading || !overview ? (
                <div className="h-48 animate-pulse rounded-xl bg-white/[0.03]" aria-hidden="true" />
              ) : (
                <ActivityChart days={overview.daily} />
              )}
            </div>
          </Panel>

          <Panel className="flex flex-col p-5 lg:p-6">
            <CardHeader eyebrow="Ahora" title="En curso" meta={overview ? `${overview.activeSessions.length} activas` : undefined} />
            <div className="mt-4 flex-1">
              {!overview || overview.activeSessions.length === 0 ? (
                <EmptyHint icon={Timer} title="Ningún entrenamiento en curso" description="Aparecerán aquí en cuanto un entrenador empiece una sesión." />
              ) : (
                <ul className="-mx-2 divide-y divide-white/[0.06]">
                  {overview.activeSessions.map((session) => {
                    const [firstName, lastName] = splitName(session.clientName);
                    return (
                      <li key={session.id}>
                        <button type="button" onClick={() => navigate(`/clients/${session.clientId}?mode=admin`)} className={`${rowButton} min-h-[64px] py-2`}>
                          <span className="relative">
                            <Avatar firstName={firstName} lastName={lastName} size="sm" />
                            <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary ring-2 ring-surface" />
                            </span>
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text-primary">{session.clientName}</span>
                            <span className="block truncate text-xs text-text-muted">con {session.trainerName}</span>
                          </span>
                          <span className="text-right">
                            <span className="tabular block font-display text-sm font-bold text-primary-soft">{formatElapsed(session.startedAt)}</span>
                            <span className="tabular block text-xs text-text-muted">{session.seriesCount} series</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          <Panel className="p-5 lg:col-span-2 lg:p-6">
            <CardHeader eyebrow="Historial" title="Últimas sesiones" />
            <div className="mt-3">
              {!overview || overview.recentSessions.length === 0 ? (
                <EmptyHint icon={Activity} title="Todavía no hay sesiones completadas" description="Cuando el equipo finalice entrenamientos, los verás aquí." />
              ) : (
                <ul className="-mx-2 divide-y divide-white/[0.06]">
                  {overview.recentSessions.map((session) => {
                    const [firstName, lastName] = splitName(session.clientName);
                    return (
                      <li key={session.id}>
                        <button type="button" onClick={() => navigate(`/clients/${session.clientId}?mode=admin`)} className={`${rowButton} min-h-[60px] py-2`}>
                          <Avatar firstName={firstName} lastName={lastName} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text-primary">{session.clientName}</span>
                            <span className="block truncate text-xs text-text-muted">
                              {session.trainerName} · {formatShortDate(session.completedAt)}
                            </span>
                          </span>
                          <span className="tabular whitespace-nowrap rounded-full border border-white/[0.08] px-2.5 py-1 text-xs font-semibold text-text-secondary">
                            {session.exerciseCount} ej · {session.seriesCount} series
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Panel>

          <Panel className="p-5 lg:p-6">
            <CardHeader eyebrow="Equipo" title="Entrenadores" meta={overview ? `${overview.period.days} días` : undefined} />
            <div className="mt-4">
              {!overview || overview.trainers.length === 0 ? (
                <EmptyHint icon={UserCog} title="Sin actividad del equipo" description="El ranking se calcula con las series del periodo." />
              ) : (
                <TeamRanking trainers={overview.trainers} />
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
          <Panel className="p-5 lg:p-6">
            <CardHeader eyebrow="Seguimiento" title="Clientes a reactivar" />
            <p className="mt-1 text-xs text-text-muted">Activos sin entrenar en los últimos 14 días.</p>
            <div className="mt-3">
              {!overview || overview.clientsToReactivate.length === 0 ? (
                <EmptyHint icon={UserRoundCheck} title="Todos entrenan con regularidad" />
              ) : (
                <ul className="-mx-2 divide-y divide-white/[0.06]">
                  {overview.clientsToReactivate.map((client) => {
                    const [firstName, lastName] = splitName(client.name);
                    return (
                      <li key={client.id}>
                        <button type="button" onClick={() => navigate(`/clients/${client.id}?mode=admin`)} className={`${rowButton} min-h-[56px]`}>
                          <Avatar firstName={firstName} lastName={lastName} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{client.name}</span>
                          <span className="tabular shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning ring-1 ring-warning/25">
                            {client.daysSince == null ? 'Sin sesiones' : `${client.daysSince} días`}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Panel>

          <Panel className="p-5 lg:p-6">
            <CardHeader eyebrow="Calidad" title="Datos a revisar" />
            <div className="mt-3">
              {clientsError && <p className="py-2 text-sm text-red-300">No se pudieron cargar los clientes.</p>}
              {!clientsError && clientsLoading && <p className="py-2 text-sm text-text-secondary">Revisando perfiles...</p>}
              {!clientsError && !clientsLoading && dataIssues.length === 0 && (
                <EmptyHint icon={CheckCircle2} title="No hay incidencias visibles" description="Todo está al día." tone="success" />
              )}
              {!clientsError && dataIssues.length > 0 && (
                <ul className="-mx-2 divide-y divide-white/[0.06]">
                  {dataIssues.map((client) => (
                    <li key={client.id}>
                      <button type="button" onClick={() => navigate(`/admin/clients/${client.id}`)} className={`${rowButton} min-h-[56px]`}>
                        <ShieldCheck size={18} className="shrink-0 text-warning" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-text-primary">{client.firstName} {client.lastName}</span>
                          <span className="block text-xs text-text-muted">Edad o datos físicos pendientes</span>
                        </span>
                        <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel className="p-5 lg:p-6">
            <CardHeader eyebrow="Tu centro" title="Catálogo y equipo" />
            <ul className="-mx-2 mt-3 divide-y divide-white/[0.06]">
              <CenterLink icon={Users} label="Clientes activos" value={clientsLoading ? '…' : activeClients.length} onClick={() => navigate('/admin/clients')} />
              <CenterLink icon={UserCog} label="Entrenadores" value={trainersLoading ? '…' : activeTrainers.length} onClick={() => navigate('/admin/trainers')} />
              <CenterLink icon={Dumbbell} label="Ejercicios" value={exercisesLoading ? '…' : activeExercises.length} onClick={() => navigate('/admin/exercises')} />
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function KpiGrid({ overview, loading, activeClientCount }: { overview?: DashboardOverview; loading: boolean; activeClientCount: number | null }) {
  const totals = overview?.totals;
  const live = overview?.activeSessions.length ?? 0;

  return (
    <section aria-label="Indicadores de los últimos 28 días" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <KpiCard
        icon={Activity}
        label="Sesiones"
        value={loading || !totals ? '…' : totals.completedSessions}
        delta={totals ? getDelta(totals.completedSessions, totals.previousCompletedSessions) : undefined}
        trend={overview?.daily.map((day) => day.sessions)}
      />
      <KpiCard
        icon={Repeat}
        label="Series registradas"
        value={loading || !totals ? '…' : totals.series}
        delta={totals ? getDelta(totals.series, totals.previousSeries) : undefined}
        trend={overview?.daily.map((day) => day.series)}
      />
      <KpiCard
        icon={UserRoundCheck}
        label="Clientes entrenados"
        value={loading || !totals ? '…' : totals.trainedClients}
        delta={totals ? getDelta(totals.trainedClients, totals.previousTrainedClients) : undefined}
        detail={activeClientCount != null && totals ? `de ${activeClientCount} activos` : undefined}
      />
      <KpiCard icon={Timer} label="En curso ahora" value={loading || !overview ? '…' : live} detail={live === 1 ? 'sesión activa' : 'sesiones activas'} live={live > 0} />
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  detail,
  trend,
  live = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  delta?: { value: string; tone: DeltaTone };
  detail?: string;
  trend?: number[];
  live?: boolean;
}) {
  return (
    <Panel className={`p-4 lg:p-5 ${live ? 'border-primary/30 bg-primary/[0.04]' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${live ? 'border-primary/40 bg-primary/15 text-primary-soft' : 'border-white/[0.08] bg-background/60 text-text-muted'}`}>
          <Icon size={15} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="tabular font-display text-3xl font-bold leading-none tracking-tight text-text-primary lg:text-4xl">{value}</p>
        {trend && <Sparkline values={trend} className="hidden h-9 w-24 sm:block" />}
      </div>
      {delta && (
        <p className={`tabular mt-2 text-xs font-medium ${deltaTone[delta.tone]}`}>
          {delta.value}
          <span className="sr-only sm:not-sr-only"> vs. periodo anterior</span>
        </p>
      )}
      {detail && <p className={`text-xs text-text-muted ${delta ? 'mt-0.5' : 'mt-2'}`}>{detail}</p>}
    </Panel>
  );
}

function TeamRanking({ trainers }: { trainers: DashboardOverview['trainers'] }) {
  const max = Math.max(...trainers.map((trainer) => trainer.series), 1);
  return (
    <ol className="space-y-4">
      {trainers.map((trainer, index) => {
        const [firstName, lastName] = splitName(trainer.name);
        return (
          <li key={trainer.id} className="flex items-center gap-3">
            <span className="tabular w-4 text-center font-display text-sm font-bold text-text-muted">{index + 1}</span>
            <Avatar firstName={firstName} lastName={lastName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-text-primary">{trainer.name}</span>
                <span className="tabular shrink-0 text-xs text-text-muted">{trainer.sessions} ses · {trainer.series} series</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((trainer.series / max) * 100, 4)}%` }} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CardHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="eyebrow text-text-muted">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-bold text-text-primary lg:text-xl">{title}</h2>
      </div>
      {meta && <span className="tabular shrink-0 text-xs text-text-muted">{meta}</span>}
    </div>
  );
}

function EmptyHint({ icon: Icon, title, description, tone = 'muted' }: { icon: LucideIcon; title: string; description?: string; tone?: 'muted' | 'success' }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${tone === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-white/[0.08] bg-background/60 text-text-muted'}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
      </div>
    </div>
  );
}

function CenterLink({ icon: Icon, label, value, onClick }: { icon: LucideIcon; label: string; value: ReactNode; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`${rowButton} min-h-[56px]`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-text-primary">{label}</span>
        <span className="tabular font-display text-lg font-bold text-text-primary">{value}</span>
        <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
      </button>
    </li>
  );
}
