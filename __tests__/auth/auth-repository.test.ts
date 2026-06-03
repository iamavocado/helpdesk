import { AuthRepositoryImpl, InMemoryTokenStore } from '@/data';
import { isOk } from '@/domain';
import { MockApiClient } from '@/services/api';

function setup() {
  const tokenStore = new InMemoryTokenStore();
  const api = new MockApiClient();
  const repo = new AuthRepositoryImpl(api, tokenStore);
  return { tokenStore, repo };
}

describe('AuthRepositoryImpl', () => {
  it('login correcto guarda la sesión y devuelve el usuario', async () => {
    const { repo, tokenStore } = setup();
    const result = await repo.login({ username: 'saulo', password: 'dozzier' });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.username).toBe('saulo');

    // Los tokens quedaron persistidos en el almacén seguro.
    expect(await tokenStore.getAccessToken()).toBeTruthy();
    expect(await repo.isAuthenticated()).toBe(true);
    expect((await repo.getCurrentUser())?.username).toBe('saulo');
  });

  it('login con contraseña incorrecta devuelve error de auth y no guarda sesión', async () => {
    const { repo, tokenStore } = setup();
    const result = await repo.login({ username: 'saulo', password: 'mala' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe('auth');
    expect(await tokenStore.getAccessToken()).toBeNull();
  });

  it('logout limpia la sesión', async () => {
    const { repo } = setup();
    await repo.login({ username: 'saulo', password: 'dozzier' });
    await repo.logout();
    expect(await repo.isAuthenticated()).toBe(false);
    expect(await repo.getCurrentUser()).toBeNull();
  });
});
