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

  const load = useCallback(
    async (force = false) => {
      // 1) Pinta primero desde la BD local: la pantalla aparece al instante
      //    sin esperar la red (offline-first / stale-while-revalidate).
      const cached = await repo.list({ page: 1, pageSize: 100000 });
      if (isOk(cached)) setCases(cached.value.items);
      // 2) Sincroniza en segundo plano y actualiza los totales con lo nuevo.
      await repo.refresh(force); // pull completo (throttled) tolerante a falta de red
      const fresh = await repo.list({ page: 1, pageSize: 100000 });
      if (isOk(fresh)) setCases(fresh.value.items);
    },
    [repo],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true); // pull-to-refresh fuerza el pull completo
    setRefreshing(false);
  }, [load]);

  const counts = useMemo<HomeCounts>(() => {
    const c: HomeCounts = { pendiente: 0, cola: 0, resuelto: 0, cerrado: 0, total: cases.length };
    for (const item of cases) {
      if (item.classification === 'pendiente') c.pendiente++;
      else if (item.classification === 'cola') c.cola++;
      // Grupo "cerrado": se separa Resuelto (estado 3) de Cerrado (estado 4).
      else if (item.statusCaseId === 3) c.resuelto++;
      else c.cerrado++;
    }
    return c;
  }, [cases]);

  const recent = useMemo(() => cases.slice(0, 4), [cases]);

  return { counts, recent, refreshing, refresh, reload: load };
}
