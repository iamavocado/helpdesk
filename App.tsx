import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import './src/presentation/i18n';
import { DesignSystemCatalog } from './src/design-system/catalog/DesignSystemCatalog';
import { ThemeProvider, useAppFonts, colors } from './src/design-system';

/**
 * Fase 2: la app monta el sistema de diseño y muestra el catálogo de componentes.
 * La navegación y las pantallas reales llegan en la Fase 5; el catálogo es temporal.
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
    <ThemeProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <DesignSystemCatalog />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? 28 : 52,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandDark,
  },
});
