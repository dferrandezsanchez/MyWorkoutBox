import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Role } from '../../../domain/shared/enums';

export function authorize(allowedRole: Role): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== allowedRole) {
      res.status(403).json({ error: 'Permisos insuficientes' });
      return;
    }
    next();
  };
}
