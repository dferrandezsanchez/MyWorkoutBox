import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil, Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { AdminManagementHeader, IconAction, ManagementSection, ManagementSummary, RowIcon } from './AdminManagement';

describe('admin management components', () => {
  it('renders the definitive section pattern and triggers actions', async () => {
    const user = userEvent.setup();
    const create = vi.fn();
    const edit = vi.fn();

    render(
      <>
        <AdminManagementHeader eyebrow="Gestión" title="Clientes" description="Directorio" actionLabel="Nuevo cliente" onAction={create} />
        <ManagementSummary items={[
          { label: 'Total', value: 3, icon: Users, tone: 'primary' },
          { label: 'Activos', value: 2, icon: Users, tone: 'green' },
          { label: 'Inactivos', value: 1, icon: Users, tone: 'amber' },
        ]} />
        <ManagementSection title="Directorio" meta="3 perfiles">
          <RowIcon icon={Users} tone="blue" />
          <RowIcon icon={Users} tone="violet" />
          <IconAction label="Editar" onClick={edit}><Pencil size={16} /></IconAction>
          <IconAction label="Eliminar" tone="danger"><Pencil size={16} /></IconAction>
        </ManagementSection>
      </>,
    );

    expect(screen.getByText('Datos actuales')).toBeInTheDocument();
    expect(screen.getByText('3 perfiles')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Nuevo cliente' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    expect(create).toHaveBeenCalledOnce();
    expect(edit).toHaveBeenCalledOnce();
  });
});
