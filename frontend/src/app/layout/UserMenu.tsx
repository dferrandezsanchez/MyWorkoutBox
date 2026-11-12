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
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm lg:absolute lg:inset-auto lg:right-8 lg:top-[66px] lg:bg-transparent lg:backdrop-blur-none" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menú de usuario" className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-white/[0.08] bg-surface p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-panel outline-none lg:relative lg:w-[360px] lg:rounded-3xl lg:pb-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold text-text-primary">{user.name || user.email}</p>
            {user.email && <p className="truncate text-sm text-text-secondary">{user.email}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar menú" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/[0.05] hover:text-text-primary focus-ring"><X size={20} /></button>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/[0.08] bg-background/60 p-3 text-sm">
          <p className="flex items-center gap-2 text-text-secondary"><Building2 size={16} className="shrink-0 text-primary-soft" /><span className="truncate">{tenantName}</span></p>
          <p className="flex items-center gap-2 text-text-secondary"><UserRound size={16} className="shrink-0 text-primary-soft" />Modo {mode === 'admin' ? 'administración' : 'entrenador'}</p>
        </div>

        {modes.length > 1 && (
          <div className="mt-5">
            <p className="eyebrow mb-2 text-xs text-text-muted">Modo de trabajo</p>
            <div className="grid grid-cols-2 gap-2">
              {modes.map((availableMode) => {
                const Icon = availableMode === 'admin' ? LayoutDashboard : Dumbbell;
                const active = availableMode === mode;
                return <button key={availableMode} type="button" onClick={() => !active && goTo(getModePath(availableMode))} aria-current={active ? 'page' : undefined} className={`flex min-h-[52px] items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors duration-150 focus-ring ${active ? 'border-primary bg-primary text-primary-contrast' : 'border-white/[0.11] text-text-secondary hover:border-white/20 hover:text-text-primary'}`}><Icon size={17} />{availableMode === 'admin' ? 'Admin' : 'Entrenador'}</button>;
              })}
            </div>
          </div>
        )}

        <div className="mt-5 space-y-1 border-t border-white/[0.08] pt-4">
          <button type="button" onClick={() => goTo(`/account?mode=${mode}`)} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-white/[0.04] focus-ring"><Settings size={18} className="text-text-secondary" />Cuenta y seguridad</button>
          <button type="button" onClick={() => { onClose(); onLogout(); }} className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-red-300 transition-colors hover:bg-danger/10 focus-ring"><LogOut size={18} />Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}
