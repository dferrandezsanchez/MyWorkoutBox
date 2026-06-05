import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../types/auth';
import { getToken, removeToken } from '../store/auth';

interface JwtPayload {
  sub: string;
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
  const token = getToken();

  // No token → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const payload = decodeJwtPayload(token);

  // Invalid token → redirect to login
  if (!payload) {
    removeToken();
    return <Navigate to="/login" replace />;
  }

  // Expired token → remove and redirect to login
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    removeToken();
    return <Navigate to="/login" replace />;
  }

  // Role check → redirect to home if insufficient role
  if (requiredRole && payload.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
