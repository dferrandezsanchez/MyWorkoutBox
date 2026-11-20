import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Archive, Plus, Search } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { RoutineCard } from '@features/routines/components/RoutineCard';
import { useCanManageRoutines, useRoutines } from '@features/routines/hooks/useRoutines';
import { Button, EmptyState, PageHeader, TextInput } from '@shared/components/ui';

export default function RoutinesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const modeQuery = location.search.includes('mode=admin') ? '?mode=admin' : '';
  const canManage = useCanManageRoutines();
  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState('');
  const { data: routines, isLoading, isError, refetch } = useRoutines(showArchived);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (routines ?? [])
      .filter((routine) => (showArchived ? routine.status === 'INACTIVE' : routine.status === 'ACTIVE'))
      .filter((routine) => !normalized
        || routine.name.toLowerCase().includes(normalized)
        || routine.exercises.some((item) => item.exercise?.name.toLowerCase().includes(normalized)));
  }, [routines, query, showArchived]);

  const total = (routines ?? []).filter((routine) => (showArchived ? routine.status === 'INACTIVE' : routine.status === 'ACTIVE')).length;

  let content;
  if (isLoading) {
    content = <p className="text-text-secondary">Cargando rutinas...</p>;
  } else if (isError) {
    content = (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
        No se pudieron cargar las rutinas
        <Button variant="ghost" onClick={() => void refetch()}>Reintentar</Button>
      </div>
    );
  } else if (total === 0) {
    content = (
      <EmptyState
        title={showArchived ? 'No hay rutinas archivadas' : 'Aún no hay rutinas'}
        description={showArchived ? undefined : canManage ? 'Prepara la primera plantilla con sus ejercicios en orden.' : 'Cuando el centro prepare rutinas aparecerán aquí.'}
      />
    );
  } else if (visible.length === 0) {
    content = <EmptyState title="No encontramos rutinas con ese nombre" />;
  } else {
    content = (
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((routine) => (
          <RoutineCard key={routine.id} routine={routine} onOpen={(item) => navigate(`/routines/${item.id}${modeQuery}`)} />
        ))}
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          eyebrow="Plantillas"
          title="Rutinas"
          description="Rutinas preparadas con sus ejercicios en orden, listas para asignar a cada cliente."
          actions={canManage ? (
            <Button variant="primary" onClick={() => navigate(`/routines/new${modeQuery}`)} className="inline-flex items-center gap-2 whitespace-nowrap">
              <Plus size={17} />
              Nueva rutina
            </Button>
          ) : undefined}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Buscar rutina</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar rutina o ejercicio" className="w-full rounded-full pl-11" />
          </label>
          <Button
            variant={showArchived ? 'primary' : 'secondary'}
            aria-pressed={showArchived}
            onClick={() => setShowArchived((value) => !value)}
            className="inline-flex items-center justify-center gap-2"
          >
            <Archive size={16} />
            Archivadas
          </Button>
        </div>

        {content}
      </div>
    </AppShell>
  );
}
