import type { DomainError } from '@/core/errors';
import type { Case, NewCaseInput } from '../entities';
import type { Classification, Result } from '../value-objects';

export interface ListCasesParams {
  classification?: Classification;
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
   * Refresca la caché local desde el servidor (pull completo paginado).
   * Con `force=false` aplica un throttle para no repetir el pull en cada foco.
   * No falla si no hay red.
   */
  refresh(force?: boolean): Promise<Result<void, DomainError>>;
}
