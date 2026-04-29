#!/bin/bash

# Test setup script for Race Wars server
# This script sets up the test database and runs all tests

set -e

echo "🏁 Setting up Race Wars test environment..."

# Stop any existing test containers
echo "🛑 Stopping existing test containers..."
docker-compose -f docker-compose.test.yml down -v

# Start test database
echo "🚀 Starting test database..."
docker-compose -f docker-compose.test.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker exec race-wars-test-db pg_isready -U race_wars -d race_wars_test; do
  echo "Waiting for postgres..."
  sleep 2
done

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker exec race-wars-test-redis redis-cli ping; do
  echo "Waiting for redis..."
  sleep 1
done

echo "✅ Database and Redis are ready!"

# Set test environment variables
export DB_HOST=localhost
export DB_PORT=5433
export DB_NAME=race_wars_test
export DB_USER=race_wars
export DB_PASSWORD=race_wars_dev
export REDIS_HOST=localhost
export REDIS_PORT=6380
export NODE_ENV=test

echo "🔧 Environment variables set for testing"

# Run database migrations if needed
echo "🗄️ Running database migrations..."
cd server
npm run migrate:test || echo "Migration script not found, continuing..."

echo "🧪 Running server tests..."
npm test

echo "🧹 Cleaning up test containers..."
cd ..
docker-compose -f docker-compose.test.yml down

echo "✅ Test run completed!"
