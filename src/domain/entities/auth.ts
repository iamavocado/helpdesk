/** Credenciales de inicio de sesión. */
export interface Credentials {
  username: string;
  password: string;
}

/** Usuario autenticado (derivado del token / perfil). */
export interface AuthUser {
  username: string;
  name: string;
  email: string;
}

/** Sesión activa: usuario + tokens JWT. */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
