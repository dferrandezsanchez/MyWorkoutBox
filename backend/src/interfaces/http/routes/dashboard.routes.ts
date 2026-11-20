import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { authenticate } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';

export function createDashboardRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);
  const adminOnly = authorizeAdmin(container);

  router.get('/overview', auth, adminOnly, async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.dashboard.overview.execute(req.user!.tenantId));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
