import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '../../../domain/shared/enums';

const FORBIDDEN_BODY = { error: 'Permisos insuficientes' };

export function authorize(allowedRole: Role): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== allowedRole) {
      res.status(403).json(FORBIDDEN_BODY);
      return;
    }
    next();
  };
}

/** Minimal port the admin guard needs: the current role of a user in a tenant. */
export interface ActiveRoleResolver {
  auth: { getActiveRole: { execute(userId: string, tenantId: string): Promise<Role | null> } };
}

/**
 * ADMIN guard that re-checks the active membership role in the tenant instead of
 * trusting the JWT role, so promotions and demotions take effect immediately.
 */
export function authorizeAdmin(container: ActiveRoleResolver): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(403).json(FORBIDDEN_BODY);
      return;
    }
    try {
      const role = await container.auth.getActiveRole.execute(req.user.userId, req.user.tenantId);
      if (role !== Role.ADMIN) {
        res.status(403).json(FORBIDDEN_BODY);
        return;
      }
      req.user.role = Role.ADMIN;
      next();
    } catch (err) {
      next(err);
    }
  };
}
