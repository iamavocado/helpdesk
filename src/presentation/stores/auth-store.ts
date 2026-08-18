import { create } from 'zustand';

import { getContainer } from '@/core/di';
import { isOk, type AuthUser, type Credentials } from '@/domain';

export type AuthStatus = 'idle' | 'restoring' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  /** Restaura la sesión desde el almacenamiento seguro al arrancar. */
  restore: () => Promise<void>;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,
  error: null,

  restore: async () => {
    set({ status: 'restoring' });
    const user = await getContainer().authRepository.getCurrentUser();
    set({ user, status: user ? 'authenticated' : 'unauthenticated' });
  },

  login: async (credentials) => {
    set({ status: 'loading', error: null });
    const container = getContainer();
    const result = await container.loginUseCase.execute(credentials);
    if (isOk(result)) {
      // La API filtra los datos por usuario. Se parte de una caché local limpia
      // para reflejar exactamente lo del servidor y no mezclar datos de una
      // sesión/usuario anterior (correctitud + privacidad de datos confidenciales).
      await container.local.clear();
      set({ user: result.value, status: 'authenticated', error: null });
    } else {
      set({ status: 'unauthenticated', error: result.error.message });
    }
  },

  logout: async () => {
    const container = getContainer();
    // Empuja lo pendiente ANTES de invalidar el token y limpiar la caché, para no
    // perder casos/comentarios creados sin sincronizar. Tolerante a falta de red.
    try {
      await container.syncEngine.drain();
    } catch {
      // sin conexión: se limpia igualmente (compromiso de seguridad: no dejar datos)
    }
    await container.logoutUseCase.execute();
    await container.local.clear(); // no dejar datos del usuario anterior en el dispositivo
    set({ user: null, status: 'unauthenticated', error: null });
  },
}));
