import { jest } from '@jest/globals';

// Global test setup
// Clean up any open handles after each test
afterAll(() => {
  jest.clearAllMocks();
});

// Mock environment variables for tests
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'zamglam_db_test';
process.env.PORT = process.env.PORT || '5000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
