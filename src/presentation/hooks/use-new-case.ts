import { useCallback, useEffect, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Catalogs, type NewCaseInput, type NewCommentInput } from '@/domain';

interface NewCaseData {
  catalogs: Catalogs | null;
  submitting: boolean;
  submit: (input: NewCaseInput, comment?: Omit<NewCommentInput, 'caseId'>) => Promise<boolean>;
}

/** Carga catálogos y crea el caso (offline-first), con comentario inicial opcional. */
export function useNewCase(): NewCaseData {
  const { catalogRepository, caseRepository, commentRepository } = getContainer();
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      // Refresca catálogos al abrir (tolerante a falta de red) para evitar
      // caché obsoleta/parcial; luego lee de local.
      await catalogRepository.refresh();
      const result = await catalogRepository.getAll();
      if (isOk(result)) setCatalogs(result.value);
    })();
  }, [catalogRepository]);

  const submit = useCallback(
    async (input: NewCaseInput, comment?: Omit<NewCommentInput, 'caseId'>): Promise<boolean> => {
      setSubmitting(true);
      const result = await caseRepository.create(input);
      // Comentario inicial opcional, encolado contra el caso recién creado.
      if (isOk(result) && comment) {
        await commentRepository.add({ ...comment, caseId: result.value.id });
      }
      setSubmitting(false);
      return isOk(result);
    },
    [caseRepository, commentRepository],
  );

  return { catalogs, submitting, submit };
}
