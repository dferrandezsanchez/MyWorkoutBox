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
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/trainer')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-elevated/80 text-text-secondary hover:text-text-primary focus-ring"
            aria-label="Volver"
          >
            <ChevronLeft size={19} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Consulta</p>
            <h1 className="text-2xl font-semibold text-text-primary">Clientes</h1>
          </div>
        </div>

        <Panel className="p-4 sm:p-5">
          <p className="text-sm text-text-secondary">Busca cualquier cliente del centro para consultar su ficha.</p>
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <TextInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente"
              className="h-12 w-full pl-12 text-base"
              autoFocus
            />
          </label>
        </Panel>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{query ? 'Resultados' : 'Todos los clientes'}</h2>
              <p className="text-sm text-text-secondary">{visibleClients.length} disponibles</p>
            </div>
            <Users className="text-primary" />
          </div>
          {isLoading && <Panel className="p-10 text-center text-text-secondary">Cargando clientes...</Panel>}
          {isError && <Panel className="p-10 text-center text-red-500">No se pudieron cargar los clientes</Panel>}
          {!isLoading && !isError && visibleClients.length === 0 ? (
            <EmptyState title="No se encontraron clientes" />
          ) : (
            <Panel className="overflow-hidden">
              <div className="divide-y divide-border/70">
                {visibleClients.map((client: Client) => (
                  <button
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="flex min-h-[86px] w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary/10 focus-ring"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-text-primary">
                          {client.firstName} {client.lastName}
                        </span>
                        <span className="mt-1 block text-sm text-text-secondary">
                          {age(client.birthDate)} años{client.notes ? ' · Con notas' : ''}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="shrink-0 text-text-secondary" size={19} />
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
