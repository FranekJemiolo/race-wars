/**
 * Test Setup File
 * 
 * Global test configuration and setup for behavioral tests.
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-behavioral-tests'
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/race_wars_test'

// Increase timeout for behavioral tests
jest.setTimeout(30000)
