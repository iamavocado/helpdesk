import type {
  CaseDto,
  CatalogsDto,
  CommentDto,
  CreateCaseDto,
  CreateCommentDto,
} from '@/data/datasources/remote/dto';

import type { ApiClient, GetCasesParams, PagedDto } from './api-client';
import { ApiError } from './api-error';

/**
 * Cliente HTTP contra la API real (basado en fetch).
 * Esqueleto de Fase 3: el interceptor de autenticación (Bearer, 401→refresh)
 * se añade en la Fase 4. La URL base proviene de la config de entorno.
 */
export class HttpApiClient implements ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      });
    } catch (cause) {
      throw new ApiError(0, `Fallo de red: ${String(cause)}`);
    }
    if (!response.ok) {
      throw new ApiError(response.status, `HTTP ${response.status} en ${path}`);
    }
    return (await response.json()) as T;
  }

  getCases(params: GetCasesParams): Promise<PagedDto<CaseDto>> {
    const q = new URLSearchParams();
    if (params.classificationId != null) q.set('classificationId', String(params.classificationId));
    if (params.page != null) q.set('page', String(params.page));
    if (params.pageSize != null) q.set('pageSize', String(params.pageSize));
    return this.request<PagedDto<CaseDto>>(`/cases?${q.toString()}`);
  }

  getCase(serverId: number): Promise<CaseDto> {
    return this.request<CaseDto>(`/cases/${serverId}`);
  }

  createCase(dto: CreateCaseDto): Promise<CaseDto> {
    return this.request<CaseDto>('/cases', { method: 'POST', body: JSON.stringify(dto) });
  }

  getComments(caseServerId: number): Promise<CommentDto[]> {
    return this.request<CommentDto[]>(`/cases/${caseServerId}/comments`);
  }

  addComment(dto: CreateCommentDto): Promise<CommentDto> {
    return this.request<CommentDto>(`/cases/${dto.IdCase}/comments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  getCatalogs(): Promise<CatalogsDto> {
    return this.request<CatalogsDto>('/catalogs');
  }
}
