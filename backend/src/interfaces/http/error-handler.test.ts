import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from './error-handler';
import { badRequest, forbidden } from '../../domain/shared/errors';

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe('errorHandler', () => {
  it('maps application errors to their HTTP status and fields', () => {
    const res = createResponse();

    errorHandler(badRequest('Datos inválidos', ['email']), {} as any, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Datos inválidos', fields: ['email'] });
  });

  it('maps forbidden errors without optional fields', () => {
    const res = createResponse();

    errorHandler(forbidden(), {} as any, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Permisos insuficientes' });
  });

  it('maps multer and photo validation errors to bad request', () => {
    const multerError = new Error('Unexpected field');
    multerError.name = 'MulterError';
    const multerResponse = createResponse();

    errorHandler(multerError, {} as any, multerResponse as any, vi.fn());

    expect(multerResponse.status).toHaveBeenCalledWith(400);
    expect(multerResponse.json).toHaveBeenCalledWith({ error: 'Unexpected field' });

    const photoResponse = createResponse();
    errorHandler(new Error('Solo se permiten imágenes'), {} as any, photoResponse as any, vi.fn());

    expect(photoResponse.status).toHaveBeenCalledWith(400);
    expect(photoResponse.json).toHaveBeenCalledWith({ error: 'Solo se permiten imágenes' });
  });

  it('returns a generic response for unexpected errors', () => {
    const res = createResponse();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(new Error('database exploded'), {} as any, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
    expect(consoleSpy).toHaveBeenCalledOnce();

    consoleSpy.mockRestore();
  });
});
