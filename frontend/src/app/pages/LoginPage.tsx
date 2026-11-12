import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { login, selectTenant } from '@features/auth/api/auth.api';
import { setStoredTenant, setToken } from '@features/auth/model/auth-store';
import { queryClient } from '@shared/state/query-client';
import { Button, Panel, TextInput } from '@shared/components/ui';
import { BrandLogo, BrandMark } from '@shared/components/BrandLogo';
import { BRAND, getMarketingUrl } from '@shared/config/branding';
import type { LoginSuccessResponse, TenantOption } from '@shared/types/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
  const reason = searchParams.get('reason');
  const nextPath = searchParams.get('next');

  const getSafeNextPath = () => {
    if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
      return null;
    }

    if (nextPath.startsWith('/login')) {
      return null;
    }

    return nextPath;
  };

  const completeLogin = (response: LoginSuccessResponse) => {
    queryClient.clear();
    setStoredTenant(response.tenant);
    setToken(response.token);
    navigate(getSafeNextPath() ?? (response.user.role === 'ADMIN' ? '/admin' : '/trainer'), {
      replace: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(email, password);
      if ('tenantSelectionRequired' in response) {
        setSelectionToken(response.selectionToken);
        setTenantOptions(response.tenants);
        return;
      }

      completeLogin(response);
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantSelect = async (tenantId: string) => {
    if (!selectionToken) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await selectTenant(selectionToken, tenantId);
      completeLogin(response);
    } catch {
      setError('No se pudo acceder a ese centro');
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = 'mb-1.5 block text-sm font-medium text-text-secondary';
  const marketingUrl = getMarketingUrl();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,rgb(var(--color-primary)/0.14),transparent_70%)]" />
      <BrandMark className="pointer-events-none absolute -left-24 top-1/3 hidden h-[520px] w-[640px] text-white/[0.025] lg:block" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_minmax(0,440px)] lg:gap-16 lg:px-8">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <BrandLogo size="md" />
          <div className="mt-10 hidden lg:block">
            <p className="eyebrow">Tecnología con ADN deportivo</p>
            <h1 className="mt-5 text-6xl font-bold leading-[0.95] text-text-primary xl:text-7xl">
              Entrena.
              <br />
              Registra.
              <br />
              <span className="text-primary">Evoluciona.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-text-secondary">{BRAND.description}</p>
          </div>
        </div>

        <div className="w-full">
          <Panel className="p-6 sm:p-8">
            {reason === 'session-expired' && !selectionToken && (
              <div className="mb-5 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-amber-100">
                Tu sesión ha caducado. Inicia sesión de nuevo para continuar.
              </div>
            )}

            {reason === 'auth-required' && !selectionToken && (
              <div className="mb-5 rounded-xl border border-white/[0.08] bg-background/60 px-4 py-3 text-sm text-text-secondary">
                Inicia sesión para acceder a la plataforma.
              </div>
            )}

            <div className="mb-7">
              <p className="eyebrow mb-3 flex items-center gap-2">
                <ShieldCheck size={14} />
                Acceso seguro
              </p>
              <h2 className="text-3xl font-bold text-text-primary">
                {selectionToken ? 'Selecciona centro' : 'Iniciar sesión'}
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                {selectionToken ? 'Tu usuario tiene acceso a varios centros.' : 'Accede con tu cuenta del centro.'}
              </p>
            </div>

            {selectionToken ? (
              <div>
                <div className="space-y-2">
                  {tenantOptions.map((tenant) => (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => handleTenantSelect(tenant.id)}
                      disabled={isLoading}
                      className="group flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-background/60 px-3 py-2 text-left transition-colors duration-150 hover:border-primary/40 hover:bg-primary/[0.06] disabled:opacity-60 focus-ring"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
                        <Building2 size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text-primary">{tenant.name}</span>
                        <span className="block truncate text-xs text-text-muted">{tenant.organizationName}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectionToken(null);
                    setTenantOptions([]);
                  }}
                >
                  Volver al login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label htmlFor="email" className={labelClass}>
                    Email
                  </label>
                  <TextInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                    autoComplete="email"
                    className="w-full"
                    aria-required="true"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="password" className={labelClass}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <TextInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pr-12"
                      aria-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 flex min-h-[44px] w-12 items-center justify-center rounded-r-xl text-text-muted transition-colors hover:text-text-primary focus-ring"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-center text-sm text-red-200"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 text-[15px]"
                >
                  {!isLoading && <LogIn size={17} />}
                  {isLoading ? 'Iniciando sesión...' : 'Entrar'}
                </Button>
              </form>
            )}

            {selectionToken && error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-center text-sm text-red-200"
              >
                {error}
              </p>
            )}
          </Panel>

          {marketingUrl && (
            <p className="mt-6 text-center">
              <a
                href={marketingUrl}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-text-secondary transition-colors hover:text-text-primary focus-ring"
              >
                <ArrowLeft size={16} />
                Volver a la web de {BRAND.name}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
