import type { DomainError } from '@/core/errors';

/**
 * Resultado explícito (éxito | error) para los casos de uso y repositorios.
 * Evita lanzar excepciones no controladas a través de las capas.
 */
export type Result<T, E = DomainError> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}
