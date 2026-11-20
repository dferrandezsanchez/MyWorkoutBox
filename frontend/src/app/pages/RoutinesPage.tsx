import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, Plus, Search } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { RoutineCard } from '@features/routines/components/RoutineCard';
import { RoutineProgramCard } from '@features/routines/components/RoutineProgramCard';
import { useCanManageRoutines, useRoutinePrograms, useRoutines } from '@features/routines/hooks/useRoutines';
import { Button, EmptyState, PageHeader, TextInput } from '@shared/components/ui';

type RoutinesTab = 'rutinas' | 'programas';

const TABS: Array<{ key: RoutinesTab; label: string }> = [
  { key: 'rutinas', label: 'Rutinas' },
  { key: 'programas', label: 'Programas' },
];

export default function RoutinesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const modeQuery = searchParams.get('mode') === 'admin' ? '?mode=admin' : '';
  const tab: RoutinesTab = searchParams.get('tab') === 'programas' ? 'programas' : 'rutinas';
  const canManage = useCanManageRoutines();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectTab = (next: RoutinesTab) => {
    if (next === tab) return;
    const params = new URLSearchParams(searchParams);
    if (next === 'programas') params.set('tab', 'programas');
    else params.delete('tab');
    setSearchParams(params);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!offset) return;
    event.preventDefault();
    const target = (index + offset + TABS.length) % TABS.length;
    selectTab(TABS[target].key);
    tabRefs.current[target]?.focus();
  };

  const isPrograms = tab === 'programas';

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-5">
        <PageHeader
          eyebrow="Plantillas"
          title="Rutinas"
          description={isPrograms
            ? 'Secuencias de rutinas (A → B → C) que siguen varios clientes a la vez.'
            : 'Rutinas preparadas con sus ejercicios en orden, listas para asignar a cada cliente.'}
          actions={canManage ? (
            <Button
              variant="primary"
              onClick={() => navigate(isPrograms ? `/routines/programs/new${modeQuery}` : `/routines/new${modeQuery}`)}
              className="inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={17} />
              {isPrograms ? 'Nuevo programa' : 'Nueva rutina'}
            </Button>
          ) : undefined}
        />

        <div role="tablist" aria-label="Rutinas y programas" className="flex gap-1 border-b border-white/[0.08]">
          {TABS.map((option, index) => {
            const selected = option.key === tab;
            return (
              <button
                key={option.key}
                ref={(element) => { tabRefs.current[index] = element; }}
                type="button"
                role="tab"
                id={`routines-tab-${option.key}`}
                aria-selected={selected}
                aria-controls={`routines-panel-${option.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(option.key)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`-mb-px min-h-[44px] border-b-2 px-4 text-sm font-semibold transition-colors duration-150 focus-ring ${
                  selected ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`routines-panel-${tab}`} aria-labelledby={`routines-tab-${tab}`} className="space-y-5">
          {isPrograms
            ? <ProgramsTab canManage={canManage} onOpen={(id) => navigate(`/routines/programs/${id}${modeQuery}`)} />
            : <TemplatesTab canManage={canManage} onOpen={(id) => navigate(`/routines/${id}${modeQuery}`)} />}
        </div>
      </div>
    </AppShell>
  );
}

function ListToolbar({ query, onQuery, placeholder, searchLabel, showArchived, onToggleArchived, archivedLabel }: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  showArchived: boolean;
  onToggleArchived: () => void;
  archivedLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative block flex-1">
        <span className="sr-only">{searchLabel}</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <TextInput value={query} onChange={(event) => onQuery(event.target.value)} placeholder={placeholder} className="w-full rounded-full pl-11" />
      </label>
      <Button
        variant={showArchived ? 'primary' : 'secondary'}
        aria-pressed={showArchived}
        onClick={onToggleArchived}
        className="inline-flex items-center justify-center gap-2"
      >
        <Archive size={16} />
        {archivedLabel}
      </Button>
    </div>
  );
}

function LoadError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
      {label}
      <Button variant="ghost" onClick={onRetry}>Reintentar</Button>
    </div>
  );
}

function TemplatesTab({ canManage, onOpen }: { canManage: boolean; onOpen: (id: string) => void }) {
  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState('');
  const { data: routines, isLoading, isError, refetch } = useRoutines(showArchived);

  const inScope = useMemo(
    () => (routines ?? []).filter((routine) => (showArchived ? routine.status === 'INACTIVE' : routine.status === 'ACTIVE')),
    [routines, showArchived],
  );
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return inScope.filter((routine) => !normalized
      || routine.name.toLowerCase().includes(normalized)
      || routine.exercises.some((item) => item.exercise?.name.toLowerCase().includes(normalized)));
  }, [inScope, query]);

  let content: ReactNode;
  if (isLoading) {
    content = <p className="text-text-secondary">Cargando rutinas...</p>;
  } else if (isError) {
    content = <LoadError label="No se pudieron cargar las rutinas" onRetry={() => void refetch()} />;
  } else if (inScope.length === 0) {
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
        {visible.map((routine) => <RoutineCard key={routine.id} routine={routine} onOpen={(item) => onOpen(item.id)} />)}
      </div>
    );
  }

  return (
    <>
      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Buscar rutina o ejercicio"
        searchLabel="Buscar rutina"
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((value) => !value)}
        archivedLabel="Archivadas"
      />
      {content}
    </>
  );
}

function ProgramsTab({ canManage, onOpen }: { canManage: boolean; onOpen: (id: string) => void }) {
  const [showArchived, setShowArchived] = useState(false);
  const [query, setQuery] = useState('');
  const { data: programs, isLoading, isError, refetch } = useRoutinePrograms(showArchived);

  const inScope = useMemo(
    () => (programs ?? []).filter((program) => (showArchived ? program.status === 'INACTIVE' : program.status === 'ACTIVE')),
    [programs, showArchived],
  );
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return inScope.filter((program) => !normalized
      || program.name.toLowerCase().includes(normalized)
      || program.items.some((item) => item.template.name.toLowerCase().includes(normalized)));
  }, [inScope, query]);

  let content: ReactNode;
  if (isLoading) {
    content = <p className="text-text-secondary">Cargando programas...</p>;
  } else if (isError) {
    content = <LoadError label="No se pudieron cargar los programas" onRetry={() => void refetch()} />;
  } else if (inScope.length === 0) {
    content = (
      <EmptyState
        title={showArchived ? 'No hay programas archivados' : 'Aún no hay programas'}
        description={showArchived ? undefined : canManage ? 'Agrupa rutinas en una secuencia y asígnala a varios clientes.' : 'Cuando el centro prepare programas aparecerán aquí.'}
      />
    );
  } else if (visible.length === 0) {
    content = <EmptyState title="No encontramos programas con ese nombre" />;
  } else {
    content = (
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((program) => <RoutineProgramCard key={program.id} program={program} onOpen={(item) => onOpen(item.id)} />)}
      </div>
    );
  }

  return (
    <>
      <ListToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Buscar programa o rutina"
        searchLabel="Buscar programa"
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((value) => !value)}
        archivedLabel="Archivados"
      />
      {content}
    </>
  );
}
