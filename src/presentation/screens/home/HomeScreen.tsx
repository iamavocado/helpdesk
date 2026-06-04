import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader, CaseListItem } from '@/presentation/components';
import { Text, colors, fontFamily, radii, shadows, spacing, statusColors } from '@/design-system';
import type { Case, Classification } from '@/domain';

export interface HomeCounts {
  pendiente: number;
  cola: number;
  cerrado: number;
  total: number;
}

export interface HomeScreenProps {
  userName: string;
  counts: HomeCounts;
  recentCases: Case[];
  onOpenList: (classification?: Classification) => void;
  onOpenCase: (caseId: string) => void;
  onCreateCase: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

interface CardDef {
  key: Classification | 'total';
  label: string;
  count: number;
  color: string;
}

/** Dashboard de inicio: saludo, tarjetas de estado, CTA y casos recientes. */
export function HomeScreen({
  userName,
  counts,
  recentCases,
  onOpenList,
  onOpenCase,
  onCreateCase,
  refreshing = false,
  onRefresh,
}: HomeScreenProps) {
  const cards: CardDef[] = [
    {
      key: 'pendiente',
      label: 'Casos Pendientes',
      count: counts.pendiente,
      color: statusColors.pendiente.base,
    },
    { key: 'cola', label: 'Casos en Cola', count: counts.cola, color: statusColors.cola.base },
    {
      key: 'cerrado',
      label: 'Casos Cerrados',
      count: counts.cerrado,
      color: statusColors.cerrado.base,
    },
    { key: 'total', label: 'Total de casos', count: counts.total, color: colors.brandTeal },
  ];

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
        }
      >
        <Text variant="screenTitle" color={colors.brandDark}>
          Hola,{' '}
          <Text variant="screenTitle" color={colors.brandTeal}>
            {userName}
          </Text>
        </Text>
        <Text variant="subtitle" color={colors.inkFaint} style={styles.subtitle}>
          Resumen de tus casos en DOZZIER
        </Text>

        <View style={styles.grid}>
          {cards.map((c) => (
            <Pressable
              key={c.key}
              accessibilityRole="button"
              accessibilityLabel={`${c.label}: ${c.count}`}
              onPress={() => onOpenList(c.key === 'total' ? undefined : c.key)}
              style={({ pressed }) => [styles.statusCard, pressed && styles.pressed]}
            >
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <Text style={styles.count} color={colors.brandDark}>
                {c.count}
              </Text>
              <Text variant="bodyStrong" color={colors.ink}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onCreateCase}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text variant="button" color={colors.white}>
            Crear nuevo caso
          </Text>
          <Text color={colors.white} style={styles.ctaArrow}>
            →
          </Text>
        </Pressable>

        <View style={styles.sectionLabel}>
          <Text variant="sectionLabel" color={colors.inkFaint}>
            Casos recientes
          </Text>
          <Pressable accessibilityRole="button" onPress={() => onOpenList()}>
            <Text variant="caption" color={colors.brandTeal}>
              Ver todos
            </Text>
          </Pressable>
        </View>

        {recentCases.length === 0 ? (
          <Text variant="body" color={colors.inkFaint}>
            No hay casos recientes.
          </Text>
        ) : (
          recentCases.map((item) => <CaseListItem key={item.id} item={item} onPress={onOpenCase} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, paddingBottom: 110 },
  subtitle: { marginBottom: spacing['4xl'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginBottom: spacing['4xl'] },
  statusCard: {
    width: '47.5%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing['3xl'],
    ...shadows.card,
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginBottom: spacing.lg },
  count: {
    fontFamily: fontFamily.extrabold,
    fontSize: 26,
    lineHeight: 34,
    marginBottom: spacing.xs,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  cta: {
    backgroundColor: colors.brandTeal,
    borderRadius: radii.card,
    padding: spacing['4xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['5xl'],
    ...shadows.cta,
  },
  ctaArrow: { fontSize: 18 },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
});
