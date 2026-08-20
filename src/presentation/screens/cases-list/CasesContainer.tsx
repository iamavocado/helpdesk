import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';

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
  const initial = route.params?.filter ?? 'todos';

  const { items, filter, total, refreshing, loadingMore, setFilter, refresh, loadMore, reload } =
    useCasesList(initial);

  // Si se llega con un filtro por navegación (p. ej. desde el inicio) y la pestaña
  // ya estaba montada, aplica ese filtro cuando el parámetro cambia.
  const paramFilter = route.params?.filter;
  useEffect(() => {
    if (paramFilter) setFilter(paramFilter);
  }, [paramFilter, setFilter]);

  // Recarga al volver a la pestaña (p. ej. tras crear un caso).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

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
