import { getAuthUser } from '@features/auth/model/auth-store';
import { LandingContent } from '@features/landing/components/LandingContent';

export default function LandingPage() {
  const user = getAuthUser();
  const appPath = user?.role === 'ADMIN' ? '/admin' : user ? '/trainer' : '/login';

  return <LandingContent appPath={appPath} authenticated={Boolean(user)} />;
}
