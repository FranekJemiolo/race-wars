# Race Wars - Full Spec Implementation Plan

## Overview
This document outlines the complete implementation plan for the Race Wars application based on the full specification in `race_wars.md`. The current implementation covers the MVP (Phase 1), but the full spec requires significant additional work.

## Current Status (Completed)
- ✅ Shared types and protocol layer
- ✅ Server core geometry engine (projection, progress)
- ✅ Server race rules engine (checkpoints, finish, laps)
- ✅ Server state management (race, player, leaderboard)
- ✅ Server WebSocket layer and tick engine
- ✅ Client React application with Leaflet map
- ✅ Client network layer and state management
- ✅ Client map rendering (route, players, checkpoints)
- ✅ Client UI (HUD, leaderboard, status)
- ✅ E2E tests with Playwright

## Remaining Implementation Phases

---

## Phase 1: Database & Persistence Layer

### 1.1 PostgreSQL Setup
- Set up PostgreSQL database with PostGIS extension
- Configure connection pooling (PgBouncer)
- Set up database migrations (using node-pg-migrate or similar)
- Create database schema for all entities

### 1.2 Database Schema Design
**Tables to create:**
- `users` (driver profiles, authentication)
- `events` (track day and custom race events)
- `sessions` (practice, qualifying, race sessions)
- `tracks` (predefined track definitions)
- `custom_routes` (admin-defined race routes)
- `checkpoints` (checkpoint definitions)
- `enforcement_zones` (speed zones, traps, patrol areas)
- `participants` (event participants)
- `session_participants` (session-specific participant data)
- `lap_records` (lap times and records)
- `incidents` (off-track, crashes, penalties)
- `flags` (flag state history)

### 1.3 PostGIS Spatial Queries
- Implement spatial indexing for GPS positions
- Create functions for:
  - Point-in-polygon detection (zones, checkpoints)
  - Distance calculations
  - Route deviation detection
  - Spatial joins for nearby cars

### 1.4 Data Access Layer
- Create repository pattern for database access
- Implement query builders for complex spatial queries
- Add caching layer (Redis) for frequently accessed data
- Implement connection management and error handling

---

## Phase 2: Identity & Session Management

### 2.1 User Authentication
- Implement JWT-based authentication
- Add OAuth providers (Google, Apple for mobile)
- Create user registration flow
- Implement password reset functionality
- Add session management (refresh tokens)

### 2.2 Driver Profiles
- Create driver profile management
- Add car profile system (make, model, class, power)
- Implement experience level tracking
- Add license verification (optional)
- Create profile privacy settings

### 2.3 Event Participation
- Implement event registration system
- Add participant approval workflow
- Create unique session links/QR codes
- Implement participant check-in/check-out
- Add waiver management (digital signatures)

### 2.4 Session State Machine
- Extend current race state machine
- Add session types: practice, qualifying, race, hot laps, timed runs
- Implement session transitions
- Add session timeline management
- Create session history and replay

---

## Phase 3: Track Management System

### 3.1 Predefined Track Database
- Create track definition format
- Implement track import tools
- Add track metadata (name, location, length, difficulty)
- Create track validation system
- Implement track versioning

### 3.2 Track Editor
- Build web-based track editor using Leaflet Draw
- Add centerline spline editing
- Implement start/finish line placement
- Add sector split definition
- Create pit lane geometry tools
- Add marshal zone definition
- Implement track boundary drawing

### 3.3 Track Storage & Retrieval
- Implement track serialization/deserialization
- Add track preview generation
- Create track search and filtering
- Implement track sharing between events
- Add track analytics (most used, etc.)

### 3.4 Track Matching Algorithm
- Improve GPS-to-track projection algorithm
- Add Kalman filtering for GPS smoothing
- Implement velocity smoothing
- Add impossible jump detection
- Create confidence scoring for position

---

## Phase 4: Flag & Race Control System

