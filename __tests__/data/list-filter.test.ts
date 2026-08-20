import { InMemoryLocalDataSource } from '@/data';
import type { Case } from '@/domain';

/** Caso mínimo para poblar el almacén local. */
function makeCase(over: Partial<Case>): Case {
  return {
    id: 'x',
    serverId: 1,
    userRequester: 'u',
    requesterEmail: null,
    reportingUser: null,
    reportingUserEmail: null,
    creationDate: 1,
    modificationDate: 1,
    solutionDate: null,
    classificationId: 3,
    classification: 'cerrado',
    statusCaseId: 3,
    statusCaseDesc: 'Resuelto',
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
    ...over,
  };
}

describe('listCases con filtro por estado (Resuelto vs Cerrado)', () => {
  it('separa Resuelto (statusCaseId 3) de Cerrado (statusCaseId 4)', async () => {
    const local = new InMemoryLocalDataSource();
    await local.putCase(makeCase({ id: 'a', serverId: 1, statusCaseId: 3 })); // Resuelto
    await local.putCase(makeCase({ id: 'b', serverId: 2, statusCaseId: 4, statusCaseDesc: 'Cerrado' })); // Cerrado
    await local.putCase(makeCase({ id: 'c', serverId: 3, statusCaseId: 3 })); // Resuelto

    const resueltos = await local.listCases({ statusCaseId: 3, page: 1, pageSize: 20 });
    expect(resueltos.total).toBe(2);
    expect(resueltos.items.every((c) => c.statusCaseId === 3)).toBe(true);

    const cerrados = await local.listCases({ statusCaseId: 4, page: 1, pageSize: 20 });
    expect(cerrados.total).toBe(1);
    expect(cerrados.items[0]?.id).toBe('b');

    // La clasificación 'cerrado' agrupa ambos (3 y 4).
    const grupoCerrado = await local.listCases({ classification: 'cerrado', page: 1, pageSize: 20 });
    expect(grupoCerrado.total).toBe(3);
  });
});
