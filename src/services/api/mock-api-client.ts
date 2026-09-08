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
import { generateSeed, type SeedData } from '@/mock';

import type { ApiClient, GetCasesParams, PagedDto, SearchCasesParams } from './api-client';
import { ApiError } from './api-error';

export interface MockApiClientOptions {
  /** Latencia simulada por request (ms). 0 en tests. */
  latencyMs?: number;
  /** Semilla inicial; por defecto, el seed generado. */
  seed?: SeedData;
}

/**
 * Implementación en proceso de ApiClient (equivalente al mock server, ver
 * STACK_DECISION.md y MOCK_SERVER.md). Mantiene el estado en memoria y simula
 * la asignación de IDs del servidor al crear. Sin riesgo nativo, testeable en Jest.
 */
export class MockApiClient implements ApiClient {
  private cases: CaseDto[];
  private comments: CommentDto[];
  private catalogs: CatalogsDto;
  private latencyMs: number;
  private nextCaseId: number;
  private attachments: AttachmentDto[] = [];
  private nextAttachmentId = 1;

  constructor(options: MockApiClientOptions = {}) {
    const data = options.seed ?? generateSeed();
    this.cases = [...data.cases];
    this.comments = [...data.comments];
    this.catalogs = data.catalogs;
    this.latencyMs = options.latencyMs ?? 0;
    this.nextCaseId = this.cases.reduce((max, c) => Math.max(max, c.Id), 0) + 1;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
  }

  // --- Autenticación (demo) ---

  private issueTokens(username: string): AuthTokensDto {
    // Token pseudo-JWT (no real): payload base64 con expiración a 15 min.
    const payload = { sub: username, exp: Date.now() + 15 * 60_000 };
    const token = `mock.${encodeURIComponent(JSON.stringify(payload))}.sig`;
    return {
      accessToken: token,
      refreshToken: `refresh.${username}.${Date.now()}`,
      user: {
        username,
        name: this.displayName(username),
        email: `${username}@ita-sa.com`,
        role: 'Usuario',
        departmentName: 'IT',
        jobFunction: 'Usuario',
      },
    };
  }

  private displayName(username: string): string {
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  async login(body: LoginRequestDto): Promise<AuthTokensDto> {
    await this.delay();
    // Credencial demo: cualquier usuario no vacío con contraseña 'dozzier'.
    if (!body.username.trim() || body.password !== 'dozzier') {
      throw new ApiError(401, 'Credenciales inválidas');
    }
    return this.issueTokens(body.username.trim());
  }

  async refresh(refreshToken: string): Promise<AuthTokensDto> {
    await this.delay();
    const username = refreshToken.split('.')[1];
    if (!refreshToken.startsWith('refresh.') || !username) {
      throw new ApiError(401, 'Refresh token inválido');
    }
    return this.issueTokens(username);
  }

  async getCases(params: GetCasesParams): Promise<PagedDto<CaseDto>> {
    await this.delay();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const filtered = this.cases
      .filter(
        (c) =>
          params.classificationId == null || c.ClassificationCaseId === params.classificationId,
      )
      .sort((a, b) => Date.parse(b.CreationDate) - Date.parse(a.CreationDate));
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
    };
  }

