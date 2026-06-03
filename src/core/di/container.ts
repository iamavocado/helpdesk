import { env } from '@/core/config/env';
import {
  ApiRemoteDataSource,
  AuthRepositoryImpl,
  CaseRepositoryImpl,
  CatalogRepositoryImpl,
  CommentRepositoryImpl,
  InMemoryLocalDataSource,
  SyncEngine,
  type LocalDataSource,
  type TokenStore,
} from '@/data';
import { SecureTokenStore } from '@/data/security/secure-token-store';
import {
  LoginUseCase,
  LogoutUseCase,
  type AuthRepository,
  type CaseRepository,
  type CatalogRepository,
  type CommentRepository,
} from '@/domain';
import { HttpApiClient, MockApiClient, type ApiClient } from '@/services/api';

/**
 * Composition root: instancia y cablea las dependencias concretas.
 * Único lugar que conoce implementaciones (secure store, mock vs HTTP).
 * El resto de la app depende de interfaces. Ver ARCHITECTURE.md §5.
 */
function buildApiClient(tokenStore: TokenStore): ApiClient {
  if (env.useMockApi || !env.apiBaseUrl) {
    return new MockApiClient();
  }
  // Interceptor: el refresh usa el propio cliente (sin Bearer-retry) → sin bucles.
  const http: HttpApiClient = new HttpApiClient({
    baseUrl: env.apiBaseUrl,
    getToken: () => tokenStore.getAccessToken(),
    refresh: async () => {
      const refreshToken = await tokenStore.getRefreshToken();
      if (!refreshToken) return null;
      try {
        const tokens = await http.refresh(refreshToken);
        await tokenStore.setSession({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: tokens.user,
        });
        return tokens.accessToken;
      } catch {
        await tokenStore.clear(); // refresh falló → forzar re-login
        return null;
      }
    },
  });
  return http;
}

function createContainer() {
  const tokenStore: TokenStore = new SecureTokenStore();
  const apiClient = buildApiClient(tokenStore);
  const local: LocalDataSource = new InMemoryLocalDataSource();
  const remote = new ApiRemoteDataSource(apiClient);

  const authRepository: AuthRepository = new AuthRepositoryImpl(apiClient, tokenStore);
  const caseRepository: CaseRepository = new CaseRepositoryImpl(local, remote);
  const commentRepository: CommentRepository = new CommentRepositoryImpl(local, remote);
  const catalogRepository: CatalogRepository = new CatalogRepositoryImpl(local, remote);
  const syncEngine = new SyncEngine(local, remote);

  return {
    tokenStore,
    apiClient,
    local,
    remote,
    authRepository,
    caseRepository,
    commentRepository,
    catalogRepository,
    syncEngine,
    loginUseCase: new LoginUseCase(authRepository),
    logoutUseCase: new LogoutUseCase(authRepository),
  };
}

export type Container = ReturnType<typeof createContainer>;

let instance: Container | null = null;

/** Devuelve el contenedor (singleton perezoso). */
export function getContainer(): Container {
  if (!instance) instance = createContainer();
  return instance;
}
