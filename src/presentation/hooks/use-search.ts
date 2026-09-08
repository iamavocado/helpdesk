import { useCallback, useEffect, useRef, useState } from 'react';

import { getContainer } from '@/core/di';
import { isOk, type Case, type SearchCasesParams } from '@/domain';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

interface SearchData {
  query: string;
  results: Case[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  setQuery: (text: string) => void;
  loadMore: () => void;
}

/** Búsqueda de casos con debounce y paginación infinita. */
export function useSearch(): SearchData {
  const repo = getContainer().caseRepository;
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<Case[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(
    async (searchQuery: string, page: number, append = false) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotal(0);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const params: SearchCasesParams = {
        busqueda: searchQuery.trim(),
        page,
        pageSize: PAGE_SIZE,
      };

      const result = await repo.search(params);
      if (!isOk(result)) {
        setError('Error al buscar. Revisa la conexión.');
        setLoading(false);
        return;
      }

      const paged = result.value;
      setResults((prev) => (append ? [...prev, ...paged.items] : paged.items));
      setTotal(paged.total);
      setLoading(false);
    },
    [repo],
  );

  const setQuery = useCallback(
    (text: string) => {
      setQueryState(text);
      pageRef.current = 1;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        void doSearch(text, 1, false);
      }, DEBOUNCE_MS);
    },
    [doSearch],
  );

  const loadMore = useCallback(() => {
    if (loading || !query.trim()) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    void doSearch(query, nextPage, true);
  }, [loading, query, doSearch]);

  // Cleanup del debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasMore = results.length < total;

  return { query, results, total, loading, hasMore, error, setQuery, loadMore };
}