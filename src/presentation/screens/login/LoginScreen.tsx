import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

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
  const [showPassword, setShowPassword] = useState(false);
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
        <View style={styles.passwordField}>
          <Input
            label="Contraseña"
            required
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            error={errors.password}
            editable={!loading}
            style={styles.passwordInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            disabled={loading}
            onPress={() => setShowPassword((v) => !v)}
            style={styles.toggle}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.inkFaint}
            />
          </Pressable>
        </View>

        <Button
          title={loading ? 'Ingresando…' : 'Ingresar'}
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submit}
        />
        {loading ? <ActivityIndicator color={colors.brandTeal} style={styles.spinner} /> : null}

        <View testID="login-version-footer" style={styles.versionFooter}>
          <Text variant="caption" color={colors.inkFaint}>
            Versión 1.0
          </Text>
          <Text variant="caption" color={colors.inkFaint}>
            14/09/2026
          </Text>
        </View>
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
  passwordField: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  toggle: { position: 'absolute', right: 12, top: 28 },
  submit: { marginTop: spacing.md },
  spinner: { marginTop: spacing['2xl'] },
  versionFooter: { marginTop: 'auto', alignItems: 'center', paddingTop: spacing['2xl'] },
});
