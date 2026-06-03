import { DomainError, unknownError } from '@/core/errors';
import { uuid } from '@/core/utils/id';
import {
  ok,
  err,
  type Comment,
  type CommentRepository,
  type NewCommentInput,
  type Result,
} from '@/domain';

import type { LocalDataSource } from '../datasources/local';
import type { PendingOperation } from '../sync';

/**
 * Repositorio de comentarios offline-first. Lecturas desde local;
 * al agregar, persiste local + encola. Los comentarios son append-only.
 */
export class CommentRepositoryImpl implements CommentRepository {
  constructor(
    private readonly local: LocalDataSource,
    private readonly now: () => number = Date.now,
    private readonly idGen: () => string = uuid,
  ) {}

  async listByCase(caseId: string): Promise<Result<Comment[], DomainError>> {
    try {
      return ok(await this.local.listCommentsByCase(caseId));
    } catch (e) {
      return err(unknownError('No se pudieron listar los comentarios', e));
    }
  }

  async add(input: NewCommentInput): Promise<Result<Comment, DomainError>> {
    const timestamp = this.now();
    const id = this.idGen();
    const parent = await this.local.getCaseById(input.caseId);

    const comment: Comment = {
      id,
      serverId: null,
      caseId: input.caseId,
      caseServerId: parent?.serverId ?? null,
      body: input.body,
      creationDate: timestamp,
      authorName: parent?.userRequester ?? '',
      authorRole: null,
      isPrivate: input.isPrivate,
      statusCaseId: input.statusCaseId ?? null,
      statusDesc: input.statusDesc ?? null,
      hasAttachment: false,
      syncStatus: 'pending',
    };

    try {
      await this.local.putComment(comment);
      const op: PendingOperation = {
        id: this.idGen(),
        entityType: 'comment',
        entityId: id,
        operation: 'create',
        payload: input,
        retryCount: 0,
        nextAttemptAt: timestamp,
        lastError: null,
        createdAt: timestamp,
      };
      await this.local.enqueue(op);
      return ok(comment);
    } catch (e) {
      return err(unknownError('No se pudo agregar el comentario', e));
    }
  }
}
