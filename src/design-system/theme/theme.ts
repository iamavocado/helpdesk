import {
  colors,
  statusColors,
  fontFamily,
  fontSize,
  textVariants,
  spacing,
  radii,
  shadows,
} from '../tokens';

/** Objeto de tema único (modo claro). Fuente de verdad para estilos. */
export const theme = {
  colors,
  statusColors,
  fontFamily,
  fontSize,
  textVariants,
  spacing,
  radii,
  shadows,
} as const;

export type Theme = typeof theme;
