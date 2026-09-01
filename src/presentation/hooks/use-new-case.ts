import { useCallback, useEffect, useState } from 'react';

import { getContainer } from '@/core/di';
import {
  isOk,
  type Catalogs,
  type CatalogItem,
  type NewCaseInput,
  type NewCommentInput,
} from '@/domain';

interface NewCaseData {
  catalogs: Catalogs | null;
  countries: CatalogItem[];
  submitting: boolean;
  /** Carga las provincias/departamentos de un país (para el select dependiente). */
  loadDepartments: (idCountry: number) => Promise<CatalogItem[]>;
  submit: (input: NewCaseInput, comment?: Omit<NewCommentInput, 'caseId'>) => Promise<boolean>;
}

/** Carga catálogos y crea el caso (offline-first), con comentario inicial opcional. */
export function useNewCase(): NewCaseData {
  const { catalogRepository, caseRepository, commentRepository, syncEngine } = getContainer();
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [countries, setCountries] = useState<CatalogItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      // Refresca catálogos al abrir (tolerante a falta de red) para evitar
      // caché obsoleta/parcial; luego lee de local.
      await catalogRepository.refresh();
      const result = await catalogRepository.getAll();
      if (isOk(result)) setCatalogs(result.value);
      const countriesResult = await catalogRepository.getCountries();
      if (isOk(countriesResult)) setCountries(countriesResult.value);
    })();
  }, [catalogRepository]);

  const loadDepartments = useCallback(
    async (idCountry: number): Promise<CatalogItem[]> => {
      const result = await catalogRepository.getDepartments(idCountry);
      return isOk(result) ? result.value : [];
    },
    [catalogRepository],
  );

  const submit = useCallback(
    async (input: NewCaseInput, comment?: Omit<NewCommentInput, 'caseId'>): Promise<boolean> => {
      console.log('[DEBUG] useNewCase.submit — input recibido:', JSON.stringify(input));
      setSubmitting(true);
      const result = await caseRepository.create(input);
      console.log('[DEBUG] useNewCase.submit — result after create:', JSON.stringify(result));
      // Comentario inicial opcional, encolado contra el caso recién creado.
      if (isOk(result) && comment) {
        console.log('[DEBUG] useNewCase.submit — agregando comentario inicial');
        await commentRepository.add({ ...comment, caseId: result.value.id });
      }
      // Empuja de inmediato al servidor (crea el caso y su comentario). Si no hay
      // red, la operación queda en cola y se reintenta al volver a primer plano.
      if (isOk(result)) {
        console.log('[DEBUG] useNewCase.submit — llamando syncEngine.drain()');
        await syncEngine.drain();
        console.log('[DEBUG] useNewCase.submit — syncEngine.drain() completado');
      }
      setSubmitting(false);
      console.log('[DEBUG] useNewCase.submit — final, isOk:', isOk(result));
      return isOk(result);
    },
    [caseRepository, commentRepository, syncEngine],
  );

  return { catalogs, countries, submitting, loadDepartments, submit };
}
