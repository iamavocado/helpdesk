import type {
  AuthTokensDto,
  CaseDto,
  CatalogsDto,
  CommentDto,
  CreateCaseDto,
  CreateCommentDto,
  LoginRequestDto,
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
 */
export interface ApiClient {
  login(body: LoginRequestDto): Promise<AuthTokensDto>;
  /** Renueva el par de tokens a partir del refresh token. */
  refresh(refreshToken: string): Promise<AuthTokensDto>;

  getCases(params: GetCasesParams): Promise<PagedDto<CaseDto>>;
  getCase(serverId: number): Promise<CaseDto>;
  createCase(dto: CreateCaseDto): Promise<CaseDto>;
  getComments(caseServerId: number): Promise<CommentDto[]>;
  addComment(dto: CreateCommentDto): Promise<CommentDto>;
  getCatalogs(): Promise<CatalogsDto>;
}
