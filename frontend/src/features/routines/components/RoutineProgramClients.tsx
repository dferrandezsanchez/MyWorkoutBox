import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { useRoutineProgramClients } from '@features/routines/hooks/useRoutines';
import { planLetter } from '@features/routines/utils/routine-labels';
import { EmptyState, Panel } from '@shared/components/ui';
import type { RoutineProgramItem } from '@shared/types/api';

/** Clients following a program, each with the routine that comes next for them. */
export function RoutineProgramClients({ programId, items, linkSuffix = '' }: {
  programId: string;
  /** Program items, sorted, to name each client's next routine. */
  items: RoutineProgramItem[];
  /** Query string appended to client links (e.g. "?mode=admin"). */
  linkSuffix?: string;
}) {
  const { data: clients = [], isLoading, isError } = useRoutineProgramClients(programId);

  let body;
  if (isLoading) {
    body = <p className="px-1 text-sm text-text-secondary">Cargando clientes...</p>;
  } else if (isError) {
    body = <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">No se pudieron cargar los clientes</p>;
  } else if (clients.length === 0) {
    body = <EmptyState title="Ningún cliente sigue este programa" description="Asígnalo desde la ficha de cada cliente." />;
  } else {
    body = (
      <Panel className="overflow-hidden">
        <ul className="divide-y divide-white/[0.06]">
          {clients.map((client) => {
            const next = items.find((item) => item.position === client.nextPosition);
            const fullName = `${client.firstName} ${client.lastName}`.trim();
            return (
              <li key={client.clientId}>
                <Link to={`/clients/${client.clientId}${linkSuffix}`} className="group flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03] focus-ring sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-text-primary">{fullName}</span>
                    <span className="block truncate text-xs text-text-muted">
                      Siguiente: <span className="font-semibold text-primary-soft">{planLetter(client.nextPosition)}{next ? ` · ${next.template.name}` : ''}</span>
                    </span>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-text-muted transition-colors group-hover:text-primary-soft" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    );
  }

  return (
    <section aria-labelledby="program-clients-title" className="space-y-3">
      <div className="px-1">
        <p className="eyebrow flex items-center gap-2"><Users size={14} />Seguimiento</p>
        <h2 id="program-clients-title" className="mt-1.5 text-xl font-bold text-text-primary">Clientes</h2>
      </div>
      {body}
    </section>
  );
}
