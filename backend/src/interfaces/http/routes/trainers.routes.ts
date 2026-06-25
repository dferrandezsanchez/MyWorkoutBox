import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { Role } from '../../../domain/shared/enums';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export function createTrainersRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.get('/', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      res.status(200).json(await container.trainers.list.execute(req.user!.tenantId, includeInactive));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.trainers.create.execute(req.user!.tenantId, req.body));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainers.get.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainers.update.execute(req.user!.tenantId, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      const { active } = req.body as { active: boolean };
      res.status(200).json(await container.trainers.setActive.execute(
        req.user!.tenantId,
        req.params.id,
        Boolean(active),
      ));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id/password', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      await container.trainers.resetPassword.execute(req.user!.tenantId, req.params.id, req.body);
      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
