/**
 * Test Setup Configuration
 * Global test setup for Vitest
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  
  console.log('🧪 Test environment initialized');
});

afterAll(() => {
  // Global cleanup
  console.log('🧪 Test environment cleaned up');
});

beforeEach(() => {
  // Reset any mocks or state before each test
});

afterEach(() => {
  // Clean up after each test
});

// Global mocks for enterprise modules
const mockLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {}
};

// Mock external dependencies
global.mockLogger = mockLogger;