import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  fields?: string[];

  constructor(message: string, statusCode: number, fields?: string[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.fields = fields;
    // Restore prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: { error: string; fields?: string[] } = { error: err.message };
    if (err.fields && err.fields.length > 0) {
      body.fields = err.fields;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / unhandled error — 500
  const statusCode = 500;
  console.error(`[${new Date().toISOString()}] Internal Server Error:`, err.stack || err.message);

  res.status(statusCode).json({ error: 'Error interno del servidor' });
}
