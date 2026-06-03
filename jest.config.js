/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  passWithNoTests: true,
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
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
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    './src/domain/': { branches: 70, functions: 70, lines: 70, statements: 70 },
    './src/services/': { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
};
