import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

export function createTrainersRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);
  const adminOnly = authorizeAdmin(container);

  router.get('/', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      res.status(200).json(await container.trainers.list.execute(req.user!.tenantId, includeInactive));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.trainers.create.execute(req.user!.tenantId, req.body));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainers.get.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainers.update.execute(
        req.user!.tenantId,
        req.params.id,
        req.body,
        req.user!.userId,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      const { active } = req.body as { active: boolean };
      res.status(200).json(await container.trainers.setActive.execute(
        req.user!.tenantId,
        req.params.id,
        Boolean(active),
        req.user!.userId,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/access', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainers.updateAccess.execute(
        req.user!.tenantId,
        req.user!.userId,
        req.params.id,
        req.body ?? {},
      ));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id/password', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      await container.trainers.resetPassword.execute(req.user!.tenantId, req.params.id, req.body);
      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
