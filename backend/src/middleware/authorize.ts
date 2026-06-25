import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '../types/domain';

export function authorize(allowedRole: Role): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== allowedRole) {
      res.status(403).json({ error: 'Permisos insuficientes' });
      return;
    }
    next();
  };
}
