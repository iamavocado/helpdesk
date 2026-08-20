import * as SQLite from 'expo-sqlite';

import type { Case, Catalogs, Comment, ListCasesParams, PagedCases } from '@/domain';

import type { PendingOperation } from '../../sync/pending-operation';
import type { LocalDataSource } from './local-data-source';
import { mergeServerCase } from './merge-case';

/**
 * Implementación persistente de LocalDataSource con expo-sqlite (funciona en
 * Expo Go y sobrevive reinicios). Estrategia "columnas indexadas + blob JSON":
 * cada entidad se guarda como JSON con unas columnas clave para filtrar/ordenar.
 *
 * Nota: el cifrado en reposo (SQLCipher) y el esquema normalizado de
 * WatermelonDB se reservan para el build nativo (ver DATA_MODEL.md / SECURITY.md).
 */
export class SqliteLocalDataSource implements LocalDataSource {
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  constructor(private readonly dbName: string = 'dozzier.db') {}

  private db(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) this.dbPromise = this.initialize();
    return this.dbPromise;
  }

  private async initialize(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(this.dbName);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY NOT NULL,
        server_id INTEGER,
        classification TEXT,
        creation_date INTEGER,
        sync_status TEXT,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cases_server ON cases(server_id);
      CREATE INDEX IF NOT EXISTS idx_cases_classification ON cases(classification);
      CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(creation_date);
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY NOT NULL,
        case_id TEXT,
        server_id INTEGER,
        creation_date INTEGER,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_comments_case ON comments(case_id);
      CREATE TABLE IF NOT EXISTS pending_operations (
        id TEXT PRIMARY KEY NOT NULL,
        next_attempt_at INTEGER,
        created_at INTEGER,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS catalogs (
        id INTEGER PRIMARY KEY NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sync_meta (
        table_name TEXT PRIMARY KEY NOT NULL,
        last_pulled_at INTEGER
      );
    `);
    return db;
  }

  // --- Casos ---

  async upsertCases(cases: Case[]): Promise<void> {
    const db = await this.db();
    for (const incoming of cases) {
      let row = incoming;
      if (incoming.serverId != null) {
        const existing = await db.getFirstAsync<{ id: string; data: string }>(
          'SELECT id, data FROM cases WHERE server_id = ? LIMIT 1',
          [incoming.serverId],
        );
        if (existing) {
          // Upsert por serverId: conserva el id local y mezcla los campos que la
          // lista liviana del servidor no trae (taxonomía, país/provincia…).
          const prev = JSON.parse(existing.data) as Case;
          row = mergeServerCase(prev, { ...incoming, id: existing.id });
          if (existing.id !== incoming.id) {
            await db.runAsync('DELETE FROM cases WHERE id = ?', [incoming.id]);
          }
        }
      }
      await this.putCase(row);
    }
  }

  async putCase(c: Case): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO cases (id, server_id, classification, creation_date, sync_status, data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [c.id, c.serverId, c.classification, c.creationDate, c.syncStatus, JSON.stringify(c)],
    );
  }

  async getCaseById(id: string): Promise<Case | null> {
    const db = await this.db();
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM cases WHERE id = ?', [
      id,
    ]);
    return row ? (JSON.parse(row.data) as Case) : null;
  }

  async listCases(params: ListCasesParams): Promise<PagedCases> {
    const db = await this.db();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    // Filtro por clasificación (columna indexada) o por estado detallado
    // (statusCaseId, extraído del JSON) para separar Resueltos de Cerrados.
    const clauses: string[] = [];
    const whereArgs: (string | number)[] = [];
    if (params.classification) {
      clauses.push('classification = ?');
      whereArgs.push(params.classification);
    }
    if (params.statusCaseId != null) {
      clauses.push("json_extract(data, '$.statusCaseId') = ?");
      whereArgs.push(params.statusCaseId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const totalRow = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) as n FROM cases ${where}`,
      whereArgs,
    );
    const rows = await db.getAllAsync<{ data: string }>(
      `SELECT data FROM cases ${where} ORDER BY creation_date DESC LIMIT ? OFFSET ?`,
      [...whereArgs, pageSize, (page - 1) * pageSize],
    );
    return {
      items: rows.map((r) => JSON.parse(r.data) as Case),
      page,
      pageSize,
      total: totalRow?.n ?? 0,
    };
  }

  // --- Comentarios ---

  async upsertComments(comments: Comment[]): Promise<void> {
    const db = await this.db();
    for (const c of comments) {
      // Elimina el duplicado local (mismo comentario ya sincronizado con otro id
      // local) para no mostrarlo dos veces al refrescar desde el servidor.
      if (c.serverId != null) {
        await db.runAsync('DELETE FROM comments WHERE case_id = ? AND server_id = ? AND id != ?', [
          c.caseId,
          c.serverId,
          c.id,
        ]);
      }
      await this.putComment(c);
    }
  }

  async putComment(c: Comment): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO comments (id, case_id, server_id, creation_date, data)
       VALUES (?, ?, ?, ?, ?)`,
      [c.id, c.caseId, c.serverId, c.creationDate, JSON.stringify(c)],
    );
  }

  async listCommentsByCase(caseId: string): Promise<Comment[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<{ data: string }>(
      'SELECT data FROM comments WHERE case_id = ? ORDER BY creation_date ASC',
      [caseId],
    );
    return rows.map((r) => JSON.parse(r.data) as Comment);
  }

  // --- Catálogos ---

  async saveCatalogs(catalogs: Catalogs): Promise<void> {
    const db = await this.db();
    await db.runAsync('INSERT OR REPLACE INTO catalogs (id, data) VALUES (1, ?)', [
      JSON.stringify(catalogs),
    ]);
  }

  async getCatalogs(): Promise<Catalogs | null> {
    const db = await this.db();
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM catalogs WHERE id = 1');
    return row ? (JSON.parse(row.data) as Catalogs) : null;
  }

  // --- Cola de operaciones ---

  async enqueue(op: PendingOperation): Promise<void> {
    await this.updateOperation(op);
  }

  async updateOperation(op: PendingOperation): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO pending_operations (id, next_attempt_at, created_at, data)
       VALUES (?, ?, ?, ?)`,
      [op.id, op.nextAttemptAt, op.createdAt, JSON.stringify(op)],
    );
  }

  async listReadyOperations(now: number): Promise<PendingOperation[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<{ data: string }>(
      'SELECT data FROM pending_operations WHERE next_attempt_at <= ? ORDER BY created_at ASC',
      [now],
    );
    return rows.map((r) => JSON.parse(r.data) as PendingOperation);
  }

  async listAllPending(): Promise<PendingOperation[]> {
    const db = await this.db();
    const rows = await db.getAllAsync<{ data: string }>(
      'SELECT data FROM pending_operations ORDER BY created_at ASC',
    );
    return rows.map((r) => JSON.parse(r.data) as PendingOperation);
  }

  async removeOperation(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync('DELETE FROM pending_operations WHERE id = ?', [id]);
  }

  async countPending(): Promise<number> {
    const db = await this.db();
    const row = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) as n FROM pending_operations',
    );
    return row?.n ?? 0;
  }

  // --- Metadatos ---

  async setLastPulledAt(table: string, epoch: number): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      'INSERT OR REPLACE INTO sync_meta (table_name, last_pulled_at) VALUES (?, ?)',
      [table, epoch],
    );
  }

  async getLastPulledAt(table: string): Promise<number | null> {
    const db = await this.db();
    const row = await db.getFirstAsync<{ last_pulled_at: number | null }>(
      'SELECT last_pulled_at FROM sync_meta WHERE table_name = ?',
      [table],
    );
    return row?.last_pulled_at ?? null;
  }

  async clear(): Promise<void> {
    const db = await this.db();
    await db.execAsync(`
      DELETE FROM cases;
      DELETE FROM comments;
      DELETE FROM pending_operations;
      DELETE FROM catalogs;
      DELETE FROM sync_meta;
    `);
  }
}
