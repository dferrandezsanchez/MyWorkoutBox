import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { Role } from '../../../domain/shared/enums';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export function createAuthRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.post('/login', async (req, res, next): Promise<void> => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      res.status(200).json(await container.auth.login.execute(email, password));
    } catch (err) {
      next(err);
    }
  });

  router.post('/select-tenant', async (req, res, next): Promise<void> => {
    try {
      const { selectionToken, tenantId } = req.body as { selectionToken: string; tenantId: string };
      res.status(200).json(await container.auth.selectTenant.execute(selectionToken, tenantId));
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', auth, (_req, res) => {
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  });

  router.get('/me', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.auth.getMe.execute(
        req.user!.userId,
        req.user!.tenantId,
        req.user!.organizationId,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.put('/me', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.auth.updateMe.execute(
        req.user!.userId,
        req.user!.tenantId,
        req.user!.organizationId,
        req.body,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.get('/tenant', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.auth.getCurrentTenant.execute(req.user!.tenantId));
    } catch (err) {
      next(err);
    }
  });

  router.put('/tenant', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.auth.updateCurrentTenant.execute(req.user!.tenantId, req.body));
    } catch (err) {
      next(err);
    }
  });

  router.put('/me/password', auth, async (req, res, next): Promise<void> => {
    try {
      await container.auth.changePassword.execute(req.user!.userId, req.body);
      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
