import { useNavigate, useParams } from 'react-router-dom';
import ClientForm from '../../components/ClientForm';
import { useClient, useUpdateClient } from '../../hooks/useClients';

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, isError } = useClient(id!);
  const updateMutation = useUpdateClient();

  if (isLoading) return <p className="text-text-secondary">Cargando...</p>;
  if (isError || !client) return <p className="text-red-500">No se encontró el cliente</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-text-primary">Editar cliente</h1>
          <button onClick={() => navigate(-1)} className="min-h-[44px] px-3 py-2 border border-border rounded-md">Cerrar</button>
        </div>
      </header>

      <main role="main" className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-surface border border-border rounded-lg p-6">
          <ClientForm
            initial={{
              firstName: client.firstName,
              lastName: client.lastName,
              birthDate: client.birthDate,
              height: client.height,
              weight: client.weight,
              bodyFatPercentage: client.bodyFatPercentage,
              status: client.status,
              notes: client.notes ?? undefined,
            }}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({ id: client.id, data });
              navigate(-1);
            }}
            showStatus
          />
        </div>
      </main>
    </div>
  );
}
