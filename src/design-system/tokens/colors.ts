/**
 * Paleta DOZZIER — extraída 1:1 del prototipo `dozzier-mobile.html` (:root).
 * No introducir colores fuera de esta paleta sin aprobación de diseño.
 */
export const colors = {
  // Marca
  brandDark: '#0a2647', // azul marino oscuro de la referencia
  brandDarker: '#071d3d',
  brandTeal: '#008776', // verde oscuro de la referencia
  brandTealBright: '#008776',
  brandAccent: '#008776', // verde oscuro de la acción principal

  // Superficies y texto
  bg: '#f7f8fa',
  surface: '#ffffff',
  ink: '#123b5d',
  inkSoft: '#5b6d84',
  inkFaint: '#7b8aa0',
  line: '#d9e2eb',
  white: '#ffffff',

  // Estados oficiales (clasificación) + variantes suaves
  pendiente: '#e68a48',
  pendienteSoft: '#fce5d3',
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
