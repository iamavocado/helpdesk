import type { DomainError } from '@/core/errors';
import type { Catalogs } from '../entities';
import type { Result } from '../value-objects';

/** Puerto del dominio para catálogos (cacheados localmente). */
export interface CatalogRepository {
  getAll(): Promise<Result<Catalogs, DomainError>>;
  refresh(): Promise<Result<void, DomainError>>;
}
