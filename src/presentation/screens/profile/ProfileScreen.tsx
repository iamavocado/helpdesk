import Constants from 'expo-constants';
import { ScrollView, StyleSheet, View } from 'react-native';

import { env } from '@/core/config/env';
import { Avatar, Button, Text, colors, radii, shadows, spacing } from '@/design-system';
import { authorInitials } from '@/domain';
import { AppHeader } from '@/presentation/components';
import { useAuthStore } from '@/presentation/stores';

/** Nombre amigable del ambiente según la URL de la API. */
function environmentLabel(baseUrl: string, dominio: string): string {
  const host = baseUrl
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .toLowerCase();
  if (host.includes('arprotec')) return 'ARPROTEC';
  if (host.includes('desa')) return 'Desarrollo (DESA)';
  return dominio || host || 'Local';
}

/** Fila etiqueta → valor dentro de una tarjeta. */
function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text variant="caption" color={colors.inkFaint}>
        {label}
      </Text>
      <Text variant="bodyStrong" color={colors.ink} numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

/** Perfil del usuario: datos de la cuenta, versión de la app y cierre de sesión. */
export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const name = user?.name?.trim() || 'Usuario';
  const username = user?.username || '—';
  const email = user?.email?.trim() || 'Sin correo';
  const role = user?.role?.trim() || 'Usuario';
  const version = Constants.expoConfig?.version ?? '0.1.0';
  const ambiente = environmentLabel(env.apiBaseUrl, env.dominio);

  return (
    <View style={styles.root}>
      <AppHeader showBadge={false} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cabecera del perfil */}
        <View style={styles.hero}>
          <Avatar initials={authorInitials(name)} size={84} />
          <Text variant="detailTitle" color={colors.brandDark} style={styles.name}>
            {name}
          </Text>
          <View style={styles.rolePill}>
            <Text variant="caption" color={colors.brandTeal}>
              {role}
            </Text>
          </View>
          <Text variant="subtitle" color={colors.inkFaint} style={styles.email}>
            {email}
          </Text>
        </View>

        {/* Datos de la cuenta */}
        <Text variant="sectionTitle" color={colors.inkFaint} style={styles.sectionTitle}>
          CUENTA
        </Text>
        <View style={styles.card}>
          <InfoRow label="Usuario" value={username} />
          <InfoRow label="Correo" value={email} />
          <InfoRow label="Rol" value={role} last />
        </View>

        {/* Datos de la aplicación */}
        <Text variant="sectionTitle" color={colors.inkFaint} style={styles.sectionTitle}>
          APLICACIÓN
        </Text>
        <View style={styles.card}>
          <InfoRow label="Versión" value={`v${version}`} />
          <InfoRow label="Ambiente" value={ambiente} last />
        </View>

        <Button
          title="Cerrar sesión"
          variant="secondary"
          fullWidth
          onPress={() => void logout()}
          style={styles.logout}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screen, paddingBottom: spacing['5xl'] },
  hero: { alignItems: 'center', paddingVertical: spacing['5xl'] },
  name: { marginTop: spacing['2xl'] },
  rolePill: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: '#dcecea', // teal suave para el pill del rol
  },
  email: { marginTop: spacing.md },
  sectionTitle: { marginTop: spacing['3xl'], marginBottom: spacing.md, letterSpacing: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    paddingHorizontal: spacing['4xl'],
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing.xl,
  },
  rowLast: { borderBottomWidth: 0 },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  logout: { marginTop: spacing['5xl'] },
});
