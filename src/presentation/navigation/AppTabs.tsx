import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PlaceholderScreen } from '@/presentation/components';
import { HomeContainer } from '@/presentation/screens/home';
import { ProfileScreen } from '@/presentation/screens/profile';

import { CustomTabBar } from './CustomTabBar';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const CasesPlaceholder = () => <PlaceholderScreen title="Casos" />;
const SearchPlaceholder = () => <PlaceholderScreen title="Buscar" />;

/** Pestañas inferiores con FAB central que abre "Nuevo caso". */
export function AppTabs() {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} onFabPress={() => rootNav.navigate('NewCase')} />}
    >
      <Tab.Screen name="Home" component={HomeContainer} />
      <Tab.Screen name="Cases" component={CasesPlaceholder} />
      <Tab.Screen name="Search" component={SearchPlaceholder} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
