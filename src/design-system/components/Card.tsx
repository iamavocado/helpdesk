import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type ViewProps,
} from 'react-native';

import { colors, radii, spacing, statusColors, shadows, type StatusKey } from '../tokens';

export type CardProps = ViewProps & {
  onPress?: () => void;
  /** Franja lateral de color de estado (como `.case-item` del prototipo). */
  statusStripe?: StatusKey;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ViewProps['children'];
};

/**
 * Tarjeta base: superficie blanca, borde sutil, radio 14.
 * Opcionalmente presionable (feedback scale) y con franja de estado a la izquierda.
 */
export function Card({
  onPress,
  statusStripe,
  elevated = false,
  style,
  children,
  ...rest
}: CardProps) {
  const content = (
    <>
      {statusStripe ? (
        <View style={[styles.stripe, { backgroundColor: statusColors[statusStripe].base }]} />
      ) : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          elevated && shadows.card,
          pressed && styles.pressed,
          style,
        ]}
        {...rest}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, elevated && shadows.card, style]} {...rest}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing['3xl'],
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.99 }], backgroundColor: '#fafbfc' },
  stripe: {
    position: 'absolute',
    left: 0,
    top: spacing['3xl'],
    bottom: spacing['3xl'],
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
});
