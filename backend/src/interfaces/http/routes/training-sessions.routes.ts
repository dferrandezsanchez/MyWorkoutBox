import { Router } from 'express';
import type { AppContainer } from '../../../main/container';
import { authenticate } from '../middleware/authenticate';

export function createTrainingSessionsRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.use(auth);

  router.get('/active', async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainingSessions.getActive.execute(req.user!.tenantId, req.user!.userId));
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.trainingSessions.start.execute(req.user!.tenantId, req.user!.userId, req.body.clientId));
    } catch (error) { next(error); }
  });

  router.get('/:id', async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainingSessions.get.execute(req.user!.tenantId, req.user!.userId, req.params.id));
    } catch (error) { next(error); }
  });

  router.post('/:id/exercises', async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.trainingSessions.addExercise.execute(req.user!.tenantId, req.user!.userId, req.params.id, req.body.exerciseId));
    } catch (error) { next(error); }
  });

  router.delete('/:id/exercises/:sessionExerciseId', async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainingSessions.removeExercise.execute(req.user!.tenantId, req.user!.userId, req.params.id, req.params.sessionExerciseId));
    } catch (error) { next(error); }
  });

  router.post('/:id/exercises/:sessionExerciseId/series', async (req, res, next): Promise<void> => {
    try {
      res.status(201).json(await container.trainingSessions.createSeries.execute(req.user!.tenantId, req.user!.userId, req.params.id, req.params.sessionExerciseId, req.body));
    } catch (error) { next(error); }
  });

  router.put('/:id/series/:recordId', async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainingSessions.updateSeries.execute(req.user!.tenantId, req.user!.userId, req.params.id, req.params.recordId, req.body));
    } catch (error) { next(error); }
  });

  router.delete('/:id/series/:recordId', async (req, res, next): Promise<void> => {
    try {
      await container.trainingSessions.deleteSeries.execute(req.user!.tenantId, req.user!.userId, req.params.id, req.params.recordId);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  router.post('/:id/complete', async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.trainingSessions.complete.execute(req.user!.tenantId, req.user!.userId, req.params.id, req.body));
    } catch (error) { next(error); }
  });

  router.delete('/:id', async (req, res, next): Promise<void> => {
    try {
      await container.trainingSessions.discard.execute(req.user!.tenantId, req.user!.userId, req.params.id);
      res.status(204).send();
    } catch (error) { next(error); }
  });

  return router;
}
