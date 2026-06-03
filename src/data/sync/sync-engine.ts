import { DomainError } from '@/core/errors';
import { logger } from '@/core/logger';
import type { NewCaseInput, NewCommentInput } from '@/domain';

import type { LocalDataSource } from '../datasources/local';
import type { RemoteDataSource } from '../datasources/remote';
import { backoffDelay, exhaustedRetries } from './backoff';
import type { PendingOperation } from './pending-operation';

export interface DrainSummary {
  processed: number;
  succeeded: number;
  failed: number;
  deferred: number;
}

const PARKED = Number.MAX_SAFE_INTEGER;

/**
 * Drena la cola de operaciones pendientes hacia el servidor (push).
 * Respeta dependencias (un comentario espera a que su caso tenga serverId) y
 * aplica backoff exponencial ante fallos de red. La detección de conectividad
 * y el indicador visual se conectan en la Fase 6.
 */
export class SyncEngine {
  constructor(
    private readonly local: LocalDataSource,
    private readonly remote: RemoteDataSource,
    private readonly random: () => number = Math.random,
  ) {}

  async drain(now: number = Date.now()): Promise<DrainSummary> {
    const summary: DrainSummary = { processed: 0, succeeded: 0, failed: 0, deferred: 0 };
    const ready = await this.local.listReadyOperations(now);

    for (const op of ready) {
      summary.processed++;
      try {
        const handled = await this.process(op);
        if (!handled) {
          summary.deferred++;
          continue;
        }
        await this.local.removeOperation(op.id);
        summary.succeeded++;
      } catch (e) {
        summary.failed++;
        await this.handleFailure(op, e, now);
      }
    }
    return summary;
  }

  /** Devuelve false si la operación se difiere (dependencia no lista). */
  private async process(op: PendingOperation): Promise<boolean> {
    if (op.entityType === 'case' && op.operation === 'create') {
      const local = await this.local.getCaseById(op.entityId);
      if (!local) return true; // el caso ya no existe localmente: se descarta
      const created = await this.remote.createCase(op.payload as NewCaseInput);
      await this.local.putCase({ ...local, serverId: created.serverId, syncStatus: 'synced' });
      return true;
    }

    if (op.entityType === 'comment' && op.operation === 'create') {
      const comment = (
        await this.local.listCommentsByCase((op.payload as NewCommentInput).caseId)
      ).find((c) => c.id === op.entityId);
      if (!comment) return true;
      const parentCase = await this.local.getCaseById(comment.caseId);
      if (!parentCase || parentCase.serverId == null) return false; // espera al caso padre
      const created = await this.remote.createComment(
        op.payload as NewCommentInput,
        parentCase.serverId,
      );
      await this.local.putComment({
        ...comment,
        serverId: created.serverId,
        caseServerId: parentCase.serverId,
        syncStatus: 'synced',
      });
      return true;
    }

    return true;
  }

  private async handleFailure(op: PendingOperation, error: unknown, now: number): Promise<void> {
    const isNetwork = error instanceof DomainError && error.kind === 'network';
    const message = error instanceof Error ? error.message : String(error);

    if (!isNetwork || exhaustedRetries(op.retryCount + 1)) {
      // Error terminal o reintentos agotados: se aparca para revisión manual (Fase 6).
      logger.warn('Operación de sync aparcada', { id: op.id, kind: op.entityType });
      await this.local.updateOperation({
        ...op,
        retryCount: op.retryCount + 1,
        nextAttemptAt: PARKED,
        lastError: message,
      });
      await this.markEntityError(op);
      return;
    }

    const retryCount = op.retryCount + 1;
    await this.local.updateOperation({
      ...op,
      retryCount,
      nextAttemptAt: now + backoffDelay(retryCount, this.random),
      lastError: message,
    });
  }

  private async markEntityError(op: PendingOperation): Promise<void> {
    if (op.entityType === 'case') {
      const c = await this.local.getCaseById(op.entityId);
      if (c) await this.local.putCase({ ...c, syncStatus: 'error' });
    }
  }
}
