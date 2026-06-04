import { useCallback, useEffect, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Case, type Classification } from '@/domain';

export type CaseFilter = Classification | 'todos';

const PAGE_SIZE = 20;

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
        classification: currentFilter === 'todos' ? undefined : currentFilter,
        page: targetPage,
        pageSize: PAGE_SIZE,
      });
      if (!isOk(result)) return;
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
    await repo.refresh();
    await fetchPage(1, filter);
    setRefreshing(false);
  }, [repo, fetchPage, filter]);

  // Carga inicial y al cambiar el filtro.
  useEffect(() => {
    void (async () => {
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
