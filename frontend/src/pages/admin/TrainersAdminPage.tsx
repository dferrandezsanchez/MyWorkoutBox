import { useNavigate } from 'react-router-dom';
import { AppShell, Button, EmptyState, PageHeader } from '../../components/ui';

export default function TrainersAdminPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administración"
        title="Entrenadores"
        description="Gestión de usuarios entrenadores pendiente de implementar."
        actions={
          <Button onClick={() => navigate('/admin')}>Volver al dashboard</Button>
        }
      />

      <EmptyState
        title="Módulo pendiente"
        description="El modelo de usuarios ya existe. La siguiente iteración debe añadir listado, creación, activación/desactivación y reset de contraseña para entrenadores."
      />
    </AppShell>
  );
}
