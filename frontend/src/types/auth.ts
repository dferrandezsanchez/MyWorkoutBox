export type Role = 'ADMIN' | 'TRAINER';

export interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: Role };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
