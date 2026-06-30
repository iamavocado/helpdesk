import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '../tokens';
import { Text } from './Text';

export type SelectOption<T extends string | number> = {
  label: string;
  value: T;
};

export type SelectProps<T extends string | number> = {
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Select estilo prototipo: campo con chevron que abre un modal inferior
 * con las opciones. Tamaño de toque ≥44pt por opción.
 */
export function Select<T extends string | number>({
  label,
  required = false,
  error,
  placeholder = 'Seleccionar...',
  value,
  options,
  onChange,
  containerStyle,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" color={colors.inkSoft} style={styles.label}>
          {label}
          {required ? <Text color={colors.brandTeal}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Abre la lista de opciones"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          !!error && styles.errorBorder,
          pressed && styles.pressed,
        ]}
      >
        <Text color={selected ? colors.ink : colors.inkFaint} variant="body">
          {selected?.label ?? placeholder}
        </Text>
        <Text color={colors.inkFaint}>▾</Text>
      </Pressable>

      {error ? (
        <Text variant="caption" color={colors.cola} style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: spacing['2xl'] + insets.bottom }]}>
            {label ? (
              <Text variant="sectionTitle" color={colors.brandDark} style={styles.sheetTitle}>
                {label}
              </Text>
            ) : null}
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  >
                    <Text color={isSelected ? colors.brandTeal : colors.ink} variant="body">
                      {item.label}
                    </Text>
                    {isSelected ? <Text color={colors.brandTeal}>✓</Text> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing['2xl'] },
  label: { marginBottom: spacing.sm },
  field: {
    width: '100%',
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.input,
    backgroundColor: '#fafbfc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { borderColor: colors.brandTeal },
  errorBorder: { borderColor: colors.cola },
  error: { marginTop: spacing.xs },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,42,58,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.screen,
    paddingBottom: spacing['5xl'],
    maxHeight: '60%',
  },
  sheetTitle: { marginBottom: spacing['2xl'] },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionPressed: { backgroundColor: '#fafbfc' },
});
