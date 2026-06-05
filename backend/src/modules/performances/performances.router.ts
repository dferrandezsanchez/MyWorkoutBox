import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as performancesService from './performances.service';

const router = Router();

// GET /clients/:clientId/current-performances
// Returns the most recent PerformanceRecord for every ACTIVE exercise for the client.
router.get(
  '/clients/:clientId/current-performances',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId } = req.params;
      const result = await performancesService.getCurrentMarks(clientId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /clients/:clientId/exercises/:exerciseId/performances
// Returns the full history for a (client, exercise) pair, ordered by date DESC.
router.get(
  '/clients/:clientId/exercises/:exerciseId/performances',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId, exerciseId } = req.params;
      const records = await performancesService.getHistory(clientId, exerciseId);
      res.status(200).json(records);
    } catch (err) {
      next(err);
    }
  }
);

// POST /clients/:clientId/exercises/:exerciseId/performances
// Creates a new PerformanceRecord. trainerId is ALWAYS taken from the JWT (req.user),
// never from the request body.
router.post(
  '/clients/:clientId/exercises/:exerciseId/performances',
  authenticate,
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientId, exerciseId } = req.params;
      // trainerId is injected from the authenticated user — req.body.trainerId is ignored
      const trainerId = req.user!.userId;
      const record = await performancesService.createPerformance(
        clientId,
        exerciseId,
        trainerId,
        req.body
      );
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
