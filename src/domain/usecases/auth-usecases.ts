import { validationError, type DomainError } from '@/core/errors';

import type { AuthUser, Credentials } from '../entities';
import type { AuthRepository } from '../repositories';
import { err, type Result } from '../value-objects';

/** Inicia sesión validando que las credenciales no estén vacías. */
export class LoginUseCase {
  constructor(private readonly auth: AuthRepository) {}

  execute(credentials: Credentials): Promise<Result<AuthUser, DomainError>> {
    const username = credentials.username.trim();
    if (!username || !credentials.password) {
      return Promise.resolve(err(validationError('Usuario y contraseña son obligatorios')));
    }
    return this.auth.login({ username, password: credentials.password });
  }
}

/** Cierra la sesión actual. */
export class LogoutUseCase {
  constructor(private readonly auth: AuthRepository) {}

  execute(): Promise<void> {
    return this.auth.logout();
  }
}
