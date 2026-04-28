# Race Wars Codebase Summary

## Overview
Race Wars is a comprehensive real-time racing platform built with a modern tech stack including TypeScript, React, Express, PostgreSQL, and Playwright for testing. The system supports race creation, route building, participant tracking, real-time updates, and notification management.

## Architecture

### Monorepo Structure
The project uses a monorepo structure with three main workspaces:
- **client**: React/TypeScript frontend application
- **server**: Node/Express backend API server
- **shared**: Shared types and utilities

## Client-Side Application

### Core Components
The client application is built with React and TypeScript, featuring:

#### Main Application Components
- **App.tsx**: Main application entry point
- **App.enhanced.tsx**: Enhanced version with additional features
- **AuthScreen.tsx**: User authentication interface (login/register)
- **ConnectionManager.tsx**: Server connection management
- **RaceSelector.tsx**: Race selection and browsing interface
- **RaceCreator.tsx**: Race creation interface with configuration options
- **AdminConsole.tsx**: Administrative interface for race management

#### Specialized Components
- **RouteBuilder.tsx**: Leaflet-based interactive route creation tool

#### UI Components
- **HUD.tsx**: Heads-up display for race information
- **Leaderboard.tsx**: Real-time race leaderboard
- **Status.tsx**: Status indicators and notifications

### Network Layer
- **authService.ts**: Authentication API client
- **raceService.ts**: Race management API client
- **routeService.ts**: Route management API client
- **socket.ts**: WebSocket connection handler
- **handlers.ts**: Network event handlers

### Map Integration
- **map.ts**: Core map initialization
- **checkpointLayer.ts**: Checkpoint visualization layer
- **playerLayer.ts**: Player position tracking layer
- **routeLayer.ts**: Route visualization layer

