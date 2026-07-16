import { serverLocalId } from '@/core/utils/id';
import type { Attachment, Case, Catalogs, Comment, NewCaseInput, NewCommentInput } from '@/domain';
import { classificationFromId } from '@/domain';

import type {
  AttachmentDto,
  CaseDto,
  CatalogItemDto,
  CatalogsDto,
  CommentDto,
  CreateCaseDto,
  CreateCommentDto,
  PriorityDto,
} from './dto';

const toEpoch = (iso: string | null): number => (iso ? Date.parse(iso) : Date.now());
const toIso = (epoch: number): string => new Date(epoch).toISOString();

/** DTO de servidor → entidad de dominio (registro ya sincronizado). */
export function dtoToCase(dto: CaseDto): Case {
  return {
    id: serverLocalId(dto.Id),
    serverId: dto.Id,
    userRequester: dto.UserRequester ?? '',
    requesterEmail: dto.EmailRequester,
    reportingUser: dto.ReportingUser,
    reportingUserEmail: dto.ReportingUserEmail,
    creationDate: toEpoch(dto.CreationDate),
    modificationDate: toEpoch(dto.ModificationDate ?? dto.CreationDate),
    solutionDate: dto.SolutionDate ? toEpoch(dto.SolutionDate) : null,
    classificationId: dto.ClassificationCaseId ?? 1,
    classification: classificationFromId(dto.ClassificationCaseId),
    statusCaseId: dto.StatusCaseId ?? 0,
    statusCaseDesc: dto.StatusCaseDesc ?? '',
    subStatusId: dto.SubStatusCaseId,
    equipmentTypeId: dto.EquipmentTypeId ?? 0,
    equipmentTypeDesc: dto.EquipmentTypeDesc ?? '',
    softwareModuleId: dto.SoftwareModuleId,
    softwareModuleDesc: dto.SoftwareModuleDesc,
    softwareEnvironmentId: dto.SoftwareEnvironmentId,
    softwareEnvironmentDesc: dto.SoftwareEnvironmentDesc,
    hardwareEquipmentId: dto.HardwareEquipmentId,
    hardwareEquipmentDesc: dto.HardwareEquipmentDesc,
    priorityId: dto.PriorityId,
    priorityDesc: dto.PriorityDesc,
    serviceTypeId: dto.ServiceTypeId,
    serviceTypeDesc: dto.ServiceTypeDesc,
    caseDetails: dto.CaseDetails ?? '',
    technician: dto.Technician,
    location: dto.Location,
    client: dto.Client,
    countryDesc: dto.CountryDesc,
    departmentDesc: dto.DepartmentDesc,
    syncStatus: 'synced',
  };
}

/** DTO de comentario → dominio. */
export function dtoToComment(dto: CommentDto, caseLocalId: string): Comment {
  return {
    id: `srv-${dto.IdCase}-${dto.Id}`,
    serverId: dto.Id,
    caseId: caseLocalId,
    caseServerId: dto.IdCase,
    body: dto.Comment ?? '',
    creationDate: toEpoch(dto.CreationDate),
    authorName: dto.UserRequester ?? '',
    authorRole: null,
    isPrivate: dto.IsPrivate ?? false,
    statusCaseId: dto.StatusCaseId,
    statusDesc: dto.StatusDesc,
    hasAttachment: !!dto.AttachedFile,
    syncStatus: 'synced',
  };
}

/** DTO de adjunto → dominio. */
export function dtoToAttachment(dto: AttachmentDto): Attachment {
  return {
    serverId: dto.Id,
    commentServerId: dto.IdCaseComment,
    caseServerId: dto.IdCase,
    fileName: dto.AttachedFile ?? '',
  };
}

const toCatalogItem = (dto: CatalogItemDto) => ({
  id: dto.Id,
  description: dto.Description ?? '',
  enable: dto.Enable ?? true,
});

const toPriorityItem = (dto: PriorityDto) => ({
  ...toCatalogItem(dto),
  hoursToClose: dto.HoursToClose,
});

export function catalogsDtoToDomain(dto: CatalogsDto): Catalogs {
  return {
    equipmentTypes: dto.equipmentTypes.map(toCatalogItem),
    modules: dto.modules.map(toCatalogItem),
    environments: dto.environments.map(toCatalogItem),
    hardwareEquipment: dto.hardwareEquipment.map(toCatalogItem),
    serviceTypes: dto.serviceTypes.map(toCatalogItem),
    priorities: dto.priorities.map(toPriorityItem),
    subStatuses: dto.subStatuses.map(toCatalogItem),
    clients: dto.clients,
  };
}

/** Entrada de creación (dominio) → cuerpo para el servidor. */
export function newCaseToCreateDto(input: NewCaseInput): CreateCaseDto {
  return {
    EquipmentTypeId: input.equipmentTypeId,
    EquipmentTypeDesc: input.equipmentTypeDesc,
    SoftwareModuleId: input.softwareModuleId ?? null,
    SoftwareModuleDesc: input.softwareModuleDesc ?? null,
    SoftwareEnvironmentId: input.softwareEnvironmentId ?? null,
    SoftwareEnvironmentDesc: input.softwareEnvironmentDesc ?? null,
    HardwareEquipmentId: input.hardwareEquipmentId ?? null,
    HardwareEquipmentDesc: input.hardwareEquipmentDesc ?? null,
    ServiceTypeId: input.serviceTypeId ?? null,
    ServiceTypeDesc: input.serviceTypeDesc ?? null,
    PriorityId: input.priorityId ?? null,
    PriorityDesc: input.priorityDesc ?? null,
    CaseDetails: input.caseDetails,
    Client: input.client ?? null,
    ReportingUser: input.reportingUser ?? null,
    ReportingUserEmail: input.reportingUserEmail ?? null,
    Location: input.location ?? null,
  };
}

export function newCommentToCreateDto(
  input: NewCommentInput,
  caseServerId: number,
): CreateCommentDto {
  return {
    IdCase: caseServerId,
    Comment: input.body,
    IsPrivate: input.isPrivate,
    StatusCaseId: input.statusCaseId ?? null,
    StatusDesc: input.statusDesc ?? null,
  };
}

export const dateUtils = { toEpoch, toIso };
