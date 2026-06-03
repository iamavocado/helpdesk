import type {
  CaseDto,
  CatalogsDto,
  CommentDto,
  CreateCaseDto,
  CreateCommentDto,
} from '@/data/datasources/remote/dto';

export interface GetCasesParams {
  classificationId?: number;
  page?: number;
  pageSize?: number;
}

export interface PagedDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Contrato de la API REST, desacoplado de su implementación.
 * Implementaciones: MockApiClient (en proceso) y HttpApiClient (API real).
 * Cambiar de una a otra es config, no arquitectura (ver ARCHITECTURE.md §8).
 *
 * Nota: los métodos de autenticación (login/refresh) se añaden en la Fase 4.
 */
export interface ApiClient {
  getCases(params: GetCasesParams): Promise<PagedDto<CaseDto>>;
  getCase(serverId: number): Promise<CaseDto>;
  createCase(dto: CreateCaseDto): Promise<CaseDto>;
  getComments(caseServerId: number): Promise<CommentDto[]>;
  addComment(dto: CreateCommentDto): Promise<CommentDto>;
  getCatalogs(): Promise<CatalogsDto>;
}
