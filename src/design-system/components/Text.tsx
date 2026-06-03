import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, textVariants, type TextVariant } from '../tokens';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
};

/**
 * Texto base del sistema de diseño. Aplica una variante tipográfica
 * (Inter Tight / Fraunces) y un color de la paleta.
 */
export function Text({
  variant = 'body',
  color = colors.ink,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[textVariants[variant] as TextStyle, { color, textAlign: align }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
