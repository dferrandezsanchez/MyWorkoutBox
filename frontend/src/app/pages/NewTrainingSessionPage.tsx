import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CirclePlay, Search } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import Avatar from '@shared/components/Avatar';
import { Button, Dialog, EmptyState, Panel, TextInput } from '@shared/components/ui';
import { useClients } from '@features/clients/hooks/useClients';
import { useActiveSession, useStartSession, useTrainerSessions } from '@features/training-sessions/hooks/useTrainingSessions';
import type { Client } from '@shared/types/api';

function age(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function NewTrainingSessionPage() {
  const navigate = useNavigate();
  const { data: activeSession } = useActiveSession();
  const { data: sessions = [] } = useTrainerSessions(10);
  const { data: clients = [], isLoading, isError } = useClients(undefined, false);
  const startSession = useStartSession();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);

  const activeClients = clients.filter((client) => client.status === 'ACTIVE');
  const recentClients = useMemo(() => {
    const ids = new Set<string>();
    return sessions.map((session) => session.client).filter((client) => {
      if (ids.has(client.id)) return false;
      ids.add(client.id);
      return true;
    }).slice(0, 3);
  }, [sessions]);
  const normalized = query.trim().toLowerCase();
  const visibleClients = activeClients.filter((client) => `${client.firstName} ${client.lastName}`.toLowerCase().includes(normalized));

  const confirmStart = async () => {
    if (!selected) return;
    const session = await startSession.mutateAsync(selected.id);
    navigate(`/trainer/sessions/${session.id}`);
  };

  if (activeSession) {
    return (
      <AppShell title="Nueva sesión">
        <div className="mx-auto max-w-3xl">
          <Panel className="border-primary/30 p-5 sm:p-7">
            <p className="eyebrow flex items-center gap-2">
              <LiveDot />
              Sesión en curso
            </p>
            <h1 className="mt-3 text-2xl font-bold text-text-primary sm:text-3xl">Ya estás entrenando con {activeSession.client.firstName}</h1>
            <p className="mt-2 text-sm text-text-secondary">Finaliza o descarta esa sesión antes de comenzar otra.</p>
            <Button variant="primary" className="mt-6 inline-flex w-full items-center justify-center gap-2 sm:w-auto" onClick={() => navigate(`/trainer/sessions/${activeSession.id}`)}>
              Continuar sesión
              <ChevronRight size={18} />
            </Button>
          </Panel>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Nueva sesión">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/trainer')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.11] text-text-secondary transition-colors duration-150 hover:border-white/20 hover:text-text-primary focus-ring" aria-label="Volver"><ChevronLeft size={19} /></button>
          <div className="min-w-0">
            <p className="eyebrow">Nuevo entrenamiento</p>
            <h1 className="mt-1 text-3xl font-bold text-text-primary">Selecciona cliente</h1>
          </div>
        </div>

        <label className="relative block">
          <span className="sr-only">Buscar cliente</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" className="h-12 w-full rounded-full bg-surface pl-12 text-base" autoFocus />
        </label>

        {!query && recentClients.length > 0 && <ClientSection title="Clientes recientes" clients={recentClients} onSelect={setSelected} />}

        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <h2 className="text-lg font-bold text-text-primary sm:text-xl">{query ? 'Resultados' : 'Clientes activos'}</h2>
            <p className="tabular font-display text-xs font-semibold text-text-muted">{visibleClients.length} disponibles</p>
          </div>
          {isLoading && <Panel className="p-10 text-center text-text-secondary">Cargando clientes...</Panel>}
          {isError && <Panel className="p-10 text-center text-danger">No se pudieron cargar los clientes</Panel>}
          {!isLoading && !isError && visibleClients.length === 0 ? <EmptyState title="No se encontraron clientes" /> : <ClientList clients={visibleClients} onSelect={setSelected} />}
        </section>
      </div>

      {selected && (
        <Dialog label="Confirmar cliente" onClose={() => setSelected(null)} className="max-w-md">
          <div className="pr-10">
            <p className="eyebrow">Confirmar entrenamiento</p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar firstName={selected.firstName} lastName={selected.lastName} size="md" />
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold text-text-primary">{selected.firstName} {selected.lastName}</h2>
                <p className="tabular mt-0.5 text-sm text-text-secondary">{age(selected.birthDate)} años{selected.height ? ` · ${selected.height} cm` : ''}{selected.weight ? ` · ${selected.weight} kg` : ''}</p>
              </div>
            </div>
          </div>
          {selected.notes && <p className="mt-5 rounded-xl border border-white/[0.08] bg-background/60 p-3 text-sm leading-6 text-text-secondary">{selected.notes}</p>}
          <p className="mt-4 text-sm text-text-muted">Se iniciará una nueva sesión activa para este cliente.</p>
          {startSession.isError && <p role="alert" className="mt-4 text-sm text-danger">No se pudo iniciar la sesión. Comprueba que no exista otra activa.</p>}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button variant="primary" disabled={startSession.isPending} onClick={() => void confirmStart()} className="inline-flex items-center justify-center gap-2">
              <CirclePlay size={17} />
              {startSession.isPending ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>
          </div>
        </Dialog>
      )}
    </AppShell>
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

function ClientSection({ title, clients, onSelect }: { title: string; clients: Client[]; onSelect: (client: Client) => void }) {
  return <section><h2 className="mb-3 px-1 text-lg font-bold text-text-primary sm:text-xl">{title}</h2><ClientList clients={clients} onSelect={onSelect} /></section>;
}

function ClientList({ clients, onSelect }: { clients: Client[]; onSelect: (client: Client) => void }) {
  return (
    <Panel className="overflow-hidden">
      <div className="divide-y divide-white/[0.06]">
        {clients.map((client) => (
          <button key={client.id} onClick={() => onSelect(client)} className="group flex min-h-[76px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-white/[0.03] focus-ring sm:px-5">
            <span className="flex min-w-0 items-center gap-3">
              <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-text-primary">{client.firstName} {client.lastName}</span>
                <span className="mt-0.5 block text-sm text-text-muted">{age(client.birthDate)} años{client.notes ? ' · Con notas' : ''}</span>
              </span>
            </span>
            <ChevronRight className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" size={19} />
          </button>
        ))}
      </div>
    </Panel>
  );
}
