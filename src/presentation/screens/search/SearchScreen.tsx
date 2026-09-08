import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { AppHeader, CaseListItem } from '@/presentation/components';
import { Input, Text, colors, spacing } from '@/design-system';
import type { Case } from '@/domain';

export interface SearchScreenProps {
  query: string;
  results: Case[];
  total: number;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  onSearch: (text: string) => void;
  onLoadMore: () => void;
  onOpenCase: (caseId: string) => void;
}

/** Pantalla de búsqueda de casos con input, resultados y paginación infinita. */
export function SearchScreen({
  query,
  results,
  total,
  loading,
  hasMore,
  error,
  onSearch,
  onLoadMore,
  onOpenCase,
}: SearchScreenProps) {
  const renderEmpty = () => {
    if (loading) return null;
    if (!query.trim()) {
      return (
        <Text variant="body" color={colors.inkFaint} style={styles.empty}>
          Escribe algo para buscar casos.
        </Text>
      );
    }
    return (
      <Text variant="body" color={colors.inkFaint} style={styles.empty}>
        No se encontraron casos para "{query}".
      </Text>
    );
  };

  return (
    <View style={styles.root}>
      <AppHeader />
      <View style={styles.content}>
        <Text variant="screenTitle" color={colors.brandDark}>
          Buscar casos
        </Text>
        <Input
          label="Buscar"
          placeholder="Número, técnico, solicitante, detalle…"
          value={query}
          onChangeText={onSearch}
          containerStyle={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? (
          <Text variant="caption" color={colors.brandError} style={styles.error}>
            {error}
          </Text>
        ) : null}
        {query.trim() && !loading && results.length > 0 ? (
          <Text variant="subtitle" color={colors.inkFaint} style={styles.count}>
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </Text>
        ) : null}
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CaseListItem item={item} onPress={onOpenCase} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        onEndReached={hasMore ? onLoadMore : undefined}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading && results.length > 0 ? (
            <ActivityIndicator color={colors.brandTeal} style={styles.more} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, paddingBottom: 0 },
  input: { marginTop: spacing['3xl'], marginBottom: spacing.lg },
  error: { marginBottom: spacing.md },
  count: { marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.screen, paddingBottom: 110 },
  empty: { textAlign: 'center', marginTop: spacing['5xl'], paddingHorizontal: spacing.screen },
  more: { paddingVertical: spacing.xl },
});
