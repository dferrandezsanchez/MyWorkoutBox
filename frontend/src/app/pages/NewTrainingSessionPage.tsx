import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, UserRoundPlus, X } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import Avatar from '@shared/components/Avatar';
import { Button, EmptyState, Panel, TextInput } from '@shared/components/ui';
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
          <Panel className="p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sesión en curso</p>
            <h1 className="mt-2 text-2xl font-semibold text-text-primary">Ya estás entrenando con {activeSession.client.firstName}</h1>
            <p className="mt-2 text-text-secondary">Finaliza o descarta esa sesión antes de comenzar otra.</p>
            <Button variant="primary" className="mt-5 w-full sm:w-auto" onClick={() => navigate(`/trainer/sessions/${activeSession.id}`)}>Continuar sesión</Button>
          </Panel>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Nueva sesión">
      <div className="mx-auto max-w-4xl space-y-5">
        <button onClick={() => navigate('/trainer')} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-text-secondary hover:text-text-primary focus-ring"><ChevronLeft size={18} />Volver</button>
        <Panel className="p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Nuevo entrenamiento</p>
          <h1 className="mt-2 text-3xl font-semibold text-text-primary">¿Con quién vamos a entrenar?</h1>
          <p className="mt-3 max-w-2xl leading-7 text-text-secondary">Selecciona un cliente activo. Confirmaremos la elección antes de iniciar la sesión.</p>
          <label className="relative mt-5 block"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} /><TextInput type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente por nombre" className="h-14 w-full pl-12 text-base" autoFocus /></label>
        </Panel>

        {!query && recentClients.length > 0 && <ClientSection title="Clientes recientes" clients={recentClients} onSelect={setSelected} />}

        <section>
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-semibold text-text-primary">{query ? 'Resultados' : 'Clientes activos'}</h2><p className="text-sm text-text-secondary">{visibleClients.length} disponibles</p></div><UserRoundPlus className="text-primary" /></div>
          {isLoading && <Panel className="p-10 text-center text-text-secondary">Cargando clientes...</Panel>}
          {isError && <Panel className="p-10 text-center text-red-500">No se pudieron cargar los clientes</Panel>}
          {!isLoading && !isError && visibleClients.length === 0 ? <EmptyState title="No se encontraron clientes" /> : <ClientList clients={visibleClients} onSelect={setSelected} />}
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Confirmar cliente">
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-elevated p-5 shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Confirmar entrenamiento</p><h2 className="mt-2 text-2xl font-semibold text-text-primary">{selected.firstName} {selected.lastName}</h2><p className="mt-1 text-sm text-text-secondary">{age(selected.birthDate)} años{selected.height ? ` · ${selected.height} cm` : ''}{selected.weight ? ` · ${selected.weight} kg` : ''}</p></div><button className="flex h-11 w-11 items-center justify-center rounded-lg focus-ring" onClick={() => setSelected(null)} aria-label="Cerrar"><X size={19} /></button></div>
            {selected.notes && <p className="mt-4 rounded-xl border border-border/70 bg-surface/70 p-3 text-sm text-text-secondary">{selected.notes}</p>}
            {startSession.isError && <p className="mt-4 text-sm text-red-500">No se pudo iniciar la sesión. Comprueba que no exista otra activa.</p>}
            <div className="mt-5 grid grid-cols-2 gap-2"><Button onClick={() => setSelected(null)}>Cancelar</Button><Button variant="primary" disabled={startSession.isPending} onClick={() => void confirmStart()}>{startSession.isPending ? 'Iniciando...' : 'Iniciar sesión'}</Button></div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ClientSection({ title, clients, onSelect }: { title: string; clients: Client[]; onSelect: (client: Client) => void }) {
  return <section><h2 className="mb-3 text-xl font-semibold text-text-primary">{title}</h2><ClientList clients={clients} onSelect={onSelect} /></section>;
}

function ClientList({ clients, onSelect }: { clients: Client[]; onSelect: (client: Client) => void }) {
  return <Panel className="overflow-hidden"><div className="divide-y divide-border/70">{clients.map((client) => <button key={client.id} onClick={() => onSelect(client)} className="flex min-h-[86px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10 focus-ring"><span className="flex min-w-0 items-center gap-3"><Avatar firstName={client.firstName} lastName={client.lastName} size="md" /><span className="min-w-0"><span className="block truncate font-semibold text-text-primary">{client.firstName} {client.lastName}</span><span className="mt-1 block text-sm text-text-secondary">{age(client.birthDate)} años{client.notes ? ' · Con notas' : ''}</span></span></span><ChevronRight className="shrink-0 text-text-secondary" size={19} /></button>)}</div></Panel>;
}