### 4.1 Flag State Management
- Extend race state machine with flag states
- Implement flag types:
  - Green (open track)
  - Yellow (sector hazard)
  - Full course yellow
  - Red flag (stop)
  - Blue flag (faster car approaching)
  - Checkered flag (session end)
- Add flag history tracking
- Implement flag transition rules

### 4.2 Sector-Based Flag System
- Implement track sector division
- Add per-sector flag state
- Create sector flag UI for drivers
- Implement flag propagation rules
- Add marshal zone integration

### 4.3 Race Admin Console
- Build admin dashboard
- Implement session controls:
  - Open/close pit
  - Start/end session
  - Restart session
  - Pause/resume
- Add flag control panel
- Create live map with all cars
- Implement incident tagging
- Add penalty assignment system
- Create session timeline view

### 4.4 Driver Flag Notifications
- Implement push notifications for flags
- Add visual overlay on driver map
- Create audio alerts (optional)
- Add flag history view for drivers
- Implement proximity warnings

---

## Phase 5: Custom Race Builder

### 5.1 Route Creation Tools
- Build route editor interface
- Implement route types:
  - Sprint race (start → finish)
  - Checkpoint race (ordered checkpoints)
  - Free roam race (flexible order)
  - Time attack loop (closed loop)
- Add map draw mode with road snapping
- Implement checkpoint placement
- Add GPX/route file import
- Create route validation

### 5.2 Rule Configuration
- Build rule configuration UI
- Implement timing rules:
  - Best single run
  - Best of N runs
  - Total cumulative time
- Add navigation rules:
  - Strict checkpoint order
  - Flexible checkpoint order
  - Penalty for missing checkpoint
- Create fairness rules:
  - Speed cap zones
  - Shortcut detection sensitivity
  - GPS deviation tolerance

### 5.3 Route Validation
- Implement route adherence validation
- Add shortcut detection algorithm
- Create direction validation
- Implement minimum distance constraint
- Add route preview system

### 5.4 Custom Race Management
- Create custom race event creation flow
- Implement race template system
- Add race sharing between organizers
- Create race analytics and feedback
- Implement race cloning/duplication

---

## Phase 6: Enforcement Layer (Game Mechanics)

### 6.1 Speed Zone System
- Implement speed zone definition
- Add zone types:
  - Normal zones
  - Restricted zones (30/50/80 km/h)
  - Event max speed cap zones
- Create zone detection algorithm
- Implement zone visualization on map
- Add speed limit vs current speed display

### 6.2 Speed Trap System
- Implement speed trap placement
- Add trap configuration:
  - GPS coordinates
  - Trigger radius (20-50m)
  - Detection direction
- Create trap trigger logic
- Implement trap notification system
- Add penalty assignment:
  - Time penalties (+X seconds)
  - Leaderboard penalty points
  - Alert count

### 6.3 Patrol Zone System
- Implement static patrol zones
- Add mobile unit (ghost car) support
- Create patrol route definition
- Implement detection radius logic
- Add "chase" simulation (optional)
- Create heat zone system

### 6.4 Detection Logic
- Implement GPS-based trigger detection
- Add speed threshold checking
- Create zone radius detection
- Implement checkpoint violation detection
- Add route deviation detection

### 6.5 Scoring System
- Implement scoring modes:
  - Pure time attack (no penalties)
  - Penalized race (time penalties)
  - Risk score system (base time + risk score)
- Create penalty calculation logic
- Add leaderboard ranking with penalties
- Implement risk level tracking

### 6.6 Driver Enforcement UI
- Add real-time alerts:
  - "Speed trap ahead"
  - "High enforcement zone"
  - "You have been detected"
  - "Risk level increasing"
- Create map overlay:
  - Red cones for traps
  - Blue zones for patrol areas
  - Heatmap for enforcement density
- Add HUD mode:
  - Speed vs limit
  - "Wanted level" indicator

---

## Phase 7: Race Admin Console

### 7.1 Admin Dashboard
- Build comprehensive admin dashboard
- Implement event management
- Add session timeline view
- Create participant management
- Implement analytics dashboard

