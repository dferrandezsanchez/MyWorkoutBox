import { useNavigate, useParams } from 'react-router-dom';
import ClientForm from '@features/clients/components/ClientForm';
import { X } from 'lucide-react';
import { Button, PageHeader, Panel } from '@shared/components/ui';
import { BrandMark } from '@shared/components/BrandLogo';
import Avatar from '@shared/components/Avatar';
import { useClient, useUpdateClient } from '@features/clients/hooks/useClients';

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, isError } = useClient(id!);
  const updateMutation = useUpdateClient();

  if (isLoading) return <div className="min-h-dvh bg-background p-6 text-text-secondary">Cargando...</div>;
  if (isError || !client) {
    return (
      <div className="min-h-dvh bg-background p-6">
        <p role="alert" className="mx-auto max-w-3xl rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">No se encontró el cliente</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/90 px-4 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] max-w-3xl items-center justify-between gap-3">
          <BrandMark className="h-6 w-7 shrink-0 text-primary" />
          <Button onClick={() => navigate(-1)} variant="secondary" className="inline-flex items-center gap-2">
            <X size={16} />
            Cerrar
          </Button>
        </div>
      </header>

      <main role="main" className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-10">
        <PageHeader eyebrow="Administración" title="Editar cliente" />
        <Panel className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3 border-b border-white/[0.06] pb-5">
            <Avatar firstName={client.firstName} lastName={client.lastName} size="md" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-text-primary sm:text-xl">
                {client.firstName} {client.lastName}
              </h2>
              <p className="mt-0.5 text-sm text-text-secondary">Datos operativos del cliente</p>
            </div>
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
              void navigate(-1);
            }}
            showStatus
          />
        </Panel>
      </main>
    </div>
  );
}
