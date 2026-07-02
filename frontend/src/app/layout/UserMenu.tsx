import { useEffect, useRef } from 'react';
import { Building2, Dumbbell, LayoutDashboard, LogOut, Settings, UserRound, X } from 'lucide-react';
import type { AppMode } from '@app/mode/app-mode';
import { getAvailableModes, getModePath } from '@app/mode/app-mode';
import type { AuthUser } from '@shared/types/auth';

interface UserMenuProps {
  open: boolean;
  user: AuthUser;
  tenantName: string;
  mode: AppMode;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function UserMenu({ open, user, tenantName, mode, onClose, onNavigate, onLogout }: UserMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const modes = getAvailableModes(user.role);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const goTo = (path: string) => {
    onClose();
    onNavigate(path);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:absolute lg:inset-auto lg:right-8 lg:top-[70px] lg:bg-transparent lg:backdrop-blur-none" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menú de usuario" className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-border bg-elevated p-5 shadow-2xl outline-none lg:relative lg:w-[360px] lg:rounded-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-text-primary">{user.name || user.email}</p>
            {user.email && <p className="truncate text-sm text-text-secondary">{user.email}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar menú" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary hover:bg-surface focus-ring"><X size={20} /></button>
        </div>

        <div className="space-y-2 rounded-2xl border border-border/70 bg-surface/60 p-3 text-sm">
          <p className="flex items-center gap-2 text-text-secondary"><Building2 size={16} className="text-primary" /><span className="truncate">{tenantName}</span></p>
          <p className="flex items-center gap-2 text-text-secondary"><UserRound size={16} className="text-primary" />Modo {mode === 'admin' ? 'administración' : 'entrenador'}</p>
        </div>

        {modes.length > 1 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Modo de trabajo</p>
            <div className="grid grid-cols-2 gap-2">
              {modes.map((availableMode) => {
                const Icon = availableMode === 'admin' ? LayoutDashboard : Dumbbell;
                const active = availableMode === mode;
                return <button key={availableMode} type="button" onClick={() => !active && goTo(getModePath(availableMode))} aria-current={active ? 'page' : undefined} className={`flex min-h-[52px] items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors focus-ring ${active ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border/70 bg-surface text-text-secondary hover:text-text-primary'}`}><Icon size={17} />{availableMode === 'admin' ? 'Admin' : 'Entrenador'}</button>;
              })}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-1 border-t border-border/70 pt-4">
          <button type="button" onClick={() => goTo(`/account?mode=${mode}`)} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-text-primary hover:bg-surface focus-ring"><Settings size={18} className="text-text-secondary" />Cuenta y seguridad</button>
          <button type="button" onClick={() => { onClose(); onLogout(); }} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10 focus-ring"><LogOut size={18} />Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