### 7.2 Track Day Console
- Create track day specific controls:
  - Session control (open/close pit, start/end)
  - Flag controls (sector yellow, full red, restart)
  - Live map with all cars
  - Incident tagging
  - Optional penalties
- Add traffic density heatmap
- Implement hot lap/cooldown lap tracking
- Create soft ranking system

### 7.3 Custom Race Console
- Create custom race specific controls:
  - Route builder
  - Checkpoint editor
  - Rule configuration
  - Enforcement object placement
  - Live leaderboard monitoring
- Add race template management
- Implement race cloning

### 7.4 Incident Management
- Implement incident detection:
  - Off-track detection
  - Crash detection (sudden stop)
  - Debris detection
- Create incident tagging system
- Add incident history tracking
- Implement incident resolution workflow

### 7.5 Penalty System
- Build penalty assignment UI
- Implement penalty types:
  - Time penalties
  - Grid penalties
  - Disqualification
- Add penalty history
- Create penalty appeal workflow (optional)

---

## Phase 8: Spectator Mode

### 8.1 Spectator Dashboard
- Build spectator view interface
- Implement live map with all cars
- Add leaderboard display
- Create replay mode
- Implement multi-camera view

### 8.2 Live Streaming
- Implement position streaming for spectators
- Add low-latency updates
- Create fan-out architecture for scaling
- Implement spectator rate limiting

### 8.3 Replay System
- Implement session recording
- Add replay playback controls
- Create highlight generation
- Implement data export (GPX, video sync)

### 8.4 Social Features
- Add spectator chat
- Implement reaction system
- Create shareable highlights
- Add social media integration

---

## Phase 9: Notifications & Push System

### 9.1 Push Notification Setup
- Set up Firebase Cloud Messaging (FCM)
- Configure Apple Push Notification Service (APNs)
- Implement notification preferences
- Add notification scheduling

### 9.2 Driver Notifications
- Implement session notifications:
  - "Session starting in 5 min"
  - "Your session starts now"
  - "Session ending soon"
- Add position notifications:
  - "You are P3 in class"
  - "Car approaching behind (Δ +2.3s)"
- Create flag notifications:
  - "Yellow flag ahead"
  - "Red flag - stop immediately"
- Add enforcement notifications:
  - "Speed trap activated"
  - "Risk level increasing"

### 9.3 Proximity Alerts
- Implement proximity detection
- Add dangerous closing speed alerts
- Create blue flag behavior detection
- Implement traffic density warnings

### 9.4 Notification Management
- Build notification preferences UI
- Implement notification history
- Add notification grouping
- Create quiet hours/do not disturb

---

## Phase 10: Scaling & Performance

### 10.1 Redis Caching Layer
- Implement Redis for session state
- Add position caching
- Create leaderboard caching
- Implement rate limiting with Redis

### 10.2 Message Queue
- Set up Kafka or NATS for event streaming
- Implement event sourcing pattern
- Add message replay capability
- Create dead letter queue

### 10.3 Horizontal Scaling
- Implement WebSocket connection pooling
- Add load balancing for WebSocket servers
- Create stateless server architecture
- Implement session affinity

### 10.4 Database Optimization
- Add database connection pooling
- Implement query optimization
- Create read replicas for analytics
- Add database indexing strategy

### 10.5 Monitoring & Logging
- Set up application monitoring (Prometheus/Grafana)
- Implement distributed tracing
- Add error tracking (Sentry)
- Create performance metrics dashboard

---

## Phase 11: Mobile App (React Native)

### 11.1 React Native Setup
- Set up React Native project
- Configure iOS and Android builds
- Add navigation (React Navigation)
- Implement state management (Redux/Zustand)

### 11.2 GPS Integration
- Implement native GPS module
- Add background location tracking
- Create GPS smoothing algorithm
- Implement power optimization

