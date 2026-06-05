import type { AuthUser, JwtPayload } from '../types/auth';

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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

export function getAuthUser(): AuthUser | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;

  return {
    id: payload.sub,
    // name and email are not stored in the JWT payload per the design,
    // so we return what we have; pages that need full user data should
    // call GET /auth/me and cache the result.
    name: '',
    email: '',
    role: payload.role,
  };
}

export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}
