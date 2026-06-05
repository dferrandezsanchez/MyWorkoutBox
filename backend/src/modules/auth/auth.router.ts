import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as authService from './auth.service';

const router = Router();

// POST /auth/login — public
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout — requires authentication (client-side invalidation)
router.post('/logout', authenticate, (_req: Request, res: Response, next: NextFunction): void => {
  try {
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me — requires authentication
router.get('/me', authenticate, async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
