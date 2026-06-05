import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '../hooks/useClients';
import { useCurrentPerformances } from '../hooks/usePerformances';
import Avatar from '../components/Avatar';
import ExerciseRow from '../components/ExerciseRow';
import PerformanceForm from '../components/PerformanceForm';

function calculateAge(birthDate: string): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
}

export default function ClientProfilePage() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState<{ exerciseId: string } | null>(null);

  const { data: client, isLoading: isLoadingClient, isError: isErrorClient } = useClient(clientId!);
  const {
    data: currentPerformances,
    isLoading: isLoadingPerf,
    isError: isErrorPerf,
  } = useCurrentPerformances(clientId!);

  const isLoading = isLoadingClient || isLoadingPerf;
  const isError = isErrorClient || isErrorPerf;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Cargando...</p>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-red-500">Error al cargar el perfil del cliente</p>
      </div>
    );
  }

  const age = calculateAge(client.birthDate);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-border transition-colors text-text-primary"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-text-primary">
            {client.firstName} {client.lastName}
          </h1>
        </div>
      </header>

      <main role="main" className="max-w-3xl mx-auto px-4 py-6">
        {/* Client info section */}
        <section className="bg-surface border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              photoUrl={client.photoUrl}
              firstName={client.firstName}
              lastName={client.lastName}
              size="lg"
            />
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {client.firstName} {client.lastName}
              </p>
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                  client.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {client.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {/* Client details */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-text-secondary">Edad</dt>
              <dd className="text-text-primary font-medium">{age} años</dd>
            </div>

            {client.height != null && (
              <div>
                <dt className="text-text-secondary">Altura</dt>
                <dd className="text-text-primary font-medium">{client.height} cm</dd>
              </div>
            )}

            {client.weight != null && (
              <div>
                <dt className="text-text-secondary">Peso</dt>
                <dd className="text-text-primary font-medium">{client.weight} kg</dd>
              </div>
            )}

            {client.bodyFatPercentage != null && (
              <div>
                <dt className="text-text-secondary">% Grasa corporal</dt>
                <dd className="text-text-primary font-medium">{client.bodyFatPercentage}%</dd>
              </div>
            )}
          </dl>

          {client.notes && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-text-secondary text-sm mb-1">Notas</p>
              <p className="text-text-primary text-sm">{client.notes}</p>
            </div>
          )}
        </section>

        {/* Current performances section */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Marcas Actuales</h2>

          {!currentPerformances || currentPerformances.length === 0 ? (
            <p className="text-text-secondary text-sm py-4">
              No hay ejercicios registrados.
            </p>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              {currentPerformances.map((item) => (
                <div key={item.exerciseId} className="flex items-center">
                  <div className="flex-1 px-4">
                    <ExerciseRow
                      exerciseName={item.exerciseName}
                      currentMark={item.record}
                      clientId={clientId!}
                      exerciseId={item.exerciseId}
                    />
                  </div>
                  <div className="pr-4">
                    <button
                      onClick={() => setShowForm({ exerciseId: item.exerciseId })}
                      className="min-h-[44px] px-3 py-1 text-sm bg-primary hover:bg-primary-hover text-white rounded-md transition-colors"
                    >
                      Añadir marca
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Performance form modal */}
      {showForm && (
        <PerformanceForm
          clientId={clientId!}
          exerciseId={showForm.exerciseId}
          onClose={() => setShowForm(null)}
        />
      )}
    </div>
  );
}
