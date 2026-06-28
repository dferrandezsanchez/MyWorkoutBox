import { describe, expect, it, vi } from 'vitest';
import { authenticate } from './authenticate';
import { Role } from '../../../domain/shared/enums';
import { unauthenticated } from '../../../domain/shared/errors';
import type { TokenService } from '../../../application/ports';

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function createTokenService(verify: TokenService['verify']): TokenService {
  return {
    signTenantToken: vi.fn(),
    signSelectionToken: vi.fn(),
    verify,
  };
}

describe('authenticate middleware', () => {
  it('rejects requests without a bearer token', () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = vi.fn();

    authenticate(createTokenService(vi.fn()))(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects tokens without the required tenant payload', () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = createResponse();
    const next = vi.fn();

    authenticate(createTokenService(() => ({ sub: 'user-id' })))(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the authenticated user context and continues', () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = createResponse();
    const next = vi.fn();

    authenticate(
      createTokenService(() => ({
        sub: 'user-id',
        tenantId: 'tenant-id',
        organizationId: 'organization-id',
        role: Role.ADMIN,
      })),
    )(req as any, res as any, next);

    expect(req).toHaveProperty('user', {
      userId: 'user-id',
      tenantId: 'tenant-id',
      organizationId: 'organization-id',
      role: Role.ADMIN,
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns a specific message for expired sessions', () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = createResponse();
    const next = vi.fn();

    authenticate(createTokenService(() => {
      throw unauthenticated('Sesión expirada');
    }))(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Sesión expirada' });
    expect(next).not.toHaveBeenCalled();
  });
});
