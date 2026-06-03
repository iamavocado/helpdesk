import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, statusColors, type StatusKey } from '../tokens';
import { Text } from './Text';

export type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Punto de color de estado a la izquierda (como `.chip-dot` del prototipo). */
  dotStatus?: StatusKey;
  style?: StyleProp<ViewStyle>;
};

/**
 * Chip de filtro. Activo => fondo azul marino y texto blanco.
 * Inactivo => superficie con borde. Opcional punto de color de estado.
 */
export function Chip({ label, active = false, onPress, dotStatus, style }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.active : styles.inactive,
        pressed && styles.pressed,
        style,
      ]}
    >
      {dotStatus ? (
        <View style={[styles.dot, { backgroundColor: statusColors[dotStatus].base }]} />
      ) : null}
      <Text variant="caption" color={active ? colors.white : colors.inkSoft} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inactive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  active: { backgroundColor: colors.brandDark, borderWidth: 1, borderColor: colors.brandDark },
  pressed: { opacity: 0.85 },
  dot: { width: 8, height: 8, borderRadius: radii.full },
  label: { fontSize: 12, fontWeight: '600' },
});
