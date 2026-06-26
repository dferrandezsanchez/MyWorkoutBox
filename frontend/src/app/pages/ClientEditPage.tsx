import { useNavigate, useParams } from 'react-router-dom';
import ClientForm from '@features/clients/components/ClientForm';
import { Button, Panel } from '@shared/components/ui';
import { useClient, useUpdateClient } from '@features/clients/hooks/useClients';

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, isError } = useClient(id!);
  const updateMutation = useUpdateClient();

  if (isLoading) return <div className="min-h-screen bg-background p-6 text-text-secondary">Cargando...</div>;
  if (isError || !client) return <div className="min-h-screen bg-background p-6 text-red-500">No se encontró el cliente</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-elevated/85 px-4 py-4 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administración</p>
            <h1 className="truncate text-xl font-bold text-text-primary">Editar cliente</h1>
          </div>
          <Button onClick={() => navigate(-1)} variant="secondary">Cerrar</Button>
        </div>
      </header>

      <main role="main" className="mx-auto max-w-4xl px-4 py-6">
        <Panel className="p-4 sm:p-6">
          <div className="mb-5 border-b border-border/70 pb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {client.firstName} {client.lastName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">Actualiza los datos operativos del cliente.</p>
          </div>
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
        </Panel>
      </main>
    </div>
  );
}
