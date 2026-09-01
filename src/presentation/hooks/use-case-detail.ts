import { useCallback, useEffect, useState } from 'react';

import { getContainer } from '@/core/di';
import {
  isOk,
  type Attachment,
  type Case,
  type Comment,
  type FileToUpload,
  type NewCommentInput,
} from '@/domain';

import { useAuthStore } from '@/presentation/stores';

interface CaseDetailData {
  caseItem: Case | null;
  comments: Comment[];
  /** Adjuntos del caso, indexados por `serverId` del comentario. */
  attachments: Record<number, Attachment[]>;
  loading: boolean;
  submitting: boolean;
  uploadingFor: number | null;
  addComment: (input: Omit<NewCommentInput, 'caseId'>) => Promise<boolean>;
  uploadAttachment: (commentServerId: number, file: FileToUpload) => Promise<boolean>;
  /** Recarga el caso y su conversación (p. ej. tras reasignar). */
  reload: () => Promise<void>;
}

/** Carga un caso y su conversación; permite agregar comentarios (offline-first). */
export function useCaseDetail(caseId: string): CaseDetailData {
  const { caseRepository, commentRepository, syncEngine } = getContainer();
  const authorUsername = useAuthStore((s) => s.user?.name ?? null);
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Record<number, Attachment[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    const result = await commentRepository.listByCase(caseId);
    if (isOk(result)) setComments(result.value);
  }, [commentRepository, caseId]);

  /** Trae los adjuntos del caso y los agrupa por comentario. */
  const loadAttachments = useCallback(
    async (caseServerId: number | null | undefined) => {
      if (caseServerId == null) return; // caso aún no sincronizado: no hay adjuntos
      const result = await commentRepository.listAttachments(caseServerId);
      if (!isOk(result)) return;
      const grouped: Record<number, Attachment[]> = {};
      for (const a of result.value) {
        (grouped[a.commentServerId] ??= []).push(a);
      }
      setAttachments(grouped);
    },
    [commentRepository],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    const caseResult = await caseRepository.getById(caseId);
    const current = isOk(caseResult) ? caseResult.value : null;
    if (current) setCaseItem(current);
    await commentRepository.refresh(caseId);
    await loadComments();
    setLoading(false);
    await loadAttachments(current?.serverId); // en segundo plano: no bloquea la pantalla
  }, [caseRepository, commentRepository, caseId, loadComments, loadAttachments]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const addComment = useCallback(
    async (input: Omit<NewCommentInput, 'caseId'>): Promise<boolean> => {
      setSubmitting(true);
      // El autor = usuario de login; el backend lo guarda como userRequester.
      const result = await commentRepository.add({ ...input, caseId, authorUsername });
      if (isOk(result)) {
        // Si el comentario lleva un estado, aplícalo también al caso (local).
        if (input.statusCaseId != null) {
          const updated = await caseRepository.updateStatus(
            caseId,
            input.statusCaseId,
            input.statusDesc ?? '',
          );
          if (isOk(updated)) setCaseItem(updated.value);
        }
        await loadComments();
        // Empuja el comentario al servidor de inmediato (si hay red).
        await syncEngine.drain();
      }
      setSubmitting(false);
      return isOk(result);
    },
    [commentRepository, caseRepository, caseId, loadComments, syncEngine, authorUsername],
  );

  /** Sube un archivo a un comentario ya sincronizado y recarga los adjuntos. */
  const uploadAttachment = useCallback(
    async (commentServerId: number, file: FileToUpload): Promise<boolean> => {
      const caseServerId = caseItem?.serverId;
      if (caseServerId == null) return false;
      setUploadingFor(commentServerId);
      const result = await commentRepository.uploadAttachment(commentServerId, caseServerId, file);
      if (isOk(result)) await loadAttachments(caseServerId);
      setUploadingFor(null);
      return isOk(result);
    },
    [commentRepository, caseItem, loadAttachments],
  );

  return {
    caseItem,
    comments,
    attachments,
    loading,
    submitting,
    uploadingFor,
    addComment,
    uploadAttachment,
    reload: loadAll,
  };
}
