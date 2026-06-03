import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './src/presentation/i18n';
import { ThemeProvider, useAppFonts, colors } from './src/design-system';
import { RootNavigator } from './src/presentation/navigation';

/**
 * Raíz de la app: carga fuentes, provee tema y navegación.
 * El gate de sesión (Login vs app) vive en RootNavigator.
 */
export default function App() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.brandTeal} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandDark,
  },
});
