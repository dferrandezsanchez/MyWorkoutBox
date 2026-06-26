import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dumbbell } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import {
  ActionTile,
  Button,
  EmptyState,
  MetricCard,
  MetricChip,
  MobileActionButton,
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
    const onMobileClick = vi.fn();

    render(
      <>
        <ActionTile title="Registrar marca" description="Nueva marca" icon={Dumbbell} onClick={onTileClick} />
        <MobileActionButton label="Nueva marca" onClick={onMobileClick} />
      </>,
    );

    await user.click(screen.getByRole('button', { name: /Registrar marca/ }));
    await user.click(screen.getByRole('button', { name: 'Nueva marca' }));

    expect(onTileClick).toHaveBeenCalledOnce();
    expect(onMobileClick).toHaveBeenCalledOnce();
  });

  it('updates theme preference from compact and segmented theme toggles', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeToggle compact />
        <ThemeToggle />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: /Cambiar a modo/ }));
    expect(localStorage.getItem('mwb_theme_preference')).toMatch(/dark|light/);

    await user.click(screen.getByRole('button', { name: 'Claro' }));
    expect(localStorage.getItem('mwb_theme_preference')).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Oscuro' }));
    expect(localStorage.getItem('mwb_theme_preference')).toBe('dark');
  });
});
