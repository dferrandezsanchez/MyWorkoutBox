import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Search, Users, Zap } from 'lucide-react';
import Avatar from '@shared/components/Avatar';
import AppShell from '@app/layout/AppShell';
import { EmptyState, Panel, StatusBadge, TextInput } from '@shared/components/ui';
import { useClients } from '@features/clients/hooks/useClients';
import { useTheme } from '@shared/theme/ThemeProvider';

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function formatAge(birthDate: string): string {
  const age = calculateAge(birthDate);
  return age >= 12 && age <= 90 ? `${age} años` : 'Edad pendiente';
}

export default function TrainerPage() {
  const navigate = useNavigate();
  const { brand } = useTheme();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: clients, isLoading, isError } = useClients(debouncedQuery || undefined);
  const activeClients = clients?.filter((client) => client.status === 'ACTIVE') ?? [];

  return (
    <AppShell
      title="Clientes"
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Buscar cliente"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <Panel className="relative overflow-hidden p-5">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Modo entrenador
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">
                  Hola, Entrenador
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Busca cliente, abre su ficha y registra marcas sin perder tiempo.
                </p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_14px_32px_rgba(var(--color-primary)/0.35)]">
                <Zap size={22} fill="currentColor" />
              </span>
            </div>

            <div className="mt-5 md:hidden">
              <label className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  <Search size={18} />
                </span>
                <TextInput
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar cliente"
                  aria-label="Buscar cliente"
                  className="w-full pl-11"
                  autoFocus
                />
              </label>
            </div>
          </div>
        </Panel>

        <section className="grid grid-cols-3 gap-3">
          <MiniStat label="Centro" value={brand.shortName} />
          <MiniStat label="Activos" value={activeClients.length} />
          <MiniStat label="Resultados" value={debouncedQuery ? activeClients.length : 'Todos'} />
        </section>

        <Panel className="overflow-hidden">
          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {debouncedQuery ? 'Resultados' : 'Clientes activos'}
                </p>
                <p className="text-xs text-text-secondary">{activeClients.length} clientes</p>
              </div>
              <Users size={18} className="text-primary" />
            </div>
          </div>

          {isLoading && <p className="py-12 text-center text-text-secondary">Cargando clientes...</p>}
          {isError && <p className="py-12 text-center text-red-500">Error al cargar clientes</p>}
          {!isLoading && !isError && activeClients.length === 0 && (
            <div className="p-4">
              <EmptyState title="No se encontraron clientes" />
            </div>
          )}

          {!isLoading && !isError && activeClients.length > 0 && (
            <div className="divide-y divide-border/70">
              {activeClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="grid min-h-[82px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-primary/10 focus-ring"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar
                      firstName={client.firstName}
                      lastName={client.lastName}
                      size="md"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-text-primary">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="mt-1 block text-sm text-text-secondary">
                        {formatAge(client.birthDate)}
                      </span>
                    </span>
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <StatusBadge status={client.status} />
                    <ChevronRight size={18} className="text-text-secondary" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-elevated/70 px-3 py-3 shadow-sm backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
