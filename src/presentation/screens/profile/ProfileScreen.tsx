import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Text, colors, spacing } from '@/design-system';
import { authorInitials } from '@/domain';
import { useAuthStore } from '@/presentation/stores';

/** Perfil del usuario con cierre de sesión. */
export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const name = user?.name ?? 'Usuario';

  return (
    <View style={styles.root}>
      <Avatar initials={authorInitials(name)} size={72} />
      <Text variant="detailTitle" color={colors.brandDark} style={styles.name}>
        {name}
      </Text>
      <Text variant="subtitle" color={colors.inkFaint}>
        {user?.email ?? ''}
      </Text>
      <Button
        title="Cerrar sesión"
        variant="secondary"
        fullWidth={false}
        onPress={() => void logout()}
        style={styles.logout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  name: { marginTop: spacing['2xl'] },
  logout: { marginTop: spacing['5xl'], paddingHorizontal: spacing['5xl'] },
});
