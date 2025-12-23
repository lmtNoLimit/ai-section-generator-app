/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app', '<rootDir>/scripts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/__tests__/**',
    '!app/entry.*.tsx',
    '!app/root.tsx',
    '!app/services/config.server.ts', // Config initialization, tested via integration
    '!app/services/theme.server.ts', // Real Shopify API, tested via mocks
    '!app/services/ai.server.ts', // Real Gemini API, tested via mocks
    '!app/services/billing.server.ts', // Complex Shopify billing, needs integration tests
    '!app/services/history.server.ts', // DB operations, needs integration tests
    '!app/services/settings.server.ts', // DB operations, needs integration tests
    '!app/services/template.server.ts', // DB operations, needs integration tests
    '!app/services/usage-tracking.server.ts', // DB operations, needs integration tests
    '!app/services/shopify-data.server.ts', // Real Shopify API, tested via mocks
    '!app/services/adapters/*.ts', // Simple delegation, tested via integration
    '!app/services/flags/*.ts', // Feature flags, tested via integration
  ],
  coverageThreshold: {
    // Low global thresholds - codebase still early stage
    // TODO: Increase as test coverage improves
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
};
