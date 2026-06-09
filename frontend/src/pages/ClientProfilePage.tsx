import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import PerformanceForm from '../components/PerformanceForm';
import { AppShell, Button, EmptyState, StatusBadge } from '../components/ui';
import { useClient } from '../hooks/useClients';
import { useCurrentPerformances, usePerformanceHistory } from '../hooks/usePerformances';
import { formatPerformance, getBestRecord } from '../utils/exerciseTemplates';
import type { CurrentMark } from '../types/api';

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

function formatAge(birthDate: string): string {
  const age = calculateAge(birthDate);
  return age >= 12 && age <= 90 ? `${age} años` : 'Edad pendiente';
}

export default function ClientProfilePage() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState<{ exerciseId: string; exerciseName: string } | null>(null);

  const { data: client, isLoading: isLoadingClient, isError: isErrorClient } = useClient(clientId!);
  const {
    data: currentPerformances,
    isLoading: isLoadingPerformances,
    isError: isErrorPerformances,
  } = useCurrentPerformances(clientId!);

  const isLoading = isLoadingClient || isLoadingPerformances;
  const isError = isErrorClient || isErrorPerformances;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <p className="text-text-secondary">Cargando cliente...</p>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <p className="text-red-500">Error al cargar el cliente</p>
      </div>
    );
  }

  return (
    <AppShell title="Ficha cliente">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4 rounded-md border border-border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button onClick={() => navigate(-1)} className="min-h-10 px-3">
              Volver
            </Button>
            <StatusBadge status={client.status} />
          </div>

          <div className="flex items-center gap-4">
            <Avatar
              photoUrl={client.photoUrl}
              firstName={client.firstName}
              lastName={client.lastName}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-[#282828]">
                {client.firstName} {client.lastName}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {formatAge(client.birthDate)}
                {client.height != null ? ` · ${client.height} cm` : ''}
                {client.weight != null ? ` · ${client.weight} kg` : ''}
              </p>
            </div>
          </div>

          {client.notes && (
            <p className="mt-4 rounded-md bg-[#FAFAFA] p-3 text-sm leading-6 text-[#5F6267]">
              {client.notes}
            </p>
          )}
        </header>

        <section className="mb-3">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#282828]">Ejercicios</h2>
              <p className="text-sm text-text-secondary">Marca actual y registro rápido.</p>
            </div>
          </div>

          {!currentPerformances || currentPerformances.length === 0 ? (
            <EmptyState title="No hay ejercicios activos" />
          ) : (
            <div className="space-y-3">
              {currentPerformances.map((item) => (
                <ExerciseMarkCard
                  key={item.exerciseId}
                  item={item}
                  clientId={clientId!}
                  onUpdate={() =>
                    setShowForm({
                      exerciseId: item.exerciseId,
                      exerciseName: item.exerciseName,
                    })
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {showForm && (
        <PerformanceForm
          clientId={clientId!}
          exerciseId={showForm.exerciseId}
          exerciseName={showForm.exerciseName}
          onClose={() => setShowForm(null)}
        />
      )}
    </AppShell>
  );
}

function ExerciseMarkCard({
  item,
  clientId,
  onUpdate,
}: {
  item: CurrentMark;
  clientId: string;
  onUpdate: () => void;
}) {
  const navigate = useNavigate();
  const { data: history } = usePerformanceHistory(clientId, item.exerciseId);
  const best = getBestRecord(history ?? []);

  return (
    <article className="rounded-md border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[#282828]">
            {item.exerciseName}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Última: {formatPerformance(item.record)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Mejor: {formatPerformance(best)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#FFF1E8] px-3 py-1 text-sm font-semibold text-primary">
          {item.record ? formatPerformance(item.record) : '-'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr] gap-2">
        <Button variant="primary" onClick={onUpdate}>
          Actualizar
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/clients/${clientId}/exercises/${item.exerciseId}`)}
        >
          Histórico
        </Button>
      </div>
    </article>
  );
}
