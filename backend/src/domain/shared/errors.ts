export type ApplicationErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL';

export class ApplicationError extends Error {
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
    public readonly fields?: string[],
  ) {
    super(message);
    this.name = 'ApplicationError';
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}

export function badRequest(message: string, fields?: string[]): ApplicationError {
  return new ApplicationError('BAD_REQUEST', message, fields);
}

export function unauthenticated(message = 'No autenticado'): ApplicationError {
  return new ApplicationError('UNAUTHENTICATED', message);
}

export function forbidden(message = 'Permisos insuficientes'): ApplicationError {
  return new ApplicationError('FORBIDDEN', message);
}

export function notFound(message = 'Recurso no encontrado'): ApplicationError {
  return new ApplicationError('NOT_FOUND', message);
}

export function conflict(message: string): ApplicationError {
  return new ApplicationError('CONFLICT', message);
}

export function internal(message = 'Error interno del servidor'): ApplicationError {
  return new ApplicationError('INTERNAL', message);
}
