import { createContext, useContext, type ReactNode } from 'react';

import { theme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(theme);

/**
 * Provee el tema DOZZIER. Hoy el tema es estático (modo claro);
 * el contexto deja la puerta abierta a theming dinámico sin refactor.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
