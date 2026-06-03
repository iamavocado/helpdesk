import { StyleSheet, View } from 'react-native';

import { Text, colors, spacing } from '@/design-system';

export interface AppHeaderProps {
  /** Punto de notificaciones visible. */
  showBadge?: boolean;
}

/** Cabecera de marca DOZZIER (azul marino + logo), como en el prototipo. */
export function AppHeader({ showBadge = true }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logo}>
        <View style={styles.mark}>
          <Text color={colors.brandTealBright} style={styles.markText}>
            Z
          </Text>
        </View>
        <Text color={colors.white} style={styles.logoText}>
          DOZZIER
        </Text>
      </View>
      <View style={styles.bell}>
        <Text color={colors.white}>🔔</Text>
        {showBadge ? <View style={styles.badge} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brandDark,
    paddingHorizontal: spacing.screen,
    paddingTop: 50,
    paddingBottom: spacing['4xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.brandTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontWeight: '800', fontSize: 18 },
  logoText: { fontWeight: '800', fontSize: 18, letterSpacing: 1.5 },
  bell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandTealBright,
  },
});
