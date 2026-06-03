import { authError, DomainError, networkError, unknownError } from '@/core/errors';
import { logger } from '@/core/logger';
import {
  ok,
  err,
  type AuthRepository,
  type AuthUser,
  type Credentials,
  type Result,
} from '@/domain';
import { ApiError, type ApiClient } from '@/services/api';

import type { StoredSession, TokenStore } from '../security';

/**
 * Repositorio de autenticación: login/refresh contra ApiClient y persistencia
 * segura de la sesión vía TokenStore. No registra credenciales ni tokens.
 */
export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly api: ApiClient,
    private readonly tokenStore: TokenStore,
  ) {}

  async login(credentials: Credentials): Promise<Result<AuthUser, DomainError>> {
    try {
      const tokens = await this.api.login({
        username: credentials.username,
        password: credentials.password,
      });
      const session: StoredSession = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: tokens.user,
      };
      await this.tokenStore.setSession(session);
      logger.info('Login correcto'); // sin PII
      return ok(tokens.user);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) return err(authError('Usuario o contraseña incorrectos', e));
        if (e.status === 0) return err(networkError('No se pudo conectar', e));
        return err(unknownError('Error al iniciar sesión', e));
      }
      return err(unknownError('Error inesperado al iniciar sesión', e));
    }
  }

  async logout(): Promise<void> {
    await this.tokenStore.clear();
    logger.info('Sesión cerrada');
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return (await this.tokenStore.getSession())?.user ?? null;
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.tokenStore.getAccessToken()) !== null;
  }
}
