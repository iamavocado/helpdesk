import { serverError } from '@/core/errors';
import {
  ApiRemoteDataSource,
  CaseRepositoryImpl,
  CommentRepositoryImpl,
  InMemoryLocalDataSource,
  SyncEngine,
  type RemoteDataSource,
} from '@/data';
import { isOk } from '@/domain';
import { MockApiClient } from '@/services/api';

const PARKED = Number.MAX_SAFE_INTEGER;

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

  it('ante un 500 reintenta (no aparca) y el drenado `all` lo envía al recuperarse', async () => {
    const local = new InMemoryLocalDataSource();
    const base = new ApiRemoteDataSource(new MockApiClient());
    let attempts = 0;
    // Falla el primer createComment con 500; el segundo intento delega y funciona.
    const flaky = new Proxy(base, {
      get(target, prop, receiver) {
        if (prop === 'createComment') {
          return (...args: unknown[]) => {
            attempts++;
            if (attempts === 1) return Promise.reject(serverError('boom 500'));
            return (target.createComment as (...a: unknown[]) => unknown)(...args);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as RemoteDataSource;

    let counter = 0;
    const idGen = () => `id-${++counter}`;
    const caseRepo = new CaseRepositoryImpl(local, flaky, () => 1_000_000, idGen);
    const commentRepo = new CommentRepositoryImpl(local, flaky, () => 1_000_000, idGen);
    const sync = new SyncEngine(local, flaky, () => 0.5);

    const created = await caseRepo.create({
      equipmentTypeId: 2,
      equipmentTypeDesc: 'Software',
      caseDetails: 'x',
    });
    if (!isOk(created)) throw new Error('setup');
    await commentRepo.add({ caseId: created.value.id, body: 'hola', isPrivate: false });

    // 1er drenado: el caso sincroniza; el comentario da 500 → se reintenta (NO aparcado).
    await sync.drain(2_000_000);
    const [op] = (await local.listAllPending()).filter((o) => o.entityType === 'comment');
    expect(op).toBeDefined();
    expect(op.nextAttemptAt).not.toBe(PARKED); // reintentable, no aparcado
    expect(await local.countPending()).toBe(1);

    // 2º intento con `all` (como en logout): ya recuperado → se envía.
    const summary = await sync.drain(2_000_000, { all: true });
    expect(summary.succeeded).toBe(1);
    expect(await local.countPending()).toBe(0);
  });
});
