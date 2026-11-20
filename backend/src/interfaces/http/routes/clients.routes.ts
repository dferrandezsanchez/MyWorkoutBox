import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { Role, Status } from '../../../domain/shared/enums';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

export function createClientsRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);
  const adminOnly = authorizeAdmin(container);

  router.get('/', auth, async (req, res, next): Promise<void> => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const includeInactive = req.user?.role === Role.ADMIN && req.query.includeInactive === 'true';
      res.status(200).json(await container.clients.list.execute(req.user!.tenantId, q, includeInactive));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', auth, adminOnly, async (req, res, next): Promise<void> => {
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

  router.put('/:id', auth, adminOnly, async (req, res, next): Promise<void> => {
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

  router.patch('/:id/status', auth, adminOnly, async (req, res, next): Promise<void> => {
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

  router.get('/:id/export', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.exportData.execute(req.user!.tenantId, req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/anonymize', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.anonymize.execute(req.user!.tenantId, req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/goal', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.updateGoal.execute(req.user!.tenantId, req.params.id, req.body, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/measurements', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.measurements.list.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/measurements', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.measurements.create.execute(req.user!.tenantId, req.params.id, req.body, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id/measurements/:measurementId', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.measurements.update.execute(
        req.user!.tenantId,
        req.params.id,
        req.params.measurementId,
        req.body,
        req.user!.userId,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id/measurements/:measurementId', auth, async (req, res, next): Promise<void> => {
    try {
      await container.measurements.delete.execute(req.user!.tenantId, req.params.id, req.params.measurementId, req.user!.userId);
      res.status(204).send();
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

  router.get('/:id/session-options', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainingSessions.options.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/routine-plan', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.routines.getClientPlan.execute(req.user!.tenantId, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id/routine-plan', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.routines.assignClientPlan.execute(
        req.user!.tenantId,
        req.user!.userId,
        req.params.id,
        req.body ?? {},
      ));
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/routine-plan/next', auth, async (req, res, next): Promise<void> => {
    try {
      const { nextPosition } = (req.body ?? {}) as { nextPosition?: unknown };
      res.status(200).json(await container.routines.setClientPlanNext.execute(
        req.user!.tenantId,
        req.user!.userId,
        req.params.id,
        nextPosition,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id/routine-plan', auth, async (req, res, next): Promise<void> => {
    try {
      await container.routines.removeClientPlan.execute(req.user!.tenantId, req.user!.userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
