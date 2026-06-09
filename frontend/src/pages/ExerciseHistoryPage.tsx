import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../hooks/useClients';
import { useExercise } from '../hooks/useExercises';
import { usePerformanceHistory } from '../hooks/usePerformances';
import PerformanceForm from '../components/PerformanceForm';
import { AppShell, Button, EmptyState } from '../components/ui';
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
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <p className="text-text-secondary">Cargando...</p>
      </div>
    );
  }

  if (isError || !client || !exercise) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
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
        <header className="mb-4 rounded-md border border-border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button onClick={() => navigate(-1)} className="min-h-10 px-3">Volver</Button>
            <Button variant="primary" onClick={() => setShowForm(true)} className="min-h-10">
              Nueva marca
            </Button>
          </div>

          <p className="text-sm text-text-secondary">{clientFullName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#282828]">
            {exerciseName}
          </h1>

          <div className="mt-4 rounded-md bg-[#FFF7F2] p-4">
            <p className="text-sm font-medium text-primary">Marca actual</p>
            <p className="mt-1 text-3xl font-semibold text-[#282828]">
              {formatPerformance(current)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {current ? formatDate(current.date) : 'Sin marcas registradas'}
            </p>
          </div>
        </header>

        <section>
        {!history || history.length === 0 ? (
          <EmptyState title="Sin marcas registradas" description="Crea la primera marca para este ejercicio." />
        ) : (
          <ul className="space-y-3" aria-label="Histórico de marcas">
            {history.map((record) => (
              <li
                key={record.id}
                className="rounded-md border border-border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-[#282828]">
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
                  <p className="mt-3 whitespace-pre-line rounded-md bg-[#FAFAFA] p-3 text-sm text-[#5A5A5A]">
                    {record.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        </section>
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