### State Management
- **state/**: Application state management

## Server-Side Application

### Core Server
The server is built with Express.js and TypeScript, featuring:

#### Main Entry Point
- **index.ts**: Server initialization with Express, HTTP server, WebSocket server, and game engine startup

#### API Routes
- **auth.routes.ts**: Authentication endpoints (login, register, token refresh)
- **race.routes.ts**: Race management endpoints
- **participation.routes.ts**: Race participation and tracking endpoints
- **route.routes.ts**: Route management endpoints
- **notification.routes.ts**: Notification management endpoints

#### Controllers
- **auth.controller.ts**: Authentication request handlers
- **race.controller.ts**: Race management request handlers
- **participation.controller.ts**: Participation tracking handlers
- **route.controller.ts**: Route management handlers
- **notification.controller.ts**: Notification management handlers

### Services Layer
- **auth.service.ts**: Authentication business logic
- **race.service.ts**: Race management business logic
- **participation.service.ts**: Participation tracking business logic
- **route.service.ts**: Route management business logic
- **track.service.ts**: Track management business logic
- **notification.service.ts**: Notification system business logic

### Database Layer

#### Connection Management
- **connection.ts**: Database connection pool and migration runner
- **connection.simple.ts**: Simplified database connection
- **index.ts**: Database query helpers and transaction support

#### Repositories (Data Access Layer)
- **user.repository.ts**: User data access
- **event.repository.ts**: Event data access
- **track.repository.ts**: Track data access
- **session.repository.ts**: Race session data access
- **participant.repository.ts**: Participant data access
- **sessionParticipant.repository.ts**: Session participant data access
- **flag.repository.ts**: Race flag data access
- **customRoute.repository.ts**: Custom route data access
- **checkpoint.repository.ts**: Checkpoint data access
- **enforcementZone.repository.ts**: Enforcement zone data access
- **lapRecord.repository.ts**: Lap record data access
- **notification.repository.ts**: Notification data access

#### Database Migrations
- **014_create_notifications.sql**: Notification system tables

### Core Systems

#### Authentication
- **auth/**: Authentication system including JWT token management

#### Engine
- **engine/tick.ts**: Game engine tick loop for real-time updates

#### Network
- **network/websocket.ts**: WebSocket server for real-time communication

#### State
- **state/**: Server-side state management

#### Utilities
- **utils/logger.ts**: Logging utilities
- **utils/**: Additional utility functions

### Middleware
- **middleware/auth.middleware.ts**: JWT authentication middleware

## Database Schema

### Core Tables
Based on the repository structure, the database includes:
- **users**: User accounts and authentication
- **events**: Race events
- **tracks**: Racing tracks
- **sessions**: Race sessions
- **participants**: Race participants
- **session_participants**: Session-specific participant data
- **flags**: Race flags and status
- **custom_routes**: User-created routes
- **checkpoints**: Route checkpoints
- **enforcement_zones**: Speed enforcement zones
- **lap_records**: Lap timing records
- **notifications**: User notifications
- **notification_preferences**: User notification settings

### Database Features
- PostgreSQL with PostGIS for spatial data
- Connection pooling for performance
- Transaction support for data consistency
- Migration system for schema management

## Testing Infrastructure

### End-to-End Testing (Playwright)
- **auth.spec.ts**: Authentication flow tests
- **race.spec.ts**: Race management tests
- **tracks.spec.ts**: Track management tests
- **simple-runner.spec.ts**: Basic test runner
- **system-integration.spec.ts**: Comprehensive system integration tests
- **working-tests.spec.ts**: Focused functional tests

### Integration Testing
- **tests/integration/**: Behavioral and integration tests
- **tests/setup.ts**: Test configuration and setup

### Test Configuration
- **playwright.config.ts**: Playwright configuration for E2E tests
- **jest.config.js**: Jest configuration for unit/integration tests

## Infrastructure

### Docker Configuration
- **docker-compose.yml**: Production Docker setup
- **docker-compose.dev.yml**: Development Docker setup
- **Dockerfile.dev**: Development Dockerfile
- **Dockerfile.client.dev**: Client development Dockerfile

### CI/CD
- **.github/workflows/**: GitHub Actions workflows

### Scripts
- **scripts/dev-setup.js**: Development environment setup
- **scripts/deploy.ts**: Deployment scripts

## Key Features Implemented

### 1. Authentication System
- User registration and login
- JWT token management
- Session handling
- Role-based access control
- Authentication middleware

### 2. Race Management
- Race creation with configuration
- Race scheduling and management
- Multiple race types (sprint, time trial, circuit)
- Race status tracking
- Admin console for race control

### 3. Route Building
- Leaflet-based interactive map
- Route drawing and editing
- Waypoint management
- Route validation
- Distance calculation
- Checkpoint placement

### 4. Participant Tracking
- User registration for races
- Real-time position tracking
- Lap timing and recording
- Participation history
- Statistics and leaderboards

### 5. Real-time Communication
- WebSocket server for live updates
- Real-time race status updates
- Live leaderboard
- Position broadcasting

### 6. Notification System
- In-app notifications
- Push notification support (framework ready)
- Email notification support (framework ready)
- User notification preferences
- Notification history and management

### 7. Enforcement System
- Speed enforcement zones
- Flag system (yellow, red, green, etc.)
- Safety car deployment
- Penalty management

### 8. Spectator Mode
- Race viewing for unauthenticated users
- Real-time race monitoring
- Leaderboard access

## Technology Stack

### Frontend
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Leaflet**: Interactive maps
- **Turf.js**: Geospatial analysis

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Type-safe JavaScript
- **WebSocket**: Real-time communication
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing

### Database
- **PostgreSQL**: Relational database
- **PostGIS**: Spatial data extension
- **pg**: PostgreSQL client
- **node-pg-migrate**: Database migrations

### Testing
- **Playwright**: E2E testing
- **Jest**: Unit and integration testing
- **ts-jest**: TypeScript Jest support

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **GitHub Actions**: CI/CD pipeline
- **npm workspaces**: Monorepo management

## Development Workflow

### Available Scripts
- `dev:server`: Start server in development mode
- `dev:client`: Start client in development mode
- `dev:all`: Start all workspaces simultaneously
- `dev:docker`: Start development environment with Docker
- `test:e2e`: Run Playwright E2E tests
- `test:behavioral`: Run behavioral tests
- `test:unit`: Run unit tests
- `lint`: Lint all workspaces
- `type-check`: Type-check all workspaces
- `build`: Build all workspaces

### Development Environment
- Hot module replacement for client
- Database connection pooling
- CORS configuration for cross-origin requests
- Environment variable configuration
- Health check endpoint

## API Endpoints

### Authentication
- POST `/api/auth/register`: User registration
- POST `/api/auth/login`: User login
- POST `/api/auth/refresh`: Token refresh

### Races
- GET `/api/races`: List all races
- POST `/api/races`: Create new race
- GET `/api/races/:id`: Get race details
- PUT `/api/races/:id`: Update race
- DELETE `/api/races/:id`: Delete race

### Participation
- POST `/api/participation/join`: Join race
- POST `/api/participation/leave`: Leave race
- GET `/api/participation/history`: Get participation history

### Routes
- GET `/api/routes`: List all routes
- POST `/api/routes`: Create new route
- GET `/api/routes/:id`: Get route details
- PUT `/api/routes/:id`: Update route
- DELETE `/api/routes/:id`: Delete route

### Notifications
- GET `/api/notifications`: Get user notifications
- PUT `/api/notifications/:id/read`: Mark notification as read
- PUT `/api/notifications/read-all`: Mark all notifications as read
- DELETE `/api/notifications/:id`: Delete notification
- GET `/api/notifications/preferences`: Get notification preferences
- PUT `/api/notifications/preferences`: Update notification preferences
- GET `/api/notifications/stats`: Get notification statistics
- GET `/api/notifications/unread-count`: Get unread count

## File Structure Summary

### Client (7 main components, 5 network files, 4 map files, 3 UI files)
- Main application: App.tsx, App.enhanced.tsx
- Authentication: AuthScreen.tsx
- Connection: ConnectionManager.tsx
- Race Management: RaceSelector.tsx, RaceCreator.tsx
- Admin: AdminConsole.tsx
- Route Building: RouteBuilder.tsx
- Network Layer: authService.ts, raceService.ts, routeService.ts, socket.ts, handlers.ts
- Map Integration: map.ts, checkpointLayer.ts, playerLayer.ts, routeLayer.ts
- UI Components: HUD.tsx, Leaderboard.tsx, Status.tsx

### Server (5 routes, 5 controllers, 6 services, 13 repositories, 1 migration)
- Main Server: index.ts
- Routes: auth.routes.ts, race.routes.ts, participation.routes.ts, route.routes.ts, notification.routes.ts
- Controllers: auth.controller.ts, race.controller.ts, participation.controller.ts, route.controller.ts, notification.controller.ts
- Services: auth.service.ts, race.service.ts, participation.service.ts, route.service.ts, track.service.ts, notification.service.ts
- Repositories: user.repository.ts, event.repository.ts, track.repository.ts, session.repository.ts, participant.repository.ts, sessionParticipant.repository.ts, flag.repository.ts, customRoute.repository.ts, checkpoint.repository.ts, enforcementZone.repository.ts, lapRecord.repository.ts, notification.repository.ts
- Database: connection.ts, connection.simple.ts, index.ts
- Migrations: 014_create_notifications.sql

### Testing (6 E2E test files)
- auth.spec.ts: Authentication tests
- race.spec.ts: Race management tests
- tracks.spec.ts: Track management tests
- simple-runner.spec.ts: Basic test runner
- system-integration.spec.ts: System integration tests
- working-tests.spec.ts: Functional tests

## Current Status

### Completed Features
- ✅ Authentication system with JWT
- ✅ Race management and creation
- ✅ Route builder with Leaflet integration
- ✅ Participant tracking system
- ✅ Real-time WebSocket communication
- ✅ Notification system
- ✅ Admin console
- ✅ Spectator mode
- ✅ Database schema and migrations
- ✅ API endpoints for all major features
- ✅ E2E testing infrastructure
- ✅ Docker containerization
- ✅ CI/CD pipeline

### System Architecture
The system follows a clean architecture pattern with:
- **Presentation Layer**: React components
- **Business Logic Layer**: Services
- **Data Access Layer**: Repositories
- **Infrastructure Layer**: Database, WebSocket, HTTP server

### Data Flow
1. User interacts with React frontend
2. Frontend makes API calls to Express backend
3. Backend processes requests through controllers
4. Controllers use services for business logic
5. Services use repositories for data access
6. Repositories interact with PostgreSQL database
7. Real-time updates pushed via WebSocket
8. Notifications generated and stored for user access

## Development Notes

### Type Safety
- Full TypeScript implementation across client and server
- Shared types in workspace for consistency
- Strict type checking enabled

### Performance
- Database connection pooling
- Efficient query patterns
- WebSocket for real-time updates
- Optimized build processes

### Security
- JWT authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- SQL injection prevention through parameterized queries

### Scalability
- Monorepo structure for modular development
- Docker containerization for deployment
- Database indexing for performance
- WebSocket for efficient real-time communication

## Conclusion

Race Wars is a comprehensive, production-ready racing platform with a modern tech stack, clean architecture, and extensive feature set. The codebase demonstrates professional software development practices including proper separation of concerns, type safety, testing infrastructure, and deployment automation.
