import { StyleSheet, View } from 'react-native';

import { timeAgo } from '@/core/utils/date';
import { Badge, Card, Text, colors, spacing } from '@/design-system';
import { caseTitle, classificationLabel, type Case } from '@/domain';

export interface CaseListItemProps {
  item: Case;
  onPress: (caseId: string) => void;
  now?: number;
}

/** Tarjeta de caso para listas (Home y Lista), con franja y badge de estado. */
export function CaseListItem({ item, onPress, now }: CaseListItemProps) {
  const meta = [item.equipmentTypeDesc, timeAgo(item.creationDate, now)].filter(Boolean);
  return (
    <Card
      statusStripe={item.classification}
      onPress={() => onPress(item.id)}
      accessibilityLabel={caseTitle(item)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="caption" color={colors.inkFaint}>
            {item.serverId != null ? `Caso #${item.serverId}` : 'Pendiente de número'}
          </Text>
          <Text variant="bodyStrong" color={colors.ink} numberOfLines={2}>
            {caseTitle(item)}
          </Text>
        </View>
        <Badge status={item.classification} label={classificationLabel(item.classification)} />
      </View>
      <Text variant="caption" color={colors.inkFaint}>
        {meta.join('  ·  ')}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg, paddingLeft: spacing['5xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  flex: { flex: 1 },
});
