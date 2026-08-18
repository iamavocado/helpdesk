import {
  type DomainError,
  networkError,
  notFoundError,
  unknownError,
  authError,
} from '@/core/errors';
import type {
  Attachment,
  Case,
  CatalogItem,
  Catalogs,
  Comment,
  FileToUpload,
  Member,
  NewCaseInput,
  NewCommentInput,
  ReassignInput,
} from '@/domain';
import { classificationIdFromStatus } from '@/domain';
import { ApiError, type ApiClient, type GetCasesParams } from '@/services/api';

import type { UpdateCaseDto } from './dto';
import {
  catalogsDtoToDomain,
  dtoToAttachment,
  dtoToCase,
  dtoToComment,
  dtoToMember,
  newCaseToCreateDto,
  newCommentToCreateDto,
} from './mappers';

export interface RemoteCasesPage {
  items: Case[];
  total: number;
  page: number;
  pageSize: number;
}

/** Traduce errores de transporte (ApiError) a errores de dominio. */
export function toDomainError(error: unknown): DomainError {
  if (error instanceof ApiError) {
    if (error.status === 0) return networkError(error.message, error);
    if (error.status === 401 || error.status === 403) return authError(error.message, error);
    if (error.status === 404) return notFoundError(error.message, error);
    return unknownError(error.message, error);
  }
  return unknownError('Error inesperado en la API', error);
}

/**
 * Fuente de datos remota: orquesta ApiClient + mappers y expone entidades de
 * dominio. Puede lanzar DomainError (lo captura el repositorio).
 */
export interface RemoteDataSource {
  fetchCases(params: GetCasesParams): Promise<RemoteCasesPage>;
  fetchCase(serverId: number): Promise<Case>;
  createCase(input: NewCaseInput): Promise<Case>;
  fetchComments(caseServerId: number, caseLocalId: string): Promise<Comment[]>;
  createComment(input: NewCommentInput, caseServerId: number): Promise<Comment>;
  fetchCatalogs(): Promise<Catalogs>;
  fetchCountries(): Promise<CatalogItem[]>;
  fetchDepartments(idCountry: number): Promise<CatalogItem[]>;
  fetchMembers(department: string, jfg: string): Promise<Member[]>;
  fetchStatusCaseSubStatuses(): Promise<CatalogItem[]>;
  updateCase(current: Case, input: ReassignInput): Promise<Case>;
  fetchAttachments(caseServerId: number): Promise<Attachment[]>;
  uploadAttachment(
    commentServerId: number,
    caseServerId: number,
    file: FileToUpload,
  ): Promise<Attachment>;
}

export class ApiRemoteDataSource implements RemoteDataSource {
  constructor(private readonly api: ApiClient) {}

  async fetchCases(params: GetCasesParams): Promise<RemoteCasesPage> {
    try {
      const page = await this.api.getCases(params);
      return {
        items: page.items.map(dtoToCase),
        total: page.total,
        page: page.page,
        pageSize: page.pageSize,
      };
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchCase(serverId: number): Promise<Case> {
    try {
      return dtoToCase(await this.api.getCase(serverId));
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async createCase(input: NewCaseInput): Promise<Case> {
    try {
      return dtoToCase(await this.api.createCase(newCaseToCreateDto(input)));
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchComments(caseServerId: number, caseLocalId: string): Promise<Comment[]> {
    try {
      const dtos = await this.api.getComments(caseServerId);
      return dtos.map((d) => dtoToComment(d, caseLocalId));
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async createComment(input: NewCommentInput, caseServerId: number): Promise<Comment> {
    try {
      const dto = await this.api.addComment(newCommentToCreateDto(input, caseServerId));
      return dtoToComment(dto, input.caseId);
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchCatalogs(): Promise<Catalogs> {
    try {
      return catalogsDtoToDomain(await this.api.getCatalogs());
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchCountries(): Promise<CatalogItem[]> {
    try {
      return (await this.api.getCountries()).map((c) => ({
        id: c.Id,
        description: c.Description ?? '',
        enable: c.Enable ?? true,
      }));
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchDepartments(idCountry: number): Promise<CatalogItem[]> {
    try {
      return (await this.api.getDepartments(idCountry)).map((c) => ({
        id: c.Id,
        description: c.Description ?? '',
        enable: c.Enable ?? true,
      }));
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchMembers(department: string, jfg: string): Promise<Member[]> {
    try {
      return (await this.api.getMembers(department, jfg)).map(dtoToMember);
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchStatusCaseSubStatuses(): Promise<CatalogItem[]> {
    try {
      return (await this.api.getStatusCaseSubStatuses()).map((c) => ({
        id: c.Id,
        description: c.Description ?? '',
        enable: c.Enable ?? true,
      }));
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async updateCase(current: Case, input: ReassignInput): Promise<Case> {
    if (current.serverId == null) {
      throw new ApiError(0, 'El caso aún no está sincronizado (sin serverId)');
    }
    // Se parte de los valores actuales y se sobreescriben los que cambian, para
    // no borrar campos que el PUT no debe tocar.
    const statusCaseId = input.statusCaseId ?? current.statusCaseId;
    const dto: UpdateCaseDto = {
      Id: current.serverId,
      UserRequester: current.userRequester,
      EmailRequester: current.requesterEmail,
      StatusCaseId: statusCaseId,
      ClassificationCaseId: classificationIdFromStatus(statusCaseId),
      PriorityId: current.priorityId,
      ServiceTypeId: input.serviceTypeId ?? current.serviceTypeId,
      EquipmentTypeId: input.equipmentTypeId ?? current.equipmentTypeId,
      Location: current.location,
      CaseDetails: input.caseDetails ?? current.caseDetails,
      Technician: input.technician,
      SubStatusCaseId: current.subStatusId,
      StatusCaseSubStatusId: input.statusCaseSubStatusId ?? null,
      StatusCaseSubStatusDesc: input.statusCaseSubStatusDesc ?? null,
    };
    try {
      return dtoToCase(await this.api.updateCase(dto));
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async fetchAttachments(caseServerId: number): Promise<Attachment[]> {
    try {
      const dtos = await this.api.getAttachments(caseServerId);
      return dtos.map(dtoToAttachment);
    } catch (e) {
      throw toDomainError(e);
    }
  }

  async uploadAttachment(
    commentServerId: number,
    caseServerId: number,
    file: FileToUpload,
  ): Promise<Attachment> {
    try {
      return dtoToAttachment(await this.api.uploadAttachment(commentServerId, caseServerId, file));
    } catch (e) {
      throw toDomainError(e);
    }
  }
}
