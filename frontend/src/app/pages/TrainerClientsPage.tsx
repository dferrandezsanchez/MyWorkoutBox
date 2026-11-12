import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import Avatar from '@shared/components/Avatar';
import { EmptyState, Panel, TextInput } from '@shared/components/ui';
import { useClients } from '@features/clients/hooks/useClients';
import type { Client } from '@shared/types/api';

function age(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function TrainerClientsPage() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading, isError } = useClients(undefined, false);
  const [query, setQuery] = useState('');

  const activeClients = clients.filter((client) => client.status === 'ACTIVE');
  const normalized = query.trim().toLowerCase();
  const visibleClients = activeClients.filter((client) =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(normalized),
  );

  return (
    <AppShell title="Clientes">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/trainer')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.11] text-text-secondary transition-colors duration-150 hover:border-white/20 hover:text-text-primary focus-ring"
            aria-label="Volver"
          >
            <ChevronLeft size={19} />
          </button>
          <div className="min-w-0">
            <p className="eyebrow">Consulta</p>
            <h1 className="mt-1 text-3xl font-bold text-text-primary">Clientes</h1>
          </div>
        </div>

        <label className="relative block">
          <span className="sr-only">Buscar cliente</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <TextInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente"
            className="h-12 w-full rounded-full bg-surface pl-12 text-base"
            autoFocus
          />
        </label>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <h2 className="text-lg font-bold text-text-primary sm:text-xl">{query ? 'Resultados' : 'Todos los clientes'}</h2>
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <Users size={14} className="text-primary-soft" />
              <span className="tabular font-display font-semibold">{visibleClients.length} disponibles</span>
            </p>
          </div>
          {isLoading && <Panel className="p-10 text-center text-text-secondary">Cargando clientes...</Panel>}
          {isError && <Panel className="p-10 text-center text-danger">No se pudieron cargar los clientes</Panel>}
          {!isLoading && !isError && visibleClients.length === 0 ? (
            <EmptyState title="No se encontraron clientes" />
          ) : (
            <Panel className="overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {visibleClients.map((client: Client) => (
                  <button
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="group flex min-h-[76px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-white/[0.03] focus-ring sm:px-5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-text-primary">
                          {client.firstName} {client.lastName}
                        </span>
                        <span className="mt-0.5 block text-sm text-text-muted">
                          {age(client.birthDate)} años{client.notes ? ' · Con notas' : ''}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary-soft" size={19} />
                  </button>
                ))}
              </div>
            </Panel>
          )}
        </section>
      </div>
    </AppShell>
  );
}
