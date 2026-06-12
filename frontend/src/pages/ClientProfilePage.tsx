import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Dumbbell, History, Plus, Trophy } from 'lucide-react';
import Avatar from '../components/Avatar';
import PerformanceForm from '../components/PerformanceForm';
import { AppShell, Button, EmptyState, Panel, StatusBadge } from '../components/ui';
import { useClient } from '../hooks/useClients';
import { useCurrentPerformances, usePerformanceHistory } from '../hooks/usePerformances';
import { formatPerformance, getBestRecord } from '../utils/exerciseTemplates';
import type { CurrentMark, Exercise } from '../types/api';

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
  const [showForm, setShowForm] = useState<{ exerciseId: string; exerciseName: string; exercise?: Exercise } | null>(null);

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-text-secondary">Cargando cliente...</p>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-red-500">Error al cargar el cliente</p>
      </div>
    );
  }

  return (
    <AppShell title="Ficha cliente">
      <div className="mx-auto max-w-4xl space-y-4">
        <Panel className="relative overflow-hidden p-4 sm:p-5">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Button onClick={() => navigate(-1)} className="inline-flex min-h-10 items-center gap-2 px-3">
                <ChevronLeft size={16} />
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
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Cliente activo
                </p>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
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
              <p className="mt-4 rounded-2xl border border-border/70 bg-surface/60 p-3 text-sm leading-6 text-text-secondary">
                {client.notes}
              </p>
            )}
          </div>
        </Panel>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Marcas
              </p>
              <h2 className="mt-1 text-xl font-semibold text-text-primary">Ejercicios de referencia</h2>
              <p className="text-sm text-text-secondary">Última marca, mejor registro y actualización rápida.</p>
            </div>
          </div>

          {!currentPerformances || currentPerformances.length === 0 ? (
            <EmptyState title="No hay ejercicios activos" />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {currentPerformances.map((item) => (
                <ExerciseMarkCard
                  key={item.exerciseId}
                  item={item}
                  clientId={clientId!}
                  onUpdate={() =>
                    setShowForm({
                      exerciseId: item.exerciseId,
                      exerciseName: item.exerciseName,
                      exercise: item.exercise,
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
          exercise={showForm.exercise}
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
  const best = getBestRecord(history ?? [], item.exercise);

  return (
    <Panel className="max-w-full overflow-hidden p-4">
      <div className="flex min-w-0 flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Dumbbell size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-text-primary">
              {item.exerciseName}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Última: <span className="font-semibold text-text-primary">{formatPerformance(item.record)}</span>
            </p>
          </div>
        </div>
        <span className="w-fit max-w-full shrink-0 truncate rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-primary/20">
          {item.record ? formatPerformance(item.record) : '-'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border/70 bg-surface/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <History size={13} />
            Última
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text-primary">{formatPerformance(item.record)}</p>
        </div>
        <div className="min-w-0 rounded-2xl border border-border/70 bg-surface/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <Trophy size={13} />
            Mejor
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text-primary">{formatPerformance(best)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-[1.15fr_0.85fr]">
        <Button variant="primary" onClick={onUpdate} className="inline-flex w-full items-center justify-center gap-2">
          <Plus size={16} />
          Actualizar
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/clients/${clientId}/exercises/${item.exerciseId}`)}
          className="inline-flex w-full items-center justify-center gap-2"
        >
          <History size={16} />
          Histórico
        </Button>
      </div>
    </Panel>
  );
}
