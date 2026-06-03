import { ApiError } from './api-error';

export interface AuthRetryOptions {
  /** Devuelve el access token actual (o null si no hay sesión). */
  getToken: () => Promise<string | null>;
  /** Renueva el token; devuelve el nuevo access token o null si falla. */
  refresh: () => Promise<string | null>;
}

/**
 * Envuelve un request con la política de autenticación:
 * adjunta el token, y ante un 401 intenta UN refresh y reintenta una vez.
 * Si el refresh falla, propaga ApiError(401). Anti-bucle: solo un reintento.
 * (Ver SECURITY.md §3.)
 */
export async function withAuthRetry<T>(
  execute: (token: string | null) => Promise<T>,
  options: AuthRetryOptions,
): Promise<T> {
  const token = await options.getToken();
  try {
    return await execute(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    const newToken = await options.refresh();
    if (!newToken) throw new ApiError(401, 'Sesión expirada');
    return execute(newToken);
  }
}
