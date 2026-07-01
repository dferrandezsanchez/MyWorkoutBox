import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dumbbell } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionTile,
  Button,
  ConfirmDialog,
  EmptyState,
  MetricCard,
  MetricChip,
  PageHeader,
  Panel,
  SectionHeader,
  StatusBadge,
  TextInput,
  ThemeToggle,
} from './ui';
import { ThemeProvider } from '@shared/theme/ThemeProvider';

describe('shared UI components', () => {
  it('renders base controls and layout components', () => {
    render(
      <>
        <Button variant="primary">Guardar</Button>
        <Button variant="danger">Eliminar</Button>
        <TextInput aria-label="Nombre" defaultValue="Demo" />
        <Panel>Panel content</Panel>
        <SectionHeader title="Clientes" description="Gestiona clientes" action={<Button>Nuevo</Button>} />
        <PageHeader title="Dashboard" eyebrow="Admin" description="Resumen" actions={<Button>Acción</Button>} />
        <MetricCard label="Clientes" value={12} detail="activos" icon={Dumbbell} tone="green" />
        <MetricChip label="Peso" value="100 kg" />
        <EmptyState title="Sin datos" description="Crea el primer registro" />
        <StatusBadge status="ACTIVE" />
        <StatusBadge status="INACTIVE" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toHaveValue('Demo');
    expect(screen.getByText('Panel content')).toBeInTheDocument();
    expect(screen.getByText('Gestiona clientes')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  it('triggers action buttons', async () => {
    const user = userEvent.setup();
    const onTileClick = vi.fn();

    render(
      <>
        <ActionTile title="Registrar marca" description="Nueva marca" icon={Dumbbell} onClick={onTileClick} />
      </>,
    );

    await user.click(screen.getByRole('button', { name: /Registrar marca/ }));

    expect(onTileClick).toHaveBeenCalledOnce();
  });

  it('renders dark mode indicator instead of a theme selector', () => {
    render(
      <ThemeProvider>
        <ThemeToggle compact />
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(screen.getByLabelText('Tema oscuro fijo')).toBeInTheDocument();
    expect(screen.getByText('Modo oscuro')).toBeInTheDocument();
  });

  it('confirms and cancels destructive dialogs', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        title="Eliminar serie"
        description="La serie se eliminará."
        confirmLabel="Eliminar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
