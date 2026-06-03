import {
  type DomainError,
  networkError,
  notFoundError,
  unknownError,
  authError,
} from '@/core/errors';
import type { Case, Catalogs, Comment, NewCaseInput, NewCommentInput } from '@/domain';
import { ApiError, type ApiClient, type GetCasesParams } from '@/services/api';

import {
  catalogsDtoToDomain,
  dtoToCase,
  dtoToComment,
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
}
