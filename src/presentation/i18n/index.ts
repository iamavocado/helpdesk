import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';

export const resources = {
  es: { translation: es },
  en: { translation: en },
} as const;

export const defaultLanguage = 'es';

const deviceLanguage = getLocales()[0]?.languageCode ?? defaultLanguage;
const supported = Object.keys(resources);
const initialLanguage = supported.includes(deviceLanguage) ? deviceLanguage : defaultLanguage;

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: defaultLanguage,
  // Resolutor de plurales clásico: no requiere Intl.PluralRules (no disponible en Hermes).
  compatibilityJSON: 'v3',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
