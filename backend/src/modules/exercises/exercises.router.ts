import { Router, Request, Response, NextFunction } from 'express';
import { Role, Status } from '../../types/domain';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as exercisesService from './exercises.service';

const router = Router();

// GET /exercises — any authenticated user
// ADMIN can pass ?includeInactive=true to include inactive exercises
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const includeInactive =
      req.user?.role === Role.ADMIN && req.query.includeInactive === 'true';
    const exercises = await exercisesService.listExercises(req.user!.tenantId, includeInactive);
    res.status(200).json(exercises);
  } catch (err) {
    next(err);
  }
});

// POST /exercises — ADMIN only
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exercise = await exercisesService.createExercise(req.user!.tenantId, req.body);
      res.status(201).json(exercise);
    } catch (err) {
      next(err);
    }
  }
);

// GET /exercises/:id — any authenticated user
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const exercise = await exercisesService.getExercise(req.user!.tenantId, req.params.id);
    res.status(200).json(exercise);
  } catch (err) {
    next(err);
  }
});

// PUT /exercises/:id — ADMIN only
router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exercise = await exercisesService.updateExercise(req.user!.tenantId, req.params.id, req.body);
      res.status(200).json(exercise);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /exercises/:id/status — ADMIN only
router.patch(
  '/:id/status',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: Status };
      const exercise = await exercisesService.setExerciseStatus(req.user!.tenantId, req.params.id, status);
      res.status(200).json(exercise);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
