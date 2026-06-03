/**
 * Tipografía DOZZIER.
 * UI: Inter Tight · Títulos: Fraunces (serif).
 * Los nombres de familia coinciden con los exportados por @expo-google-fonts
 * y cargados en src/design-system/theme/fonts.ts.
 */
export const fontFamily = {
  regular: 'InterTight_400Regular',
  medium: 'InterTight_500Medium',
  semibold: 'InterTight_600SemiBold',
  bold: 'InterTight_700Bold',
  extrabold: 'InterTight_800ExtraBold',
  serifRegular: 'Fraunces_400Regular',
  serifSemibold: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
} as const;

export const fontSize = {
  xs: 10,
  sm: 11,
  md: 12,
  base: 13,
  lg: 14,
  xl: 15,
  '2xl': 18,
  detailTitle: 22,
  screenTitle: 30,
} as const;

/** Escalas tipográficas listas para usar, derivadas del prototipo. */
export const textVariants = {
  // Fraunces 30, -0.03em
  screenTitle: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: fontSize.screenTitle,
    letterSpacing: -0.9,
    lineHeight: 32,
  },
  // Fraunces 22, -0.02em
  detailTitle: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: fontSize.detailTitle,
    letterSpacing: -0.44,
    lineHeight: 26,
  },
  // Fraunces 15 (títulos de sección de formulario)
  sectionTitle: {
    fontFamily: fontFamily.serifSemibold,
    fontSize: fontSize.xl,
    letterSpacing: -0.15,
  },
  // Etiqueta de sección en mayúsculas, 11, +0.1em
  sectionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: 19,
  },
  bodyStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    letterSpacing: -0.14,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
} as const;

export type TextVariant = keyof typeof textVariants;
