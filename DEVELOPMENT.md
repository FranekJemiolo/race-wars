# Development Setup Guide

This guide explains how to set up and run the Race Wars application locally for development.

## Quick Start

### Option 1: Simple Local Development (Recommended)

```bash
# Setup development environment
npm run dev:setup

# Start all components
npm run dev:simple
```

### Option 2: Docker Development

```bash
# Start with Docker Compose
npm run dev:docker

# Stop Docker services
npm run dev:docker:down
```

### Option 3: Full Local Development

```bash
# Start PostgreSQL (if not using Docker)
docker run -d -p 5432:5432 -e POSTGRES_DB=race_wars -e POSTGRES_USER=race_wars -e POSTGRES_PASSWORD=password postgis/postgis:15-3.3

# Start all services
npm run dev:all
```

## Development Components

### Server (Backend)
- **Port**: 8080
- **Technology**: Node.js, TypeScript, Express
- **Database**: PostgreSQL (with in-memory fallback)
- **Authentication**: JWT tokens

### Client (Frontend)
- **Port**: 5173
- **Technology**: React, Vite, TypeScript
- **Real-time**: WebSocket connection

### Shared Package
- **Purpose**: Common types and utilities
- **Technology**: TypeScript

## Database Setup

### PostgreSQL (Production-like)
```bash
# Using Docker
docker run -d \
  --name race-wars-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=race_wars \
  -e POSTGRES_USER=race_wars \
  -e POSTGRES_PASSWORD=password \
  postgis/postgis:15-3.3
```

### In-Memory (Development)
The application automatically falls back to an in-memory database if PostgreSQL is not available. This is perfect for quick development and testing.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: JWT secret for access tokens
- `JWT_REFRESH_SECRET`: JWT secret for refresh tokens
- `PORT`: Server port (default: 8080)
- `CLIENT_PORT`: Client port (default: 5173)

## Available Scripts

### Development
- `npm run dev:setup` - Setup development environment
- `npm run dev:simple` - Quick start with in-memory DB
- `npm run dev:all` - Start all components
- `npm run dev:server` - Start server only
- `npm run dev:client` - Start client only
- `npm run dev:docker` - Start with Docker

### Testing
- `npm run test:behavioral` - Run behavioral tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:all` - Run all tests

### Building
- `npm run build` - Build all packages
- `npm run build:server` - Build server
- `npm run build:client` - Build client
- `npm run build:shared` - Build shared package

### Code Quality
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages

## Application URLs

When running locally:

- **Server API**: http://localhost:8080
- **Client Application**: http://localhost:5173
- **WebSocket**: ws://localhost:8081

## Database Management

### Migrations
Migrations run automatically when the server starts.

### Seeding
The in-memory database is automatically seeded with sample data for development.

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database connection
npm run dev:simple  # Uses in-memory fallback
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :8080  # Server
lsof -i :5173  # Client
lsof -i :5432  # PostgreSQL
```

### Build Issues
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Development Workflow

1. **Setup**: Run `npm run dev:setup` once
2. **Start**: Use `npm run dev:simple` for quick development
3. **Code**: Make changes to server/client/shared
4. **Test**: Run `npm run test:behavioral` to verify
5. **Build**: Use `npm run build` before committing

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client (5173) │────│  Server (8080)  │────│ Database (5432)│
│   React + Vite  │    │  Express + TS   │    │  PostgreSQL     │
│                 │    │                 │    │                 │
│   WebSocket ◄──┼────┤  WebSocket ◄───┼────│                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Shared Package │
                    │  Types + Utils  │
                    └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:behavioral`
5. Build: `npm run build`
6. Submit a pull request

## Performance Tips

- Use in-memory database for quick development
- Enable hot reload in client and server
- Use `npm run dev:simple` for fastest startup
- Use Docker for production-like environment
