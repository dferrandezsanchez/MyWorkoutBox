import type { ErrorRequestHandler } from 'express';
import { ApplicationError } from '../../domain/shared/errors';

const STATUS_BY_CODE: Record<ApplicationError['code'], number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApplicationError) {
    const body: { error: string; fields?: string[] } = { error: err.message };
    if (err.fields && err.fields.length > 0) {
      body.fields = err.fields;
    }
    res.status(STATUS_BY_CODE[err.code]).json(body);
    return;
  }

  if (err instanceof Error && (err.name === 'MulterError' || err.message.startsWith('Solo se permiten imágenes'))) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof Error) {
    console.error(`[${new Date().toISOString()}] Internal Server Error:`, err.stack || err.message);
  }

  res.status(500).json({ error: 'Error interno del servidor' });
};
