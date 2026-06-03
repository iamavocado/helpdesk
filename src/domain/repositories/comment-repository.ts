import type { DomainError } from '@/core/errors';
import type { Comment, NewCommentInput } from '../entities';
import type { Result } from '../value-objects';

/** Puerto del dominio para comentarios (append-only, offline-first). */
export interface CommentRepository {
  /** Comentarios de un caso, ordenados por fecha ascendente. */
  listByCase(caseId: string): Promise<Result<Comment[], DomainError>>;

  /** Agrega un comentario (persiste local + encola para sync). */
  add(input: NewCommentInput): Promise<Result<Comment, DomainError>>;
}
