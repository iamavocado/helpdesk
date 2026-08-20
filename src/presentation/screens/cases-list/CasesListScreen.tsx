import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { AppHeader, CaseListItem } from '@/presentation/components';
import { Chip, Text, colors, spacing } from '@/design-system';
import type { Case, Classification } from '@/domain';

export type ListFilter = 'todos' | 'pendiente' | 'cola' | 'resuelto' | 'cerrado';

export interface CasesListScreenProps {
  cases: Case[];
  filter: ListFilter;
  total: number;
  refreshing?: boolean;
  loadingMore?: boolean;
  onChangeFilter: (filter: ListFilter) => void;
  onOpenCase: (caseId: string) => void;
  onEndReached?: () => void;
  onRefresh?: () => void;
}

const FILTERS: { key: ListFilter; label: string; dot?: Classification }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendientes', dot: 'pendiente' },
  { key: 'cola', label: 'En Cola', dot: 'cola' },
  { key: 'resuelto', label: 'Resueltos', dot: 'cerrado' },
  { key: 'cerrado', label: 'Cerrados', dot: 'cerrado' },
];

const TITLES: Record<ListFilter, { title: string; subtitle: string }> = {
  todos: { title: 'Mis casos', subtitle: 'Todos los casos' },
  pendiente: { title: 'Pendientes', subtitle: 'Casos pendientes' },
  cola: { title: 'En Cola', subtitle: 'Casos esperando' },
  resuelto: { title: 'Resueltos', subtitle: 'Casos resueltos' },
  cerrado: { title: 'Cerrados', subtitle: 'Casos cerrados' },
};

/** Lista de casos con filtros por estado, paginación y pull-to-refresh. */
export function CasesListScreen({
  cases,
  filter,
  total,
  refreshing = false,
  loadingMore = false,
  onChangeFilter,
  onOpenCase,
  onEndReached,
  onRefresh,
}: CasesListScreenProps) {
  const header = (
    <View>
      <Text variant="screenTitle" color={colors.brandDark}>
        {TITLES[filter].title}
      </Text>
      <Text variant="subtitle" color={colors.inkFaint} style={styles.subtitle}>
        {total} {total === 1 ? 'caso' : 'casos'} · {TITLES[filter].subtitle}
      </Text>
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            dotStatus={f.dot}
            active={filter === f.key}
            onPress={() => onChangeFilter(f.key)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <AppHeader />
      <FlatList
        data={cases}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CaseListItem item={item} onPress={onOpenCase} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <Text variant="body" color={colors.inkFaint} style={styles.empty}>
            No hay casos en este filtro.
          </Text>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.brandTeal} style={styles.more} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, paddingBottom: 110 },
  subtitle: { marginBottom: spacing['3xl'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing['3xl'] },
  empty: { marginTop: spacing['5xl'], textAlign: 'center' },
  more: { marginVertical: spacing['3xl'] },
});
