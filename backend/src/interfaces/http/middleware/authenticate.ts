import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { TokenService } from '../../../application/ports';
import { Role } from '../../../domain/shared/enums';
import { ApplicationError } from '../../../domain/shared/errors';

export function authenticate(tokenService: TokenService): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    try {
      const payload = tokenService.verify(authHeader.slice(7));
      if (!payload.sub || !payload.tenantId || !payload.organizationId || !payload.role) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      req.user = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        organizationId: payload.organizationId,
        role: payload.role as Role,
      };
      next();
    } catch (err) {
      if (err instanceof ApplicationError && err.message === 'Sesión expirada') {
        res.status(401).json({ error: 'Sesión expirada' });
        return;
      }
      res.status(401).json({ error: 'No autenticado' });
    }
  };
}
