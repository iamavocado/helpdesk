import type { DomainError } from '@/core/errors';
import type { Attachment, Comment, FileToUpload, NewCommentInput } from '../entities';
import type { Result } from '../value-objects';

/** Puerto del dominio para comentarios (append-only, offline-first). */
export interface CommentRepository {
  /** Comentarios de un caso, ordenados por fecha ascendente. */
  listByCase(caseId: string): Promise<Result<Comment[], DomainError>>;

  /** Agrega un comentario (persiste local + encola para sync). */
  add(input: NewCommentInput): Promise<Result<Comment, DomainError>>;

  /** Sincroniza desde el servidor los comentarios del caso (tolerante a falta de red). */
  refresh(caseId: string): Promise<Result<void, DomainError>>;

  /**
   * Adjuntos de todos los comentarios de un caso (requiere `serverId` del caso).
   * Requiere red: los adjuntos no se cachean en local.
   */
  listAttachments(caseServerId: number): Promise<Result<Attachment[], DomainError>>;

  /** Sube un archivo y lo asocia a un comentario ya sincronizado. */
  uploadAttachment(
    commentServerId: number,
    caseServerId: number,
    file: FileToUpload,
  ): Promise<Result<Attachment, DomainError>>;
}
