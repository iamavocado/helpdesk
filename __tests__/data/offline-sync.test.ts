import {
  ApiRemoteDataSource,
  CaseRepositoryImpl,
  CommentRepositoryImpl,
  InMemoryLocalDataSource,
  SyncEngine,
} from '@/data';
import { isOk } from '@/domain';
import { MockApiClient } from '@/services/api';

/**
 * Flujo offline → online (criterio de aceptación del proyecto):
 * crear caso + comentario sin conexión, luego drenar la cola al "volver la red".
 */
function setup() {
  const local = new InMemoryLocalDataSource();
  const remote = new ApiRemoteDataSource(new MockApiClient());
  let counter = 0;
  const idGen = () => `id-${++counter}`;
  const clock = () => 1_000_000;
  const caseRepo = new CaseRepositoryImpl(local, remote, clock, idGen);
  const commentRepo = new CommentRepositoryImpl(local, remote, clock, idGen);
  const sync = new SyncEngine(local, remote, () => 0.5);
  return { local, caseRepo, commentRepo, sync };
}

describe('Sincronización offline → online', () => {
  it('drena un caso y su comentario creados offline, en orden de dependencia', async () => {
    const { local, caseRepo, commentRepo, sync } = setup();

    // 1) Offline: crear caso
    const created = await caseRepo.create({
      equipmentTypeId: 2,
      equipmentTypeDesc: 'Software',
      caseDetails: 'Falla intermitente',
    });
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;
    const localCaseId = created.value.id;

    // 2) Offline: comentar ese caso (aún sin serverId)
    const commented = await commentRepo.add({
      caseId: localCaseId,
      body: 'Adjunto evidencia',
      isPrivate: false,
    });
    expect(isOk(commented)).toBe(true);

    expect(await local.countPending()).toBe(2);

    // 3) Vuelve la red: drenar
    const summary = await sync.drain(2_000_000);
    expect(summary.succeeded).toBe(2);
    expect(await local.countPending()).toBe(0);

    // El caso obtuvo serverId y el comentario quedó enlazado a él
    const syncedCase = await local.getCaseById(localCaseId);
    expect(syncedCase?.serverId).not.toBeNull();
    expect(syncedCase?.syncStatus).toBe('synced');

    const comments = await local.listCommentsByCase(localCaseId);
    expect(comments[0]?.serverId).not.toBeNull();
    expect(comments[0]?.caseServerId).toBe(syncedCase?.serverId);
  });

  it('difiere el comentario si su caso padre aún no tiene serverId', async () => {
    const { local, commentRepo, sync } = setup();
    // Caso local sin serverId, sin operación de caso encolada
    await local.putCase({
      id: 'orphan',
      serverId: null,
      userRequester: '',
      requesterEmail: null,
      reportingUser: null,
      reportingUserEmail: null,
      creationDate: 1,
      modificationDate: 1,
      solutionDate: null,
      classificationId: 1,
      classification: 'pendiente',
      statusCaseId: 1,
      statusCaseDesc: '',
      subStatusId: null,
      equipmentTypeId: 2,
      equipmentTypeDesc: 'Software',
      softwareModuleId: null,
      softwareModuleDesc: null,
      softwareEnvironmentId: null,
      softwareEnvironmentDesc: null,
      hardwareEquipmentId: null,
      hardwareEquipmentDesc: null,
      priorityId: null,
      priorityDesc: null,
      serviceTypeId: null,
      serviceTypeDesc: null,
      caseDetails: '',
      technician: null,
      location: null,
      client: null,
      countryDesc: null,
      departmentDesc: null,
      syncStatus: 'pending',
    });

    await commentRepo.add({ caseId: 'orphan', body: 'huérfano', isPrivate: false });
    const summary = await sync.drain(2_000_000);
    expect(summary.deferred).toBe(1);
    expect(summary.succeeded).toBe(0);
    expect(await local.countPending()).toBe(1); // sigue en cola
  });
});
