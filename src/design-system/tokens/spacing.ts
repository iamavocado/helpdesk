/**
 * Escala de espaciado (px) derivada de los paddings/gaps del prototipo:
 * padding de pantalla 22, gaps 8/10/14, paddings de tarjeta 16/18.
 */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  '4xl': 18,
  screen: 22,
  '5xl': 24,
} as const;

export type SpacingToken = keyof typeof spacing;
