import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { Button, Panel } from '@shared/components/ui';

type Tone = 'primary' | 'green' | 'blue' | 'amber' | 'violet';

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary/14 text-primary ring-primary/20',
  green: 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/20',
  blue: 'bg-sky-500/12 text-sky-300 ring-sky-500/20',
  amber: 'bg-amber-500/12 text-amber-300 ring-amber-500/20',
  violet: 'bg-violet-500/12 text-violet-300 ring-violet-500/20',
};

export function AdminManagementHeader({ eyebrow, title, description, actionLabel, onAction }: { eyebrow: string; title: string; description: string; actionLabel: string; onAction: () => void }) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold text-text-primary">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p></div><Button variant="primary" onClick={onAction} className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"><Plus size={18} />{actionLabel}</Button></header>;
}

export interface SummaryItem {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone: Tone;
}

export function ManagementSummary({ items }: { items: SummaryItem[] }) {
  return <section><div className="mb-3 flex items-end justify-between gap-3 px-1"><h2 className="text-base font-semibold text-text-primary sm:text-lg">Resumen</h2><span className="text-xs text-text-muted">Datos actuales</span></div><Panel className={`grid overflow-hidden ${items.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>{items.map(({ label, value, icon: Icon, tone }) => <div key={label} className="grid grid-rows-[32px_28px_34px] justify-items-center border-r border-border/70 px-1 py-3 text-center last:border-r-0 sm:grid-rows-[40px_32px_40px] sm:p-4"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 sm:h-10 sm:w-10 sm:rounded-xl ${toneClasses[tone]}`}><Icon size={18} /></span><span className="flex items-end text-[11px] text-text-secondary sm:text-sm">{label}</span><strong className="self-end text-2xl font-semibold text-text-primary sm:text-3xl">{value}</strong></div>)}</Panel></section>;
}

export function ManagementSection({ title, meta, children }: { title: string; meta: string; children: ReactNode }) {
  return <section><div className="mb-3 flex items-end justify-between gap-3 px-1"><h2 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h2><span className="text-xs text-text-muted">{meta}</span></div><Panel className="overflow-hidden">{children}</Panel></section>;
}

export function RowIcon({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${toneClasses[tone]}`}><Icon size={20} /></span>;
}

export function IconAction({ label, tone = 'default', className = '', ...props }: { label: string; tone?: 'default' | 'danger' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" title={label} aria-label={label} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors focus-ring ${tone === 'danger' ? 'border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'border-border/70 bg-surface/70 text-text-secondary hover:border-primary/35 hover:text-primary'} ${className}`} {...props} />;
}
