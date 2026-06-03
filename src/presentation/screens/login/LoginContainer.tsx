import type { Credentials } from '@/domain';
import { useAuthStore } from '@/presentation/stores';

import { LoginScreen } from './LoginScreen';

/** Conecta LoginScreen con el store de sesión. */
export function LoginContainer() {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);

  return (
    <LoginScreen
      loading={status === 'loading'}
      errorMessage={error}
      onSubmit={(credentials: Credentials) => void login(credentials)}
    />
  );
}
