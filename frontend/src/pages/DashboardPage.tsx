import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Smartphone, UserCog, Users } from 'lucide-react';
import { AppShell, Button, EmptyState, PageHeader, StatusBadge } from '../components/ui';
import { useClients } from '../hooks/useClients';
import { useExercises } from '../hooks/useExercises';
import { useTrainers } from '../hooks/useTrainers';
import type { Client } from '../types/api';

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function hasDataIssue(client: Client): boolean {
  const age = calculateAge(client.birthDate);
  return age < 12 || age > 90 || (client.height == null && client.weight == null);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading: isLoadingClients, isError: isClientsError } = useClients(undefined, true);
  const { data: exercises, isLoading: isLoadingExercises } = useExercises(true);
  const { data: trainers, isLoading: isLoadingTrainers } = useTrainers(true);

  const activeClients = clients?.filter((client) => client.status === 'ACTIVE') ?? [];
  const inactiveClients = clients?.filter((client) => client.status === 'INACTIVE') ?? [];
  const activeExercises = exercises?.filter((exercise) => exercise.status === 'ACTIVE') ?? [];
  const inactiveExercises = exercises?.filter((exercise) => exercise.status === 'INACTIVE') ?? [];
  const activeTrainers = trainers?.filter((trainer) => trainer.active) ?? [];
  const dataIssues = useMemo(
    () => activeClients.filter(hasDataIssue).slice(0, 6),
    [activeClients],
  );

  return (
    <AppShell>
      <PageHeader
        title="Dashboard admin"
        description="Control general del centro y accesos a la gestión."
        actions={
          <>
            <Button onClick={() => navigate('/admin/clients')}>Clientes</Button>
            <Button variant="primary" onClick={() => navigate('/admin/exercises')}>
              Ejercicios
            </Button>
          </>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Clientes activos', isLoadingClients ? '...' : activeClients.length],
          ['Clientes inactivos', isLoadingClients ? '...' : inactiveClients.length],
          ['Entrenadores activos', isLoadingTrainers ? '...' : activeTrainers.length],
          ['Ejercicios activos', isLoadingExercises ? '...' : activeExercises.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-border bg-elevated p-4 shadow-sm">
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-text-primary">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-md border border-border bg-elevated p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary">Gestión</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => navigate('/admin/clients')}
              className="min-h-[112px] rounded-md border border-border bg-surface p-4 text-left transition-colors hover:bg-primary/5 focus-ring"
            >
              <Users size={20} className="mb-3 text-primary" />
              <span className="block text-lg font-semibold text-text-primary">Clientes</span>
              <span className="mt-2 block text-sm text-text-secondary">Altas, edición, fotos y RGPD.</span>
            </button>
            <button
              onClick={() => navigate('/admin/trainers')}
              className="min-h-[112px] rounded-md border border-border bg-surface p-4 text-left transition-colors hover:bg-primary/5 focus-ring"
            >
              <UserCog size={20} className="mb-3 text-primary" />
              <span className="block text-lg font-semibold text-text-primary">Entrenadores</span>
              <span className="mt-2 block text-sm text-text-secondary">Altas, accesos, estado y contraseña.</span>
            </button>
            <button
              onClick={() => navigate('/admin/exercises')}
              className="min-h-[112px] rounded-md border border-border bg-surface p-4 text-left transition-colors hover:bg-primary/5 focus-ring"
            >
              <Dumbbell size={20} className="mb-3 text-primary" />
              <span className="block text-lg font-semibold text-text-primary">Ejercicios</span>
              <span className="mt-2 block text-sm text-text-secondary">Catálogo de ejercicios de referencia.</span>
            </button>
            <button
              onClick={() => navigate('/trainer')}
              className="min-h-[112px] rounded-md border border-border bg-surface p-4 text-left transition-colors hover:bg-primary/5 focus-ring"
            >
              <Smartphone size={20} className="mb-3 text-primary" />
              <span className="block text-lg font-semibold text-text-primary">Vista trainer</span>
              <span className="mt-2 block text-sm text-text-secondary">Comprobar flujo móvil de marcas.</span>
            </button>
          </div>
        </section>

        <section className="rounded-md border border-border bg-elevated p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Datos a revisar</h2>
              <p className="text-sm text-text-secondary">Clientes importados con información incompleta.</p>
            </div>
            <StatusBadge status={dataIssues.length ? 'INACTIVE' : 'ACTIVE'} />
          </div>

          {isClientsError && <p className="text-red-500">Error al cargar clientes</p>}
          {!isClientsError && dataIssues.length === 0 && (
            <EmptyState title="No hay incidencias visibles" />
          )}
          {!isClientsError && dataIssues.length > 0 && (
            <div className="space-y-2">
              {dataIssues.map((client) => (
                <button
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="flex min-h-[58px] w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-left transition-colors hover:bg-primary/5 focus-ring"
                >
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">
                      {client.firstName} {client.lastName}
                    </span>
                    <span className="text-xs text-text-secondary">
                      Edad o datos físicos pendientes
                    </span>
                  </span>
                  <span className="text-text-secondary">›</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
