import type { Role } from './domain';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        organizationId: string;
        role: Role;
      };
    }
  }
}

export {};
