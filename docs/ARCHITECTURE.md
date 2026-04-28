# Race Wars Architecture Documentation

## Overview

Race Wars is a real-time GPS-based racing platform that enables drivers to participate in tracked racing sessions using their smartphones. The system consists of a web-based admin console, a mobile driver app, and a backend infrastructure built for scalability and reliability.

## System Architecture

### High-Level Components

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Driver App    │     │  Admin Console  │     │   Spectator     │
│  (React Native) │     │    (React)      │     │     (React)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ HTTPS/WebSocket       │ HTTPS                │ HTTPS/WebSocket
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                         ┌───────▼────────┐
                         │  Load Balancer │
                         │   (NGINX)      │
                         └───────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌────────▼────────┐
         │   API Server        │   │  WebSocket      │
         │   (Express)         │   │  Server (WS)    │
         └──────────┬──────────┘   └────────┬────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    ┌────▼────┐          ┌──────▼──────┐        ┌──────▼──────┐
    │PostgreSQL│          │    Redis    │        │    NATS     │
    │ (RDS)    │          │  (ElastiCache)│        │ (JetStream) │
    └──────────┘          └─────────────┘        └─────────────┘
```

## Technology Stack

### Frontend

#### Admin Console
- **Framework**: React 18 with TypeScript
- **UI Library**: TailwindCSS, shadcn/ui
- **State Management**: React Context, React Query
- **Maps**: Mapbox GL JS
- **Real-time**: WebSocket client

#### Driver App (Planned)
- **Framework**: React Native
- **Maps**: Mapbox React Native
- **GPS**: React Native Geolocation
- **State Management**: Redux Toolkit
- **Offline Support**: AsyncStorage

### Backend

#### API Server
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT, OAuth (Google, Apple)
- **Database**: PostgreSQL 15
- **ORM**: Custom repository pattern
- **Validation**: Custom validators

#### WebSocket Server
- **Library**: ws (Node.js WebSocket)
- **Features**: Connection pooling, load balancing
- **Message Protocol**: JSON

### Infrastructure

#### Compute
- **Orchestration**: Kubernetes (EKS)
- **Auto-scaling**: Horizontal Pod Autoscaler
- **Container Runtime**: Docker

#### Database
- **Primary**: PostgreSQL (AWS RDS)
- **Cache**: Redis (AWS ElastiCache)
- **Message Queue**: NATS JetStream

#### Monitoring & Observability
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry + Jaeger
- **Error Tracking**: Sentry
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

#### Infrastructure as Code
- **Provisioning**: Terraform
- **Configuration**: Kubernetes manifests
- **CI/CD**: GitHub Actions

## Data Model

### Core Entities

#### Users
- **id**: UUID (primary key)
- **email**: String (unique)
- **password_hash**: String
- **display_name**: String
- **car_number**: Integer
- **created_at**: Timestamp
- **updated_at**: Timestamp

#### Car Profiles
- **id**: UUID (primary key)
- **user_id**: UUID (foreign key)
- **make**: String
- **model**: String
- **year**: Integer
- **color**: String
- **specifications**: JSONB
- **is_default**: Boolean
- **created_at**: Timestamp

#### Tracks
- **id**: UUID (primary key)
- **name**: String
- **location**: String
- **layout**: Geometry (PostGIS)
- **length_meters**: Float
- **sectors**: JSONB
- **pit_lane**: Geometry
- **created_at**: Timestamp

#### Sessions
- **id**: UUID (primary key)
- **track_id**: UUID (foreign key)
- **name**: String
- **session_type**: Enum (race, practice, qualifying, hot_lap)
- **scheduled_start**: Timestamp
- **scheduled_end**: Timestamp
- **actual_start**: Timestamp
- **actual_end**: Timestamp
- **status**: Enum (scheduled, active, paused, completed, cancelled)
- **created_at**: Timestamp

#### Participants
- **id**: UUID (primary key)
- **session_id**: UUID (foreign key)
- **user_id**: UUID (foreign key)
- **car_profile_id**: UUID (foreign key)
- **car_number**: Integer
- **status**: Enum (registered, on_track, in_pits, retired, disqualified)
- **created_at**: Timestamp

#### Positions
- **id**: UUID (primary key)
- **session_id**: UUID (foreign key)
- **participant_id**: UUID (foreign key)
- **latitude**: Float
- **longitude**: Float
- **altitude**: Float (nullable)
- **speed**: Float
- **heading**: Float
- **accuracy**: Float
- **timestamp**: Timestamp
- **created_at**: Timestamp

#### Incidents
- **id**: UUID (primary key)
- **session_id**: UUID (foreign key)
- **participant_id**: UUID (foreign key)
- **type**: Enum (off_track, collision, spin, stall)
- **severity**: Enum (low, medium, high, critical)
- **location**: Geometry
- **description**: Text
- **status**: Enum (pending, under_review, resolved, dismissed)
- **reported_at**: Timestamp
- **resolved_at**: Timestamp (nullable)

#### Penalties
- **id**: UUID (primary key)
- **session_id**: UUID (foreign key)
- **participant_id**: UUID (foreign key)
- **incident_id**: UUID (foreign key, nullable)
- **type**: Enum (time, points, grid, disqualification)
- **amount**: Integer
- **reason**: Text
- **status**: Enum (pending, applied, appealed, cancelled)
- **applied_at**: Timestamp (nullable)

## API Design

### REST Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/oauth/google` - OAuth with Google
- `POST /api/auth/oauth/apple` - OAuth with Apple
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

#### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:id` - Get user by ID (admin only)

#### Car Profiles
- `GET /api/car-profiles` - List user's car profiles
- `POST /api/car-profiles` - Create car profile
- `GET /api/car-profiles/:id` - Get car profile details
- `PUT /api/car-profiles/:id` - Update car profile
- `DELETE /api/car-profiles/:id` - Delete car profile
- `POST /api/car-profiles/:id/set-default` - Set as default

#### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session (admin only)
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session (admin only)
- `DELETE /api/sessions/:id` - Delete session (admin only)
- `POST /api/sessions/:id/start` - Start session (admin only)
- `POST /api/sessions/:id/pause` - Pause session (admin only)
- `POST /api/sessions/:id/resume` - Resume session (admin only)
- `POST /api/sessions/:id/end` - End session (admin only)

#### Participants
- `GET /api/sessions/:sessionId/participants` - List participants
- `POST /api/sessions/:sessionId/participants` - Register for session
- `DELETE /api/sessions/:sessionId/participants/:id` - Withdraw from session

#### Incidents
- `GET /api/incidents` - List incidents
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents` - Report incident
- `PUT /api/incidents/:id` - Update incident (admin only)
- `POST /api/incidents/:id/resolve` - Resolve incident (admin only)
- `DELETE /api/incidents/:id` - Delete incident (admin only)

#### Penalties
- `GET /api/penalties` - List penalties
- `GET /api/penalties/:id` - Get penalty details
- `POST /api/penalties` - Assign penalty (admin only)
- `PUT /api/penalties/:id` - Update penalty (admin only)
- `POST /api/penalties/:id/appeal` - Appeal penalty

### WebSocket Protocol

#### Connection
- URL: `wss://api.racewars.com/ws`
- Authentication: JWT token in query string

#### Messages

**Client → Server**
```json
{
  "type": "position_update",
  "data": {
    "sessionId": "uuid",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "speed": 45.5,
    "heading": 180,
    "accuracy": 5.0,
    "timestamp": 1234567890
  }
}
```

**Server → Client**
```json
{
  "type": "session_update",
  "data": {
    "sessionId": "uuid",
    "status": "active",
    "flag": "green"
  }
}
```

## Service Layer Architecture

### Core Services

#### GPSTrackingService
- Manages GPS data collection from clients
- Handles position smoothing and validation
- Provides distance and speed calculations

#### IncidentDetectionService
- Analyzes GPS data for incident patterns
- Detects off-track, collision, spin, stall events
- Configurable detection thresholds

#### SessionRecordingService
- Records session data for replay
- Buffers position and event data
- Exports recordings for playback

#### CacheService
- Redis-based caching layer
- Caches session, user, and leaderboard data
- Cache-aside pattern implementation

#### MessageQueueService
- NATS-based message queue
- Publishes session updates, positions, incidents
- Supports durable messaging with JetStream

#### MetricsService
- Prometheus metrics collection
- HTTP, WebSocket, database metrics
- Business metrics (sessions, incidents, penalties)

#### TracingService
- OpenTelemetry distributed tracing
- Span creation and context propagation
- Jaeger export for trace visualization

#### ErrorTrackingService
- Sentry error tracking
- Exception and message capture
- User context and breadcrumbs

#### OAuthService
- OAuth integration (Google, Apple)
- Token verification and user linking
- Authorization URL generation

#### PasswordResetService
- Password reset token management
- Token generation and validation
- Email sending for reset links

