export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
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

export interface UploadedPhoto {
  tempPath: string;
  filename: string;
}

export interface PhotoStorage {
  persistClientPhoto(file: UploadedPhoto): Promise<string>;
  deleteByUrl(url: string): Promise<void>;
}

export interface Clock {
  now(): Date;
}
