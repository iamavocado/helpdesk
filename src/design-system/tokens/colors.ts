/**
 * Paleta DOZZIER — extraída 1:1 del prototipo `dozzier-mobile.html` (:root).
 * No introducir colores fuera de esta paleta sin aprobación de diseño.
 */
export const colors = {
  // Marca
  brandDark: '#1e2a3a', // azul marino del logo
  brandDarker: '#151e2b',
  brandTeal: '#2d9b8f', // verde azulado del logo
  brandTealBright: '#3eb5a7',
  brandAccent: '#f5a623', // acento cálido

  // Superficies y texto
  bg: '#f4f6f8',
  surface: '#ffffff',
  ink: '#1e2a3a',
  inkSoft: '#4a5868',
  inkFaint: '#8a95a3',
  line: '#e3e8ee',
  white: '#ffffff',

  // Estados oficiales (clasificación) + variantes suaves
  pendiente: '#f0934a',
  pendienteSoft: '#fde6d3',
  cola: '#e53935',
  colaSoft: '#fcdbd9',
  resuelto: '#7cb342',
  resueltoSoft: '#e0eed1',
  cerrado: '#6c757d',
  cerradoSoft: '#e0e2e5',

  // Comentario privado (estilo amarillo del prototipo)
  privateBg: '#fef9e7',
  privateBorder: '#f0d97a',
  privateTag: '#b8860b',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Estados de caso según la clasificación real de la BD (Pendiente/Cola/Cerrado),
 * más `resuelto` como subestado visual. Cada uno con su color base y suave.
 */
export const statusColors = {
  pendiente: { base: colors.pendiente, soft: colors.pendienteSoft },
  cola: { base: colors.cola, soft: colors.colaSoft },
  resuelto: { base: colors.resuelto, soft: colors.resueltoSoft },
  cerrado: { base: colors.cerrado, soft: colors.cerradoSoft },
} as const;

export type StatusKey = keyof typeof statusColors;
