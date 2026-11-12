import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border-primary bg-primary text-primary-contrast hover:border-primary-hover hover:bg-primary-hover',
  secondary:
    'border-white/[0.11] bg-transparent text-text-primary hover:border-white/20 hover:bg-white/[0.04]',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:bg-white/[0.05] hover:text-text-primary',
  danger:
    'border-danger/30 bg-danger/10 text-red-200 hover:border-danger/45 hover:bg-danger/15',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-[44px] rounded-full border px-5 py-2 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-ring ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-[46px] rounded-xl border border-border bg-background/60 px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 ${className}`}
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
    <section className={`min-w-0 rounded-2xl border border-white/[0.08] bg-surface ${className}`}>
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
        <h2 className="text-lg font-bold text-text-primary sm:text-xl">{title}</h2>
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
    primary: 'text-primary-soft',
    blue: 'text-primary-soft',
    green: 'text-success',
    amber: 'text-warning',
    red: 'text-danger',
  }[tone];

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-background/60 ${toneClass}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="tabular mt-4 font-display text-4xl font-bold leading-none tracking-tight text-text-primary">{value}</p>
      {detail && <p className="mt-2 text-xs text-text-muted">{detail}</p>}
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
      className={`group min-h-[96px] rounded-2xl border border-white/[0.08] bg-surface p-4 text-left transition-[border-color,background-color] duration-150 ease-out hover:border-primary/40 hover:bg-primary/[0.06] focus-ring ${className}`}
    >
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-contrast">
        <Icon size={19} />
      </span>
      <span className="block font-display text-base font-bold text-text-primary">{title}</span>
      {description && <span className="mt-1 block text-xs leading-5 text-text-secondary">{description}</span>}
    </button>
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
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="eyebrow mb-3 flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-primary/60" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold text-text-primary sm:text-[2.75rem] sm:leading-[1.05]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">{description}</p>}
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
          ? 'bg-primary/10 text-primary-soft ring-primary/25'
          : 'bg-white/[0.04] text-text-secondary ring-white/[0.08]'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? 'bg-primary' : 'bg-text-muted'
        }`}
      />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export function MetricChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-background/60 px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="tabular font-display text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.12] bg-surface/60 px-6 py-10 text-center">
      <p className="font-display font-bold text-text-primary">{title}</p>
      {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
    </div>
  );
}

/** Visual grab handle shown on mobile bottom sheets. */
function SheetHandle() {
  return <span aria-hidden="true" className="mx-auto -mt-1 mb-4 block h-1 w-10 rounded-full bg-white/15 sm:hidden" />;
}

export function Dialog({
  label,
  onClose,
  children,
  className = '',
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
    // Mount-only: focusing and attaching the Escape listener must not re-run
    // when a parent passes a new onClose reference on every render (that
    // previously stole focus back from inputs inside the dialog on each
    // keystroke). onCloseRef always calls the latest onClose regardless.
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`pb-safe relative max-h-[92dvh] w-full animate-sheet-in overflow-y-auto overscroll-contain rounded-t-3xl border border-white/[0.08] bg-surface p-5 shadow-panel outline-none sm:animate-pop-in sm:rounded-3xl sm:p-6 ${className}`}
      >
        <SheetHandle />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary focus-ring"
        >
          <X size={18} />
        </button>
        {children}
      </div>
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
    <div className="fixed inset-0 z-[60] flex animate-fade-in items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
      <div className="pb-safe w-full max-w-md animate-sheet-in rounded-t-3xl border border-white/[0.08] bg-surface p-5 shadow-panel sm:animate-pop-in sm:rounded-3xl sm:p-6">
        <SheetHandle />
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-text-primary">{title}</h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>{cancelLabel}</Button>
          <Button type="button" variant={tone} onClick={onConfirm} disabled={pending}>
            {pending ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
