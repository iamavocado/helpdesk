import { DomainError, notFoundError, unknownError } from '@/core/errors';
import { uuid } from '@/core/utils/id';
import {
  classificationFromId,
  ok,
  err,
  type Case,
  type CaseRepository,
  type ListCasesParams,
  type NewCaseInput,
  type PagedCases,
  type Result,
} from '@/domain';

import type { LocalDataSource } from '../datasources/local';
import type { RemoteDataSource } from '../datasources/remote';
import type { PendingOperation } from '../sync';

const CASES_TABLE = 'cases';

/**
 * Repositorio de casos offline-first:
 * - lecturas desde la BD local (fuente de verdad para UI),
 * - escrituras persisten local + encolan operación de sync,
 * - refresh hace pull tolerante a falta de red.
 */
export class CaseRepositoryImpl implements CaseRepository {
  constructor(
    private readonly local: LocalDataSource,
    private readonly remote: RemoteDataSource,
    private readonly now: () => number = Date.now,
    private readonly idGen: () => string = uuid,
  ) {}

  async list(params: ListCasesParams): Promise<Result<PagedCases, DomainError>> {
    try {
      return ok(await this.local.listCases(params));
    } catch (e) {
      return err(unknownError('No se pudo listar casos', e));
    }
  }

  async getById(id: string): Promise<Result<Case, DomainError>> {
    const found = await this.local.getCaseById(id);
    return found ? ok(found) : err(notFoundError(`Caso ${id} no encontrado`));
  }

  async create(input: NewCaseInput): Promise<Result<Case, DomainError>> {
    const timestamp = this.now();
    const id = this.idGen();
    const newCase: Case = {
      id,
      serverId: null,
      userRequester: input.reportingUser ?? '',
      requesterEmail: input.reportingUserEmail ?? null,
      reportingUser: input.reportingUser ?? null,
      reportingUserEmail: input.reportingUserEmail ?? null,
      creationDate: timestamp,
      modificationDate: timestamp,
      solutionDate: null,
      classificationId: 1,
      classification: classificationFromId(1),
      statusCaseId: 1,
      statusCaseDesc: 'En espera de respuesta soporte',
      subStatusId: 1,
      equipmentTypeId: input.equipmentTypeId,
      equipmentTypeDesc: input.equipmentTypeDesc,
      softwareModuleId: input.softwareModuleId ?? null,
      softwareModuleDesc: input.softwareModuleDesc ?? null,
      softwareEnvironmentId: input.softwareEnvironmentId ?? null,
      softwareEnvironmentDesc: input.softwareEnvironmentDesc ?? null,
      hardwareEquipmentId: input.hardwareEquipmentId ?? null,
      hardwareEquipmentDesc: input.hardwareEquipmentDesc ?? null,
      priorityId: input.priorityId ?? null,
      priorityDesc: input.priorityDesc ?? null,
      serviceTypeId: input.serviceTypeId ?? null,
      serviceTypeDesc: input.serviceTypeDesc ?? null,
      caseDetails: input.caseDetails,
      technician: null,
      location: input.location ?? null,
      client: input.client ?? null,
      countryDesc: null,
      departmentDesc: null,
      syncStatus: 'pending',
    };

    try {
      await this.local.putCase(newCase);
      const op: PendingOperation = {
        id: this.idGen(),
        entityType: 'case',
        entityId: id,
        operation: 'create',
        payload: input,
        retryCount: 0,
        nextAttemptAt: timestamp,
        lastError: null,
        createdAt: timestamp,
      };
      await this.local.enqueue(op);
      return ok(newCase);
    } catch (e) {
      return err(unknownError('No se pudo crear el caso', e));
    }
  }

  async refresh(): Promise<Result<void, DomainError>> {
    try {
      const page = await this.remote.fetchCases({ page: 1, pageSize: 100 });
      await this.local.upsertCases(page.items);
      await this.local.setLastPulledAt(CASES_TABLE, this.now());
      return ok(undefined);
    } catch (e) {
      // Tolerante a falta de red: sin conexión, la app sigue con datos locales.
      if (e instanceof DomainError && e.kind === 'network') return ok(undefined);
      return err(e instanceof DomainError ? e : unknownError('Fallo al refrescar casos', e));
    }
  }
}
