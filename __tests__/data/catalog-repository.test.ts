import { networkError } from '@/core/errors';
import {
  ApiRemoteDataSource,
  CatalogRepositoryImpl,
  InMemoryLocalDataSource,
  type RemoteDataSource,
} from '@/data';
import { isOk } from '@/domain';
import { MockApiClient } from '@/services/api';

describe('CatalogRepositoryImpl', () => {
  it('getAll() refresca desde el servidor y cachea localmente', async () => {
    const local = new InMemoryLocalDataSource();
    const remote = new ApiRemoteDataSource(new MockApiClient());
    const repo = new CatalogRepositoryImpl(local, remote);

    const result = await repo.getAll();
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.equipmentTypes).toHaveLength(5);

    // La segunda llamada usa la caché (no debería requerir red).
    const cached = await local.getCatalogs();
    expect(cached?.priorities).toHaveLength(3);
  });

  it('getAll() devuelve error si no hay caché ni red', async () => {
    const local = new InMemoryLocalDataSource();
    const offline: RemoteDataSource = {
      fetchCases: () => Promise.reject(networkError()),
      fetchCase: () => Promise.reject(networkError()),
      createCase: () => Promise.reject(networkError()),
      fetchComments: () => Promise.reject(networkError()),
      createComment: () => Promise.reject(networkError()),
      fetchCatalogs: () => Promise.reject(networkError()),
      fetchAttachments: () => Promise.reject(networkError()),
      uploadAttachment: () => Promise.reject(networkError()),
      fetchMembers: () => Promise.reject(networkError()),
      fetchStatusCaseSubStatuses: () => Promise.reject(networkError()),
      updateCase: () => Promise.reject(networkError()),
      updateCaseStatus: () => Promise.reject(networkError()),
      fetchCountries: () => Promise.reject(networkError()),
      fetchDepartments: () => Promise.reject(networkError()),
    };
    const repo = new CatalogRepositoryImpl(local, offline);
    const result = await repo.getAll();
    expect(result.ok).toBe(false);
  });
});
