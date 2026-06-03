import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCasesList } from '@/presentation/hooks/use-cases-list';

import type { RootStackParamList, TabParamList } from '../../navigation/types';
import { CasesListScreen } from './CasesListScreen';

type CasesNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Cases'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/** Conecta CasesListScreen con datos paginados y navegación. */
export function CasesContainer() {
  const navigation = useNavigation<CasesNav>();
  const route = useRoute<RouteProp<TabParamList, 'Cases'>>();
  const initial = route.params?.classification ?? 'todos';

  const { items, filter, total, refreshing, loadingMore, setFilter, refresh, loadMore } =
    useCasesList(initial);

  return (
    <CasesListScreen
      cases={items}
      filter={filter}
      total={total}
      refreshing={refreshing}
      loadingMore={loadingMore}
      onChangeFilter={setFilter}
      onRefresh={refresh}
      onEndReached={loadMore}
      onOpenCase={(caseId: string) => navigation.navigate('CaseDetail', { caseId })}
    />
  );
}