  async searchCases(params: SearchCasesParams): Promise<PagedDto<CaseDto>> {
    await this.delay();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = (params.busqueda ?? '').toLowerCase().trim();
    const filtered = this.cases.filter((c) => {
      if (!query) return true;
      const searchable = [
        c.CaseDetails,
        c.Technician,
        c.UserRequester,
        c.Client,
        c.StatusCaseDesc,
        c.Location,
        String(c.IdCaseClient),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total: filtered.length,
    };
  }

  async getCase(serverId: number): Promise<CaseDto> {
    await this.delay();
    const found = this.cases.find((c) => c.Id === serverId);
    if (!found) throw new ApiError(404, `Caso ${serverId} no encontrado`);
    return found;
  }

  async createCase(dto: CreateCaseDto): Promise<CaseDto> {
    await this.delay();
    const id = this.nextCaseId++;
    const nowIso = new Date().toISOString();
    const created: CaseDto = {
      Id: id,
      UserRequester: dto.UserRequester ?? dto.ReportingUser ?? 'Usuario',
      EmailRequester: dto.EmailRequester ?? dto.ReportingUserEmail ?? null,
      ReportingUser: dto.ReportingUser ?? null,
      ReportingUserEmail: dto.ReportingUserEmail ?? null,
      CreationDate: nowIso,
      ModificationDate: nowIso,
      SolutionDate: null,
      ClassificationCaseId: 1, // nuevo caso => Pendiente
      StatusCaseId: 1,
      StatusCaseDesc: 'En espera de respuesta soporte',
      SubStatusCaseId: 1,
      EquipmentTypeId: dto.EquipmentTypeId,
      EquipmentTypeDesc: dto.EquipmentTypeDesc,
      SoftwareModuleId: dto.SoftwareModuleId ?? null,
      SoftwareModuleDesc: dto.SoftwareModuleDesc ?? null,
      SoftwareEnvironmentId: dto.SoftwareEnvironmentId ?? null,
      SoftwareEnvironmentDesc: dto.SoftwareEnvironmentDesc ?? null,
      HardwareEquipmentId: dto.HardwareEquipmentId ?? null,
      HardwareEquipmentDesc: dto.HardwareEquipmentDesc ?? null,
      PriorityId: dto.PriorityId ?? null,
      PriorityDesc: dto.PriorityDesc ?? null,
      ServiceTypeId: dto.ServiceTypeId ?? null,
      ServiceTypeDesc: dto.ServiceTypeDesc ?? null,
      CaseDetails: dto.CaseDetails,
      Technician: null,
      Location: dto.Location ?? null,
      Client: dto.Client ?? null,
      CountryDesc: dto.CountryDesc ?? null,
      DepartmentDesc: dto.DepartmentDesc ?? null,
    };
    this.cases.push(created);
    return created;
  }

  async getCountries(): Promise<CatalogItemDto[]> {
    await this.delay();
    return [{ Id: 1, Description: 'PANAMÁ', Enable: true }];
  }

  async getDepartments(idCountry: number): Promise<CatalogItemDto[]> {
    await this.delay();
    if (idCountry !== 1) return [];
    return [
      'BOCAS DEL TORO',
      'COCLÉ',
      'COLÓN',
      'CHIRIQUÍ',
      'DARIÉN',
      'HERRERA',
      'LOS SANTOS',
      'PANAMÁ',
      'VERAGUAS',
      'PANAMÁ OESTE',
    ].map((description, i) => ({ Id: i + 1, Description: description, Enable: true }));
  }

  async getComments(caseServerId: number): Promise<CommentDto[]> {
    await this.delay();
    return this.comments
      .filter((c) => c.IdCase === caseServerId)
      .sort((a, b) => Date.parse(a.CreationDate) - Date.parse(b.CreationDate));
  }

  async addComment(dto: CreateCommentDto): Promise<CommentDto> {
    await this.delay();
    if (!this.cases.some((c) => c.Id === dto.IdCase)) {
      throw new ApiError(404, `Caso ${dto.IdCase} no encontrado`);
    }
    const caseComments = this.comments.filter((c) => c.IdCase === dto.IdCase);
    const id = caseComments.reduce((max, c) => Math.max(max, c.Id), 0) + 1;
    const created: CommentDto = {
      Id: id,
      IdCase: dto.IdCase,
      Comment: dto.Comment,
      CreationDate: new Date().toISOString(),
      StatusCaseId: dto.StatusCaseId ?? null,
      StatusDesc: dto.StatusDesc ?? null,
      ClassificationCaseId: null,
      SubStatusCaseId: null,
      UserRequester: dto.UserRequester ?? 'Usuario',
      IsPrivate: dto.IsPrivate,
      AttachedFile: null,
    };
    this.comments.push(created);
    return created;
  }

  async getCatalogs(): Promise<CatalogsDto> {
    await this.delay();
    return this.catalogs;
  }

  async getStatusCounts(): Promise<StatusCountDto[]> {
    await this.delay();
    // Conteo demo basado en los casos existentes.
    const counts: Record<string, number> = {};
    for (const c of this.cases) {
      const desc = c.StatusCaseDesc ?? 'Desconocido';
      counts[desc] = (counts[desc] ?? 0) + 1;
    }
    return Object.entries(counts).map(([statusCaseDesc, cantidadCasos]) => ({
      statusCaseDesc,
      cantidadCasos,
    }));
  }

  async getRecentCases(): Promise<PagedDto<CaseDto>> {
    await this.delay();
    // Últimos 20 casos ordenados por fecha de creación (descendente).
    const sorted = [...this.cases].sort(
      (a, b) => Date.parse(b.CreationDate) - Date.parse(a.CreationDate),
    );
    const items = sorted.slice(0, 20);
    return { items, page: 1, pageSize: 20, total: items.length };
  }

  async getMembers(): Promise<MemberDto[]> {
    await this.delay();
    // Lista demo equivalente a la del portal (en real viene de Ultimus/AD).
    return [
      'Irvin Josué Acosta Chávez',
      'Rommel Pérez',
      'Roberto Rueda',
      'Angel Alvarado',
      'Diego Tapias',
      'Daniel Tapias',
      'Soporte SPA nivel 2',
      'Soporte Salas Audiencias',
    ].map((fullName, i) => ({
      UserFullName: fullName,
      UserName: `DESA/user${i + 1}`,
      EmailAddress: null,
      JobFunction: 'Soporte',
    }));
  }

  async getStatusCaseSubStatuses(): Promise<CatalogItemDto[]> {
    await this.delay();
    return [
      { Id: 1, Description: 'En desarrollo', Enable: true },
      { Id: 2, Description: 'En validación', Enable: true },
      { Id: 3, Description: 'En espera pase a producción', Enable: true },
      { Id: 4, Description: 'Para revisión', Enable: true },
    ];
  }

  async updateCase(dto: UpdateCaseDto): Promise<CaseDto> {
    await this.delay();
    const idx = this.cases.findIndex((c) => c.Id === dto.Id);
    if (idx < 0) throw new ApiError(404, `Caso ${dto.Id} no encontrado`);
    const current = this.cases[idx];
    const updated: CaseDto = {
      ...current,
      StatusCaseId: dto.StatusCaseId ?? current.StatusCaseId,
      ClassificationCaseId: dto.ClassificationCaseId ?? current.ClassificationCaseId,
      ServiceTypeId: dto.ServiceTypeId ?? current.ServiceTypeId,
      EquipmentTypeId: dto.EquipmentTypeId ?? current.EquipmentTypeId,
      Location: dto.Location ?? current.Location,
      CaseDetails: dto.CaseDetails ?? current.CaseDetails,
      Technician: dto.Technician ?? current.Technician,
      SubStatusCaseId: dto.SubStatusCaseId ?? current.SubStatusCaseId,
      ModificationDate: new Date().toISOString(),
    };
    this.cases[idx] = updated;
    return updated;
  }

  async getAttachments(caseServerId: number): Promise<AttachmentDto[]> {
    await this.delay();
    return this.attachments.filter((a) => a.IdCase === caseServerId);
  }

  async uploadAttachment(
    commentServerId: number,
    caseServerId: number,
    file: FileToUpload,
  ): Promise<AttachmentDto> {
    await this.delay();
    const exists = this.comments.some((c) => c.Id === commentServerId && c.IdCase === caseServerId);
    if (!exists) {
      throw new ApiError(
        404,
        `Comentario ${commentServerId} del caso ${caseServerId} no encontrado`,
      );
    }
    const created: AttachmentDto = {
      Id: this.nextAttachmentId++,
      IdCaseComment: commentServerId,
      IdCase: caseServerId,
      AttachedFile: file.name,
    };
    this.attachments.push(created);
    return created;
  }
}
