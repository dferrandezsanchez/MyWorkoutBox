import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Dumbbell,
  LineChart,
  Smartphone,
  UserCog,
  Users,
} from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { ActionTile, Button, EmptyState, MetricCard, Panel, SectionHeader, StatusBadge } from '@shared/components/ui';
import { useClients } from '@features/clients/hooks/useClients';
import { useExercises } from '@features/exercises/hooks/useExercises';
import { useTrainers } from '@features/trainers/hooks/useTrainers';
import { useTheme } from '@shared/theme/ThemeProvider';
import type { Client } from '@shared/types/api';

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function hasDataIssue(client: Client): boolean {
  const age = calculateAge(client.birthDate);
  return age < 12 || age > 90 || (client.height == null && client.weight == null);
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-28 items-end gap-2">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="flex-1 rounded-t-lg bg-gradient-to-t from-primary/25 to-primary"
          style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { brand } = useTheme();
  const { data: clients, isLoading: isLoadingClients, isError: isClientsError } = useClients(undefined, true);
  const { data: exercises, isLoading: isLoadingExercises } = useExercises(true);
  const { data: trainers, isLoading: isLoadingTrainers } = useTrainers(true);

  const activeClients = useMemo(() => clients?.filter((client) => client.status === 'ACTIVE') ?? [], [clients]);
  const inactiveClients = useMemo(() => clients?.filter((client) => client.status === 'INACTIVE') ?? [], [clients]);
  const activeExercises = useMemo(() => exercises?.filter((exercise) => exercise.status === 'ACTIVE') ?? [], [exercises]);
  const activeTrainers = useMemo(() => trainers?.filter((trainer) => trainer.active) ?? [], [trainers]);
  const dataIssues = useMemo(
    () => activeClients.filter(hasDataIssue).slice(0, 6),
    [activeClients],
  );
  const chartValues = [
    activeClients.length,
    inactiveClients.length,
    activeTrainers.length,
    activeExercises.length,
  ];

  return (
    <AppShell>
      <div className="space-y-5">
        <Panel className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                Hola, Admin
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                Resumen operativo de {brand.name}. Gestiona clientes, entrenadores y ejercicios desde un panel compacto.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/admin/clients')}>Clientes</Button>
              <Button variant="primary" onClick={() => navigate('/admin/exercises')}>
                Ejercicios
              </Button>
            </div>
          </div>
        </Panel>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Clientes activos"
            value={isLoadingClients ? '...' : activeClients.length}
            detail="Perfiles disponibles"
            icon={Users}
            tone="primary"
          />
          <MetricCard
            label="Clientes inactivos"
            value={isLoadingClients ? '...' : inactiveClients.length}
            detail="Fuera de seguimiento"
            icon={AlertTriangle}
            tone="red"
          />
          <MetricCard
            label="Entrenadores activos"
            value={isLoadingTrainers ? '...' : activeTrainers.length}
            detail="Usuarios operativos"
            icon={UserCog}
            tone="green"
          />
          <MetricCard
            label="Ejercicios activos"
            value={isLoadingExercises ? '...' : activeExercises.length}
            detail="Catálogo visible"
            icon={Dumbbell}
            tone="blue"
          />
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-4 sm:p-5">
            <SectionHeader
              title="Rendimiento del centro"
              description="Distribución simple basada en datos reales del tenant."
              action={<LineChart size={20} className="text-primary" />}
            />
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_190px]">
              <div className="rounded-2xl border border-border/70 bg-surface/60 p-4">
                <MiniBars values={chartValues} />
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] text-text-secondary">
                  <span>Activos</span>
                  <span>Inactivos</span>
                  <span>Trainers</span>
                  <span>Ejercicios</span>
                </div>
              </div>
              <div className="space-y-3">
                <StatusRow label="Clientes activos" value={activeClients.length} tone="bg-primary" />
                <StatusRow label="Entrenadores" value={activeTrainers.length} tone="bg-emerald-400" />
                <StatusRow label="Ejercicios" value={activeExercises.length} tone="bg-sky-400" />
                <StatusRow label="Revisar" value={dataIssues.length} tone="bg-amber-400" />
              </div>
            </div>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <SectionHeader title="Acciones rápidas" description="Gestión real disponible en el MVP." />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ActionTile
                icon={Users}
                title="Clientes"
                description="Alta, edición y RGPD"
                onClick={() => navigate('/admin/clients')}
              />
              <ActionTile
                icon={UserCog}
                title="Entrenadores"
                description="Accesos y estado"
                onClick={() => navigate('/admin/trainers')}
              />
              <ActionTile
                icon={Dumbbell}
                title="Ejercicios"
                description="Catálogo del centro"
                onClick={() => navigate('/admin/exercises')}
              />
              <ActionTile
                icon={Smartphone}
                title="Vista trainer"
                description="Probar flujo móvil"
                onClick={() => navigate('/trainer')}
              />
            </div>
          </Panel>
        </div>

        <Panel className="p-4 sm:p-5">
          <SectionHeader
            title="Datos a revisar"
            description="Clientes activos con edad o datos físicos pendientes."
            action={<StatusBadge status={dataIssues.length ? 'INACTIVE' : 'ACTIVE'} />}
          />

          {isClientsError && <p className="mt-5 text-red-500">Error al cargar clientes</p>}
          {!isClientsError && dataIssues.length === 0 && (
            <div className="mt-5">
              <EmptyState title="No hay incidencias visibles" />
            </div>
          )}
          {!isClientsError && dataIssues.length > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dataIssues.map((client) => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="flex min-h-[76px] w-full items-center justify-between rounded-2xl border border-border/70 bg-surface/65 px-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/10 focus-ring"
                >
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">
                      {client.firstName} {client.lastName}
                    </span>
                    <span className="text-xs text-text-secondary">Edad o datos físicos pendientes</span>
                  </span>
                  <span className="text-text-secondary">›</span>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-text-secondary">
          <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
          {label}
        </span>
        <span className="text-sm font-semibold text-text-primary">{value}</span>
      </div>
    </div>
  );
}
