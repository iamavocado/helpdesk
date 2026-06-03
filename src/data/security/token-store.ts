import type { AuthUser } from '@/domain';

/** Sesión persistida de forma segura (tokens + usuario). */
export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

/**
 * Almacén seguro de la sesión. Implementaciones:
 * - SecureTokenStore (Keychain/Keystore vía expo-secure-store) en runtime,
 * - InMemoryTokenStore en tests.
 * NUNCA se guardan tokens en claro (AsyncStorage/archivos). Ver SECURITY.md §4.
 */
export interface TokenStore {
  setSession(session: StoredSession): Promise<void>;
  getSession(): Promise<StoredSession | null>;
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  clear(): Promise<void>;
}
