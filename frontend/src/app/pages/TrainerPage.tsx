import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, CirclePlay, ClipboardCheck, Dumbbell } from 'lucide-react';
import Avatar from '@shared/components/Avatar';
import AppShell from '@app/layout/AppShell';
import { Button, EmptyState, Panel } from '@shared/components/ui';
import { useActiveSession, useTrainerSessions } from '@features/training-sessions/hooks/useTrainingSessions';
import { useAuthUser } from '@features/auth/hooks/useAuthUser';
import type { Client, TrainingSession } from '@shared/types/api';
import trainerDumbbell from '../../assets/trainer-dumbbell.webp';

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
        <section className="px-1 py-1">
          <h1 className="text-2xl font-semibold text-text-primary sm:text-3xl">
            Hola, {user?.name || 'Entrenador'}
          </h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-base">
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

          <RecentClients clients={recentClients} isLoading={sessionsLoading} onOpen={(id) => navigate(`/clients/${id}`)} />

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
    <Panel className="relative isolate overflow-hidden border border-primary/10 bg-surface shadow-[0_22px_60px_rgba(var(--color-primary-soft)/0.12)]">
      <div className="absolute inset-x-0 top-0 h-px bg-primary/70" />
      <div className="relative z-10 p-5 sm:p-6">
        <div className="pr-16 sm:pr-24">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Listo para entrenar</p>
          <h2 className="mt-2 text-xl font-semibold text-text-primary sm:text-2xl">Inicia una nueva sesión</h2>
        </div>
        <p className="mt-2 max-w-full text-sm leading-6 text-text-secondary sm:max-w-[55%]">
          Selecciona un cliente y comienza a registrar ejercicios.
        </p>
        <Button variant="primary" onClick={onStart} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 sm:w-auto">
          <CirclePlay size={20} />
          Nuevo entrenamiento
          <ChevronRight size={18} />
        </Button>
      </div>
      <div className="pointer-events-none absolute -right-2 top-14 z-0 h-32 w-44 sm:right-2 sm:top-10 sm:h-36 sm:w-52">
        <img src={trainerDumbbell} alt="" className="h-full w-full object-contain opacity-90 [filter:grayscale(1)_contrast(1.35)_brightness(0.38)_drop-shadow(0_16px_20px_rgb(0_0_0/0.6))]" />
        <span
          className="absolute inset-0 bg-primary opacity-30 mix-blend-color"
          style={{ WebkitMaskImage: `url(${trainerDumbbell})`, maskImage: `url(${trainerDumbbell})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }}
        />
      </div>
    </Panel>
  );
}

function ActiveSessionPanel({ session, elapsedTime, isStale, onContinue }: { session: TrainingSession; elapsedTime: string; isStale: boolean; onContinue: () => void }) {
  const seriesCount = session.exercises.reduce((total, exercise) => total + exercise.series.length, 0);
  return (
    <Panel className="overflow-hidden border-primary/45 bg-primary/10 shadow-[0_18px_50px_rgba(var(--color-primary)/0.12)]">
      <div className="h-1 bg-primary" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--color-primary)/0.8)]" />
            Sesión en curso
          </p>
          <time className="font-mono text-sm font-semibold text-text-secondary">{elapsedTime}</time>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-text-primary">
          {session.client.firstName} {session.client.lastName}
        </h2>
        <div className="mt-4 flex gap-5 text-sm text-text-secondary">
          <span className="flex items-center gap-2"><Dumbbell size={17} className="text-primary" />{session.exercises.length} ejercicios</span>
          <span className="flex items-center gap-2"><Activity size={17} className="text-primary" />{seriesCount} series</span>
        </div>
        {isStale && (
          <div className="mt-4 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>Esta sesión lleva más de 3 horas activa. Revísala antes de continuar.</p>
          </div>
        )}
        <Button variant="primary" onClick={onContinue} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 sm:w-auto">
          Continuar entrenamiento
          <ChevronRight size={18} />
        </Button>
      </div>
    </Panel>
  );
}

function TodaySummary({ sessions, exercises, series }: { sessions: number; exercises: number; series: number }) {
  return (
    <Panel className="overflow-hidden bg-surface lg:col-start-2 lg:row-start-1">
      <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-text-primary">
        <CalendarDays size={17} className="text-primary" />
        Hoy
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/70 border-t border-border/70">
        <SummaryValue label="Sesiones" value={sessions} />
        <SummaryValue label="Ejercicios" value={exercises} />
        <SummaryValue label="Series" value={series} />
      </div>
    </Panel>
  );
}

function SummaryValue({ label, value }: { label: string; value: number }) {
  return <div className="px-2 py-4 text-center"><strong className="block text-2xl font-semibold text-primary">{value}</strong><span className="mt-1 block text-[11px] text-text-secondary">{label}</span></div>;
}

function RecentClients({ clients, isLoading, onOpen }: { clients: { client: Client; lastSessionAt: string }[]; isLoading: boolean; onOpen: (id: string) => void }) {
  return (
    <section className="min-w-0 lg:col-start-2 lg:row-start-2">
      <h2 className="px-1 text-sm font-semibold text-text-primary">Últimos clientes</h2>
      {isLoading && <p className="py-8 text-center text-text-secondary">Cargando clientes...</p>}
      {!isLoading && clients.length === 0 && <div className="p-4"><EmptyState title="Aún no hay clientes recientes" /></div>}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {clients.map(({ client, lastSessionAt }) => (
          <button key={client.id} onClick={() => onOpen(client.id)} className="flex min-h-[68px] min-w-[190px] flex-1 items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface/70 px-3 py-2 text-left hover:border-primary/40 hover:bg-primary/10 focus-ring lg:min-w-0">
            <span className="flex min-w-0 items-center gap-3">
              <span className="relative"><Avatar firstName={client.firstName} lastName={client.lastName} size="sm" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" /></span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-text-primary">{client.firstName} {client.lastName}</span>
                <span className="mt-0.5 block text-xs text-text-secondary">{formatRelativeDate(lastSessionAt)}</span>
              </span>
            </span>
            <ChevronRight size={19} className="shrink-0 text-text-secondary" />
          </button>
        ))}
      </div>
    </section>
  );
}

function RecentSessions({ sessions, isLoading, onOpen }: { sessions: TrainingSession[]; isLoading: boolean; onOpen: (id: string) => void }) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-text-primary">Actividad reciente</h2>
        <ClipboardCheck className="text-primary" size={19} />
      </div>
      {isLoading && <p className="py-10 text-center text-text-secondary">Cargando sesiones...</p>}
      {!isLoading && sessions.length === 0 && <div className="p-4"><EmptyState title="Aún no hay sesiones completadas" /></div>}
      <div className="divide-y divide-border/70">
        {sessions.map((session) => (
          <button key={session.id} onClick={() => onOpen(session.id)} className="flex min-h-[76px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10 focus-ring sm:px-5">
            <span className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><ClipboardCheck size={19} /></span><span className="min-w-0"><span className="block text-xs text-text-secondary">Entrenamiento completado</span><span className="mt-0.5 block truncate font-semibold text-text-primary">{session.client.firstName} {session.client.lastName}</span></span></span>
            <span className="flex shrink-0 items-center gap-3"><span className="text-xs text-text-secondary">{formatRelativeDate(session.startedAt)}</span><CheckCircle2 size={20} className="text-success" /></span>
          </button>
        ))}
      </div>
    </Panel>
  );
}
