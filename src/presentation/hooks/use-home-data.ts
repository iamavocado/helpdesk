import { useCallback, useEffect, useMemo, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Case } from '@/domain';

import type { HomeCounts } from '../screens/home/HomeScreen';

interface HomeData {
  counts: HomeCounts;
  recent: Case[];
  refreshing: boolean;
  refresh: () => Promise<void>;
  /** Recarga silenciosa (sin spinner), p. ej. al volver a la pantalla. */
  reload: () => Promise<void>;
}

/** Carga casos del repositorio (offline-first) y calcula los totales del dashboard. */
export function useHomeData(): HomeData {
  const repo = getContainer().caseRepository;
  const [cases, setCases] = useState<Case[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await repo.refresh(); // pull tolerante a falta de red
    const result = await repo.list({ page: 1, pageSize: 500 });
    if (isOk(result)) setCases(result.value.items);
  }, [repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const counts = useMemo<HomeCounts>(() => {
    const c: HomeCounts = { pendiente: 0, cola: 0, cerrado: 0, total: cases.length };
    for (const item of cases) c[item.classification]++;
    return c;
  }, [cases]);

  const recent = useMemo(() => cases.slice(0, 4), [cases]);

  return { counts, recent, refreshing, refresh, reload: load };
}
