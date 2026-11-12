import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Pencil, Power, ShieldX, UserCheck, UserRound, UserX } from 'lucide-react';
import { useClients, useCreateClient, useSetClientStatus, useExportClient, useAnonymizeClient } from '@features/clients/hooks/useClients';
import ClientForm from '@features/clients/components/ClientForm';
import type { Client, CreateClientData } from '@shared/types/api';
import AppShell from '@app/layout/AppShell';
import { AdminManagementHeader, IconAction, ManagementSection, ManagementSummary, RowActionsMenu } from '@app/components/AdminManagement';
import Avatar from '@shared/components/Avatar';
import { ConfirmDialog, Dialog, EmptyState, StatusBadge } from '@shared/components/ui';

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
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-200">Error al cargar clientes</p>
      </AppShell>
    );
  }

  const activeCount = clients?.filter((client) => client.status === 'ACTIVE').length ?? 0;
  const inactiveCount = clients?.filter((client) => client.status === 'INACTIVE').length ?? 0;

  const exportClient = async (client: Client) => {
    const exported = await exportMutation.mutateAsync(client.id);
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cliente-${client.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        { label: 'Activos', value: activeCount, icon: UserCheck, tone: 'primary' },
        { label: 'Inactivos', value: inactiveCount, icon: UserX, tone: 'muted' },
      ]} />

      <ManagementSection title="Directorio de clientes" meta={`${clients?.length ?? 0} perfiles`}>
        {!clients || clients.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No hay clientes" description="Crea el primer perfil para empezar a registrar sesiones." />
          </div>
        ) : (
          clients.map((c) => (
            <div key={c.id} className="flex items-center gap-2 py-2 pl-3 pr-2 transition-colors duration-150 hover:bg-white/[0.02] sm:gap-3 sm:px-5 sm:py-3">
              <button type="button" onClick={() => navigate(`/clients/${c.id}?mode=admin`)} className="group flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-ring">
                <Avatar firstName={c.firstName} lastName={c.lastName} size="md" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-text-primary transition-colors duration-150 group-hover:text-primary-soft">{c.firstName} {c.lastName}</span>
                  <span className="mt-1 block"><StatusBadge status={c.status} /></span>
                </span>
              </button>
              <div className="flex shrink-0 gap-2">
                <IconAction label={`Editar ${c.firstName}`} onClick={() => navigate(`/admin/clients/${c.id}`)}><Pencil size={16} /></IconAction>
                <RowActionsMenu
                  subject={`${c.firstName} ${c.lastName}`}
                  actions={[
                    {
                      label: c.status === 'ACTIVE' ? 'Desactivar cliente' : 'Activar cliente',
                      icon: Power,
                      onSelect: () => statusMutation.mutate({ id: c.id, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
                    },
                    { label: 'Exportar datos (RGPD)', icon: Download, onSelect: () => void exportClient(c) },
                    { label: 'Anonimizar cliente', icon: ShieldX, tone: 'danger', onSelect: () => setClientToAnonymize(c) },
                  ]}
                />
              </div>
            </div>
          ))
        )}
      </ManagementSection>

        {/* Create modal */}
        {showCreate && (
          <Dialog label="Crear cliente" onClose={() => setShowCreate(false)} className="max-w-md">
              <p className="eyebrow mb-2">Nuevo perfil</p>
              <h2 className="mb-5 text-xl font-bold text-text-primary">Crear cliente</h2>
              <ClientForm
                onSubmit={async (data) => {
                  await createMutation.mutateAsync(data as CreateClientData);
                  setShowCreate(false);
                }}
                submitLabel="Crear"
              />
          </Dialog>
        )}
        {clientToAnonymize && <ConfirmDialog title="Anonimizar cliente" description={`Los datos personales de ${clientToAnonymize.firstName} ${clientToAnonymize.lastName} se eliminarán de forma irreversible.`} confirmLabel="Anonimizar" pending={anonymizeMutation.isPending} onCancel={() => setClientToAnonymize(null)} onConfirm={() => anonymizeMutation.mutate(clientToAnonymize.id, { onSuccess: () => setClientToAnonymize(null) })} />}
      </div>
    </AppShell>
  );
}
