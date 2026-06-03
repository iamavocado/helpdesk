import { StyleSheet, View } from 'react-native';

import { Text, colors, spacing } from '@/design-system';

/** Pantalla temporal para secciones aún no implementadas. */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.root}>
      <Text variant="detailTitle" color={colors.brandDark}>
        {title}
      </Text>
      <Text variant="subtitle" color={colors.inkFaint} style={styles.note}>
        Disponible próximamente
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  note: { marginTop: spacing.md },
});
