import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight, CirclePlay, Clock3, Search } from 'lucide-react';
import Avatar from '@shared/components/Avatar';
import AppShell from '@app/layout/AppShell';
import { Button, EmptyState, Panel, TextInput } from '@shared/components/ui';
import { useClients } from '@features/clients/hooks/useClients';
import { useTheme } from '@shared/theme/ThemeProvider';
import { useActiveSession, useTrainerSessions } from '@features/training-sessions/hooks/useTrainingSessions';
import { useAuthUser } from '@features/auth/hooks/useAuthUser';

function calculateAge(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

export default function TrainerPage() {
  const navigate = useNavigate();
  const { brand } = useTheme();
  const { data: activeSession } = useActiveSession();
  const { data: sessions = [], isLoading: sessionsLoading } = useTrainerSessions(8);
  const { data: user } = useAuthUser();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: clients = [], isLoading, isError } = useClients(debouncedQuery || undefined);
  const activeClients = clients.filter((client) => client.status === 'ACTIVE');
  const visibleSessions = useMemo(() => {
    const todaySessions = sessions.filter((session) => isToday(session.startedAt));
    const olderSessions = sessions.filter((session) => !isToday(session.startedAt));
    return [...todaySessions, ...olderSessions].slice(0, 4);
  }, [sessions]);
  const todaySessionCount = sessions.filter((session) => isToday(session.startedAt)).length;

  const sessionTarget = activeSession
    ? `/trainer/sessions/${activeSession.id}`
    : '/trainer/sessions/new';

  return (
    <AppShell title="Inicio">
      <div className="mx-auto max-w-5xl space-y-5">
        <Panel className="relative overflow-hidden p-4 sm:p-6">
          <div className="relative grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Modo entrenador</p>
              <h1 className="mt-2 text-2xl font-semibold text-text-primary sm:text-3xl">
                Hola, {user?.name || 'Entrenador'}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
                Encuentra un cliente y registra su entrenamiento sin perder tiempo.
              </p>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={21} />
              <TextInput
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar cliente"
                aria-label="Buscar cliente"
                className="h-12 w-full pl-12 text-base"
              />
            </label>
          </div>
        </Panel>

        {debouncedQuery ? (
          <ClientResults clients={activeClients} isLoading={isLoading} isError={isError} onOpen={(id) => navigate(`/clients/${id}`)} />
        ) : (
          <>
            <section className="grid grid-cols-3 gap-2 sm:gap-3">
              <MiniStat label="Centro" value={brand.shortName} />
              <MiniStat label="Activos" value={activeClients.length} tone="primary" />
              <MiniStat label="Hoy" value={todaySessionCount} />
            </section>

            <Button
              variant="primary"
              onClick={() => navigate(sessionTarget)}
              className="inline-flex min-h-14 w-full items-center justify-center gap-3 text-base sm:text-lg"
            >
              <CirclePlay size={22} />
              {activeSession ? 'Continuar entrenamiento' : 'Nuevo entrenamiento'}
            </Button>

            {activeSession && (
              <Panel className="border-primary/35 bg-primary/10 p-4 sm:p-5">
                <button onClick={() => navigate(sessionTarget)} className="flex w-full items-center justify-between gap-4 text-left focus-ring">
                  <span className="min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">Sesión en curso</span>
                    <span className="mt-1 block truncate text-lg font-semibold text-text-primary">
                      {activeSession.client.firstName} {activeSession.client.lastName}
                    </span>
                    <span className="mt-1 block text-sm text-text-secondary">{activeSession.exercises.length} ejercicios registrados</span>
                  </span>
                  <ChevronRight className="shrink-0 text-primary" />
                </button>
              </Panel>
            )}

            <RecentSessions sessions={visibleSessions} isLoading={sessionsLoading} onOpen={(id) => navigate(`/trainer/sessions/${id}`)} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function ClientResults({ clients, isLoading, isError, onOpen }: { clients: ReturnType<typeof useClients>['data'] extends infer T ? NonNullable<T> : never; isLoading: boolean; isError: boolean; onOpen: (id: string) => void }) {
  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-border/70 px-4 py-4"><h2 className="font-semibold text-text-primary">Resultados</h2><p className="text-sm text-text-secondary">{clients.length} clientes activos</p></div>
      {isLoading && <p className="py-12 text-center text-text-secondary">Buscando clientes...</p>}
      {isError && <p className="py-12 text-center text-red-500">No se pudieron cargar los clientes</p>}
      {!isLoading && !isError && clients.length === 0 && <div className="p-4"><EmptyState title="No se encontraron clientes" /></div>}
      <div className="divide-y divide-border/70">
        {clients.map((client) => (
          <button key={client.id} onClick={() => onOpen(client.id)} className="flex min-h-[82px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10 focus-ring">
            <span className="flex min-w-0 items-center gap-3"><Avatar firstName={client.firstName} lastName={client.lastName} size="md" /><span className="min-w-0"><span className="block truncate font-semibold text-text-primary">{client.firstName} {client.lastName}</span><span className="text-sm text-text-secondary">{calculateAge(client.birthDate)} años</span></span></span>
            <ChevronRight size={19} className="shrink-0 text-text-secondary" />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function RecentSessions({ sessions, isLoading, onOpen }: { sessions: import('@shared/types/api').TrainingSession[]; isLoading: boolean; onOpen: (id: string) => void }) {
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-4 sm:px-5">
        <div><h2 className="text-xl font-semibold text-text-primary">Sesiones recientes</h2><p className="mt-1 text-sm text-text-secondary">Últimos entrenamientos</p></div>
        <CalendarDays className="text-primary" size={21} />
      </div>
      {isLoading && <p className="py-10 text-center text-text-secondary">Cargando sesiones...</p>}
      {!isLoading && sessions.length === 0 && <div className="p-4"><EmptyState title="Aún no hay sesiones completadas" /></div>}
      <div className="divide-y divide-border/70">
        {sessions.map((session) => (
          <button key={session.id} onClick={() => onOpen(session.id)} className="flex min-h-[86px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10 focus-ring sm:px-5">
            <span className="flex min-w-0 items-center gap-3"><Avatar firstName={session.client.firstName} lastName={session.client.lastName} size="md" /><span className="min-w-0"><span className="block truncate font-semibold text-text-primary">{session.client.firstName} {session.client.lastName}</span><span className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary"><Clock3 size={14} />{isToday(session.startedAt) ? 'Hoy' : new Date(session.startedAt).toLocaleDateString('es-ES')} · {new Date(session.startedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></span></span>
            <span className="flex items-center gap-2"><span className="hidden rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600 sm:inline">Completada</span><ChevronRight size={19} className="text-text-secondary" /></span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone?: 'primary' }) {
  return <div className={`min-w-0 rounded-xl border bg-elevated/70 px-3 py-3 shadow-sm ${tone ? 'border-primary/35' : 'border-border/70'}`}><p className="truncate text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p><p className={`mt-0.5 truncate text-lg font-semibold ${tone ? 'text-primary' : 'text-text-primary'}`}>{value}</p></div>;
}
