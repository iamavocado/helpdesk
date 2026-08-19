import { networkError } from '@/core/errors';
import {
  ApiRemoteDataSource,
  CaseRepositoryImpl,
  InMemoryLocalDataSource,
  type RemoteDataSource,
} from '@/data';
import { isOk } from '@/domain';
import { MockApiClient } from '@/services/api';

function setup() {
  const local = new InMemoryLocalDataSource();
  const remote = new ApiRemoteDataSource(new MockApiClient());
  let counter = 0;
  const idGen = () => `id-${++counter}`;
  const repo = new CaseRepositoryImpl(local, remote, () => 1_000_000, idGen);
  return { local, remote, repo };
}

describe('CaseRepositoryImpl (offline-first)', () => {
  it('refresh() hace pull del servidor y llena la caché local', async () => {
    const { repo, local } = setup();
    const result = await repo.refresh();
    expect(result.ok).toBe(true);
    const listed = await local.listCases({ page: 1, pageSize: 1000 });
    expect(listed.total).toBeGreaterThanOrEqual(50);
  });

  it('create() funciona offline: persiste local con serverId null y encola', async () => {
    const { repo, local } = setup();
    const result = await repo.create({
      equipmentTypeId: 2,
      equipmentTypeDesc: 'Software',
      caseDetails: 'No carga el reporte',
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.serverId).toBeNull();
    expect(result.value.syncStatus).toBe('pending');
    expect(await local.countPending()).toBe(1);

    const fromLocal = await repo.list({ page: 1, pageSize: 10 });
    expect(isOk(fromLocal) && fromLocal.value.total).toBe(1);
  });

  it('updateStatus() de un caso sincronizado persiste el estado en el servidor', async () => {
    const { repo, local } = setup();
    await repo.refresh(); // llena local con casos del mock (con serverId)
    const listed = await local.listCases({ page: 1, pageSize: 1 });
    const target = listed.items[0];
    expect(target.serverId).not.toBeNull();

    const result = await repo.updateStatus(target.id, 3, 'Resuelto');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.statusCaseId).toBe(3);
    expect(result.value.statusCaseDesc).toBe('Resuelto');
    expect(result.value.classification).toBe('cerrado');
    expect(result.value.syncStatus).toBe('synced');

    // Persistió en local con el nuevo estado.
    const reloaded = await local.getCaseById(target.id);
    expect(reloaded?.statusCaseId).toBe(3);
  });

  it('refresh() es tolerante a falta de red (no falla sin conexión)', async () => {
    const local = new InMemoryLocalDataSource();
    const offlineRemote: RemoteDataSource = {
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
    const repo = new CaseRepositoryImpl(local, offlineRemote);
    const result = await repo.refresh();
    expect(result.ok).toBe(true); // silencioso ante red
  });
});
