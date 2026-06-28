import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useClients, useCreateClient, useSetClientStatus, useExportClient, useAnonymizeClient } from '@features/clients/hooks/useClients';
import ClientPhotoUploader from '@features/clients/components/ClientPhotoUploader';
import ClientCard from '@features/clients/components/ClientCard';
import ClientForm from '@features/clients/components/ClientForm';
import type { CreateClientData } from '@shared/types/api';
import AppShell from '@app/layout/AppShell';
import { Button, EmptyState, MetricChip, PageHeader, StatusBadge } from '@shared/components/ui';

export default function ClientsAdminPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading, isError } = useClients(undefined, true);
  const createMutation = useCreateClient();
  const statusMutation = useSetClientStatus();
  const exportMutation = useExportClient();
  const anonymizeMutation = useAnonymizeClient();

  const [showCreate, setShowCreate] = useState(false);
  const [uploadFor, setUploadFor] = useState<string | null>(null);

  if (isLoading) {
    return (
      <AppShell>
        <p className="text-text-secondary">Cargando clientes...</p>
      </AppShell>
    );
  }
  if (isError) {
    return (
      <AppShell>
        <p className="text-red-500">Error al cargar clientes</p>
      </AppShell>
    );
  }

  const activeCount = clients?.filter((client) => client.status === 'ACTIVE').length ?? 0;
  const inactiveCount = clients?.filter((client) => client.status === 'INACTIVE').length ?? 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administración"
        title="Clientes"
        description="Gestiona altas, estado, fotos y acciones RGPD."
        actions={
          <>
            <Button onClick={() => navigate('/admin/exercises')}>Ejercicios</Button>
            <Button variant="primary" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2">
              <Plus size={16} />
              Nuevo cliente
            </Button>
          </>
        }
      />

      <section className="mb-5 grid grid-cols-3 gap-3">
        <MetricChip label="Total" value={clients?.length ?? 0} />
        <MetricChip label="Activos" value={activeCount} />
        <MetricChip label="Inactivos" value={inactiveCount} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-elevated/85 shadow-panel backdrop-blur">
        {!clients || clients.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay clientes" />
          </div>
        ) : (
          clients.map((c) => (
            <div key={c.id} className="border-b border-border/70 p-3 last:border-b-0">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <ClientCard client={c} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={c.status} />
                  <Button onClick={() => navigate(`/admin/clients/${c.id}`)}>
                  Editar
                  </Button>
                  <Button
                  onClick={() => statusMutation.mutate({ id: c.id, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                >
                  {c.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                  onClick={async () => {
                    const exported = await exportMutation.mutateAsync(c.id);
                    const blob = new Blob([JSON.stringify(exported, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `cliente-${c.id}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Exportar
                  </Button>
                  <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('¿Anonimizar este cliente? Esta acción no se puede deshacer.')) {
                      anonymizeMutation.mutate(c.id);
                    }
                  }}
                >
                  Anonimizar
                  </Button>
                  <Button
                  onClick={() => setUploadFor(c.id)}
                >
                  Foto
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Crear cliente" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <div className="w-full max-w-md rounded-2xl border border-border/70 bg-elevated/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Crear cliente</h2>
              <ClientForm
                onSubmit={async (data) => {
                  await createMutation.mutateAsync(data as CreateClientData);
                  setShowCreate(false);
                }}
                submitLabel="Crear"
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => setShowCreate(false)}>Cerrar</Button>
              </div>
            </div>
          </div>
        )}
        {uploadFor && (
          <ClientPhotoUploader clientId={uploadFor} onClose={() => setUploadFor(null)} />
        )}
    </AppShell>
  );
}
