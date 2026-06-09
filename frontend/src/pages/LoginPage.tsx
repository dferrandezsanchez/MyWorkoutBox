import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { login } from '../api/auth';
import { setToken } from '../store/auth';
import { Button, TextInput, ThemeToggle } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { brand } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login(email, password);
      setToken(response.token);
      navigate(response.user.role === 'ADMIN' ? '/admin' : '/trainer');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = 'mb-1 block text-sm font-medium text-text-primary';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-primary text-lg font-bold text-white shadow-sm">
            {brand.mark}
          </span>
          <h1 className="text-2xl font-semibold text-text-primary">{brand.appName}</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {brand.description}
          </p>
        </div>

        <div className="rounded-md border border-border bg-elevated p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h2 className="mb-1 text-lg font-semibold text-text-primary">Iniciar sesión</h2>
              <p className="text-sm text-text-secondary">Accede con tu cuenta de entrenador.</p>
            </div>
            <ThemeToggle compact />
          </div>

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
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full"
                aria-required="true"
              />
            </div>

            {error && (
              <p
              role="alert"
                className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="inline-flex w-full items-center justify-center gap-2"
            >
              {!isLoading && <LogIn size={17} />}
              {isLoading ? 'Iniciando sesión...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
