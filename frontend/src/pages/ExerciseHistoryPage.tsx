import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../hooks/useClients';
import { useExercise } from '../hooks/useExercises';
import { usePerformanceHistory } from '../hooks/usePerformances';
import PerformanceForm from '../components/PerformanceForm';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Cargando...</p>
      </div>
    );
  }

  if (isError || !client || !exercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Error al cargar el histórico</p>
      </div>
    );
  }

  const clientFullName = `${client.firstName} ${client.lastName}`;
  const exerciseName = exercise.name;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              aria-label="Volver"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-border transition-colors text-text-primary flex-shrink-0"
            >
              ←
            </button>
            <h1 className="text-base font-bold text-text-primary truncate">
              {exerciseName} — {clientFullName}
            </h1>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="min-h-[44px] px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0"
          >
            Nueva marca
          </button>
        </div>
      </header>

      <main role="main" className="max-w-3xl mx-auto px-4 py-6">
        {!history || history.length === 0 ? (
          <p className="text-text-secondary text-center py-12">
            Sin marcas registradas para este ejercicio
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Histórico de marcas">
            {history.map((record) => (
              <li
                key={record.id}
                className="bg-surface border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Date */}
                  <span className="text-text-secondary text-sm flex-shrink-0">
                    {formatDate(record.date)}
                  </span>

                  {/* Value + unit */}
                  <span className="bg-primary-soft text-primary text-sm font-semibold px-2 py-0.5 rounded-full">
                    {record.value} {record.unit}
                  </span>
                </div>

                {/* Trainer */}
                <p className="text-text-secondary text-xs mt-2">
                  Registrado por: {record.trainerName}
                </p>

                {/* Notes */}
                {record.notes && (
                  <p className="text-text-primary text-sm mt-1 italic">{record.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Performance form modal */}
      {showForm && (
        <PerformanceForm
          clientId={clientId!}
          exerciseId={exerciseId!}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
