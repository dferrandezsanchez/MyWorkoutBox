import { Router } from 'express';
import multer from 'multer';
import type { AppContainer } from '../../../main/container';
import { Role, Status } from '../../../domain/shared/enums';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

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
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function createClientsRouter(container: AppContainer): Router {
  const router = Router();
  const auth = authenticate(container.tokenService);

  router.get('/', auth, async (req, res, next): Promise<void> => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const includeInactive = req.user?.role === Role.ADMIN && req.query.includeInactive === 'true';
      res.status(200).json(await container.clients.list.execute(req.user!.tenantId, q, includeInactive));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
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

  router.put('/:id', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
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

  router.patch('/:id/status', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
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

  router.post('/:id/photo', auth, authorize(Role.ADMIN), upload.single('photo'), async (req, res, next): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Se requiere un archivo de imagen' });
        return;
      }
      const consentAt = req.body.consentAt ? new Date(req.body.consentAt as string) : new Date();
      res.status(200).json(await container.clients.uploadPhoto.execute(
        req.user!.tenantId,
        req.params.id,
        { tempPath: req.file.path, filename: req.file.filename },
        consentAt,
        req.user!.userId,
      ));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id/export', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.exportData.execute(req.user!.tenantId, req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/anonymize', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.anonymize.execute(req.user!.tenantId, req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id/photo', auth, authorize(Role.ADMIN), async (req, res, next): Promise<void> => {
    try {
      res.status(200).json(await container.clients.deletePhoto.execute(req.user!.tenantId, req.params.id, req.user!.userId));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
