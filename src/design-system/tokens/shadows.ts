import { Platform, type ViewStyle } from 'react-native';

/**
 * Sombras del prototipo traducidas a RN (iOS shadow* + Android elevation).
 * --shadow: 0 1px 2px rgba(30,42,58,.04), 0 8px 24px rgba(30,42,58,.08)
 */
const make = (
  opacity: number,
  radius: number,
  offsetY: number,
  elevation: number,
  color = '#1e2a3a',
): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;

export const shadows = {
  none: make(0, 0, 0, 0),
  card: make(0.08, 12, 8, 3),
  cta: make(0.3, 14, 4, 6, '#2d9b8f'),
  fab: make(0.5, 20, 6, 10, '#2d9b8f'),
} as const;

export type ShadowToken = keyof typeof shadows;
