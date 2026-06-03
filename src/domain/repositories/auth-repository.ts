import type { DomainError } from '@/core/errors';
import type { AuthUser, Credentials } from '../entities';
import type { Result } from '../value-objects';

/** Puerto del dominio para autenticación JWT. */
export interface AuthRepository {
  /** Inicia sesión y persiste los tokens de forma segura. */
  login(credentials: Credentials): Promise<Result<AuthUser, DomainError>>;

  /** Cierra sesión y limpia los tokens del almacenamiento seguro. */
  logout(): Promise<void>;

  /** Usuario actual si hay sesión válida en almacenamiento seguro. */
  getCurrentUser(): Promise<AuthUser | null>;

  /** ¿Hay tokens guardados? (sesión potencialmente activa). */
  isAuthenticated(): Promise<boolean>;
}
