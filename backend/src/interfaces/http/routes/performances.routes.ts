import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { authenticate } from '../middleware/authenticate';

export function createPerformancesRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.get('/clients/:clientId/current-performances', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.performances.getCurrentMarks.execute(req.user!.tenantId, req.params.clientId));
    } catch (err) {
      next(err);
    }
  });

  router.get('/clients/:clientId/exercises/:exerciseId/performances', auth, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.performances.getHistory.execute(
        req.user!.tenantId,
        req.params.clientId,
        req.params.exerciseId,
      ));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
