import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Role, Status } from '../../types/domain';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as clientsService from './clients.service';

// ── Multer configuration ──────────────────────────────────────────────────────

const upload = multer({
  dest: 'uploads/tmp',
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, png, webp)'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ── Router ────────────────────────────────────────────────────────────────────

const router = Router();

// GET /clients — any authenticated user
router.get('/', authenticate, async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const includeInactive =
      (req as any).user?.role === Role.ADMIN && req.query.includeInactive === 'true';
    const clients = await clientsService.listClients(req.user!.tenantId, q, includeInactive);
    res.status(200).json(clients);
  } catch (err) {
    next(err);
  }
});

// POST /clients — ADMIN only
router.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await clientsService.createClient(req.user!.tenantId, req.body, req.user!.userId);
      res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  }
);

// GET /clients/:id — any authenticated user
router.get('/:id', authenticate, async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await clientsService.getClient(req.user!.tenantId, req.params.id);
    res.status(200).json(client);
  } catch (err) {
    next(err);
  }
});

// PUT /clients/:id — ADMIN only
router.put(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await clientsService.updateClient(req.user!.tenantId, req.params.id, req.body, req.user!.userId);
      res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /clients/:id/status — ADMIN only
router.patch(
  '/:id/status',
  authenticate,
  authorize(Role.ADMIN),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body as { status: Status };
      const client = await clientsService.setClientStatus(req.user!.tenantId, req.params.id, status, req.user!.userId);
      res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  }
);

// POST /clients/:id/photo — ADMIN only, with multer
router.post(
  '/:id/photo',
  authenticate,
  authorize(Role.ADMIN),
  upload.single('photo'),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Se requiere un archivo de imagen' });
        return;
      }

      const consentAt = req.body.consentAt ? new Date(req.body.consentAt as string) : new Date();
      const client = await clientsService.uploadPhoto(
        req.user!.tenantId,
        req.params.id,
        req.file,
        consentAt,
        req.user!.userId
      );
      res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  }
);

// ── GDPR routes ───────────────────────────────────────────────────────────────

// GET /clients/:id/export — ADMIN only
router.get(
  '/:id/export',
  authenticate,
  authorize(Role.ADMIN),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await clientsService.exportClient(req.user!.tenantId, req.params.id, req.user!.userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /clients/:id/anonymize — ADMIN only
router.post(
  '/:id/anonymize',
  authenticate,
  authorize(Role.ADMIN),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await clientsService.anonymizeClient(req.user!.tenantId, req.params.id, req.user!.userId);
      res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /clients/:id/photo — ADMIN only
router.delete(
  '/:id/photo',
  authenticate,
  authorize(Role.ADMIN),
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = await clientsService.deletePhoto(req.user!.tenantId, req.params.id, req.user!.userId);
      res.status(200).json(client);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
