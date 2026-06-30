/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  passWithNoTests: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|i18next|react-i18next))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/data/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    'src/presentation/screens/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
    // Archivos solo-interfaz/tipos (sin lógica ejecutable):
    '!src/domain/repositories/**',
    '!src/domain/entities/catalog.ts',
    '!src/domain/value-objects/sync-status.ts',
    '!src/services/api/api-client.ts',
    '!src/data/datasources/local/local-data-source.ts',
    '!src/data/datasources/remote/dto.ts',
    '!src/data/sync/pending-operation.ts',
    // Esqueleto que se implementa/prueba al cablear la API real (Fase 4):
    '!src/services/api/http-api-client.ts',
    // Esquema WatermelonDB: se activa con el build nativo (Fase posterior):
    '!src/data/datasources/local/watermelon/**',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    './src/domain/': { branches: 70, functions: 70, lines: 70, statements: 70 },
    './src/services/': { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
};
