import { DomainError, notFoundError, unknownError } from '@/core/errors';
import { uuid } from '@/core/utils/id';
import {
  classificationFromId,
  classificationIdFromStatus,
  ok,
  err,
  type Case,
  type CaseRepository,
  type ListCasesParams,
  type NewCaseInput,
  type PagedCases,
  type ReassignInput,
  type ReassignOptions,
  type Result,
} from '@/domain';

import type { LocalDataSource } from '../datasources/local';
import type { RemoteDataSource } from '../datasources/remote';
import type { PendingOperation } from '../sync';

const CASES_TABLE = 'cases';
const REFRESH_TTL_MS = 60_000; // evita re-pull en cada foco
const PULL_PAGE_SIZE = 200;
const MAX_PULL_PAGES = 50; // tope de seguridad (~10k casos)

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

  async updateStatus(
    id: string,
    statusCaseId: number,
    statusCaseDesc: string,
  ): Promise<Result<Case, DomainError>> {
    try {
      const existing = await this.local.getCaseById(id);
      if (!existing) return err(notFoundError(`Caso ${id} no encontrado`));
      const classificationId = classificationIdFromStatus(statusCaseId);
      const updated: Case = {
        ...existing,
        statusCaseId,
        statusCaseDesc,
        classificationId,
        classification: classificationFromId(classificationId),
        modificationDate: this.now(),
      };
      await this.local.putCase(updated);
      return ok(updated);
    } catch (e) {
      return err(unknownError('No se pudo actualizar el estado del caso', e));
    }
  }

  async getReassignOptions(): Promise<Result<ReassignOptions, DomainError>> {
    try {
      const [members, statusSubStatuses] = await Promise.all([
        this.remote.fetchMembers('HelpDesk', 'Soporte'),
        this.remote.fetchStatusCaseSubStatuses(),
      ]);
      return ok({ members, statusSubStatuses });
    } catch (e) {
      return err(
        e instanceof DomainError ? e : unknownError('No se pudieron cargar las opciones', e),
      );
    }
  }

  async reassign(id: string, input: ReassignInput): Promise<Result<Case, DomainError>> {
    try {
      const local = await this.local.getCaseById(id);
      if (!local) return err(notFoundError(`Caso ${id} no encontrado`));
      if (local.serverId == null) {
        return err(unknownError('El caso aún no está sincronizado; no se puede reasignar'));
      }
      const updated = await this.remote.updateCase(local, input);
      // El servidor manda: se refleja tal cual en local (conserva el id local).
      const merged: Case = { ...updated, id: local.id, syncStatus: 'synced' };
      await this.local.putCase(merged);
      return ok(merged);
    } catch (e) {
      return err(e instanceof DomainError ? e : unknownError('No se pudo reasignar el caso', e));
    }
  }

  async refresh(force = false): Promise<Result<void, DomainError>> {
    try {
      const last = await this.local.getLastPulledAt(CASES_TABLE);
      const now = this.now();
      // Throttle: si el último pull fue reciente y no es forzado, usar local.
      if (!force && last != null && now - last < REFRESH_TTL_MS) return ok(undefined);

      // Pull completo paginado para conteos/listas exactos sobre todos los casos.
      let page = 1;
      for (;;) {
        const result = await this.remote.fetchCases({ page, pageSize: PULL_PAGE_SIZE });
        await this.local.upsertCases(result.items);
        const fetched = page * PULL_PAGE_SIZE;
        if (
          result.items.length < PULL_PAGE_SIZE ||
          fetched >= result.total ||
          page >= MAX_PULL_PAGES
        ) {
          break;
        }
        page++;
      }
      await this.local.setLastPulledAt(CASES_TABLE, now);
      return ok(undefined);
    } catch (e) {
      // Tolerante a falta de red: sin conexión, la app sigue con datos locales.
      if (e instanceof DomainError && e.kind === 'network') return ok(undefined);
      return err(e instanceof DomainError ? e : unknownError('Fallo al refrescar casos', e));
    }
  }
}
