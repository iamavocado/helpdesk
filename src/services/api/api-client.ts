import type {
  AttachmentDto,
  AuthTokensDto,
  CaseDto,
  CatalogItemDto,
  CatalogsDto,
  CommentDto,
  CreateCaseDto,
  CreateCommentDto,
  LoginRequestDto,
  MemberDto,
  StatusCountDto,
  UpdateCaseDto,
} from '@/data/datasources/remote/dto';
import type { FileToUpload } from '@/domain';

export interface GetCasesParams {
  classificationId?: number;
  page?: number;
  pageSize?: number;
}

export interface SearchCasesParams {
  busqueda?: string;
  page?: number;
  pageSize?: number;
  ordenarPor?: string;
  ordenDescendente?: boolean;
  client?: string;
  statusCaseDesc?: string;
  technician?: string;
  userRequester?: string;
  idCaseClient?: number;
  nombreCompleto?: string;
  creationDate?: string;
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

  /** Países (para el select País). */
  getCountries(): Promise<CatalogItemDto[]>;
  /** Provincias/departamentos de un país (requiere idCountry). */
  getDepartments(idCountry: number): Promise<CatalogItemDto[]>;

  /** Personas asignables (para el select "Asignar a" del modal de reasignación). */
  getMembers(department: string, jfg: string): Promise<MemberDto[]>;
  /** Búsqueda de casos con filtros (GET /api/Case/filtrados). */
  searchCases(params: SearchCasesParams): Promise<PagedDto<CaseDto>>;
  /** Conteo de casos por estado (GET /api/Case/por-status-count). */
  getStatusCounts(): Promise<StatusCountDto[]>;
  /** Subestados detallados (StatusCaseSubStatus: En desarrollo, En validación…). */
  getStatusCaseSubStatuses(): Promise<CatalogItemDto[]>;
  /** Actualiza/reasigna un caso (PUT). Devuelve el caso actualizado. */
  updateCase(dto: UpdateCaseDto): Promise<CaseDto>;

  /** Adjuntos de los comentarios de un caso. */
  getAttachments(caseServerId: number): Promise<AttachmentDto[]>;
  /** Sube un archivo asociado a un comentario (multipart/form-data). */
  uploadAttachment(
    commentServerId: number,
    caseServerId: number,
    file: FileToUpload,
  ): Promise<AttachmentDto>;
}
