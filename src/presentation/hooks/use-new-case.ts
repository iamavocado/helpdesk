import { useCallback, useEffect, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Catalogs, type NewCaseInput } from '@/domain';

interface NewCaseData {
  catalogs: Catalogs | null;
  submitting: boolean;
  submit: (input: NewCaseInput) => Promise<boolean>;
}

/** Carga catálogos y crea el caso (offline-first). */
export function useNewCase(): NewCaseData {
  const { catalogRepository, caseRepository } = getContainer();
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const result = await catalogRepository.getAll();
      if (isOk(result)) setCatalogs(result.value);
    })();
  }, [catalogRepository]);

  const submit = useCallback(
    async (input: NewCaseInput): Promise<boolean> => {
      setSubmitting(true);
      const result = await caseRepository.create(input);
      setSubmitting(false);
      return isOk(result);
    },
    [caseRepository],
  );

  return { catalogs, submitting, submit };
}
