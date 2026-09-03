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

import { mergeServerCase, type LocalDataSource } from '../datasources/local';
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
    console.log('[DEBUG] CaseRepositoryImpl.create — input:', JSON.stringify(input));
    const timestamp = this.now();
    const id = this.idGen();
    const newCase: Case = {
      id,
      serverId: null,
      userRequester: input.userRequester ?? '',
      requesterEmail: input.emailRequester ?? null,
      reportingUser: null,
      reportingUserEmail: null,
      creationDate: timestamp,
      modificationDate: timestamp,
      solutionDate: null,
      classificationId: input.classificationCaseId ?? 1,
      classification: classificationFromId(input.classificationCaseId ?? 1),
      statusCaseId: input.statusCaseId ?? 1,
      statusCaseDesc: 'En espera de respuesta soporte',
      subStatusId: 1,
      equipmentTypeId: input.equipmentTypeId,
      equipmentTypeDesc: '',
      softwareModuleId: input.softwareModuleId ?? null,
      softwareModuleDesc: null,
      softwareEnvironmentId: input.softwareEnvironmentId ?? null,
      softwareEnvironmentDesc: null,
      hardwareEquipmentId: input.hardwareEquipmentId ?? null,
      hardwareEquipmentDesc: null,
      priorityId: input.priorityId ?? null,
      priorityDesc: null,
      serviceTypeId: input.serviceTypeId ?? null,
      serviceTypeDesc: null,
      caseDetails: input.caseDetails,
      technician: input.technician ?? null,
      location: input.location ?? null,
      client: input.client ?? null,
      countryDesc: null,
      departmentDesc: null,
      syncStatus: 'pending',
    };

    try {
      console.log('[DEBUG] CaseRepositoryImpl.create — guardando en local DB, id:', id);
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
      console.log('[DEBUG] CaseRepositoryImpl.create — OK, caso creado localmente:', id);
      return ok(newCase);
    } catch (e) {
      console.log('[DEBUG] CaseRepositoryImpl.create — ERROR:', String(e));
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
      // Aplica el nuevo estado sobre los datos actuales (conserva técnico, etc.).
      const withStatus: Case = {
        ...existing,
        statusCaseId,
        statusCaseDesc,
        classificationId,
        classification: classificationFromId(classificationId),
        modificationDate: this.now(),
      };

      // Si el caso ya está sincronizado, persiste el estado en el servidor con un
      // PUT /api/Case (el backend no cambia el estado desde el comentario).
      if (existing.serverId != null) {
        // PUT mínimo (solo estado): el payload completo hace 500 al cerrar el caso.
        const updated = await this.remote.updateCaseStatus(existing, statusCaseId, statusCaseDesc);
        // El servidor puede devolver descripciones vacías tras el PUT: se mezcla
        // para conservar la taxonomía local y se fuerza el estado elegido.
        const merged = mergeServerCase(existing, { ...updated, id: existing.id });
        const saved: Case = {
          ...merged,
          statusCaseId,
          statusCaseDesc: statusCaseDesc || merged.statusCaseDesc,
          classificationId,
          classification: classificationFromId(classificationId),
          syncStatus: 'synced',
        };
        await this.local.putCase(saved);
        return ok(saved);
      }

      // Caso aún sin serverId: se guarda local (se reflejará al sincronizar).
      await this.local.putCase(withStatus);
      return ok(withStatus);
    } catch (e) {
      return err(
        e instanceof DomainError ? e : unknownError('No se pudo actualizar el estado del caso', e),
      );
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
      // Mezcla para conservar la taxonomía local si el servidor la devuelve vacía
      // tras el PUT (conserva el id local y marca como sincronizado).
      const merged = mergeServerCase(local, { ...updated, id: local.id, syncStatus: 'synced' });
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

  async updateLocal(c: Case): Promise<Result<Case, DomainError>> {
    try {
      await this.local.putCase(c);
      return ok(c);
    } catch (e) {
      return err(unknownError('No se pudo actualizar el caso local', e));
    }
  }
}
