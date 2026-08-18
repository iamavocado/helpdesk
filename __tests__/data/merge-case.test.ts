import { mergeServerCase } from '@/data';
import type { Case } from '@/domain';

/** Caso base mínimo para las pruebas. */
function makeCase(over: Partial<Case>): Case {
  return {
    id: 'local-1',
    serverId: 100,
    userRequester: 'aalvarado',
    requesterEmail: null,
    reportingUser: null,
    reportingUserEmail: null,
    creationDate: 1,
    modificationDate: 1,
    solutionDate: null,
    classificationId: 1,
    classification: 'pendiente',
    statusCaseId: 1,
    statusCaseDesc: 'En espera de respuesta soporte',
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
    caseDetails: 'Detalle',
    technician: null,
    location: null,
    client: null,
    countryDesc: 'PANAMÁ',
    departmentDesc: 'PANAMÁ',
    syncStatus: 'synced',
    ...over,
  };
}

describe('mergeServerCase', () => {
  it('conserva la taxonomía local cuando la lista liviana la trae vacía', () => {
    const local = makeCase({ equipmentTypeDesc: 'Software', countryDesc: 'PANAMÁ' });
    // La lista liviana no trae categoría/país (llegan vacíos por el mapper).
    const light = makeCase({
      equipmentTypeId: 0,
      equipmentTypeDesc: '',
      countryDesc: null,
      statusCaseId: 0,
      statusCaseDesc: '',
    });

    const merged = mergeServerCase(local, light);
    expect(merged.equipmentTypeDesc).toBe('Software');
    expect(merged.equipmentTypeId).toBe(2);
    expect(merged.countryDesc).toBe('PANAMÁ');
    expect(merged.statusCaseId).toBe(1); // se preserva el estado por defecto
  });

  it('deja ganar al servidor cuando trae un valor real (más fresco)', () => {
    const local = makeCase({ statusCaseDesc: 'En espera', technician: null });
    const server = makeCase({
      statusCaseId: 4,
      statusCaseDesc: 'Cerrado',
      technician: 'emanrique',
    });

    const merged = mergeServerCase(local, server);
    expect(merged.statusCaseDesc).toBe('Cerrado');
    expect(merged.statusCaseId).toBe(4);
    expect(merged.technician).toBe('emanrique');
  });
});
