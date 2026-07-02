import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Pencil, Power, ShieldX, UserCheck, UserRound, UserX } from 'lucide-react';
import { useClients, useCreateClient, useSetClientStatus, useExportClient, useAnonymizeClient } from '@features/clients/hooks/useClients';
import ClientForm from '@features/clients/components/ClientForm';
import type { Client, CreateClientData } from '@shared/types/api';
import AppShell from '@app/layout/AppShell';
import { AdminManagementHeader, IconAction, ManagementSection, ManagementSummary } from '@app/components/AdminManagement';
import Avatar from '@shared/components/Avatar';
import { Button, ConfirmDialog, EmptyState, StatusBadge } from '@shared/components/ui';

export default function ClientsAdminPage() {
  const navigate = useNavigate();
  const { data: clients, isLoading, isError } = useClients(undefined, true);
  const createMutation = useCreateClient();
  const statusMutation = useSetClientStatus();
  const exportMutation = useExportClient();
  const anonymizeMutation = useAnonymizeClient();

  const [showCreate, setShowCreate] = useState(false);
  const [clientToAnonymize, setClientToAnonymize] = useState<Client | null>(null);

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
      <div className="mx-auto max-w-6xl space-y-6">
      <AdminManagementHeader
        eyebrow="Gestión del centro"
        title="Clientes"
        description="Gestiona altas, estado y acciones RGPD."
        actionLabel="Nuevo cliente"
        onAction={() => setShowCreate(true)}
      />

      <ManagementSummary items={[
        { label: 'Total', value: clients?.length ?? 0, icon: UserRound, tone: 'primary' },
        { label: 'Activos', value: activeCount, icon: UserCheck, tone: 'green' },
        { label: 'Inactivos', value: inactiveCount, icon: UserX, tone: 'amber' },
      ]} />

      <ManagementSection title="Directorio de clientes" meta={`${clients?.length ?? 0} perfiles`}>
        {!clients || clients.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay clientes" description="Crea el primer perfil para empezar a registrar sesiones." />
          </div>
        ) : (
          clients.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 border-b border-border/70 p-4 last:border-b-0 sm:flex-row sm:items-center">
                <button type="button" onClick={() => navigate(`/clients/${c.id}`)} className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-ring">
                  <Avatar firstName={c.firstName} lastName={c.lastName} size="md" />
                  <span className="min-w-0"><span className="block truncate font-semibold text-text-primary group-hover:text-primary">{c.firstName} {c.lastName}</span><span className="mt-1 block text-xs text-text-secondary">Perfil, sesiones y marcas</span></span>
                </button>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <StatusBadge status={c.status} />
                  <div className="flex gap-1.5">
                  <IconAction label={`Editar ${c.firstName}`} onClick={() => navigate(`/admin/clients/${c.id}`)}><Pencil size={16} /></IconAction>
                  <IconAction label={c.status === 'ACTIVE' ? `Desactivar ${c.firstName}` : `Activar ${c.firstName}`} onClick={() => statusMutation.mutate({ id: c.id, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}><Power size={16} /></IconAction>
                  <IconAction label={`Exportar ${c.firstName}`} onClick={async () => {
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
                  }}><Download size={16} /></IconAction>
                  <IconAction label={`Anonimizar ${c.firstName}`} tone="danger" onClick={() => setClientToAnonymize(c)}><ShieldX size={16} /></IconAction>
                  </div>
                </div>
            </div>
          ))
        )}
      </ManagementSection>

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
        {clientToAnonymize && <ConfirmDialog title="Anonimizar cliente" description={`Los datos personales de ${clientToAnonymize.firstName} ${clientToAnonymize.lastName} se eliminarán de forma irreversible.`} confirmLabel="Anonimizar" pending={anonymizeMutation.isPending} onCancel={() => setClientToAnonymize(null)} onConfirm={() => anonymizeMutation.mutate(clientToAnonymize.id, { onSuccess: () => setClientToAnonymize(null) })} />}
      </div>
    </AppShell>
  );
}
