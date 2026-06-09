import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell, Button, TextInput } from '../components/ui';
import { useAuthUser, useChangePassword, useUpdateAuthUser } from '../hooks/useAuthUser';
import { removeToken } from '../store/auth';

export default function TrainerAccountPage() {
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useAuthUser();
  const updateMutation = useUpdateAuthUser();
  const passwordMutation = useChangePassword();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const logout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <AppShell title="Cuenta">
      <div className="mx-auto max-w-xl">
        <header className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Entrenador</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#282828]">Cuenta</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Mantén tus datos de contacto actualizados.
          </p>
        </header>

        <section className="rounded-md border border-border bg-white p-4 shadow-sm">
          {isLoading && <p className="text-text-secondary">Cargando cuenta...</p>}
          {isError && <p className="text-red-500">Error al cargar la cuenta</p>}
          {user && (
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setSaved(false);
                await updateMutation.mutateAsync({ name, email });
                setSaved(true);
              }}
            >
              <div>
                <label htmlFor="account-name" className="mb-1 block text-sm font-medium text-[#4A4A4A]">
                  Nombre
                </label>
                <TextInput
                  id="account-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="account-email" className="mb-1 block text-sm font-medium text-[#4A4A4A]">
                  Email
                </label>
                <TextInput
                  id="account-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div className="rounded-md bg-[#FAFAFA] p-3 text-sm text-text-secondary">
                Rol: {user.role === 'ADMIN' ? 'Administrador' : 'Entrenador'}
              </div>

              {saved && <p className="text-sm text-emerald-700">Datos guardados.</p>}
              {updateMutation.isError && (
                <p className="text-sm text-red-600">No se pudieron guardar los cambios.</p>
              )}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateMutation.isPending || !name.trim() || !email.trim()}
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button type="button" variant="secondary" onClick={logout}>
                  Salir
                </Button>
              </div>
            </form>
          )}
        </section>

        <section className="mt-5 rounded-md border border-border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#282828]">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Usa al menos 8 caracteres para la nueva contraseña.
          </p>

          <form
            className="mt-4 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setPasswordSaved(false);
              setPasswordError(null);

              if (newPassword.length < 8) {
                setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
                return;
              }

              if (newPassword !== confirmPassword) {
                setPasswordError('La confirmación no coincide.');
                return;
              }

              try {
                await passwordMutation.mutateAsync({ currentPassword, newPassword });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordSaved(true);
              } catch {
                setPasswordError('No se pudo cambiar la contraseña. Revisa la contraseña actual.');
              }
            }}
          >
            <div>
              <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-[#4A4A4A]">
                Contraseña actual
              </label>
              <TextInput
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full"
                autoComplete="current-password"
                required
              />
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-[#4A4A4A]">
                Nueva contraseña
              </label>
              <TextInput
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-[#4A4A4A]">
                Confirmar contraseña
              </label>
              <TextInput
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full"
                autoComplete="new-password"
                required
              />
            </div>

            {passwordSaved && (
              <p className="text-sm text-emerald-700">Contraseña actualizada.</p>
            )}
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={
                passwordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {passwordMutation.isPending ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
