// Test setup for integration tests
const fs = require('fs');
const path = require('path');

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite:./data/race_wars_test.db';
process.env.DB_NAME = 'race_wars_test';
process.env.LOG_LEVEL = 'error';

// Ensure test database directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create test database file
const testDbPath = path.join(dataDir, 'race_wars_test.db');
if (!fs.existsSync(testDbPath)) {
  fs.writeFileSync(testDbPath, '');
}

console.log('Test environment configured');
console.log('Test database:', testDbPath);
