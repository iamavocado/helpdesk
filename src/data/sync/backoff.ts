/**
 * Backoff exponencial con jitter para reintentos de la cola de sync.
 * delay = min(BASE * 2^retry, MAX) ± 20%   (ver DATA_MODEL.md §4.3)
 */
export const BACKOFF_BASE_MS = 2_000;
export const BACKOFF_MAX_MS = 5 * 60_000;
export const MAX_RETRIES = 8;

export function backoffDelay(retryCount: number, random: () => number = Math.random): number {
  const exponential = BACKOFF_BASE_MS * 2 ** retryCount;
  const capped = Math.min(exponential, BACKOFF_MAX_MS);
  const jitter = capped * 0.2 * (random() * 2 - 1); // ±20%
  return Math.max(0, Math.round(capped + jitter));
}

/** ¿Se agotaron los reintentos? => la operación pasa a estado 'error'. */
export function exhaustedRetries(retryCount: number): boolean {
  return retryCount >= MAX_RETRIES;
}