#### UserExperienceService
- Experience points and level tracking
- Streak and statistics management
- Leaderboard calculations

## Deployment Architecture

### Kubernetes Deployment

#### Namespaces
- `race-wars`: Production namespace
- `race-wars-staging`: Staging namespace

#### Components
- **Deployment**: Server pods (3 replicas)
- **StatefulSet**: PostgreSQL, Redis, NATS
- **Service**: ClusterIP services for internal communication
- **Ingress**: External access with TLS
- **HPA**: Auto-scaling based on CPU/memory

### AWS Infrastructure

#### VPC
- 3 availability zones
- Public and private subnets
- NAT gateway for internet access

#### EKS Cluster
- Managed Kubernetes control plane
- Managed node group (t3.medium)
- 2-5 nodes with auto-scaling

#### RDS PostgreSQL
- Multi-AZ deployment
- Automated backups (7-day retention)
- Point-in-time recovery
- Performance insights

#### ElastiCache Redis
- Single-node deployment
- AOF persistence
- Encryption at rest and in transit

#### S3
- Terraform state storage
- Static asset hosting
- Backup storage

## Security Architecture

### Authentication
- JWT-based authentication
- OAuth 2.0 integration (Google, Apple)
- Password hashing with bcrypt
- Token refresh mechanism

### Authorization
- Role-based access control (RBAC)
- Admin, Race Director, Observer, Track Marshal roles
- Permission checks on all endpoints

### Data Security
- Encryption at rest (RDS, ElastiCache)
- Encryption in transit (TLS 1.3)
- Secrets management (Kubernetes Secrets)
- Sensitive data in environment variables

### Network Security
- VPC with private subnets
- Security groups for access control
- Network policies for pod-to-pod communication
- WAF for API protection

## Performance Optimization

### Caching Strategy
- Redis for session and user data
- Cache-aside pattern
- TTL-based invalidation
- Cache warming for frequently accessed data

### Database Optimization
- Connection pooling
- Query optimization with indexes
- Read replicas for scaling reads
- Materialized views for complex queries

### WebSocket Optimization
- Connection pooling (max 1000 per pool)
- Load balancing across pools
- Message batching
- Binary message compression

### CDN Integration
- Static assets served via CDN
- API response caching
- Geographic distribution

## Monitoring & Observability

### Metrics (Prometheus)
- HTTP request metrics (rate, duration, errors)
- WebSocket connection metrics
- Database query metrics
- Business metrics (sessions, incidents, penalties)

### Tracing (OpenTelemetry)
- Distributed tracing across services
- Request context propagation
- Performance bottleneck identification
- Jaeger for trace visualization

### Logging (ELK)
- Centralized log aggregation
- Structured logging with JSON
- Log retention policies
- Kibana for log analysis

### Error Tracking (Sentry)
- Real-time error alerts
- Error context and breadcrumbs
- User information with errors
- Performance monitoring

## Disaster Recovery

### Backup Strategy
- Daily automated database backups
- 7-day retention for automated backups
- 30-day retention for snapshots
- Cross-region replication to DR region

### High Availability
- Multi-AZ deployment
- Auto-scaling for fault tolerance
- Health checks and self-healing
- Graceful degradation

### Recovery Procedures
- Documented RTO/RPO objectives
- Step-by-step recovery procedures
- Regular DR drills
- Communication plan

## Development Workflow

### CI/CD Pipeline
- GitHub Actions for CI/CD
- Automated testing on PR
- Automated deployment to staging
- Manual approval for production

### Code Quality
- ESLint for linting
- TypeScript for type safety
- Unit tests with Jest
- E2E tests with Playwright

### Version Control
- Git flow branching strategy
- Feature branches for development
- Pull request reviews
- Semantic versioning

## Scalability Considerations

### Horizontal Scaling
- Stateless API server
- Kubernetes HPA for auto-scaling
- Load balancing across pods
- Database connection pooling

### Vertical Scaling
- Configurable resource limits
- Node auto-scaling group
- Database instance scaling
- Cache instance scaling

### Geographic Distribution
- Multi-region deployment
- CDN for static assets
- Database read replicas
- Edge computing consideration

## Future Enhancements

### Planned Features
- React Native mobile app
- Offline map caching
- Advanced telemetry
- Video integration
- AI-powered incident analysis

### Technical Improvements
- GraphQL API
- Event sourcing
- CQRS pattern
- Microservices architecture
- Serverless functions

---

**Version**: 1.0  
**Last Updated**: January 28, 2024
