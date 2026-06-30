import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { Role, Status } from '../../../domain/shared/enums';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export function createClientsRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.get('/', auth, async (req, res, next): Promise<void> => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const includeInactive = req.user?.role === Role.ADMIN && req.query.includeInactive === 'true';
      res.status(200).json(await container.clients.list.execute(req.user!.tenantId, q, includeInactive));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.clients.create.execute(req.user!.tenantId, req.body, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.get.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.update.execute(
        req.user!.tenantId,
        req.params.id,
        req.body,
        req.user!.userId,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      const { status } = req.body as { status: Status };
      res.status(200).json(await container.clients.setStatus.execute(
        req.user!.tenantId,
        req.params.id,
        status,
        req.user!.userId,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/export', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.exportData.execute(req.user!.tenantId, req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/anonymize', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.anonymize.execute(req.user!.tenantId, req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/training-sessions', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainingSessions.listByClient.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
