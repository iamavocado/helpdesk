import { env } from '@/core/config/env';
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
} from '@/data/datasources/remote/dto';
import type { FileToUpload } from '@/domain';

import type { ApiClient, GetCasesParams, PagedDto } from './api-client';
import { ApiError } from './api-error';
import { withAuthRetry } from './with-auth-retry';

/**
 * Cliente HTTP contra la API real DOZZIER (HelpDesk.Api).
 *
 * Adapta el contrato real (camelCase, respuestas envueltas en ApiRespuesta,
 * lista de casos "liviana") al contrato interno DTO (PascalCase) que consumen
 * los mappers, el mock y los tests. Toda la lógica específica de la API vive aquí.
 *
 * Notas del contrato real (validado en DESA):
 * - Auth: un solo token JWT + expiración (sin refresh token, sin datos de usuario).
 * - Lista GET /api/Case no trae classificationCaseId ni equipmentType → se derivan.
 * - Comentarios: /api/CasesComment no filtra por caso (limitación del backend).
 */

interface ApiRespuesta<T> {
  exitoso: boolean;
  mensaje: string | null;
  datos: T;
  errores: string[] | null;
  codigoEstado: number;
}

interface Paginado<T> {
  items: T[] | null;
  numeroPagina: number;
  tamanoPagina: number;
  totalRegistros: number;
  totalPaginas: number;
}

/** Caso liviano (lista) tal como lo devuelve la API. */
interface ApiCaseList {
  id: number;
  userRequester: string | null;
  emailRequester: string | null;
  creationDate: string | null;
  modificationDate: string | null;
  solutionDate: string | null;
  statusCaseId: number | null;
  statusCaseDesc: string | null;
  priorityId: number | null;
  priorityDesc: string | null;
  technician: string | null;
  caseDetails: string | null;
  serviceTypeId: number | null;
  serviceTypeDesc: string | null;
  location: string | null;
  client: string | null;
}

/** Caso completo (detalle). */
interface ApiCaseDetail extends ApiCaseList {
  classificationCaseId: number | null;
  equipmentTypeId: number | null;
  equipmentTypeDesc: string | null;
  softwareModuleId: number | null;
  softwareModuleDesc: string | null;
  softwareEnvironmentId: number | null;
  softwareEnvironmentDesc: string | null;
  hardwareEquipmentId: number | null;
  hardwareEquipmentDesc: string | null;
  subStatusCaseId: number | null;
  countryId: number | null;
  countryDesc: string | null;
  departmentId: number | null;
  departmentDesc: string | null;
  reportingUser: string | null;
  reportingUserEmail: string | null;
}

interface ApiComment {
  id: number;
  idCase: number;
  comment: string | null;
  creationDate: string | null;
  statusCaseId: number | null;
  statusDesc: string | null;
  userRequester: string | null;
  isPrivate: boolean | null;
  attachedFile: string | null;
}

interface ApiAttachment {
  id: number;
  idCaseComment: number;
  idCase: number;
  attachedFile: string | null;
}

interface ApiCatalogItem {
  id: number;
  description: string | null;
  enable: boolean | null;
  hoursToClose?: number | null;
  name?: string | null;
}

export interface HttpApiClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  refresh?: () => Promise<string | null>;
}

/**
 * Mapa estado → clasificación (las 3 reales: 1 Pendiente, 2 Cola, 3 Cerrado).
 * La lista no trae classificationCaseId; se deriva del statusCaseId.
 * Heurística documentada (ver integración API): 4 (Cerrado)→Cerrado;
 * 5 (espera AIG) y 6 (espera cliente)→Pendiente.
 */
const STATUS_TO_CLASSIFICATION: Readonly<Record<number, number>> = {
  1: 1,
  2: 2,
  3: 3,
  4: 3,
  5: 1,
  6: 1,
};

function classificationFromStatus(statusCaseId: number | null): number {
  if (statusCaseId == null) return 1;
  return STATUS_TO_CLASSIFICATION[statusCaseId] ?? 1;
}

