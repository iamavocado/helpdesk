import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import './src/presentation/i18n';

/**
 * Andamiaje Fase 1: la app compila y arranca vacía.
 * La navegación, el sistema de diseño y las pantallas llegan en fases posteriores.
 */
export default function App() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.brand}>{t('app.name')}</Text>
      <Text style={styles.tagline}>{t('app.tagline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e2a3a',
  },
  brand: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  tagline: {
    color: '#3eb5a7',
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 1,
  },
});
