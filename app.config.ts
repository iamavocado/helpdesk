import { config as loadEnv } from 'dotenv';
import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Selección de ambiente por la variable APP_ENV.
 * Carga el archivo .env.<APP_ENV> y expone las variables vía `extra`,
 * accesibles en runtime con expo-constants (ver src/core/config/env.ts).
 *
 * Ej.:  APP_ENV=staging npx expo start
 */
const APP_ENV = process.env.APP_ENV ?? 'development';
loadEnv({ path: `.env.${APP_ENV}` });

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'DOZZIER HelpDesk',
  slug: 'dozzier-helpdesk-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'dozzier',
  assetBundlePatterns: ['**/*'],
  plugins: ['expo-font', 'expo-secure-store', 'expo-sqlite'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.ita.dozzier.helpdesk',
    // deploymentTarget 14.0 se fija vía expo-build-properties en una fase posterior
    infoPlist: {
      // HTTPS obligatorio: ATS sin excepciones en release (ver SECURITY.md §6)
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
    },
  },
  android: {
    package: 'com.ita.dozzier.helpdesk',
    // minSdkVersion 24 y cleartext=false se fijan vía expo-build-properties en una fase posterior
  },
  extra: {
    appEnv: APP_ENV,
    apiBaseUrl: process.env.API_BASE_URL ?? '',
    useMockApi: process.env.USE_MOCK_API ?? 'true',
    enableCertPinning: process.env.ENABLE_CERT_PINNING ?? 'false',
    inactivityTimeoutMinutes: process.env.INACTIVITY_TIMEOUT_MINUTES ?? '30',
    dominio: process.env.DOMINIO ?? '',
  },
});
