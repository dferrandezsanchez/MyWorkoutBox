import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, CirclePlay, ClipboardCheck, Dumbbell, Users } from 'lucide-react';
import Avatar from '@shared/components/Avatar';
import AppShell from '@app/layout/AppShell';
import { OperationalHero } from '@app/components/OperationalHero';
import { Button, Panel } from '@shared/components/ui';
import { useActiveSession, useTrainerSessions } from '@features/training-sessions/hooks/useTrainingSessions';
import { useAuthUser } from '@features/auth/hooks/useAuthUser';
import type { Client, TrainingSession } from '@shared/types/api';

const STALE_SESSION_MS = 3 * 60 * 60 * 1000;

function isToday(value: string): boolean {
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  if (isToday(value)) return `Hoy · ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatElapsedTime(startedAt: string, now: number): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function TrainerPage() {
  const navigate = useNavigate();
  const { data: activeSession } = useActiveSession();
  const { data: sessions = [], isLoading: sessionsLoading } = useTrainerSessions(20);
  const { data: user } = useAuthUser();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeSession) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeSession]);

  const todaySessions = sessions.filter((session) => isToday(session.startedAt));
  const visibleSessions = useMemo(() => {
    const todaySessions = sessions.filter((session) => isToday(session.startedAt));
    const olderSessions = sessions.filter((session) => !isToday(session.startedAt));
    return [...todaySessions, ...olderSessions].slice(0, 4);
  }, [sessions]);
  const recentClients = useMemo(() => {
    const uniqueClients = new Map<string, { client: Client; lastSessionAt: string }>();
    sessions.forEach((session) => {
      if (!uniqueClients.has(session.client.id)) {
        uniqueClients.set(session.client.id, { client: session.client, lastSessionAt: session.startedAt });
      }
    });
    return [...uniqueClients.values()].slice(0, 3);
  }, [sessions]);
  const todayExerciseCount = todaySessions.reduce((total, session) => total + session.exercises.length, 0);
  const todaySeriesCount = todaySessions.reduce(
    (total, session) => total + session.exercises.reduce((exerciseTotal, exercise) => exerciseTotal + exercise.series.length, 0),
    0,
  );

  const sessionTarget = activeSession
    ? `/trainer/sessions/${activeSession.id}`
    : '/trainer/sessions/new';

  return (
    <AppShell title="Inicio">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <section className="px-1">
          <p className="eyebrow flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            Inicio
          </p>
          <h1 className="mt-3 text-3xl font-bold text-text-primary sm:text-[2.75rem] sm:leading-[1.05]">
            Hola, {user?.name || 'Entrenador'}
          </h1>
          <p className="mt-2 text-sm text-text-secondary sm:text-base">
            ¿Qué necesitas hacer ahora?
          </p>
        </section>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)] lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
            {activeSession ? (
              <ActiveSessionPanel
                session={activeSession}
                elapsedTime={formatElapsedTime(activeSession.startedAt, now)}
                isStale={now - new Date(activeSession.startedAt).getTime() >= STALE_SESSION_MS}
                onContinue={() => navigate(sessionTarget)}
              />
            ) : (
              <DashboardHero onStart={() => navigate(sessionTarget)} />
            )}
          </div>

          <TodaySummary sessions={todaySessions.length} exercises={todayExerciseCount} series={todaySeriesCount} />

          <RecentClients
            clients={recentClients}
            isLoading={sessionsLoading}
            onOpen={(id) => navigate(`/clients/${id}`)}
            onViewAll={() => navigate('/trainer/clients')}
          />

          <div className="lg:col-start-1 lg:row-start-2 lg:row-span-2">
            <RecentSessions sessions={visibleSessions} isLoading={sessionsLoading} onOpen={(id) => navigate(`/trainer/sessions/${id}`)} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DashboardHero({ onStart }: { onStart: () => void }) {
  return (
    <OperationalHero
      eyebrow="Listo para entrenar"
      title="Inicia una nueva sesión"
      description="Selecciona un cliente y comienza a registrar ejercicios."
      action={
        <Button variant="primary" onClick={onStart} className="inline-flex min-h-12 w-full items-center justify-center gap-2">
          <CirclePlay size={20} />
          Nuevo entrenamiento
          <ChevronRight size={18} />
        </Button>
      }
    />
  );
}

function ActiveSessionPanel({ session, elapsedTime, isStale, onContinue }: { session: TrainingSession; elapsedTime: string; isStale: boolean; onContinue: () => void }) {
  const seriesCount = session.exercises.reduce((total, exercise) => total + exercise.series.length, 0);
  return (
    <Panel className="relative overflow-hidden border-primary/30">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary via-primary/40 to-transparent" />
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow flex items-center gap-2">
            <LiveDot />
            Sesión en curso
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="min-w-0 truncate text-2xl font-bold text-text-primary sm:text-3xl">
            {session.client.firstName} {session.client.lastName}
          </h2>
          <time className="tabular font-display text-4xl font-bold leading-none tracking-tight text-text-primary sm:text-5xl">{elapsedTime}</time>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-background/60 px-3 py-1.5"><Dumbbell size={15} className="text-primary-soft" /><span className="tabular font-display font-semibold text-text-primary">{session.exercises.length} ejercicios</span></span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-background/60 px-3 py-1.5"><Activity size={15} className="text-primary-soft" /><span className="tabular font-display font-semibold text-text-primary">{seriesCount} series</span></span>
        </div>
        {isStale && (
          <div role="status" className="mt-4 flex gap-3 rounded-xl border border-warning/25 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>Esta sesión lleva más de 3 horas activa. Revísala antes de continuar.</p>
          </div>
        )}
        <Button variant="primary" onClick={onContinue} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 sm:w-auto">
          Continuar entrenamiento
          <ChevronRight size={18} />
        </Button>
      </div>
    </Panel>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
    </span>
  );
}

function TodaySummary({ sessions, exercises, series }: { sessions: number; exercises: number; series: number }) {
  return (
    <section className="min-w-0 lg:col-start-2 lg:row-start-1">
      <SectionHeading title="Resumen de hoy" meta="Datos actuales" />
      <Panel className="mt-3 grid grid-cols-3 divide-x divide-white/[0.06] overflow-hidden">
        <SummaryValue label="Sesiones" value={sessions} />
        <SummaryValue label="Ejercicios" value={exercises} />
        <SummaryValue label="Series" value={series} />
      </Panel>
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-2 px-1 py-4 text-center sm:px-2 sm:py-5">
      <strong className="tabular font-display text-3xl font-bold leading-none tracking-tight text-text-primary sm:text-4xl">{value}</strong>
      <span className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</span>
    </div>
  );
}

function RecentClients({ clients, isLoading, onOpen, onViewAll }: { clients: { client: Client; lastSessionAt: string }[]; isLoading: boolean; onOpen: (id: string) => void; onViewAll: () => void }) {
  return (
    <section className="min-w-0 lg:col-start-2 lg:row-start-2">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-lg font-bold text-text-primary">Últimos clientes</h2>
        <button type="button" onClick={onViewAll} className="-mr-2 inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-semibold text-primary-soft transition-colors duration-150 hover:bg-white/[0.04] hover:text-primary-hover focus-ring">
          Ver todos
        </button>
      </div>
      {isLoading && <p className="py-8 text-center text-text-secondary">Cargando clientes...</p>}
      {!isLoading && clients.length === 0 && <Panel className="mt-2"><EmptySection icon={<Users size={18} />} title="Aún no hay clientes recientes" /></Panel>}
      {clients.length > 0 && (
        <Panel className="mt-2 overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {clients.map(({ client, lastSessionAt }) => (
              <button key={client.id} onClick={() => onOpen(client.id)} className="group flex min-h-[68px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-white/[0.03] focus-ring">
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar firstName={client.firstName} lastName={client.lastName} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text-primary">{client.firstName} {client.lastName}</span>
                    <span className="mt-0.5 block text-xs text-text-muted">{formatRelativeDate(lastSessionAt)}</span>
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" />
              </button>
            ))}
          </div>
        </Panel>
      )}
    </section>
  );
}

function RecentSessions({ sessions, isLoading, onOpen }: { sessions: TrainingSession[]; isLoading: boolean; onOpen: (id: string) => void }) {
  return (
    <section className="min-w-0">
      <SectionHeading title="Actividad reciente" meta="Entrenamientos completados" />
      <Panel className="mt-3 overflow-hidden">
        {isLoading && <p className="py-10 text-center text-text-secondary">Cargando sesiones...</p>}
        {!isLoading && sessions.length === 0 && <EmptySection icon={<ClipboardCheck size={18} />} title="Aún no hay sesiones completadas" />}
        <div className="divide-y divide-white/[0.06]">
          {sessions.map((session) => (
            <button key={session.id} onClick={() => onOpen(session.id)} className="group flex min-h-[72px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-white/[0.03] focus-ring sm:px-5">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-background/60 text-text-secondary"><ClipboardCheck size={18} /></span>
                <span className="min-w-0">
                  <span className="block text-xs text-text-muted">Entrenamiento completado</span>
                  <span className="mt-0.5 block truncate font-semibold text-text-primary">{session.client.firstName} {session.client.lastName}</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="tabular text-xs text-text-muted">{formatRelativeDate(session.startedAt)}</span>
                <CheckCircle2 size={19} className="text-primary-soft" />
              </span>
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function SectionHeading({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <span className="text-xs text-text-muted">{meta}</span>
    </div>
  );
}

function EmptySection({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex min-h-[96px] items-center gap-3 px-4 py-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">{icon}</span>
      <p className="text-sm font-medium text-text-secondary">{title}</p>
    </div>
  );
}
