export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export interface PasswordGenerator {
  /** A random, human-readable password strong enough to hand over once. */
  generate(): string;
}

export interface TokenPayload {
  sub: string;
  tenantId?: string;
  organizationId?: string;
  role?: string;
  purpose?: string;
}

export interface TokenService {
  signTenantToken(input: { userId: string; tenantId: string; organizationId: string; role: string }): string;
  signSelectionToken(userId: string): string;
  verify(token: string): TokenPayload;
}

export interface Clock {
  now(): Date;
}
