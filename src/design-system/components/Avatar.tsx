import { StyleSheet, View } from 'react-native';

import { colors, radii } from '../tokens';
import { Text } from './Text';

export type AvatarVariant = 'requester' | 'support';

export type AvatarProps = {
  initials: string;
  variant?: AvatarVariant;
  size?: number;
};

/**
 * Avatar circular con iniciales. `requester` teal, `support` azul marino,
 * igual que `.avatar` / `.avatar.support` del prototipo.
 */
export function Avatar({ initials, variant = 'requester', size = 28 }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radii.full,
          backgroundColor: variant === 'support' ? colors.brandDark : colors.brandTeal,
        },
      ]}
    >
      <Text color={colors.white} style={[styles.text, { fontSize: size * 0.4 }]}>
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' },
});
