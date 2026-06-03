import { InMemoryLocalDataSource } from '@/data/datasources/local';
import type { Case } from '@/domain';
import type { PendingOperation } from '@/data/sync';

const makeCase = (overrides: Partial<Case> = {}): Case => ({
  id: overrides.id ?? 'local-1',
  serverId: overrides.serverId ?? null,
  userRequester: 'Tester',
  requesterEmail: null,
  reportingUser: null,
  reportingUserEmail: null,
  creationDate: overrides.creationDate ?? 1000,
  modificationDate: 1000,
  solutionDate: null,
  classificationId: overrides.classificationId ?? 1,
  classification: 'pendiente',
  statusCaseId: 1,
  statusCaseDesc: 'En espera',
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
  caseDetails: 'detalle',
  technician: null,
  location: null,
  client: null,
  countryDesc: null,
  departmentDesc: null,
  syncStatus: 'synced',
  ...overrides,
});

describe('InMemoryLocalDataSource', () => {
  it('upsert por serverId conserva el id local existente', async () => {
    const ds = new InMemoryLocalDataSource();
    await ds.putCase(makeCase({ id: 'local-1', serverId: 5, caseDetails: 'v1' }));
    // Llega el mismo registro del servidor con otro id local => debe fusionar.
    await ds.upsertCases([makeCase({ id: 'srv-5', serverId: 5, caseDetails: 'v2' })]);

    const byLocal = await ds.getCaseById('local-1');
    expect(byLocal?.caseDetails).toBe('v2');
    expect(await ds.getCaseById('srv-5')).toBeNull();
  });

  it('listCases filtra por clasificación y pagina', async () => {
    const ds = new InMemoryLocalDataSource();
    await ds.upsertCases([
      makeCase({ id: 'a', serverId: 1, classificationId: 1, creationDate: 30 }),
      makeCase({ id: 'b', serverId: 2, classificationId: 2, creationDate: 20 }),
      makeCase({ id: 'c', serverId: 3, classificationId: 1, creationDate: 10 }),
    ]);

    const pendientes = await ds.listCases({ classification: 'pendiente' });
    expect(pendientes.total).toBe(2);
    expect(pendientes.items.map((c) => c.id)).toEqual(['a', 'c']); // orden por fecha desc

    const page1 = await ds.listCases({ page: 1, pageSize: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(3);
  });

  it('gestiona la cola: encola, lista listas por tiempo y elimina', async () => {
    const ds = new InMemoryLocalDataSource();
    const op = (id: string, nextAttemptAt: number): PendingOperation => ({
      id,
      entityType: 'case',
      entityId: id,
      operation: 'create',
      payload: {},
      retryCount: 0,
      nextAttemptAt,
      lastError: null,
      createdAt: nextAttemptAt,
    });
    await ds.enqueue(op('op1', 100));
    await ds.enqueue(op('op2', 500));

    expect(await ds.countPending()).toBe(2);
    const ready = await ds.listReadyOperations(200);
    expect(ready.map((o) => o.id)).toEqual(['op1']);

    await ds.removeOperation('op1');
    expect(await ds.countPending()).toBe(1);
  });
});
