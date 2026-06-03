import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { env } from '@/core/config/env';
import { InactivityTimer } from '@/data/security';
import { colors } from '@/design-system';
import { PlaceholderScreen } from '@/presentation/components';
import { LoginContainer } from '@/presentation/screens/login';
import { useAuthStore } from '@/presentation/stores';

import { AppTabs } from './AppTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const CaseDetailPlaceholder = () => <PlaceholderScreen title="Detalle del caso" />;
const NewCasePlaceholder = () => <PlaceholderScreen title="Nuevo caso" />;

/** Envuelve la sesión autenticada y reinicia el temporizador de inactividad al tocar. */
function InactivityGate({ children }: { children: ReactNode }) {
  const logout = useAuthStore((s) => s.logout);
  const timer = useMemo(
    () => new InactivityTimer(() => void logout(), env.inactivityTimeoutMinutes),
    [logout],
  );
  const ref = useRef(timer);
  ref.current = timer;

  useEffect(() => {
    timer.touch();
    return () => timer.stop();
  }, [timer]);

  return (
    <View style={styles.fill} onTouchStart={() => ref.current.touch()}>
      {children}
    </View>
  );
}

/** Decide entre Login y la app autenticada; restaura la sesión al arrancar. */
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (status === 'idle' || status === 'restoring') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.brandTeal} />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return <LoginContainer />;
  }

  return (
    <InactivityGate>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={AppTabs} />
        <Stack.Screen name="CaseDetail" component={CaseDetailPlaceholder} />
        <Stack.Screen
          name="NewCase"
          component={NewCasePlaceholder}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </InactivityGate>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandDark,
  },
});
