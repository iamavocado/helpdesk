import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';

import { env } from '@/core/config/env';
import { getContainer } from '@/core/di';
import { InactivityTimer } from '@/data/security';
import { colors } from '@/design-system';
import { CaseDetailContainer } from '@/presentation/screens/case-detail';
import { LoginContainer } from '@/presentation/screens/login';
import { NewCaseContainer } from '@/presentation/screens/new-case';
import { useAuthStore } from '@/presentation/stores';

import { AppTabs } from './AppTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

  // Sincroniza la cola pendiente al autenticarse y cada vez que la app vuelve a
  // primer plano (drena lo que quedó offline). Event-driven: sin temporizadores.
  useEffect(() => {
    const drain = () => void getContainer().syncEngine.drain();
    drain();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') drain();
    });
    return () => sub.remove();
  }, []);

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
        <Stack.Screen name="CaseDetail" component={CaseDetailContainer} />
        <Stack.Screen
          name="NewCase"
          component={NewCaseContainer}
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
