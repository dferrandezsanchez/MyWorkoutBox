import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, LineChart, Plus } from 'lucide-react';
import { useClient } from '../hooks/useClients';
import { useExercise } from '../hooks/useExercises';
import { usePerformanceHistory } from '../hooks/usePerformances';
import PerformanceForm from '../components/PerformanceForm';
import ProgressChart from '../components/ProgressChart';
import { AppShell, Button, EmptyState, Panel } from '../components/ui';
import { formatPerformance } from '../utils/exerciseTemplates';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ExerciseHistoryPage() {
  const { id: clientId, exerciseId } = useParams<{ id: string; exerciseId: string }>();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);

  const { data: client, isLoading: isLoadingClient, isError: isErrorClient } = useClient(clientId!);
  const { data: exercise, isLoading: isLoadingExercise, isError: isErrorExercise } = useExercise(exerciseId!);
  const {
    data: history,
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
  } = usePerformanceHistory(clientId!, exerciseId!);

  const isLoading = isLoadingClient || isLoadingExercise || isLoadingHistory;
  const isError = isErrorClient || isErrorExercise || isErrorHistory;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-text-secondary">Cargando...</p>
      </div>
    );
  }

  if (isError || !client || !exercise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-red-500">Error al cargar el histórico</p>
      </div>
    );
  }

  const clientFullName = `${client.firstName} ${client.lastName}`;
  const exerciseName = exercise.name;
  const current = history?.[0];

  return (
    <AppShell title="Histórico">
      <div className="mx-auto max-w-3xl">
        <Panel className="mb-4 overflow-hidden p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button onClick={() => navigate(-1)} className="inline-flex min-h-10 items-center gap-2 px-3">
              <ChevronLeft size={16} />
              Volver
            </Button>
            <Button variant="primary" onClick={() => setShowForm(true)} className="inline-flex min-h-10 items-center gap-2">
              <Plus size={16} />
              Nueva marca
            </Button>
          </div>

          <p className="text-sm text-text-secondary">{clientFullName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
            {exerciseName}
          </h1>

          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <LineChart size={16} />
              Marca actual
            </p>
            <p className="mt-1 text-3xl font-semibold text-text-primary">
              {formatPerformance(current)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {current ? formatDate(current.date) : 'Sin marcas registradas'}
            </p>
          </div>
        </Panel>

        {!history || history.length === 0 ? (
          <EmptyState title="Sin marcas registradas" description="Crea la primera marca para este ejercicio." />
        ) : (
          <>
            <ProgressChart history={history} />
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text-primary">Registros</h2>
              <ul className="space-y-3" aria-label="Histórico de marcas">
                {history.map((record) => (
                  <li key={record.id} className="rounded-2xl border border-border/70 bg-elevated/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold text-text-primary">
                          {formatPerformance(record)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                          Registrado por {record.trainerName}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-text-secondary">
                        {formatDate(record.date)}
                      </span>
                    </div>

                    {record.notes && (
                      <p className="mt-3 whitespace-pre-line rounded-2xl bg-surface/70 p-3 text-sm text-text-secondary">
                        {record.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      {showForm && (
        <PerformanceForm
          clientId={clientId!}
          exerciseId={exerciseId!}
          exerciseName={exercise.name}
          defaultUnit={exercise.defaultUnit}
          onClose={() => setShowForm(false)}
        />
      )}
    </AppShell>
  );
}
