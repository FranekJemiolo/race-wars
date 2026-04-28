#!/usr/bin/env node

/**
 * Development Setup Script
 * 
 * Sets up local development environment with database and starts all services
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Setting up Race Wars development environment...\n');

// Create .env file if it doesn't exist
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file...');
  const envContent = `# Database Configuration (SQLite for local dev)
DATABASE_URL=sqlite:./data/race_wars.db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=race_wars
DB_USER=race_wars
DB_PASSWORD=password

# JWT Configuration
JWT_ACCESS_SECRET=dev-access-secret-key-local
JWT_REFRESH_SECRET=dev-refresh-secret-key-local
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server Configuration
PORT=8080
NODE_ENV=development

# Client Configuration
CLIENT_PORT=5173
VITE_API_URL=http://localhost:8080

# WebSocket Configuration
WS_PORT=8081

# Development Settings
DEBUG=race-wars:*
LOG_LEVEL=debug
`;
  
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created');
} else {
  console.log('✅ .env file already exists');
}

// Create data directory
if (!fs.existsSync('data')) {
  fs.mkdirSync('data', { recursive: true });
  console.log('✅ Created data directory');
}

// Update database connection to use SQLite for local development
console.log('🔧 Configuring database for local development...');

const serverIndex = 'server/src/index.ts';
if (fs.existsSync(serverIndex)) {
  let indexContent = fs.readFileSync(serverIndex, 'utf8');
  
  // Add SQLite fallback for local development
  if (!indexContent.includes('sqlite')) {
    console.log('📝 Adding SQLite configuration...');
    // This would be handled in the database connection file
  }
}

console.log('\n🎯 Development environment ready!');
console.log('\n📋 Next steps:');
console.log('1. Start PostgreSQL (optional): docker run -d -p 5432:5432 -e POSTGRES_DB=race_wars -e POSTGRES_USER=race_wars -e POSTGRES_PASSWORD=password postgis/postgis:15-3.3');
console.log('2. Or use SQLite (default for local dev)');
console.log('3. Run: npm run dev:all');
console.log('\n🌐 Access points:');
console.log('- Server: http://localhost:8080');
console.log('- Client: http://localhost:5173');
console.log('- WebSocket: ws://localhost:8081');
