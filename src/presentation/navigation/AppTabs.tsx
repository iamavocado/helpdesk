import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CasesContainer } from '@/presentation/screens/cases-list';
import { HomeContainer } from '@/presentation/screens/home';
import { ProfileScreen } from '@/presentation/screens/profile';
import { SearchContainer } from '@/presentation/screens/search';

import { CustomTabBar } from './CustomTabBar';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/** Pestañas inferiores con FAB central que abre "Nuevo caso". */
export function AppTabs() {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} onFabPress={() => rootNav.navigate('NewCase')} />}
    >
      <Tab.Screen name="Home" component={HomeContainer} />
      <Tab.Screen name="Cases" component={CasesContainer} />
      <Tab.Screen name="Search" component={SearchContainer} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
