/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app'],
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
  ],
  coverageThreshold: {
    // Service layer coverage thresholds
    'app/services/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Adapters have simple delegation logic, lower branch threshold acceptable
    'app/services/adapters/*.ts': {
      branches: 50,
      functions: 100,
      lines: 100,
      statements: 100,
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
