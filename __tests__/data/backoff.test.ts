import { backoffDelay, exhaustedRetries, BACKOFF_MAX_MS, MAX_RETRIES } from '@/data/sync';

describe('backoff exponencial', () => {
  it('crece con el número de reintentos (sin jitter)', () => {
    const noJitter = () => 0.5; // random=0.5 => jitter 0
    expect(backoffDelay(0, noJitter)).toBe(2000);
    expect(backoffDelay(1, noJitter)).toBe(4000);
    expect(backoffDelay(2, noJitter)).toBe(8000);
  });

  it('se limita al máximo', () => {
    const noJitter = () => 0.5;
    expect(backoffDelay(100, noJitter)).toBe(BACKOFF_MAX_MS);
  });

  it('detecta reintentos agotados', () => {
    expect(exhaustedRetries(MAX_RETRIES - 1)).toBe(false);
    expect(exhaustedRetries(MAX_RETRIES)).toBe(true);
  });
});
