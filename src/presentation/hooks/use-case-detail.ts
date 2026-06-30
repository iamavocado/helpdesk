import { useCallback, useEffect, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Case, type Comment, type NewCommentInput } from '@/domain';

interface CaseDetailData {
  caseItem: Case | null;
  comments: Comment[];
  loading: boolean;
  submitting: boolean;
  addComment: (input: Omit<NewCommentInput, 'caseId'>) => Promise<boolean>;
}

/** Carga un caso y su conversación; permite agregar comentarios (offline-first). */
export function useCaseDetail(caseId: string): CaseDetailData {
  const { caseRepository, commentRepository } = getContainer();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    const result = await commentRepository.listByCase(caseId);
    if (isOk(result)) setComments(result.value);
  }, [commentRepository, caseId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const caseResult = await caseRepository.getById(caseId);
      if (isOk(caseResult)) setCaseItem(caseResult.value);
      await commentRepository.refresh(caseId);
      await loadComments();
      setLoading(false);
    })();
  }, [caseRepository, commentRepository, caseId, loadComments]);

  const addComment = useCallback(
    async (input: Omit<NewCommentInput, 'caseId'>): Promise<boolean> => {
      setSubmitting(true);
      const result = await commentRepository.add({ ...input, caseId });
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
      }
      setSubmitting(false);
      return isOk(result);
    },
    [commentRepository, caseRepository, caseId, loadComments],
  );

  return { caseItem, comments, loading, submitting, addComment };
}
