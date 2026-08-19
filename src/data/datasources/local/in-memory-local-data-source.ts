import type { Case, Catalogs, Comment, ListCasesParams, PagedCases } from '@/domain';
import { classificationFromId } from '@/domain';

import type { PendingOperation } from '../../sync/pending-operation';
import type { LocalDataSource } from './local-data-source';
import { mergeServerCase } from './merge-case';

/**
 * Implementación en memoria de LocalDataSource.
 * Usada en tests y como almacenamiento de trabajo hasta activar WatermelonDB
 * en el build nativo. Replica la semántica de upsert por `serverId`.
 */
export class InMemoryLocalDataSource implements LocalDataSource {
  private cases = new Map<string, Case>();
  private comments = new Map<string, Comment>();
  private catalogs: Catalogs | null = null;
  private operations = new Map<string, PendingOperation>();
  private meta = new Map<string, number>();

  private indexByServerId(serverId: number | null): Case | undefined {
    if (serverId == null) return undefined;
    for (const c of this.cases.values()) {
      if (c.serverId === serverId) return c;
    }
    return undefined;
  }

  async upsertCases(cases: Case[]): Promise<void> {
    for (const incoming of cases) {
      const existing = this.indexByServerId(incoming.serverId);
      // Upsert por serverId: conserva el id local y mezcla los campos que la
      // lista liviana del servidor no trae (taxonomía, país/provincia…).
      const id = existing?.id ?? incoming.id;
      const row = existing ? mergeServerCase(existing, { ...incoming, id }) : { ...incoming, id };
      this.cases.set(id, row);
      if (existing && existing.id !== incoming.id) this.cases.delete(incoming.id);
    }
  }

  async putCase(c: Case): Promise<void> {
    this.cases.set(c.id, c);
  }

  async getCaseById(id: string): Promise<Case | null> {
    return this.cases.get(id) ?? null;
  }

  async listCases(params: ListCasesParams): Promise<PagedCases> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const all = Array.from(this.cases.values())
      .filter((c) =>
        params.classification == null
          ? true
          : classificationFromId(c.classificationId) === params.classification,
      )
      .sort((a, b) => b.creationDate - a.creationDate);
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), page, pageSize, total: all.length };
  }

  async upsertComments(comments: Comment[]): Promise<void> {
    for (const c of comments) {
      // Elimina el duplicado local (mismo comentario ya sincronizado con otro id
      // local) para no mostrarlo dos veces al refrescar desde el servidor.
      if (c.serverId != null) {
        for (const [key, existing] of this.comments) {
          if (existing.caseId === c.caseId && existing.serverId === c.serverId && key !== c.id) {
            this.comments.delete(key);
          }
        }
      }
      this.comments.set(c.id, c);
    }
  }

  async putComment(c: Comment): Promise<void> {
    this.comments.set(c.id, c);
  }

  async listCommentsByCase(caseId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((c) => c.caseId === caseId)
      .sort((a, b) => a.creationDate - b.creationDate);
  }

  async saveCatalogs(catalogs: Catalogs): Promise<void> {
    this.catalogs = catalogs;
  }

  async getCatalogs(): Promise<Catalogs | null> {
    return this.catalogs;
  }

  async enqueue(op: PendingOperation): Promise<void> {
    this.operations.set(op.id, op);
  }

  async listReadyOperations(now: number): Promise<PendingOperation[]> {
    return Array.from(this.operations.values())
      .filter((op) => op.nextAttemptAt <= now)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async listAllPending(): Promise<PendingOperation[]> {
    return Array.from(this.operations.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  async updateOperation(op: PendingOperation): Promise<void> {
    this.operations.set(op.id, op);
  }

  async removeOperation(id: string): Promise<void> {
    this.operations.delete(id);
  }

  async countPending(): Promise<number> {
    return this.operations.size;
  }

  async setLastPulledAt(table: string, epoch: number): Promise<void> {
    this.meta.set(table, epoch);
  }

  async getLastPulledAt(table: string): Promise<number | null> {
    return this.meta.get(table) ?? null;
  }

  async clear(): Promise<void> {
    this.cases.clear();
    this.comments.clear();
    this.operations.clear();
    this.meta.clear();
    this.catalogs = null;
  }
}
