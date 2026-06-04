import Constants from 'expo-constants';

/**
 * Configuración tipada de ambiente.
 * Lee los valores inyectados en app.config.ts -> extra (cargados desde .env.<APP_ENV>).
 * Centraliza el acceso para no esparcir `process.env` por la app (ver SECURITY.md §10).
 */
type RawExtra = {
  appEnv?: string;
  apiBaseUrl?: string;
  useMockApi?: string;
  enableCertPinning?: string;
  inactivityTimeoutMinutes?: string;
  dominio?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as RawExtra;

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export type AppEnvironment = 'development' | 'staging' | 'production';

export const env = {
  appEnv: (extra.appEnv ?? 'development') as AppEnvironment,
  apiBaseUrl: extra.apiBaseUrl ?? '',
  useMockApi: toBool(extra.useMockApi, true),
  enableCertPinning: toBool(extra.enableCertPinning, false),
  inactivityTimeoutMinutes: toInt(extra.inactivityTimeoutMinutes, 30),
  dominio: extra.dominio ?? '',
  isDev: (extra.appEnv ?? 'development') === 'development',
} as const;
