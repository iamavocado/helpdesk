import type {
  AuthTokensDto,
  CaseDto,
  CatalogsDto,
  CommentDto,
  CreateCaseDto,
  CreateCommentDto,
  LoginRequestDto,
} from '@/data/datasources/remote/dto';

import type { ApiClient, GetCasesParams, PagedDto } from './api-client';
import { ApiError } from './api-error';
import { withAuthRetry } from './with-auth-retry';

export interface HttpApiClientOptions {
  baseUrl: string;
  /** Access token actual (lo provee el TokenStore vía composición). */
  getToken?: () => Promise<string | null>;
  /** Renueva el token ante un 401 (lo provee la capa de auth). */
  refresh?: () => Promise<string | null>;
}

/**
 * Cliente HTTP contra la API real (fetch) con interceptor de autenticación:
 * adjunta Bearer y maneja 401 → refresh → reintento (ver SECURITY.md §3).
 * Los endpoints de auth (login/refresh) no pasan por el interceptor (anti-bucle).
 */
export class HttpApiClient implements ApiClient {
  private readonly baseUrl: string;
  private readonly getToken: () => Promise<string | null>;
  private readonly refreshToken: () => Promise<string | null>;

  constructor(options: HttpApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.getToken = options.getToken ?? (async () => null);
    this.refreshToken = options.refresh ?? (async () => null);
  }

  /** Request con autenticación (Bearer + 401→refresh→retry). */
  private authed<T>(path: string, init?: RequestInit): Promise<T> {
    return withAuthRetry((token) => this.raw<T>(path, init, token), {
      getToken: this.getToken,
      refresh: this.refreshToken,
    });
  }

  /** Request crudo (sin interceptor); opcionalmente con token. */
  private async raw<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {}),
        },
      });
    } catch (cause) {
      throw new ApiError(0, `Fallo de red: ${String(cause)}`);
    }
    if (!response.ok) throw new ApiError(response.status, `HTTP ${response.status} en ${path}`);
    return (await response.json()) as T;
  }

  login(body: LoginRequestDto): Promise<AuthTokensDto> {
    return this.raw<AuthTokensDto>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }

  refresh(refreshToken: string): Promise<AuthTokensDto> {
    return this.raw<AuthTokensDto>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  getCases(params: GetCasesParams): Promise<PagedDto<CaseDto>> {
    const q = new URLSearchParams();
    if (params.classificationId != null) q.set('classificationId', String(params.classificationId));
    if (params.page != null) q.set('page', String(params.page));
    if (params.pageSize != null) q.set('pageSize', String(params.pageSize));
    return this.authed<PagedDto<CaseDto>>(`/cases?${q.toString()}`);
  }

  getCase(serverId: number): Promise<CaseDto> {
    return this.authed<CaseDto>(`/cases/${serverId}`);
  }

  createCase(dto: CreateCaseDto): Promise<CaseDto> {
    return this.authed<CaseDto>('/cases', { method: 'POST', body: JSON.stringify(dto) });
  }

  getComments(caseServerId: number): Promise<CommentDto[]> {
    return this.authed<CommentDto[]>(`/cases/${caseServerId}/comments`);
  }

  addComment(dto: CreateCommentDto): Promise<CommentDto> {
    return this.authed<CommentDto>(`/cases/${dto.IdCase}/comments`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  getCatalogs(): Promise<CatalogsDto> {
    return this.authed<CatalogsDto>('/catalogs');
  }
}
