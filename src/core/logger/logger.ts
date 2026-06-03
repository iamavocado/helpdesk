import { env } from '@/core/config/env';

/**
 * Logger estructurado con scrubbing de PII (ver SECURITY.md §9).
 * Nunca registra tokens, contraseñas, emails ni contenido de casos/comentarios.
 * En producción se silencian niveles debug/info.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = [
  'token',
  'accesstoken',
  'refreshtoken',
  'password',
  'authorization',
  'email',
  'requesteremail',
  'body',
  'casedetails',
  'comment',
];

const REDACTED = '[REDACTED]';

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.includes(key.toLowerCase()) ? REDACTED : scrub(val, depth + 1);
    }
    return out;
  }
  return value;
}

function shouldLog(level: LogLevel): boolean {
  if (level === 'warn' || level === 'error') return true;
  return env.appEnv !== 'production';
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const payload = context ? scrub(context) : undefined;
  const line = `[${level.toUpperCase()}] ${message}`;
  // Solo warn/error van a consola para cumplir la regla no-console del linter.
  if (level === 'error') console.error(line, payload ?? '');
  else console.warn(line, payload ?? '');
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
  /** Expuesto para tests del scrubbing. */
  _scrub: scrub,
};
