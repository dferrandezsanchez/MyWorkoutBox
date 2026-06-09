import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { AppShell, EmptyState, StatusBadge, TextInput } from '../components/ui';
import { useClients } from '../hooks/useClients';

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
      <div className="mx-auto max-w-2xl">
        <header className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Entrenador</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#282828]">Clientes</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Busca un cliente y actualiza sus marcas desde la ficha.
          </p>
        </header>

        <div className="sticky top-[77px] z-20 mb-3 bg-[#F7F7F6] py-2 md:hidden">
          <TextInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente"
            aria-label="Buscar cliente"
            className="w-full"
            autoFocus
          />
        </div>

        <section className="overflow-hidden rounded-md border border-border bg-white shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-[#343434]">
              {debouncedQuery ? 'Resultados' : 'Clientes activos'}
            </p>
            <p className="text-xs text-text-secondary">{activeClients.length} clientes</p>
          </div>

          {isLoading && <p className="py-12 text-center text-text-secondary">Cargando clientes...</p>}
          {isError && <p className="py-12 text-center text-red-500">Error al cargar clientes</p>}
          {!isLoading && !isError && activeClients.length === 0 && (
            <div className="p-4">
              <EmptyState title="No se encontraron clientes" />
            </div>
          )}

          {!isLoading && !isError && activeClients.length > 0 && (
            <div className="divide-y divide-border">
              {activeClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="grid min-h-[72px] w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FFF7F2] focus-ring"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar
                      photoUrl={client.photoUrl}
                      firstName={client.firstName}
                      lastName={client.lastName}
                      size="md"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-[#343434]">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="mt-0.5 block text-sm text-text-secondary">
                        {formatAge(client.birthDate)}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={client.status} />
                    <span className="text-xl text-text-secondary">›</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
