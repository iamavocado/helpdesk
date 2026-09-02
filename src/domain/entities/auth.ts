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
  /** Rol del usuario (del JWT), p. ej. "Usuario", "Administrador". */
  role?: string | null;
  /** Departamento del usuario (del JWT: StrDepartmentName). */
  departmentName?: string | null;
  /** Cargo/función del usuario (del JWT: StrJobFunction). */
  jobFunction?: string | null;
}

/** Sesión activa: usuario + tokens JWT. */
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
