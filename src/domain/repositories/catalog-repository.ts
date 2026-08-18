import type { DomainError } from '@/core/errors';
import type { CatalogItem, Catalogs } from '../entities';
import type { Result } from '../value-objects';

/** Puerto del dominio para catálogos (cacheados localmente). */
export interface CatalogRepository {
  getAll(): Promise<Result<Catalogs, DomainError>>;
  refresh(): Promise<Result<void, DomainError>>;

  /** Lista de países (para el select País). */
  getCountries(): Promise<Result<CatalogItem[], DomainError>>;

  /** Provincias/departamentos de un país (requiere idCountry). */
  getDepartments(idCountry: number): Promise<Result<CatalogItem[], DomainError>>;
}
