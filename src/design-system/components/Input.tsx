import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radii, spacing, fontFamily, fontSize } from '../tokens';
import { Text } from './Text';

export type InputProps = TextInputProps & {
  label?: string;
  required?: boolean;
  error?: string;
  readonly?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Campo de texto con etiqueta en mayúsculas, estado de foco teal,
 * variante readonly y mensaje de error. Soporta multiline (textarea).
 */
export function Input({
  label,
  required = false,
  error,
  readonly = false,
  multiline = false,
  containerStyle,
  style,
  editable,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const isEditable = editable ?? !readonly;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" color={colors.inkSoft} style={styles.label}>
          {label}
          {required ? <Text color={colors.brandTeal}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        editable={isEditable}
        multiline={multiline}
        placeholderTextColor={colors.inkFaint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.textarea,
          focused && styles.focused,
          readonly && styles.readonly,
          !!error && styles.errorBorder,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color={colors.cola} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing['2xl'] },
  label: { marginBottom: spacing.sm },
  input: {
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.input,
    backgroundColor: '#fafbfc',
    color: colors.ink,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  focused: { borderColor: colors.brandTeal, backgroundColor: colors.surface },
  readonly: { backgroundColor: '#f0f3f6', color: colors.inkFaint },
  errorBorder: { borderColor: colors.cola },
  error: { marginTop: spacing.xs },
});
