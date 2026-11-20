import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { authenticate } from '../middleware/authenticate';

/**
 * Routine templates. Any authenticated staff member can read them; writes are
 * checked by the routine-manager policy inside each use case (ADMIN, or TRAINER
 * with canManageRoutines).
 */
export function createRoutinesRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.get('/', auth, async (req, res, next): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      res.status(200).json(await container.routines.list.execute(req.user!.tenantId, includeInactive));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.routines.create.execute(req.user!.tenantId, req.user!.userId, req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.routines.get.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.routines.update.execute(
        req.user!.tenantId,
        req.user!.userId,
        req.params.id,
        req.body ?? {},
      ));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', auth, async (req, res, next): Promise<void> => {
    try {
      const { status } = (req.body ?? {}) as { status?: unknown };
      res.status(200).json(await container.routines.setStatus.execute(req.user!.tenantId, req.user!.userId, req.params.id, status));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
