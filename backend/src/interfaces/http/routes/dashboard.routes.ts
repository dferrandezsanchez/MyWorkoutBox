import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { Role } from '../../../domain/shared/enums';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

export function createDashboardRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.get('/overview', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.dashboard.overview.execute(req.user!.tenantId));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
