import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '@shared/types/auth';
import { getToken, removeToken } from '@features/auth/model/auth-store';
import { queryClient } from '@shared/state/query-client';

interface JwtPayload {
  sub: string;
  tenantId: string;
  organizationId: string;
  role: Role;
  iat: number;
  exp: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded = payloadBase64.padEnd(
      payloadBase64.length + ((4 - (payloadBase64.length % 4)) % 4),
      '='
    );

    const jsonStr = atob(padded);
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
}

interface ProtectedRouteProps {
  requiredRole?: Role;
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const token = getToken();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const loginPath = `/login?reason=auth-required&next=${encodeURIComponent(currentPath)}`;

  // No token → redirect to login
  if (!token) {
    return <Navigate to={loginPath} replace />;
  }

  const payload = decodeJwtPayload(token);

  // Invalid token → redirect to login
  if (!payload || !payload.tenantId || !payload.organizationId) {
    removeToken();
    queryClient.clear();
    return <Navigate to={`/login?reason=session-expired&next=${encodeURIComponent(currentPath)}`} replace />;
  }

  // Expired token → remove and redirect to login
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    removeToken();
    queryClient.clear();
    return <Navigate to={`/login?reason=session-expired&next=${encodeURIComponent(currentPath)}`} replace />;
  }

  // Role check → redirect to home if insufficient role
  if (requiredRole && payload.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
