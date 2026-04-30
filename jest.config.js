/**
 * Jest Configuration for Behavioral Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/integration/**/*.+(ts|tsx|js)',
    '**/unit/**/*.+(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/tests/playwright',
    '<rootDir>/tests/e2e',
    '<rootDir>/screenshots'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'server/src/**/*.{ts,tsx}',
    '!server/src/**/*.d.ts',
    '!server/src/**/*.spec.ts',
    '!server/src/**/*.test.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/server/src/$1'
  }
}
