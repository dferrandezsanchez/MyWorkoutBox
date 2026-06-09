import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Role } from '../../types/domain';
import * as trainersService from './trainers.service';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const trainers = await trainersService.listTrainers(includeInactive);
      res.status(200).json(trainers);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trainer = await trainersService.createTrainer(req.body);
      res.status(201).json(trainer);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trainer = await trainersService.getTrainer(req.params.id);
      res.status(200).json(trainer);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const trainer = await trainersService.updateTrainer(req.params.id, req.body);
      res.status(200).json(trainer);
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { active } = req.body as { active: boolean };
      const trainer = await trainersService.setTrainerActive(req.params.id, Boolean(active));
      res.status(200).json(trainer);
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id/password',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await trainersService.resetTrainerPassword(req.params.id, req.body);
      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
