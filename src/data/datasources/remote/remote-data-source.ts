import {
  type DomainError,
  networkError,
  notFoundError,
  serverError,
  unknownError,
  authError,
} from '@/core/errors';
import { logger } from '@/core/logger';
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
    // 5xx: fallo transitorio del servidor → reintentable (no aparcar la operación).
    if (error.status >= 500) return serverError(error.message, error);
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
  updateCaseStatus(current: Case, statusCaseId: number, statusCaseDesc: string): Promise<Case>;
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
    logger.info('RemoteDataSource.fetchCases', { page: params.page, pageSize: params.pageSize });
    try {
      const page = await this.api.getCases(params);
      return {
        items: page.items.map(dtoToCase),
        total: page.total,
        page: page.page,
        pageSize: page.pageSize,
      };
    } catch (e) {
      logger.error('RemoteDataSource.fetchCases — error', { error: String(e) });
      throw toDomainError(e);
    }
  }

  async fetchCase(serverId: number): Promise<Case> {
    logger.info('RemoteDataSource.fetchCase', { serverId });
    try {
      return dtoToCase(await this.api.getCase(serverId));
    } catch (e) {
      logger.error('RemoteDataSource.fetchCase — error', { serverId, error: String(e) });
      throw toDomainError(e);
    }
  }

  async createCase(input: NewCaseInput): Promise<Case> {
    console.log('[DEBUG] RemoteDataSource.createCase — input:', JSON.stringify(input));
    logger.info('RemoteDataSource.createCase');
    try {
      const dto = newCaseToCreateDto(input);
      console.log('[DEBUG] RemoteDataSource.createCase — dto:', JSON.stringify(dto));
      const result = dtoToCase(await this.api.createCase(dto));
      console.log('[DEBUG] RemoteDataSource.createCase — resultado:', JSON.stringify(result));
      return result;
    } catch (e) {
      logger.error('RemoteDataSource.createCase — error', { error: String(e) });
      console.log('[DEBUG] RemoteDataSource.createCase — ERROR:', String(e));
      throw toDomainError(e);
    }
  }

  async fetchComments(caseServerId: number, caseLocalId: string): Promise<Comment[]> {
    logger.info('RemoteDataSource.fetchComments', { caseServerId });
    try {
      const dtos = await this.api.getComments(caseServerId);
      return dtos.map((d) => dtoToComment(d, caseLocalId));
    } catch (e) {
      logger.error('RemoteDataSource.fetchComments — error', { caseServerId, error: String(e) });
      throw toDomainError(e);
    }
  }

  async createComment(input: NewCommentInput, caseServerId: number): Promise<Comment> {
    logger.info('RemoteDataSource.createComment', { caseServerId });
    try {
      const dto = await this.api.addComment(newCommentToCreateDto(input, caseServerId));
      return dtoToComment(dto, input.caseId);
    } catch (e) {
      logger.error('RemoteDataSource.createComment — error', { caseServerId, error: String(e) });
      throw toDomainError(e);
    }
  }

  async fetchCatalogs(): Promise<Catalogs> {
    logger.info('RemoteDataSource.fetchCatalogs');
    try {
      return catalogsDtoToDomain(await this.api.getCatalogs());
    } catch (e) {
      logger.error('RemoteDataSource.fetchCatalogs — error', { error: String(e) });
      throw toDomainError(e);
    }
  }

  async fetchCountries(): Promise<CatalogItem[]> {
    logger.info('RemoteDataSource.fetchCountries');
    try {
      return (await this.api.getCountries()).map((c) => ({
        id: c.Id,
        description: c.Description ?? '',
        enable: c.Enable ?? true,
      }));
    } catch (e) {
      logger.error('RemoteDataSource.fetchCountries — error', { error: String(e) });
      throw toDomainError(e);
    }
  }

  async fetchDepartments(idCountry: number): Promise<CatalogItem[]> {
    logger.info('RemoteDataSource.fetchDepartments', { idCountry });
    try {
      return (await this.api.getDepartments(idCountry)).map((c) => ({
        id: c.Id,
        description: c.Description ?? '',
        enable: c.Enable ?? true,
      }));
    } catch (e) {
      logger.error('RemoteDataSource.fetchDepartments — error', { idCountry, error: String(e) });
      throw toDomainError(e);
    }
  }

  async fetchMembers(department: string, jfg: string): Promise<Member[]> {
    logger.info('RemoteDataSource.fetchMembers', { department, jfg });
    try {
      return (await this.api.getMembers(department, jfg)).map(dtoToMember);
    } catch (e) {
      logger.error('RemoteDataSource.fetchMembers — error', { department, jfg, error: String(e) });
      throw toDomainError(e);
    }
  }

  async fetchStatusCaseSubStatuses(): Promise<CatalogItem[]> {
    logger.info('RemoteDataSource.fetchStatusCaseSubStatuses');
    try {
      return (await this.api.getStatusCaseSubStatuses()).map((c) => ({
        id: c.Id,
        description: c.Description ?? '',
        enable: c.Enable ?? true,
      }));
    } catch (e) {
      logger.error('RemoteDataSource.fetchStatusCaseSubStatuses — error', { error: String(e) });
      throw toDomainError(e);
    }
  }

  async updateCase(current: Case, input: ReassignInput): Promise<Case> {
    if (current.serverId == null) {
      throw new ApiError(0, 'El caso aún no está sincronizado (sin serverId)');
    }
    logger.info('RemoteDataSource.updateCase', { serverId: current.serverId });
    // Se parte de los valores actuales y se sobreescriben los que cambian, para
    // no borrar campos que el PUT no debe tocar.
    const statusCaseId = input.statusCaseId ?? current.statusCaseId;
    const dto: UpdateCaseDto = {
      Id: current.serverId,
      UserRequester: current.userRequester,
      EmailRequester: current.requesterEmail,
      StatusCaseId: statusCaseId,
      ClassificationCaseId: statusCaseId, // el backend exige cls == status
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
      logger.error('RemoteDataSource.updateCase — error', {
        serverId: current.serverId,
        error: String(e),
      });
      throw toDomainError(e);
    }
  }

  /**
   * Actualiza SOLO el estado con un PUT mínimo
   * `{Id, UserRequester, StatusCaseId, ClassificationCaseId}`.
   * IMPORTANTE: el backend EXIGE que `classificationCaseId` sea IGUAL a
   * `statusCaseId` (verificado en vivo: cualquier valor distinto → 500). Con este
   * valor, TODOS los estados funcionan (1–6, incluido Cerrado). La clasificación
   * real (pendiente/cola/cerrado) no se ve afectada: la app la deriva del
   * `statusCaseId` en la lista y el detalle.
   */
  async updateCaseStatus(current: Case, statusCaseId: number): Promise<Case> {
    if (current.serverId == null) {
      throw new ApiError(0, 'El caso aún no está sincronizado (sin serverId)');
    }
    logger.info('RemoteDataSource.updateCaseStatus', {
      serverId: current.serverId,
      statusCaseId,
    });
    const dto: UpdateCaseDto = {
      Id: current.serverId,
      UserRequester: current.userRequester,
      StatusCaseId: statusCaseId,
      ClassificationCaseId: statusCaseId, // el backend exige cls == status
    };
    try {
      return dtoToCase(await this.api.updateCase(dto));
    } catch (e) {
      logger.error('RemoteDataSource.updateCaseStatus — error', {
        serverId: current.serverId,
        statusCaseId,
        error: String(e),
      });
      throw toDomainError(e);
    }
  }

  async fetchAttachments(caseServerId: number): Promise<Attachment[]> {
    logger.info('RemoteDataSource.fetchAttachments', { caseServerId });
    try {
      const dtos = await this.api.getAttachments(caseServerId);
      return dtos.map(dtoToAttachment);
    } catch (e) {
      logger.error('RemoteDataSource.fetchAttachments — error', {
        caseServerId,
        error: String(e),
      });
      throw toDomainError(e);
    }
  }

  async uploadAttachment(
    commentServerId: number,
    caseServerId: number,
    file: FileToUpload,
  ): Promise<Attachment> {
    logger.info('RemoteDataSource.uploadAttachment', {
      commentServerId,
      caseServerId,
      fileName: file.name,
    });
    try {
      return dtoToAttachment(await this.api.uploadAttachment(commentServerId, caseServerId, file));
    } catch (e) {
      logger.error('RemoteDataSource.uploadAttachment — error', {
        commentServerId,
        caseServerId,
        error: String(e),
      });
      throw toDomainError(e);
    }
  }
}
