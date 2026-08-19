/** Tipos de error de dominio, usados con Result<T, DomainError>. */
export type DomainErrorKind =
  | 'network'
  | 'server'
  | 'auth'
  | 'validation'
  | 'conflict'
  | 'not_found'
  | 'unknown';

export class DomainError extends Error {
  readonly kind: DomainErrorKind;
  readonly cause?: unknown;

  constructor(kind: DomainErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'DomainError';
    this.kind = kind;
    this.cause = cause;
  }
}

export const networkError = (message = 'Sin conexión o servidor no disponible', cause?: unknown) =>
  new DomainError('network', message, cause);

/** Error 5xx del servidor: transitorio, se debe reintentar (no aparcar). */
export const serverError = (message = 'Error del servidor', cause?: unknown) =>
  new DomainError('server', message, cause);

export const authError = (message = 'No autorizado', cause?: unknown) =>
  new DomainError('auth', message, cause);

export const validationError = (message: string, cause?: unknown) =>
  new DomainError('validation', message, cause);

export const conflictError = (message = 'Conflicto de sincronización', cause?: unknown) =>
  new DomainError('conflict', message, cause);

export const notFoundError = (message = 'Recurso no encontrado', cause?: unknown) =>
  new DomainError('not_found', message, cause);

export const unknownError = (message = 'Error inesperado', cause?: unknown) =>
  new DomainError('unknown', message, cause);
