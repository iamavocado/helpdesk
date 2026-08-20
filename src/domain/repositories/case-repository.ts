import type { DomainError } from '@/core/errors';
import type { Case, CatalogItem, Member, NewCaseInput, ReassignInput } from '../entities';
import type { Classification, Result } from '../value-objects';

/** Opciones que necesita el modal "Reasignar Caso" (cargadas bajo demanda). */
export interface ReassignOptions {
  members: Member[];
  statusSubStatuses: CatalogItem[];
}

export interface ListCasesParams {
  classification?: Classification;
  /** Filtra por estado detallado (StatusCase.Id), ej. 3 = Resuelto, 4 = Cerrado. */
  statusCaseId?: number;
  page?: number;
  pageSize?: number;
}

export interface PagedCases {
  items: Case[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Puerto del dominio para casos. La implementación (Data) es offline-first:
 * lee de local y sincroniza en segundo plano.
 */
export interface CaseRepository {
  /** Lista paginada desde la fuente local, filtrable por clasificación. */
  list(params: ListCasesParams): Promise<Result<PagedCases, DomainError>>;

  /** Obtiene un caso por id local. */
  getById(id: string): Promise<Result<Case, DomainError>>;

  /** Crea un caso (offline-first: persiste local + encola para sync). */
  create(input: NewCaseInput): Promise<Result<Case, DomainError>>;

  /**
   * Actualiza el estado del caso en local (el cambio viaja al servidor a través
   * del comentario que lo acompaña, cuyo `statusCaseId` lo aplica el backend).
   */
  updateStatus(
    id: string,
    statusCaseId: number,
    statusCaseDesc: string,
  ): Promise<Result<Case, DomainError>>;

  /** Carga las opciones del modal de reasignación (técnicos + subestados). */
  getReassignOptions(): Promise<Result<ReassignOptions, DomainError>>;

  /** Reasigna un caso (técnico, estado, subestado, categoría, etc.) vía PUT. */
  reassign(id: string, input: ReassignInput): Promise<Result<Case, DomainError>>;

  /**
   * Refresca la caché local desde el servidor (pull completo paginado).
   * Con `force=false` aplica un throttle para no repetir el pull en cada foco.
   * No falla si no hay red.
   */
  refresh(force?: boolean): Promise<Result<void, DomainError>>;
}
