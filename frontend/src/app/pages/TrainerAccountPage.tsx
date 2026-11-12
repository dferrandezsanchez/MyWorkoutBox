import { useEffect, useState } from 'react';
import { Check, KeyRound, UserCircle } from 'lucide-react';
import AppShell from '@app/layout/AppShell';
import { Button, PageHeader, Panel, SectionHeader, TextInput } from '@shared/components/ui';
import { useAuthUser, useChangePassword, useUpdateAuthUser } from '@features/auth/hooks/useAuthUser';

export default function AccountPage() {
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

  return (
    <AppShell title="Cuenta">
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="Perfil personal" title="Cuenta" description="Datos de contacto y seguridad." />

        <div className="space-y-5">
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
              <UserCircle size={20} />
            </span>
            <SectionHeader title="Datos personales" className="flex-1" />
          </div>
          {isLoading && <p className="mt-5 text-text-secondary">Cargando cuenta...</p>}
          {isError && <p className="mt-5 text-danger">Error al cargar la cuenta</p>}
          {user && (
            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setSaved(false);
                await updateMutation.mutateAsync({ name, email });
                setSaved(true);
              }}
            >
              <div>
                <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium text-text-secondary">
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
                <label htmlFor="account-email" className="mb-1.5 block text-sm font-medium text-text-secondary">
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

              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-background/60 px-3.5 py-3 text-sm">
                <span className="text-text-muted">Rol</span>
                <span className="font-semibold text-text-primary">{user.role === 'ADMIN' ? 'Administrador' : 'Entrenador'}</span>
              </div>

              {saved && <p role="status" className="inline-flex items-center gap-1.5 text-sm text-primary-soft"><Check size={16} />Datos guardados.</p>}
              {updateMutation.isError && (
                <p role="alert" className="text-sm text-danger">No se pudieron guardar los cambios.</p>
              )}

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateMutation.isPending || !name.trim() || !email.trim()}
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          )}
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary-soft">
              <KeyRound size={19} />
            </span>
            <SectionHeader title="Cambiar contraseña" description="Usa al menos 8 caracteres para la nueva contraseña." className="flex-1" />
          </div>

          <form
            className="mt-6 space-y-4"
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
              <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-text-secondary">
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
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-text-secondary">
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
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-text-secondary">
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
              <p role="status" className="inline-flex items-center gap-1.5 text-sm text-primary-soft"><Check size={16} />Contraseña actualizada.</p>
            )}
            {passwordError && <p role="alert" className="text-sm text-danger">{passwordError}</p>}

            <Button
              type="submit"
              variant="secondary"
              className="w-full sm:w-auto"
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
        </Panel>
        </div>
      </div>
    </AppShell>
  );
}
