import type {
  CaseDto,
  CatalogsDto,
  CommentDto,
  CreateCaseDto,
  CreateCommentDto,
} from '@/data/datasources/remote/dto';
import { generateSeed, type SeedData } from '@/mock';

import type { ApiClient, GetCasesParams, PagedDto } from './api-client';
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
      UserRequester: dto.ReportingUser ?? 'Usuario',
      EmailRequester: dto.ReportingUserEmail ?? null,
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
      CountryDesc: null,
      DepartmentDesc: null,
    };
    this.cases.push(created);
    return created;
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
      UserRequester: 'Usuario',
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
}
