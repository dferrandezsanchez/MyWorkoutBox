import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setToken } from '../store/auth';
import { Button, TextInput } from '../components/ui';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const labelClass = 'mb-1 block text-sm font-medium text-[#4A4A4A]';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-primary text-lg font-bold text-white shadow-sm">
            TM
          </span>
          <h1 className="text-2xl font-semibold text-[#3F3F3F]">Control de Marcas</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Gestión interna de clientes, ejercicios y progresión.
          </p>
        </div>

        <div className="rounded-md border border-border bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-[#3F3F3F]">Iniciar sesión</h2>
          <p className="mb-6 text-sm text-text-secondary">Accede con tu cuenta de entrenador.</p>

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
                className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm text-red-600"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full"
            >
              {isLoading ? 'Iniciando sesión...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
