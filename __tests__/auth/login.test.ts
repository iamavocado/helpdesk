import { InMemoryTokenStore, AuthRepositoryImpl } from '@/data';
import { LoginUseCase, isOk } from '@/domain';
import { MockApiClient } from '@/services/api';
import { validateLogin } from '@/presentation/screens/login/login-validation';

describe('LoginUseCase', () => {
  const build = () =>
    new LoginUseCase(new AuthRepositoryImpl(new MockApiClient(), new InMemoryTokenStore()));

  it('rechaza credenciales vacías con error de validación', async () => {
    const result = await build().execute({ username: '  ', password: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('validation');
  });

  it('delega en el repositorio con credenciales válidas', async () => {
    const result = await build().execute({ username: 'saulo', password: 'dozzier' });
    expect(isOk(result)).toBe(true);
  });
});

describe('validateLogin', () => {
  it('marca campos vacíos', () => {
    const errors = validateLogin({ username: '', password: '' });
    expect(errors.username).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it('no marca errores con datos válidos', () => {
    expect(validateLogin({ username: 'saulo', password: 'dozzier' })).toEqual({});
  });
});

describe('MockApiClient auth', () => {
  it('login emite tokens y refresh los renueva', async () => {
    const api = new MockApiClient();
    const tokens = await api.login({ username: 'saulo', password: 'dozzier' });
    expect(tokens.accessToken).toContain('mock.');
    expect(tokens.user.email).toBe('saulo@ita-sa.com');

    const refreshed = await api.refresh(tokens.refreshToken);
    expect(refreshed.accessToken).toContain('mock.');
  });

  it('login inválido lanza 401', async () => {
    const api = new MockApiClient();
    await expect(api.login({ username: '', password: 'x' })).rejects.toMatchObject({ status: 401 });
  });
});
