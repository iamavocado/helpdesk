import { useCallback, useEffect, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Case, type Classification } from '@/domain';

/** Filtros de la lista: los 3 grupos + "Resuelto" (estado detallado) + todos. */
export type CaseFilter = 'todos' | 'pendiente' | 'cola' | 'resuelto' | 'cerrado';

const PAGE_SIZE = 20;

/** Traduce el chip de filtro a parámetros de consulta (clasificación o estado). */
function filterToParams(f: CaseFilter): { classification?: Classification; statusCaseId?: number } {
  switch (f) {
    case 'pendiente':
      return { classification: 'pendiente' };
    case 'cola':
      return { classification: 'cola' };
    case 'resuelto':
      return { statusCaseId: 3 }; // Resuelto
    case 'cerrado':
      return { statusCaseId: 4 }; // Cerrado (separado de Resuelto)
    default:
      return {};
  }
}

interface CasesListData {
  items: Case[];
  filter: CaseFilter;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  setFilter: (filter: CaseFilter) => void;
  refresh: () => Promise<void>;
  loadMore: () => void;
  reload: () => Promise<void>;
}

/** Lista de casos paginada y filtrable por clasificación (offline-first). */
export function useCasesList(initialFilter: CaseFilter = 'todos'): CasesListData {
  const repo = getContainer().caseRepository;
  const [filter, setFilterState] = useState<CaseFilter>(initialFilter);
  const [items, setItems] = useState<Case[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (targetPage: number, currentFilter: CaseFilter) => {
      const result = await repo.list({
        ...filterToParams(currentFilter),
        page: targetPage,
        pageSize: PAGE_SIZE,
      });
      if (!isOk(result)) return;
      console.log('[DEBUG] useCasesList — items recibidos:', JSON.stringify(result.value.items.slice(0, 3), null, 2));
      setTotal(result.value.total);
      setPage(targetPage);
      setItems((prev) =>
        targetPage === 1 ? result.value.items : [...prev, ...result.value.items],
      );
    },
    [repo],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await repo.refresh(true); // pull completo forzado
    await fetchPage(1, filter);
    setRefreshing(false);
  }, [repo, fetchPage, filter]);

  // Carga inicial y al cambiar el filtro: local primero (instantáneo), luego
  // sincroniza en segundo plano y refresca.
  useEffect(() => {
    void (async () => {
      await fetchPage(1, filter);
      await repo.refresh();
      await fetchPage(1, filter);
    })();
  }, [repo, fetchPage, filter]);

  const setFilter = useCallback((next: CaseFilter) => {
    setItems([]);
    setPage(1);
    setFilterState(next);
  }, []);

  const hasMore = items.length < total;

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    void fetchPage(page + 1, filter).finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, fetchPage, page, filter]);

  // Recarga silenciosa (página 1 del filtro actual), p. ej. al enfocar la pantalla.
  const reload = useCallback(async () => {
    await fetchPage(1, filter);
    await repo.refresh();
    await fetchPage(1, filter);
  }, [repo, fetchPage, filter]);

  return {
    items,
    filter,
    refreshing,
    loadingMore,
    hasMore,
    total,
    setFilter,
    refresh,
    loadMore,
    reload,
  };
}
