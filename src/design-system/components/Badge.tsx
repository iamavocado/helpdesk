import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii, spacing, statusColors, type StatusKey } from '../tokens';
import { Text } from './Text';

export type BadgeProps = {
  label: string;
  status: StatusKey;
  style?: StyleProp<ViewStyle>;
};

/**
 * Píldora de estado (clasificación del caso). Fondo suave + texto del color base,
 * en mayúsculas, igual que `.status-badge` del prototipo.
 */
export function Badge({ label, status, style }: BadgeProps) {
  const palette = statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: palette.soft }, style]}>
      <Text variant="caption" color={palette.base} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
});