/** Decodifica el payload de un JWT (claims) sin verificar firma. */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const atobFn = (globalThis as { atob?: (s: string) => string }).atob;
    if (!payload || !atobFn) return {};
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atobFn(normalized)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

export class HttpApiClient implements ApiClient {
  private readonly baseUrl: string;
  private readonly getToken: () => Promise<string | null>;
  private readonly refreshToken: () => Promise<string | null>;

  constructor(options: HttpApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.getToken = options.getToken ?? (async () => null);
    this.refreshToken = options.refresh ?? (async () => null);
  }

  /** Petición cruda que desempaqueta ApiRespuesta y valida `exitoso`. */
  private async call<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {}),
        },
      });
    } catch (cause) {
      throw new ApiError(0, `Fallo de red: ${String(cause)}`);
    }
    if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status} en ${path}`);
    const body = (await res.json()) as ApiRespuesta<T>;
    if (body && body.exitoso === false) {
      throw new ApiError(body.codigoEstado || 400, body.mensaje ?? 'Error de la API');
    }
    return body.datos;
  }

  /** Petición autenticada con interceptor 401 → (sin refresh) → logout. */
  private authed<T>(path: string, init?: RequestInit): Promise<T> {
    return withAuthRetry((token) => this.call<T>(path, init, token), {
      getToken: this.getToken,
      refresh: this.refreshToken,
    });
  }

  async login(body: LoginRequestDto): Promise<AuthTokensDto> {
    const datos = await this.call<{ token: string; expiracion: string }>('/api/Auth/login', {
      method: 'POST',
      body: JSON.stringify({
        nombreUsuario: body.username,
        password: body.password,
        dominio: env.dominio,
      }),
    });
    const claims = decodeJwt(datos.token);
    const name =
      str(claims['name']) ??
      str(claims['unique_name']) ??
      str(claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']) ??
      body.username;
    const email =
      str(claims['email']) ??
      str(claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']) ??
      '';
    // La API no expone refresh token: se guarda vacío → en 401 se fuerza re-login.
    return {
      accessToken: datos.token,
      refreshToken: '',
      user: { username: body.username, name, email },
    };
  }

  // La API no tiene refresh token; al guardarse vacío, el interceptor nunca
  // llega aquí (en 401 fuerza re-login). Se deja por contrato de ApiClient.
  refresh(_refreshToken: string): Promise<AuthTokensDto> {
    return Promise.reject(new ApiError(401, 'La API no soporta refresh token'));
  }

  async getCases(params: GetCasesParams): Promise<PagedDto<CaseDto>> {
    const q = new URLSearchParams();
    q.set('numeroPagina', String(params.page ?? 1));
    q.set('tamanoPagina', String(params.pageSize ?? 20));
    q.set('ordenarPor', 'creationDate');
    q.set('ordenDescendente', 'true');
    const page = await this.authed<Paginado<ApiCaseList>>(`/api/Case?${q.toString()}`);
    return {
      items: (page.items ?? []).map((c) => this.listToCaseDto(c)),
      page: page.numeroPagina,
      pageSize: page.tamanoPagina,
      total: page.totalRegistros,
    };
  }

  async getCase(serverId: number): Promise<CaseDto> {
    const d = await this.authed<ApiCaseDetail>(`/api/Case/${serverId}`);
    return this.detailToCaseDto(d);
  }

  async createCase(dto: CreateCaseDto): Promise<CaseDto> {
    const d = await this.authed<ApiCaseDetail>('/api/Case', {
      method: 'POST',
      body: JSON.stringify({
        equipmentTypeId: dto.EquipmentTypeId,
        softwareModuleId: dto.SoftwareModuleId,
        softwareEnvironmentId: dto.SoftwareEnvironmentId,
        hardwareEquipmentId: dto.HardwareEquipmentId,
        serviceTypeId: dto.ServiceTypeId,
        priorityId: dto.PriorityId,
        caseDetails: dto.CaseDetails,
        client: dto.Client,
        reportingUser: dto.ReportingUser,
        reportingUserEmail: dto.ReportingUserEmail,
        location: dto.Location,
      }),
    });
    return this.detailToCaseDto(d);
  }

  /**
   * Limitación del backend: /api/CasesComment no filtra por caso. Como workaround
   * de un solo request, se trae una página amplia ordenada por fecha y se filtra
   * por idCase en el cliente (pendiente de que el backend acepte idCase).
   */
  async getComments(caseServerId: number): Promise<CommentDto[]> {
    const q = new URLSearchParams();
    q.set('numeroPagina', '1');
    q.set('tamanoPagina', '200');
    q.set('ordenarPor', 'creationDate');
    q.set('ordenDescendente', 'true');
    const page = await this.authed<Paginado<ApiComment>>(`/api/CasesComment?${q.toString()}`);
    return (page.items ?? [])
      .filter((c) => c.idCase === caseServerId)
      .map((c) => this.commentToDto(c))
      .reverse();
  }

  async addComment(dto: CreateCommentDto): Promise<CommentDto> {
    const c = await this.authed<ApiComment>('/api/CasesComment', {
      method: 'POST',
      body: JSON.stringify({
        idCase: dto.IdCase,
        comment: dto.Comment,
        isPrivate: dto.IsPrivate,
        statusCaseId: dto.StatusCaseId,
      }),
    });
    return this.commentToDto(c);
  }

  /**
   * Adjuntos de un caso. El backend no permite filtrar por caso, así que se trae
   * una página amplia y se filtra por `idCase` en el cliente (mismo workaround
   * que `getComments`; pendiente de que la API acepte el filtro).
   */
  async getAttachments(caseServerId: number): Promise<AttachmentDto[]> {
    const q = new URLSearchParams();
    q.set('numeroPagina', '1');
    q.set('tamanoPagina', '2000');
    const page = await this.authed<Paginado<ApiAttachment>>(
      `/api/CasesCommentsAttach?${q.toString()}`,
    );
    return (page.items ?? [])
      .filter((a) => a.idCase === caseServerId)
      .map((a) => this.attachmentToDto(a));
  }

  /**
   * Sube un archivo (multipart/form-data). No usa `call()` porque el body es
   * FormData: fetch debe fijar el boundary del Content-Type automáticamente.
   */
  async uploadAttachment(
    commentServerId: number,
    caseServerId: number,
    file: FileToUpload,
  ): Promise<AttachmentDto> {
    const form = new FormData();
    form.append('IdCaseComment', String(commentServerId));
    form.append('IdCase', String(caseServerId));
    // En React Native el archivo se adjunta como {uri, name, type}.
    form.append('File', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);

    const attach = await withAuthRetry(
      async (token) => {
        let res: Response;
        try {
          res = await fetch(`${this.baseUrl}/api/CasesCommentsAttach/upload-file`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: form,
          });
        } catch (cause) {
          throw new ApiError(0, `Fallo de red: ${String(cause)}`);
        }
        if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status} al subir el adjunto`);
        const body = (await res.json()) as ApiRespuesta<ApiAttachment>;
        if (body && body.exitoso === false) {
          throw new ApiError(body.codigoEstado || 400, body.mensaje ?? 'Error al subir el adjunto');
        }
        return body.datos;
      },
      { getToken: this.getToken, refresh: this.refreshToken },
    );
    return this.attachmentToDto(attach);
  }

  async getCatalogs(): Promise<CatalogsDto> {
    const fetchCat = (name: string) =>
      this.authed<ApiCatalogItem[]>(`/api/${name}/todos`).catch(() => [] as ApiCatalogItem[]);
    const [
      equipmentTypes,
      modules,
      environments,
      hardwareEquipment,
      serviceTypes,
      priorities,
      subStatuses,
      clients,
    ] = await Promise.all([
      fetchCat('EquipmentType'),
      fetchCat('Module'),
      fetchCat('Environment'),
      fetchCat('HardwareEquipment'),
      fetchCat('ServiceType'),
      fetchCat('Priority'),
      fetchCat('SubStatusCase'),
      fetchCat('Client'),
    ]);
    const item = (c: ApiCatalogItem): CatalogItemDto => ({
      Id: c.id,
      Description: c.description ?? c.name ?? '',
      Enable: c.enable ?? true,
    });
    return {
      equipmentTypes: equipmentTypes.map(item),
      modules: modules.map(item),
      environments: environments.map(item),
      hardwareEquipment: hardwareEquipment.map(item),
      serviceTypes: serviceTypes.map(item),
      priorities: priorities.map((c) => ({ ...item(c), HoursToClose: c.hoursToClose ?? null })),
      subStatuses: subStatuses.map(item),
      clients: clients.map((c) => c.description ?? c.name ?? '').filter((s) => s.length > 0),
    };
  }

  // --- Transformaciones API real → DTO interno (PascalCase) ---

  private listToCaseDto(c: ApiCaseList): CaseDto {
    return {
      Id: c.id,
      UserRequester: c.userRequester,
      EmailRequester: c.emailRequester,
      ReportingUser: null,
      ReportingUserEmail: null,
      CreationDate: c.creationDate ?? new Date().toISOString(),
      ModificationDate: c.modificationDate,
      SolutionDate: c.solutionDate,
      ClassificationCaseId: classificationFromStatus(c.statusCaseId),
      StatusCaseId: c.statusCaseId,
      StatusCaseDesc: c.statusCaseDesc,
      SubStatusCaseId: null,
      EquipmentTypeId: null,
      EquipmentTypeDesc: c.serviceTypeDesc, // la lista no trae categoría; se usa el tipo de servicio como respaldo
      SoftwareModuleId: null,
      SoftwareModuleDesc: null,
      SoftwareEnvironmentId: null,
      SoftwareEnvironmentDesc: null,
      HardwareEquipmentId: null,
      HardwareEquipmentDesc: null,
      PriorityId: c.priorityId,
      PriorityDesc: c.priorityDesc,
      ServiceTypeId: c.serviceTypeId,
      ServiceTypeDesc: c.serviceTypeDesc,
      CaseDetails: c.caseDetails,
      Technician: c.technician,
      Location: c.location,
      Client: c.client,
      CountryDesc: null,
      DepartmentDesc: null,
    };
  }

  private detailToCaseDto(c: ApiCaseDetail): CaseDto {
    return {
      ...this.listToCaseDto(c),
      ReportingUser: c.reportingUser,
      ReportingUserEmail: c.reportingUserEmail,
      ClassificationCaseId: c.classificationCaseId ?? classificationFromStatus(c.statusCaseId),
      SubStatusCaseId: c.subStatusCaseId,
      EquipmentTypeId: c.equipmentTypeId,
      EquipmentTypeDesc: c.equipmentTypeDesc,
      SoftwareModuleId: c.softwareModuleId,
      SoftwareModuleDesc: c.softwareModuleDesc,
      SoftwareEnvironmentId: c.softwareEnvironmentId,
      SoftwareEnvironmentDesc: c.softwareEnvironmentDesc,
      HardwareEquipmentId: c.hardwareEquipmentId,
      HardwareEquipmentDesc: c.hardwareEquipmentDesc,
      CountryDesc: c.countryDesc,
      DepartmentDesc: c.departmentDesc,
    };
  }

  private attachmentToDto(a: ApiAttachment): AttachmentDto {
    return {
      Id: a.id,
      IdCaseComment: a.idCaseComment,
      IdCase: a.idCase,
      AttachedFile: a.attachedFile,
    };
  }

  private commentToDto(c: ApiComment): CommentDto {
    return {
      Id: c.id,
      IdCase: c.idCase,
      Comment: c.comment,
      CreationDate: c.creationDate ?? new Date().toISOString(),
      StatusCaseId: c.statusCaseId,
      StatusDesc: c.statusDesc,
      ClassificationCaseId: null,
      SubStatusCaseId: null,
      UserRequester: c.userRequester,
      IsPrivate: c.isPrivate,
      AttachedFile: c.attachedFile,
    };
  }
}

export { classificationFromStatus };
