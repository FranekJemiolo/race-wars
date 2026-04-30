const fs = require('fs');
const path = require('path');

// Create test database setup
function setupTestDatabase() {
  const dataDir = path.join(__dirname, '../data');
  const testDbPath = path.join(dataDir, 'race_wars_test.db');
  
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Create test database file
  if (!fs.existsSync(testDbPath)) {
    fs.writeFileSync(testDbPath, '');
    console.log('✅ Test database created at:', testDbPath);
  } else {
    console.log('✅ Test database already exists at:', testDbPath);
  }
  
  // Create test environment file
  const testEnvPath = path.join(__dirname, '../.env.test');
  const testEnvContent = `
# Database Configuration (SQLite for testing)
DATABASE_URL=sqlite:./data/race_wars_test.db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=race_wars_test
DB_USER=race_wars
DB_PASSWORD=password

# JWT Configuration
JWT_ACCESS_SECRET=test-access-secret-key
JWT_REFRESH_SECRET=test-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server Configuration
PORT=8080
NODE_ENV=test

# Client Configuration
CLIENT_PORT=5173
VITE_API_URL=http://localhost:8080

# WebSocket Configuration
WS_PORT=8081

# Development Settings
DEBUG=race-wars:*
LOG_LEVEL=error
`;

  fs.writeFileSync(testEnvPath, testEnvContent.trim());
  console.log('✅ Test environment file created at:', testEnvPath);
  
  return testDbPath;
}

// Setup test database
setupTestDatabase();
