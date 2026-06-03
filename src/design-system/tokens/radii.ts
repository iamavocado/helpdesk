/**
 * Radios de borde. `card` (14) es el --radius del prototipo;
 * input 10, button 12, pill 100, full para círculos.
 */
export const radii = {
  input: 10,
  button: 12,
  card: 14,
  lg: 18,
  xl: 24,
  pill: 100,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
