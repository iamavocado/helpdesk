import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Button, Input, Text, colors, spacing } from '@/design-system';
import type { Credentials } from '@/domain';

import { validateLogin, type LoginErrors } from './login-validation';

export interface LoginScreenProps {
  onSubmit: (credentials: Credentials) => void;
  loading?: boolean;
  errorMessage?: string | null;
}

/**
 * Pantalla de login (presentacional). Valida los campos con zod y delega el
 * envío a `onSubmit`. Sin acoplamiento a stores ni módulos nativos (testeable).
 */
export function LoginScreen({ onSubmit, loading = false, errorMessage }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});

  const handleSubmit = (): void => {
    const fieldErrors = validateLogin({ username, password });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;
    onSubmit({ username: username.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo} color={colors.white}>
          DOZZIER
        </Text>
        <Text variant="subtitle" color={colors.brandTealBright}>
          HelpDesk Móvil
        </Text>
      </View>

      <View style={styles.card}>
        <Text variant="detailTitle" color={colors.brandDark} style={styles.title}>
          Iniciar sesión
        </Text>

        {errorMessage ? (
          <View accessibilityRole="alert" style={styles.errorBox}>
            <Text variant="body" color={colors.cola}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <Input
          label="Usuario"
          required
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          placeholder="usuario"
          error={errors.username}
          editable={!loading}
        />
        <Input
          label="Contraseña"
          required
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          error={errors.password}
          editable={!loading}
        />

        <Button
          title={loading ? 'Ingresando…' : 'Ingresar'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submit}
        />
        {loading ? <ActivityIndicator color={colors.brandTeal} style={styles.spinner} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brandDark },
  header: { paddingTop: 90, paddingBottom: spacing['5xl'], alignItems: 'center' },
  logo: { fontSize: 28, lineHeight: 36, fontWeight: '800', letterSpacing: 2 },
  card: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.screen,
    paddingTop: spacing['5xl'],
  },
  title: { marginBottom: spacing['4xl'] },
  errorBox: {
    backgroundColor: colors.colaSoft,
    borderRadius: spacing.lg,
    padding: spacing['2xl'],
    marginBottom: spacing['4xl'],
  },
  submit: { marginTop: spacing.md },
  spinner: { marginTop: spacing['2xl'] },
});
