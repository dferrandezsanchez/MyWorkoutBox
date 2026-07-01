import type { ReactNode } from 'react';
import {
  Activity,
  Building2,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthUser } from '@features/auth/hooks/useAuthUser';
import { useActiveSession } from '@features/training-sessions/hooks/useTrainingSessions';
import { getAuthUser, removeToken } from '@features/auth/model/auth-store';
import { Button } from '@shared/components/ui';
import { PLATFORM_BRAND } from '@shared/config/branding';
import { useTheme } from '@shared/theme/useTheme';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function AppShell({
  children,
  title = 'Control de Marcas',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar cliente',
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = getAuthUser();
  const isAdmin = user?.role === 'ADMIN';
  const { data: fullUser } = useAuthUser();
  const { data: activeSession } = useActiveSession(!isAdmin);
  const { brand } = useTheme();
  const displayUser = fullUser ?? user;

  const logout = () => {
    removeToken();
    queryClient.clear();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, active: location.pathname === '/admin' },
        { label: 'Clientes', path: '/admin/clients', icon: Users, active: location.pathname.startsWith('/admin/clients') },
        { label: 'Entrenadores', path: '/admin/trainers', icon: User, active: location.pathname.startsWith('/admin/trainers') },
        { label: 'Ejercicios', path: '/admin/exercises', icon: Dumbbell, active: location.pathname.startsWith('/admin/exercises') },
        { label: 'Ajustes', path: '/admin/settings', icon: Settings, active: location.pathname.startsWith('/admin/settings') },
      ]
    : [
        {
          label: 'Inicio',
          path: '/trainer',
          icon: LayoutDashboard,
          active: location.pathname === '/trainer' || /^\/clients\/[^/]+$/.test(location.pathname),
        },
        {
          label: activeSession ? 'Sesión activa' : 'Nueva sesión',
          path: activeSession ? `/trainer/sessions/${activeSession.id}` : '/trainer/sessions/new',
          icon: Dumbbell,
          active: location.pathname.startsWith('/trainer/sessions'),
        },
        {
          label: 'Cuenta',
          path: '/trainer/account',
          icon: User,
          active: location.pathname.startsWith('/trainer/account'),
        },
      ];

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[282px] border-r border-white/10 bg-[#07111f]/95 px-5 py-6 text-white shadow-2xl backdrop-blur-xl lg:flex lg:flex-col dark:bg-[#07111f]/95">
        <button
          onClick={() => navigate('/')}
          className="mb-7 flex min-h-[58px] items-center gap-3 rounded-xl text-left focus-ring"
          aria-label="Ir al panel"
        >
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-xl font-black text-primary ring-1 ring-primary/25">
            {PLATFORM_BRAND.mark}
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary shadow-[0_0_18px_rgba(var(--color-primary)/0.85)]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-2xl font-bold leading-none text-white">
              {PLATFORM_BRAND.appName}
            </span>
            <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48">
              {PLATFORM_BRAND.claim}
            </span>
          </span>
        </button>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">
            <Building2 size={14} />
            Centro activo
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-white">{brand.name}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Tenant operativo
          </div>
        </div>

        <nav aria-label="Navegación principal" className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${item.path}`}
                onClick={() => navigate(item.path)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all focus-ring ${
                  item.active
                    ? 'bg-primary text-white shadow-[0_14px_30px_rgba(var(--color-primary)/0.32)]'
                    : 'text-white/68 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    item.active ? 'bg-white/14 text-white' : 'bg-white/[0.05] text-white/60'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {isAdmin ? <Activity size={18} /> : <Zap size={18} />}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                {isAdmin ? 'Control del centro' : 'Modo entrenador'}
              </p>
              <p className="text-xs text-white/50">
                {isAdmin ? 'Gestión real del MVP' : 'Listo para registrar marcas'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[282px]">
        <header className="sticky top-0 z-30 bg-background/90 px-2 pt-2 backdrop-blur-xl lg:border-b lg:border-border/60 lg:px-0 lg:pt-0">
          <div className="flex min-h-[68px] items-center justify-between gap-3 rounded-2xl border border-border/70 bg-elevated/70 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.14)] lg:min-h-[78px] lg:rounded-none lg:border-0 lg:bg-transparent lg:px-8 lg:py-3 lg:shadow-none">
            <button
              onClick={() => navigate('/')}
              className="flex min-h-[44px] min-w-0 items-center gap-3 rounded-xl text-left focus-ring lg:hidden"
              aria-label="Ir al panel"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-white shadow-[0_10px_24px_rgba(var(--color-primary)/0.34)]">
                {PLATFORM_BRAND.mark}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-text-primary">
                  {isAdmin ? title : 'Modo entrenador'}
                </span>
                <span className="block truncate text-xs text-text-secondary">{brand.name}</span>
              </span>
            </button>

            <div className="hidden min-w-0 flex-1 md:block">
              {onSearchChange && (
                <label className="relative block max-w-xl">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                    <Search size={18} />
                  </span>
                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-12 w-full rounded-xl border border-border/70 bg-elevated/80 pl-12 pr-4 text-sm text-text-primary shadow-sm placeholder:text-text-secondary focus-ring"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate(isAdmin ? '/admin/settings' : '/trainer/account')}
                aria-label="Abrir cuenta"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-text-primary text-sm font-bold text-background ring-2 ring-primary/20 focus-ring lg:h-11 lg:w-11"
              >
                {(displayUser?.name || displayUser?.email || 'U').slice(0, 2).toUpperCase()}
              </button>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-text-primary">
                  {displayUser?.name || displayUser?.email || 'Usuario'}
                </p>
                <p className="text-xs text-text-secondary">
                  {displayUser?.role === 'ADMIN' ? 'Administrador' : 'Entrenador'}
                </p>
              </div>
              <Button variant="ghost" onClick={logout} className="hidden gap-2 px-3 lg:inline-flex lg:items-center">
                <LogOut size={16} />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </header>

        <main role="main" className="px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-5">
          {children}
        </main>
      </div>

      <nav
        aria-label="Navegación móvil"
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-elevated/95 px-2 pb-[max(env(safe-area-inset-bottom),0.6rem)] pt-2 shadow-[0_-16px_42px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:hidden ${
          isAdmin ? 'grid grid-cols-5 gap-1' : 'grid grid-cols-2 gap-1'
        }`}
      >
        {isAdmin ? (
          navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`mobile-${item.label}-${item.path}`}
                onClick={() => navigate(item.path)}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors focus-ring ${
                  item.active ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })
        ) : (
          <>
            {[navItems[0], navItems[2]].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={`mobile-${item.label}-${item.path}`}
                  onClick={() => navigate(item.path)}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors focus-ring ${
                    item.active ? 'text-primary' : 'text-text-secondary hover:bg-surface'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>
    </div>
  );
}

export default AppShell;
