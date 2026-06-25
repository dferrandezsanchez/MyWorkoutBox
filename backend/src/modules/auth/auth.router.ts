import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../types/domain';
import * as authService from './auth.service';

const router = Router();

// POST /auth/login — public
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/select-tenant — public, uses a short-lived tenant selection token
router.post('/select-tenant', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { selectionToken, tenantId } = req.body as { selectionToken: string; tenantId: string };
    const result = await authService.selectTenant(selectionToken, tenantId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout — requires authentication (client-side invalidation)
router.post('/logout', authenticate, (_req: Request, res: Response, next: NextFunction): void => {
  try {
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me — requires authentication
router.get('/me', authenticate, async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(
      req.user!.userId,
      req.user!.tenantId,
      req.user!.organizationId,
    );
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /auth/me — update current user's contact info
router.put('/me', authenticate, async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.updateMe(
      req.user!.userId,
      req.user!.tenantId,
      req.user!.organizationId,
      req.body,
    );
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// GET /auth/tenant — current tenant branding/context
router.get('/tenant', authenticate, async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenant = await authService.getCurrentTenant(req.user!.tenantId);
    res.status(200).json(tenant);
  } catch (err) {
    next(err);
  }
});

// PUT /auth/tenant — update current tenant branding/context, ADMIN only
router.put('/tenant', authenticate, authorize(Role.ADMIN), async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenant = await authService.updateCurrentTenant(req.user!.tenantId, req.body);
    res.status(200).json(tenant);
  } catch (err) {
    next(err);
  }
});

// PUT /auth/me/password — update current user's password
router.put('/me/password', authenticate, async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.changePassword(req.user!.userId, req.body);
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
});

export default router;
