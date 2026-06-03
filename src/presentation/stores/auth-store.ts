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
    const result = await getContainer().loginUseCase.execute(credentials);
    if (isOk(result)) {
      set({ user: result.value, status: 'authenticated', error: null });
    } else {
      set({ status: 'unauthenticated', error: result.error.message });
    }
  },

  logout: async () => {
    await getContainer().logoutUseCase.execute();
    set({ user: null, status: 'unauthenticated', error: null });
  },
}));
