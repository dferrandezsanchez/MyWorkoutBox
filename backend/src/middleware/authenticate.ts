import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Role } from '../types/domain';

interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

export function authenticate(req: any, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Error interno del servidor' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      userId: payload.sub,
      role: payload.role,
    };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ error: 'Sesión expirada' });
    } else {
      res.status(401).json({ error: 'No autenticado' });
    }
  }
}