### 11.3 Map Integration
- Integrate Mapbox or MapLibre
- Implement offline map caching
- Add custom map styles
- Create track overlay rendering

### 11.4 Offline Support
- Implement offline mode
- Add data synchronization
- Create conflict resolution
- Implement queue for offline updates

### 11.5 Push Notifications
- Set up FCM for Android
- Configure APNs for iOS
- Implement notification handling
- Add notification categories

---

## Phase 12: Testing & Quality Assurance

### 12.1 Unit Tests
- Add Jest for unit testing
- Implement test coverage reporting
- Create test utilities
- Add mocking for external dependencies

### 12.2 Integration Tests
- Create integration test suite
- Test database operations
- Test WebSocket communication
- Test spatial queries

### 12.3 E2E Tests
- Extend Playwright tests
- Add admin console tests
- Create mobile app E2E tests (Detox)
- Implement visual regression tests

### 12.4 Load Testing
- Set up load testing (k6 or Artillery)
- Test WebSocket connection limits
- Test database query performance
- Create performance benchmarks

### 12.5 Security Testing
- Implement security audit
- Add penetration testing
- Test authentication flows
- Validate input sanitization

---

## Phase 13: Deployment & DevOps

### 13.1 CI/CD Pipeline
- Extend GitHub Actions workflow
- Add automated testing
- Implement automated deployment
- Create staging environment

### 13.2 Containerization
- Dockerize all services
- Create Docker Compose for local dev
- Implement Kubernetes manifests
- Add Helm charts

### 13.3 Infrastructure as Code
- Set up Terraform for infrastructure
- Configure cloud resources (AWS/GCP)
- Implement auto-scaling
- Add disaster recovery plan

### 13.4 Monitoring & Alerting
- Set up application monitoring
- Implement log aggregation (ELK)
- Create alerting rules
- Add uptime monitoring

---

## Phase 14: Documentation & Onboarding

### 14.1 API Documentation
- Create OpenAPI/Swagger documentation
- Add API examples
- Implement API versioning
- Create SDK documentation

### 14.2 User Documentation
- Write user guides for drivers
- Create admin console documentation
- Add video tutorials
- Implement in-app help

### 14.3 Developer Documentation
- Write architecture documentation
- Create contribution guidelines
- Add code documentation
- Implement onboarding guide

---

## Implementation Priority

### Critical Path (Must Have)
1. Phase 1: Database & Persistence Layer
2. Phase 2: Identity & Session Management
3. Phase 4: Flag & Race Control System
4. Phase 7: Race Admin Console

### High Priority (Should Have)
5. Phase 3: Track Management System
6. Phase 5: Custom Race Builder
7. Phase 9: Notifications & Push System
8. Phase 12: Testing & Quality Assurance

### Medium Priority (Nice to Have)
9. Phase 6: Enforcement Layer (Game Mechanics)
10. Phase 8: Spectator Mode
11. Phase 10: Scaling & Performance
12. Phase 13: Deployment & DevOps

### Future Enhancements
13. Phase 11: Mobile App (React Native)
14. Phase 14: Documentation & Onboarding

---

## Estimated Timeline

- Phase 1: 2-3 weeks
- Phase 2: 2 weeks
- Phase 3: 2 weeks
- Phase 4: 2 weeks
- Phase 5: 3 weeks
- Phase 6: 3 weeks
- Phase 7: 3 weeks
- Phase 8: 2 weeks
- Phase 9: 2 weeks
- Phase 10: 2 weeks
- Phase 11: 4-6 weeks
- Phase 12: Ongoing
- Phase 13: 2 weeks
- Phase 14: Ongoing

**Total Estimated Time: 6-9 months for full implementation**

---

## Next Steps

1. Review and approve this plan
2. Begin with Phase 1 (Database & Persistence Layer)
3. Set up PostgreSQL with PostGIS
4. Design and implement database schema
5. Create data access layer
6. Move to Phase 2 (Identity & Session Management)

This plan will be updated as implementation progresses and requirements evolve.
