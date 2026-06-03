import type { CaseDto, CommentDto } from '@/data/datasources/remote/dto';
import { dtoToCase, dtoToComment, catalogsDtoToDomain } from '@/data/datasources/remote/mappers';
import { mockCatalogs } from '@/mock';

const baseCaseDto = (overrides: Partial<CaseDto> = {}): CaseDto => ({
  Id: 28,
  UserRequester: 'Adalberto Ariano',
  EmailRequester: 'adalberto@ita-sa.com',
  ReportingUser: 'Adalberto Ariano',
  ReportingUserEmail: null,
  CreationDate: '2026-05-27T09:14:00.000Z',
  ModificationDate: '2026-05-28T10:20:00.000Z',
  SolutionDate: null,
  ClassificationCaseId: 2,
  StatusCaseId: 2,
  StatusCaseDesc: 'Devolver a cola',
  SubStatusCaseId: 1,
  EquipmentTypeId: 2,
  EquipmentTypeDesc: 'Software',
  SoftwareModuleId: 11,
  SoftwareModuleDesc: 'Programación de Audiencia',
  SoftwareEnvironmentId: 3,
  SoftwareEnvironmentDesc: 'Producción',
  HardwareEquipmentId: null,
  HardwareEquipmentDesc: null,
  PriorityId: 1,
  PriorityDesc: 'Baja',
  ServiceTypeId: 1,
  ServiceTypeDesc: 'Correctivo',
  CaseDetails: 'Error al agendar',
  Technician: 'Xoftix Soporte',
  Location: 'Sala 3',
  Client: 'SPA',
  CountryDesc: 'PANAMÁ',
  DepartmentDesc: null,
  ...overrides,
});

describe('mappers', () => {
  it('mapea CaseDto a dominio con clasificación derivada y serverId estable', () => {
    const c = dtoToCase(baseCaseDto());
    expect(c.serverId).toBe(28);
    expect(c.id).toBe('srv-28');
    expect(c.classification).toBe('cola'); // ClassificationCaseId 2
    expect(c.equipmentTypeDesc).toBe('Software');
    expect(c.syncStatus).toBe('synced');
    expect(c.creationDate).toBe(Date.parse('2026-05-27T09:14:00.000Z'));
  });

  it('clasificación cae en pendiente para ids fuera de {1,2,3}', () => {
    const c = dtoToCase(baseCaseDto({ ClassificationCaseId: 6 }));
    expect(c.classification).toBe('pendiente');
  });

  it('mapea CommentDto preservando IsPrivate y autor', () => {
    const dto: CommentDto = {
      Id: 3,
      IdCase: 28,
      Comment: 'Nota privada',
      CreationDate: '2026-05-27T10:33:00.000Z',
      StatusCaseId: 2,
      StatusDesc: 'Devolver a cola',
      ClassificationCaseId: 2,
      SubStatusCaseId: 1,
      UserRequester: 'María Rodríguez',
      IsPrivate: true,
      AttachedFile: null,
    };
    const comment = dtoToComment(dto, 'srv-28');
    expect(comment.isPrivate).toBe(true);
    expect(comment.caseId).toBe('srv-28');
    expect(comment.authorName).toBe('María Rodríguez');
  });

  it('mapea catálogos preservando prioridades con SLA', () => {
    const catalogs = catalogsDtoToDomain(mockCatalogs);
    expect(catalogs.equipmentTypes).toHaveLength(5);
    expect(catalogs.priorities.find((p) => p.description === 'Alta')?.hoursToClose).toBe(1);
  });
});
