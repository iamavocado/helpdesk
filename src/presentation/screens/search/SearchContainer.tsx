import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSearch } from '@/presentation/hooks/use-search';

import type { RootStackParamList, TabParamList } from '../../navigation/types';
import { SearchScreen } from './SearchScreen';

type SearchNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Search'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/** Conecta SearchScreen con datos de búsqueda y navegación. */
export function SearchContainer() {
  const navigation = useNavigation<SearchNav>();
  const { query, results, total, loading, hasMore, error, setQuery, loadMore } = useSearch();

  return (
    <SearchScreen
      query={query}
      results={results}
      total={total}
      loading={loading}
      hasMore={hasMore}
      error={error}
      onSearch={setQuery}
      onLoadMore={loadMore}
      onOpenCase={(caseId: string) => navigation.navigate('CaseDetail', { caseId })}
    />
  );
}
