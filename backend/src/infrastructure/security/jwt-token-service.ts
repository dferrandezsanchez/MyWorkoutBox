import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { internal, unauthenticated } from '../../domain/shared/errors';
import type { TokenPayload, TokenService } from '../../application/ports';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string | undefined,
    private readonly expiresIn = '8h',
  ) {}

  signTenantToken(input: { userId: string; tenantId: string; organizationId: string; role: string }): string {
    return jwt.sign(
      { sub: input.userId, tenantId: input.tenantId, organizationId: input.organizationId, role: input.role },
      this.getSecret(),
      { expiresIn: this.expiresIn } as jwt.SignOptions,
    );
  }

  signSelectionToken(userId: string): string {
    return jwt.sign(
      { sub: userId, purpose: 'tenant-selection' },
      this.getSecret(),
      { expiresIn: '10m' } as jwt.SignOptions,
    );
  }

  verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.getSecret()) as TokenPayload;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw unauthenticated('Sesión expirada');
      }
      throw unauthenticated();
    }
  }

  private getSecret(): string {
    if (!this.secret) throw internal();
    return this.secret;
  }
}
