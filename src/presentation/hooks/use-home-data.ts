import { useCallback, useEffect, useMemo, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Case, type StatusCount } from '@/domain';

import type { HomeCounts } from '../screens/home/HomeScreen';

interface HomeData {
  counts: HomeCounts;
  recent: Case[];
  refreshing: boolean;
  refresh: () => Promise<void>;
  /** Recarga silenciosa (sin spinner), p. ej. al volver a la pantalla. */
  reload: () => Promise<void>;
}

/**
 * Mapea los statusCaseDesc del backend a las 4 categorías del dashboard.
 * El backend puede devolver descripciones como "Pendiente", "En Cola",
 * "Resuelto", "Cerrado", "En espera de respuesta soporte", etc.
 */
function categorizeCounts(counts: StatusCount[]): HomeCounts {
  const result: HomeCounts = { pendiente: 0, cola: 0, resuelto: 0, cerrado: 0, total: 0 };
  for (const c of counts) {
    const desc = c.statusCaseDesc.toLowerCase();
    if (desc.includes('pendiente') || desc.includes('espera')) {
      result.pendiente += c.cantidadCasos;
    } else if (desc.includes('cola')) {
      result.cola += c.cantidadCasos;
    } else if (desc.includes('resuelto')) {
      result.resuelto += c.cantidadCasos;
    } else if (desc.includes('cerrado')) {
      result.cerrado += c.cantidadCasos;
    }
    result.total += c.cantidadCasos;
  }
  return result;
}

/** Carga conteos del servidor y casos recientes de la BD local. */
export function useHomeData(): HomeData {
  const repo = getContainer().caseRepository;
  const [cases, setCases] = useState<Case[]>([]);
  const [counts, setCounts] = useState<HomeCounts>({ pendiente: 0, cola: 0, resuelto: 0, cerrado: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async () => {
      // 1) Conteos desde el servidor (1 llamada rápida).
      const countsResult = await repo.getStatusCounts();
      if (isOk(countsResult)) {
        setCounts(categorizeCounts(countsResult.value));
      }

      // 2) Casos recientes desde la BD local (instantáneo, sin descarga masiva).
      const cached = await repo.list({ page: 1, pageSize: 4 });
      if (isOk(cached)) setCases(cached.value.items);
    },
    [repo],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const recent = useMemo(() => cases.slice(0, 4), [cases]);

  return { counts, recent, refreshing, refresh, reload: load };
}
