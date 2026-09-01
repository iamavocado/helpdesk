import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, colors, radii, shadows, spacing } from '@/design-system';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Cases: 'list-outline',
  Search: 'search-outline',
  Profile: 'person-outline',
};

const LABELS: Record<string, string> = {
  Home: 'Inicio',
  Cases: 'Casos',
  Search: 'Buscar',
  Profile: 'Perfil',
};

/**
 * Tab bar del prototipo: Inicio · Casos · [FAB +] · Buscar · Perfil.
 * El FAB central no es una pestaña: dispara `onFabPress` (crear caso).
 */
export function CustomTabBar({
  state,
  navigation,
  onFabPress,
}: BottomTabBarProps & { onFabPress: () => void }) {
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderItem = (routeName: string, index: number) => {
    const focused = state.index === index;
    return (
      <Pressable
        key={routeName}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={LABELS[routeName]}
        style={styles.item}
        onPress={() => navigation.navigate(routeName)}
      >
        <Ionicons
          name={ICONS[routeName] ?? 'ellipse-outline'}
          size={22}
          color={focused ? colors.brandTeal : colors.inkFaint}
        />
        <Text variant="caption" color={focused ? colors.brandTeal : colors.inkFaint}>
          {LABELS[routeName]}
        </Text>
      </Pressable>
    );
  };

  return (
    // paddingBottom = barra de navegación del sistema (safe area) para que las
    // pestañas nunca queden debajo de los botones del teléfono (cualquier modelo).
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {left.map((r) => renderItem(r.name, state.routes.indexOf(r)))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear caso"
        onPress={() => {
          console.log('[DEBUG] FAB presionado — navegando a NewCase');
          onFabPress();
        }}
        style={styles.fab}
      >
        <Ionicons name="add" size={26} color={colors.white} />
      </Pressable>
      {right.map((r) => renderItem(r.name, state.routes.indexOf(r)))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screen,
  },
  item: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  fab: {
    width: 54,
    height: 54,
    borderRadius: radii.full,
    backgroundColor: colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 3,
    borderColor: colors.white,
    ...shadows.fab,
  },
});
