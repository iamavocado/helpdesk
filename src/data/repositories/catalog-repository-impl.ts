import { DomainError, unknownError } from '@/core/errors';
import { ok, err, type Catalogs, type CatalogRepository, type Result } from '@/domain';

import type { LocalDataSource } from '../datasources/local';
import type { RemoteDataSource } from '../datasources/remote';

/** Repositorio de catálogos: cache local + refresh desde el servidor. */
export class CatalogRepositoryImpl implements CatalogRepository {
  constructor(
    private readonly local: LocalDataSource,
    private readonly remote: RemoteDataSource,
  ) {}

  async getAll(): Promise<Result<Catalogs, DomainError>> {
    const cached = await this.local.getCatalogs();
    // Solo se usa la caché si tiene contenido; una caché vacía/parcial se re-consulta.
    if (cached && cached.equipmentTypes.length > 0) return ok(cached);

    const refreshed = await this.refresh();
    if (!refreshed.ok) return refreshed;

    const afterRefresh = await this.local.getCatalogs();
    return afterRefresh ? ok(afterRefresh) : err(unknownError('Catálogos no disponibles'));
  }

  async refresh(): Promise<Result<void, DomainError>> {
    try {
      const catalogs = await this.remote.fetchCatalogs();
      await this.local.saveCatalogs(catalogs);
      return ok(undefined);
    } catch (e) {
      return err(e instanceof DomainError ? e : unknownError('Fallo al refrescar catálogos', e));
    }
  }
}
