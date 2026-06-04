import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';

import type { Classification } from '@/domain';
import { useHomeData } from '@/presentation/hooks/use-home-data';
import { useAuthStore } from '@/presentation/stores';

import type { RootStackParamList, TabParamList } from '../../navigation/types';
import { HomeScreen } from './HomeScreen';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/** Conecta HomeScreen con datos (repositorio) y navegación. */
export function HomeContainer() {
  const navigation = useNavigation<HomeNav>();
  const user = useAuthStore((s) => s.user);
  const { counts, recent, refreshing, refresh, reload } = useHomeData();

  // Recarga al volver a la pantalla (p. ej. tras crear un caso).
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <HomeScreen
      userName={user?.name ?? 'Usuario'}
      counts={counts}
      recentCases={recent}
      refreshing={refreshing}
      onRefresh={refresh}
      onOpenList={(classification?: Classification) =>
        navigation.navigate('Cases', classification ? { classification } : undefined)
      }
      onOpenCase={(caseId: string) => navigation.navigate('CaseDetail', { caseId })}
      onCreateCase={() => navigation.navigate('NewCase')}
    />
  );
}
