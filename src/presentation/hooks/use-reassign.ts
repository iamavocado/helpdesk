import { useCallback, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type CatalogItem, type Member, type ReassignInput, type Catalogs } from '@/domain';

import { useAuthStore } from '@/presentation/stores';

interface ReassignData {
  members: Member[];
  statusSubStatuses: CatalogItem[];
  equipmentTypes: CatalogItem[];
  serviceTypes: CatalogItem[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  /** Carga las opciones del modal (técnicos, subestados, categorías, tipos). */
  load: () => Promise<void>;
  /** Envía la reasignación (PUT). Devuelve true si tuvo éxito. */
  submit: (caseId: string, input: ReassignInput) => Promise<boolean>;
}

/** Carga las opciones y ejecuta la reasignación de un caso. */
export function useReassign(): ReassignData {
  const { caseRepository, catalogRepository } = getContainer();
  const departmentName = useAuthStore((s) => s.user?.departmentName ?? undefined);
  const [members, setMembers] = useState<Member[]>([]);
  const [statusSubStatuses, setStatusSubStatuses] = useState<CatalogItem[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [optionsResult, catalogsResult] = await Promise.all([
      caseRepository.getReassignOptions(departmentName),
      catalogRepository.getAll(),
    ]);
    if (isOk(optionsResult)) {
      setMembers(optionsResult.value.members);
      setStatusSubStatuses(optionsResult.value.statusSubStatuses);
    } else {
      setError('No se pudieron cargar los técnicos. Revisa la conexión.');
    }
    if (isOk(catalogsResult)) setCatalogs(catalogsResult.value);
    setLoading(false);
  }, [caseRepository, catalogRepository, departmentName]);

  const submit = useCallback(
    async (caseId: string, input: ReassignInput): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      const result = await caseRepository.reassign(caseId, input);
      setSubmitting(false);
      if (!isOk(result)) {
        setError(result.error.message || 'No se pudo reasignar el caso.');
        return false;
      }
      return true;
    },
    [caseRepository],
  );

  return {
    members,
    statusSubStatuses,
    equipmentTypes: catalogs?.equipmentTypes ?? [],
    serviceTypes: catalogs?.serviceTypes ?? [],
    loading,
    submitting,
    error,
    load,
    submit,
  };
}
