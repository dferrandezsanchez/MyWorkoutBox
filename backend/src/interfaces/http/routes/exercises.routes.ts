import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { Role, Status } from '../../../domain/shared/enums';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export function createExercisesRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.get('/', auth, async (req, res, next): Promise<void> => {
    try {
      const includeInactive = req.user?.role === Role.ADMIN && req.query.includeInactive === 'true';
      res.status(200).json(await container.exercises.list.execute(req.user!.tenantId, includeInactive));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.exercises.create.execute(req.user!.tenantId, req.body));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.exercises.get.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.exercises.update.execute(req.user!.tenantId, req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      const { status } = req.body as { status: Status };
      res.status(200).json(await container.exercises.setStatus.execute(req.user!.tenantId, req.params.id, status));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
