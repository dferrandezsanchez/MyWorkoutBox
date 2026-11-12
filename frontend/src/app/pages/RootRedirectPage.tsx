import { Navigate } from 'react-router-dom';
import { getAuthUser } from '@features/auth/model/auth-store';

export default function RootRedirectPage() {
  const user = getAuthUser();
  const target = user?.role === 'ADMIN' ? '/admin' : user ? '/trainer' : '/login';

  return <Navigate to={target} replace />;
}
