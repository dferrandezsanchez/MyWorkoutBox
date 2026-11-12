import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Dialog, PageHeader, Panel } from '@shared/components/ui';

/**
 * Icon tones. Legacy names (green, blue, violet) are kept for API compatibility
 * but collapse to the STELIOS palette: teal accent, warning or neutral.
 */
type Tone = 'primary' | 'green' | 'blue' | 'amber' | 'violet' | 'muted';

const accentTone = 'border-primary/25 bg-primary/10 text-primary-soft';

const toneClasses: Record<Tone, string> = {
  primary: accentTone,
  green: accentTone,
  blue: accentTone,
  violet: accentTone,
  amber: 'border-warning/25 bg-warning/10 text-warning',
  muted: 'border-white/[0.08] bg-white/[0.03] text-text-muted',
};

/**
 * Page header for admin lists. On mobile the primary action becomes an extended
 * floating button above the bottom navigation (thumb zone); from `lg` it sits in
 * the header. It is a single element, positioned per breakpoint.
 */
export function AdminManagementHeader({ eyebrow, title, description, actionLabel, onAction }: { eyebrow: string; title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="relative">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <button
        type="button"
        onClick={onAction}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-contrast shadow-glow transition-[background-color,transform] duration-150 ease-out hover:bg-primary-hover active:scale-[0.97] focus-ring lg:absolute lg:bottom-auto lg:right-0 lg:top-0 lg:min-h-[44px] lg:text-sm lg:shadow-none"
      >
        <Plus size={20} strokeWidth={2.4} />
        {actionLabel}
      </button>
    </div>
  );
}

export interface SummaryItem {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: Tone;
}

export function ManagementSummary({ items }: { items: SummaryItem[] }) {
  return (
    <section>
      <div className="mb-2 flex items-end justify-between gap-3 px-1 sm:mb-3">
        <h2 className="eyebrow">Resumen</h2>
        <span className="text-xs text-text-muted">Datos actuales</span>
      </div>
      <Panel className={`grid divide-x divide-white/[0.06] ${items.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="min-w-0 px-3 py-3 sm:px-5 sm:py-5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-text-secondary sm:text-sm">{label}</span>
              <span className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:flex ${toneClasses[tone]}`}>
                <Icon size={15} />
              </span>
            </div>
            <strong className="tabular mt-2 block font-display text-2xl font-bold leading-none tracking-tight text-text-primary sm:mt-3 sm:text-4xl">{value}</strong>
          </div>
        ))}
      </Panel>
    </section>
  );
}

export function ManagementSection({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3 px-1">
        <h2 className="text-lg font-bold text-text-primary sm:text-xl">{title}</h2>
        <span className="tabular text-xs text-text-muted">{meta}</span>
      </div>
      <Panel className="divide-y divide-white/[0.06] overflow-hidden">{children}</Panel>
    </section>
  );
}

export function RowIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${toneClasses[tone]}`}>
      <Icon size={19} />
    </span>
  );
}

export function IconAction({ label, tone = 'default', className = '', ...props }: { label: string; tone?: 'default' | 'danger' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:scale-100 focus-ring ${
        tone === 'danger'
          ? 'border-danger/30 bg-danger/10 text-red-200 hover:border-danger/45 hover:bg-danger/15'
          : 'border-white/[0.11] bg-transparent text-text-secondary hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary-soft'
      } ${className}`}
      {...props}
    />
  );
}

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

/**
 * Secondary row actions collapsed into one "more" button that opens a sheet with
 * labelled actions: one large target on mobile instead of a cluster of icons.
 */
export function RowActionsMenu({ subject, actions }: { subject: string; actions: RowAction[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconAction label={`Más acciones de ${subject}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <MoreHorizontal size={18} />
      </IconAction>
      {open && (
        <Dialog label={`Acciones de ${subject}`} onClose={() => setOpen(false)} className="max-w-sm">
          <p className="eyebrow mb-1 text-xs text-text-muted">Acciones</p>
          <h2 className="mb-4 truncate pr-10 text-lg font-bold text-text-primary">{subject}</h2>
          <ul className="space-y-1.5">
            {actions.map(({ label, icon: Icon, onSelect, tone = 'default', disabled }) => (
              <li key={label}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setOpen(false);
                    onSelect();
                  }}
                  className={`flex min-h-[54px] w-full items-center gap-3 rounded-2xl px-4 text-left text-[15px] font-semibold transition-colors duration-150 disabled:opacity-50 focus-ring ${
                    tone === 'danger'
                      ? 'text-red-300 hover:bg-danger/10'
                      : 'text-text-primary hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon size={19} className={tone === 'danger' ? 'text-red-300' : 'text-text-muted'} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </>
  );
}
