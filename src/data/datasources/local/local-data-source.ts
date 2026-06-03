import type { Case, Catalogs, Comment } from '@/domain';
import type { ListCasesParams, PagedCases } from '@/domain';

import type { PendingOperation } from '../../sync/pending-operation';

/**
 * Puerto de persistencia local. La implementación de producción es WatermelonDB
 * (cifrada con SQLCipher); en tests y mientras no haya build nativo se usa
 * InMemoryLocalDataSource. La lógica de repositorio depende solo de esta interfaz.
 */
export interface LocalDataSource {
  // Casos
  upsertCases(cases: Case[]): Promise<void>;
  putCase(c: Case): Promise<void>;
  getCaseById(id: string): Promise<Case | null>;
  listCases(params: ListCasesParams): Promise<PagedCases>;

  // Comentarios
  upsertComments(comments: Comment[]): Promise<void>;
  putComment(c: Comment): Promise<void>;
  listCommentsByCase(caseId: string): Promise<Comment[]>;

  // Catálogos
  saveCatalogs(catalogs: Catalogs): Promise<void>;
  getCatalogs(): Promise<Catalogs | null>;

  // Cola de operaciones pendientes
  enqueue(op: PendingOperation): Promise<void>;
  listReadyOperations(now: number): Promise<PendingOperation[]>;
  listAllPending(): Promise<PendingOperation[]>;
  updateOperation(op: PendingOperation): Promise<void>;
  removeOperation(id: string): Promise<void>;
  countPending(): Promise<number>;

  // Metadatos de sincronización
  setLastPulledAt(table: string, epoch: number): Promise<void>;
  getLastPulledAt(table: string): Promise<number | null>;

  /** Limpia toda la base local (p. ej. al cerrar sesión). */
  clear(): Promise<void>;
}
