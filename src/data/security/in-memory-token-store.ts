import type { StoredSession, TokenStore } from './token-store';

/** Almacén de sesión en memoria (tests). No persiste entre arranques. */
export class InMemoryTokenStore implements TokenStore {
  private session: StoredSession | null = null;

  async setSession(session: StoredSession): Promise<void> {
    this.session = session;
  }

  async getSession(): Promise<StoredSession | null> {
    return this.session;
  }

  async getAccessToken(): Promise<string | null> {
    return this.session?.accessToken ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.session?.refreshToken ?? null;
  }

  async clear(): Promise<void> {
    this.session = null;
  }
}
