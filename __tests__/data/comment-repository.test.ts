import { ApiRemoteDataSource, CommentRepositoryImpl, InMemoryLocalDataSource } from '@/data';
import { isOk, type Case } from '@/domain';
import { MockApiClient } from '@/services/api';

const syncedCase = (serverId: number): Case => ({
  id: `srv-${serverId}`,
  serverId,
  userRequester: 'Tester',
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
  syncStatus: 'synced',
});

function setup() {
  const local = new InMemoryLocalDataSource();
  const remote = new ApiRemoteDataSource(new MockApiClient());
  let counter = 0;
  const repo = new CommentRepositoryImpl(
    local,
    remote,
    () => 1000,
    () => `id-${++counter}`,
  );
  return { local, repo };
}

describe('CommentRepositoryImpl', () => {
  it('refresh() trae los comentarios del servidor para un caso sincronizado', async () => {
    const { local, repo } = setup();
    await local.putCase(syncedCase(1));

    const result = await repo.refresh('srv-1');
    expect(result.ok).toBe(true);

    const listed = await repo.listByCase('srv-1');
    expect(isOk(listed)).toBe(true);
    if (!isOk(listed)) return;
    expect(listed.value.length).toBeGreaterThan(0);
  });

  it('add() persiste un comentario pendiente y lo encola', async () => {
    const { local, repo } = setup();
    await local.putCase(syncedCase(1));

    const result = await repo.add({ caseId: 'srv-1', body: 'Hola', isPrivate: true });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.syncStatus).toBe('pending');
    expect(result.value.isPrivate).toBe(true);
    expect(await local.countPending()).toBe(1);
  });
});
