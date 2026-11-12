import { useState, type ReactNode } from 'react';
import {
  Building2,
  Dumbbell,
  LayoutDashboard,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser } from '@features/auth/hooks/useAuthUser';
import { useLogout } from '@features/auth/hooks/useLogout';
import { useActiveSession } from '@features/training-sessions/hooks/useTrainingSessions';
import { getAuthUser } from '@features/auth/model/auth-store';
import { ConfirmDialog } from '@shared/components/ui';
import { BrandLogo, BrandMark } from '@shared/components/BrandLogo';
import { BRAND } from '@shared/config/branding';
import { useActiveTenant } from '@shared/tenant/useActiveTenant';
import { getAppMode, getModePath } from '@app/mode/app-mode';
import { UserMenu } from '@app/layout/UserMenu';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function AppShell({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar cliente',
}: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  const mode = getAppMode(`${location.pathname}${location.search}`);
  const isAdminMode = mode === 'admin';
  const modeHome = getModePath(mode);
  const { data: fullUser } = useAuthUser();
  const { data: activeSession } = useActiveSession();
  const { tenant } = useActiveTenant();
  const logout = useLogout();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const displayUser = fullUser ?? user;

  const requestLogout = () => {
    if (activeSession) {
      setLogoutConfirmationOpen(true);
      return;
    }
    void logout.execute();
  };

  const navItems = isAdminMode
    ? [
        { label: 'Dashboard', mobileLabel: 'Inicio', path: '/admin', icon: LayoutDashboard, active: location.pathname === '/admin' },
        { label: 'Clientes', path: '/admin/clients', icon: Users, active: location.pathname.startsWith('/admin/clients') },
        { label: 'Entrenadores', mobileLabel: 'Equipo', path: '/admin/trainers', icon: User, active: location.pathname.startsWith('/admin/trainers') },
        { label: 'Ejercicios', path: '/admin/exercises', icon: Dumbbell, active: location.pathname.startsWith('/admin/exercises') },
        { label: 'Ajustes', path: '/admin/settings', icon: Settings, active: location.pathname.startsWith('/admin/settings') },
      ]
    : [
        {
          label: 'Inicio',
          path: '/trainer',
          icon: LayoutDashboard,
          active: location.pathname === '/trainer',
        },
        {
          label: 'Clientes',
          path: '/trainer/clients',
          icon: Users,
          active: location.pathname === '/trainer/clients' || location.pathname.startsWith('/clients/'),
        },
        {
          label: activeSession ? 'Sesión activa' : 'Nueva sesión',
          mobileLabel: activeSession ? 'En curso' : 'Entrenar',
          primary: true,
          path: activeSession ? `/trainer/sessions/${activeSession.id}` : '/trainer/sessions/new',
          icon: Dumbbell,
          active: location.pathname.startsWith('/trainer/sessions'),
        },
        {
          label: 'Cuenta',
          path: '/account',
          icon: User,
          active: location.pathname === '/account',
        },
      ];

  const initials = (displayUser?.name || displayUser?.email || 'U').slice(0, 2).toUpperCase();
  const tenantName = tenant?.name ?? '';

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <a
        href="#contenido"
        className="sr-only z-[100] rounded-full bg-primary px-4 py-2 font-semibold text-primary-contrast focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-white/[0.06] bg-[#080B10] px-4 py-6 lg:flex">
        <button
          onClick={() => navigate(modeHome)}
          className="mb-8 flex min-h-[44px] items-center rounded-xl px-2 text-left focus-ring"
          aria-label="Ir al panel"
        >
          <BrandLogo size="md" />
        </button>

        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-surface p-3.5">
          <p className="eyebrow text-xs text-text-muted">Centro</p>
          <p className="mt-1.5 flex items-center gap-2 truncate text-sm font-semibold text-text-primary">
            <Building2 size={15} className="shrink-0 text-primary-soft" />
            <span className="truncate">{tenantName || 'Sin centro'}</span>
          </p>
          <p className="mt-2 text-xs text-text-muted">{isAdminMode ? 'Modo administración' : 'Modo entrenador'}</p>
        </div>

        <nav aria-label="Navegación principal" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.label}-${item.path}`}
                onClick={() => navigate(item.path)}
                aria-current={item.active ? 'page' : undefined}
                className={`relative flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors duration-150 focus-ring ${
                  item.active
                    ? 'bg-primary/10 text-text-primary'
                    : 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary'
                }`}
              >
                {item.active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />}
                <Icon size={18} strokeWidth={2.1} className={item.active ? 'text-primary-soft' : 'text-text-muted'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {activeSession && !isAdminMode && (
          <button
            type="button"
            onClick={() => navigate(`/trainer/sessions/${activeSession.id}`)}
            className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.08] p-3.5 text-left transition-colors hover:border-primary/50 focus-ring"
          >
            <span className="eyebrow flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              En curso
            </span>
            <span className="mt-1.5 block truncate text-sm font-semibold text-text-primary">
              {activeSession.client ? `${activeSession.client.firstName} ${activeSession.client.lastName}` : 'Sesión activa'}
            </span>
          </button>
        )}

        <p className="mt-auto px-2 text-xs text-text-muted">{BRAND.claim}</p>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="pt-safe sticky top-0 z-30 border-b border-white/[0.06] bg-background/90 backdrop-blur-xl">
          <div className="flex min-h-[64px] items-center justify-between gap-3 px-4 lg:min-h-[72px] lg:px-8">
            <button
              onClick={() => navigate(modeHome)}
              className="flex min-h-[44px] min-w-0 items-center gap-3 rounded-xl text-left focus-ring lg:hidden"
              aria-label="Ir al panel"
            >
              <BrandMark className="h-6 w-7 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-bold tracking-[0.18em] text-text-primary">{BRAND.name}</span>
                <span className="block truncate text-xs text-text-secondary">{tenantName}</span>
              </span>
            </button>

            <div className="hidden min-w-0 flex-1 md:block">
              {onSearchChange && (
                <label className="relative block max-w-xl">
                  <span className="sr-only">{searchPlaceholder}</span>
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <Search size={18} />
                  </span>
                  <input
                    type="search"
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-11 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={() => setUserMenuOpen(true)}
              aria-label="Abrir cuenta"
              className="flex min-h-[44px] items-center gap-3 rounded-full py-1 pl-1 pr-1 text-left transition-colors hover:bg-white/[0.04] focus-ring sm:pr-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-display text-sm font-bold text-primary-soft">
                {initials}
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold text-text-primary">
                  {displayUser?.name || displayUser?.email || 'Usuario'}
                </span>
                <span className="block text-xs text-text-muted">
                  {displayUser?.role === 'ADMIN' ? 'Administrador' : 'Entrenador'}
                </span>
              </span>
            </button>
          </div>
        </header>

        <main id="contenido" tabIndex={-1} role="main" className="pb-mobile-nav mx-auto max-w-[1280px] px-4 pt-5 outline-none lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Navegación móvil"
        className={`pb-safe fixed inset-x-0 bottom-0 z-40 grid gap-1 border-t border-white/[0.08] bg-[#080B10]/95 px-2 pt-1.5 backdrop-blur-xl lg:hidden ${
          isAdminMode ? 'grid-cols-5' : 'grid-cols-3'
        }`}
      >
        {/* Trainer: Inicio · Entrenar · Clientes, with the training action centred in the thumb zone. Account lives in the header avatar. */}
        {(isAdminMode ? navItems : [navItems[0], navItems[2], navItems[1]]).map((item) => {
          const Icon = item.icon;
          const label = item.mobileLabel ?? item.label;

          if ('primary' in item && item.primary) {
            return (
              <button
                key={`mobile-${item.path}`}
                onClick={() => navigate(item.path)}
                aria-current={item.active ? 'page' : undefined}
                aria-label={item.label}
                className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-primary-soft focus-ring"
              >
                <span className="relative flex h-11 w-11 -mt-4 items-center justify-center rounded-full bg-primary text-primary-contrast shadow-glow ring-4 ring-[#080B10] transition-transform duration-150 active:scale-95">
                  <Icon size={20} strokeWidth={2.4} />
                  {activeSession && (
                    <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary-soft ring-2 ring-[#080B10]" />
                  )}
                </span>
                <span>{label}</span>
              </button>
            );
          }

          return (
            <button
              key={`mobile-${item.label}-${item.path}`}
              onClick={() => navigate(item.path)}
              aria-current={item.active ? 'page' : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors duration-150 focus-ring ${
                item.active ? 'text-primary-soft' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150 ${item.active ? 'bg-primary/15' : ''}`}>
                <Icon size={18} />
              </span>
              <span className="max-w-full truncate px-0.5">{label}</span>
            </button>
          );
        })}
      </nav>

      {displayUser && (
        <UserMenu
          open={userMenuOpen}
          user={displayUser}
          tenantName={tenantName}
          mode={mode}
          onClose={() => setUserMenuOpen(false)}
          onNavigate={navigate}
          onLogout={requestLogout}
        />
      )}

      {logoutConfirmationOpen && (
        <ConfirmDialog
          title="Hay un entrenamiento en curso"
          description="La sesión permanecerá guardada, pero tendrás que volver a iniciar sesión para continuarla."
          confirmLabel="Cerrar sesión"
          pending={logout.isPending}
          onCancel={() => setLogoutConfirmationOpen(false)}
          onConfirm={() => void logout.execute()}
        />
      )}
    </div>
  );
}

export default AppShell;
