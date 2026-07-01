import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import {
  Moon,
  type LucideIcon,
} from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border-primary bg-primary text-primary-contrast shadow-[0_14px_34px_rgba(var(--color-primary)/0.32)] hover:bg-primary-hover',
  secondary:
    'border-border/80 bg-elevated/80 text-text-primary shadow-sm hover:bg-surface',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:bg-surface/80 hover:text-text-primary',
  danger:
    'border-red-300/50 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-[46px] rounded-lg border border-border/80 bg-elevated/90 px-3 py-2 text-sm text-text-primary shadow-sm placeholder:text-text-muted focus-ring ${className}`}
      {...props}
    />
  );
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border border-border/70 bg-elevated/85 shadow-panel backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h2>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'primary',
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: LucideIcon;
  tone?: 'primary' | 'blue' | 'green' | 'amber' | 'red';
}) {
  const toneClass = {
    primary: 'bg-primary/15 text-primary ring-primary/20',
    blue: 'bg-sky-500/15 text-sky-500 dark:text-sky-300 ring-sky-500/20',
    green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/20',
    red: 'bg-red-500/15 text-red-600 dark:text-red-300 ring-red-500/20',
  }[tone];

  return (
    <Panel className="relative overflow-hidden p-4">
      <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">{value}</p>
          {detail && <p className="mt-1 text-xs font-semibold text-text-secondary">{detail}</p>}
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClass}`}>
          <Icon size={20} />
        </span>
      </div>
    </Panel>
  );
}

export function ActionTile({
  title,
  description,
  icon: Icon,
  onClick,
  className = '',
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group min-h-[96px] rounded-xl border border-border/70 bg-surface/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/10 focus-ring ${className}`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon size={19} />
      </span>
      <span className="block text-sm font-semibold text-text-primary">{title}</span>
      {description && <span className="mt-1 block text-xs leading-5 text-text-secondary">{description}</span>}
    </button>
  );
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/70 bg-elevated/85 text-text-secondary shadow-sm"
        aria-label="Tema oscuro fijo"
        title="Tema oscuro fijo"
      >
        <Moon size={18} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 rounded-xl border border-border/70 bg-surface/70 p-1">
      <div className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-elevated px-3 text-sm font-semibold text-text-primary">
        <Moon size={16} />
        <span>Modo oscuro</span>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  const active = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        active
          ? 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300'
          : 'bg-text-muted/10 text-text-secondary ring-border'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-text-muted'
        }`}
      />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export function MetricChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-elevated/80 px-3 py-2 shadow-sm">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/80 bg-elevated/70 px-6 py-10 text-center">
      <p className="font-medium text-text-primary">{title}</p>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'danger',
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
      <div className="w-full max-w-md rounded-t-2xl border border-border/70 bg-elevated p-5 shadow-2xl sm:rounded-2xl">
        <h2 id="confirm-dialog-title" className="text-xl font-semibold text-text-primary">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>{cancelLabel}</Button>
          <Button type="button" variant={tone} onClick={onConfirm} disabled={pending}>
            {pending ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
