import * as SecureStore from 'expo-secure-store';

import { logger } from '@/core/logger';

import type { StoredSession, TokenStore } from './token-store';

const SESSION_KEY = 'dozzier.session';

/**
 * Almacén de sesión sobre el almacenamiento seguro del SO:
 * Keychain (iOS) / Keystore-EncryptedSharedPreferences (Android), vía expo-secure-store.
 * La sesión se serializa como JSON bajo una sola clave. Ver SECURITY.md §4.
 */
export class SecureTokenStore implements TokenStore {
  async setSession(session: StoredSession): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async getSession(): Promise<StoredSession | null> {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch (e) {
      // Sesión corrupta: se limpia para forzar re-login. No se loguea el contenido.
      logger.warn('Sesión segura corrupta; limpiando');
      await this.clear();
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    return (await this.getSession())?.accessToken ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    return (await this.getSession())?.refreshToken ?? null;
  }

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}
