# Race Wars - Comprehensive Implementation Plan

## Project Overview

**Race Wars** is a real-time multiplayer GPS racing engine for closed-road/track racing. The system projects GPS positions onto predefined route polylines, tracks progress, validates checkpoints, and maintains live leaderboards.

**Core Concept**: GPS → smoothing → projection → progress → ranking → broadcast → UI

**Tech Stack**:
- **Server**: TypeScript (Node.js) + Turf.js + WebSockets
- **Client**: React + Vite + Leaflet + TypeScript
- **Shared**: TypeScript types and protocol definitions
- **Assets**: AI-generated icons (Stable Diffusion/DALL·E stubs)

---

## Phase 1: Repository Setup & Infrastructure

### 1.1 Repository Initialization
- [x] Create git repository
- [ ] Initialize with proper .gitignore
- [ ] Set up GitHub repository under FranekJemiolo organization
- [ ] Configure repository settings (protected branches, etc.)
- [ ] Create initial commit with README

### 1.2 GitHub Pages Setup
- [ ] Create docs/ directory for GitHub Pages
- [ ] Create index.html with app overview and UI mockup
- [ ] Configure GitHub Pages source to docs/ branch
- [ ] Set up CI/CD workflow for GitHub Pages deployment

### 1.3 Monorepo Structure
- [ ] Create root package.json with workspaces
- [ ] Set up TypeScript base configuration
- [ ] Create directory structure:
  ```
  /race-wars
    /shared
    /server
    /client
    /assets
    /docs (GitHub Pages)
    /journal
  ```

---

## Phase 2: Shared Layer (Foundation)

### 2.1 Types Definition (`shared/src/types.ts`)
- [ ] Define LatLng type
- [ ] Define PlayerState enum (NOT_JOINED, READY, ARMED, RACING, OFF_ROUTE, FINISHED, DISCONNECTED, DISQUALIFIED)
- [ ] Define Player interface
- [ ] Define Checkpoint interface
- [ ] Define RaceRoute interface
- [ ] Define RaceState interface
- [ ] Define PlayerRaceProgress interface
- [ ] Define ProjectionResult interface

### 2.2 Protocol Definition (`shared/src/protocol.ts`)
- [ ] Define ClientMessage union type:
  - JOIN_RACE
  - POSITION_UPDATE
  - READY
  - PING
  - REJOIN
- [ ] Define ServerMessage union type:
  - STATE_SNAPSHOT
  - POSITION_BATCH
  - LEADERBOARD_UPDATE
  - RACE_EVENT
  - PONG
  - CRITICAL_ERROR
- [ ] Add message versioning field
- [ ] Add sequence numbers for ordering

### 2.3 Constants Configuration (`shared/src/constants.ts`)
- [ ] Define CONFIG object with:
  - TICK_RATE (1000ms)
  - MAX_SPEED (350 km/h)
  - MAX_ROUTE_DISTANCE (50m)
  - CHECKPOINT_RADIUS (20m)
  - OFF_ROUTE_THRESHOLD (40m)
  - HEARTBEAT_INTERVAL (5000ms)
  - PROJECTION_WINDOW (±10 segments)
  - MAX_SEGMENT_JUMP (15)
  - MAX_PARTICIPANTS (100)
  - GPS_ACCURACY_THRESHOLD (30m)
- [ ] Export all constants

### 2.4 Shared Build Setup
- [ ] Create shared/package.json
- [ ] Create shared/tsconfig.json
- [ ] Create shared/src/index.ts (export all)
- [ ] Set up build script
- [ ] Test shared package build

---

## Phase 3: Server Core Geometry Engine

### 3.1 Projection Module (`server/src/core/projection.ts`)
- [ ] Import Turf.js
- [ ] Implement projectToRoute function:
  - Convert GPS point to Turf point
  - Local segment window search (±10 segments)
  - Find closest segment using turf.nearestPointOnLine
  - Extract projection result (point, distance, confidence)
  - Compute cumulative progress along route
  - Handle edge cases (route bounds, projection failure)
- [ ] Add projection confidence scoring
- [ ] Add segment transition guard (max jump check)
- [ ] Add fallback full scan if window fails
- [ ] Write unit tests for projection accuracy

### 3.2 Progress Module (`server/src/core/progress.ts`)
- [ ] Implement computeProgress function
- [ ] Add progress delta rate limiting
- [ ] Add floating-point drift correction
- [ ] Add route edge clamping (0 to routeLength)
- [ ] Implement progress monotonicity constraint
- [ ] Add zero-speed noise suppression
- [ ] Write unit tests for progress calculation

### 3.3 Validation Module (`server/src/core/validation.ts`)
- [ ] Implement validateInput function:
  - Check lat/lon ranges
  - Check timestamp validity
  - Check time delta sanity (0 < dt < 5s)
  - Check GPS accuracy threshold
- [ ] Implement speed sanity check (max 350 km/h)
- [ ] Implement acceleration filter
- [ ] Implement teleport detection
- [ ] Add input sanitization
- [ ] Write unit tests for validation

### 3.4 Geo Utilities (`server/src/utils/geo.ts`)
- [ ] Implement haversine distance function
- [ ] Implement heading derivation fallback
- [ ] Implement low-speed heading ignore logic
- [ ] Implement coordinate wrapping safety
- [ ] Write unit tests for geo functions

### 3.5 Math Utilities (`server/src/utils/math.ts`)
- [ ] Implement exponential smoothing
- [ ] Implement linear interpolation
- [ ] Implement angle between vectors
- [ ] Implement numeric precision normalization
- [ ] Write unit tests for math functions

---

## Phase 4: Server Race Rules Engine

### 4.1 Checkpoint System (`server/src/core/raceRules/checkpoints.ts`)
- [ ] Implement processCheckpoints function:
  - Check next expected checkpoint only
  - Distance check using haversine
  - Ordered checkpoint enforcement
  - Checkpoint cooldown suppression (2s)
  - Directional checkpoint validation
  - Checkpoint recovery logic (forgiving mode)
- [ ] Implement checkpoint geometry types (circle vs gate)
- [ ] Add minimum checkpoint spacing validation
- [ ] Implement checkpoint tunneling fix for high speed
- [ ] Write unit tests for checkpoint logic

### 4.2 Finish Line System (`server/src/core/raceRules/finish.ts`)
- [ ] Implement checkFinish function:
  - Line segment intersection detection
  - Direction validation (dot product)
  - Speed threshold check (>20 km/h)
  - Minimum progress check (>90%)
  - Finish line angle constraint
  - Finish line cooldown (5-10s)
  - Double-crossing suppression
- [ ] Implement finish state hard lock
- [ ] Add finish result hashing
- [ ] Write unit tests for finish detection

### 4.3 Lap System (`server/src/core/raceRules/laps.ts`)
- [ ] Implement lap detection for loop routes
- [ ] Add lap spam prevention (cooldown)
- [ ] Implement lap-based ranking metric
- [ ] Handle lap progress reset
- [ ] Write unit tests for lap logic

### 4.4 Route Validation (`server/src/core/raceRules/routeValidation.ts`)
- [ ] Implement route gap detection
- [ ] Validate segment lengths (<50m)
- [ ] Validate route direction normalization
- [ ] Validate checkpoint ordering
- [ ] Implement route hash generation
- [ ] Add route quality validation summary
- [ ] Write unit tests for route validation

### 4.5 Race Rules Index (`server/src/core/raceRules/index.ts`)
- [ ] Export all race rules functions
- [ ] Create unified processRaceRules function
- [ ] Integrate checkpoints, finish, laps
- [ ] Add event generation

---

## Phase 5: Server State Management

### 5.1 Race State (`server/src/state/raceState.ts`)
- [ ] Define RaceState interface
- [ ] Implement race state machine:
  - CREATED → COUNTDOWN → LIVE → FINISHED → ABORTED
  - PAUSED state support
- [ ] Implement race state transitions
- [ ] Add state transition audit logging
- [ ] Implement minimum race start conditions
- [ ] Add graceful race termination
- [ ] Implement server restart recovery strategy

### 5.2 Player State (`server/src/state/playerState.ts`)
- [ ] Implement player state machine:
  - NOT_JOINED → READY → ARMED → RACING → FINISHED
  - OFF_ROUTE, DISCONNECTED, DISQUALIFIED states
- [ ] Implement state transition enforcement
- [ ] Add initial position lock-in phase
- [ ] Implement STALLED state detection
- [ ] Add player ID collision handling
- [ ] Implement state snapshot hashing
- [ ] Write unit tests for state transitions

### 5.3 Leaderboard (`server/src/state/leaderboard.ts`)
- [ ] Implement computeLeaderboard function:
  - Sort by finish time (finished players)
  - Sort by progress (active players)
  - Sort by lap count (loop races)
  - Tie-breaking rules
- [ ] Implement leaderboard snapshot consistency
- [ ] Add ranking smoothing (hysteresis)
- [ ] Implement anti-jitter rule (5m threshold)
- [ ] Add fixed interval updates (1s)
- [ ] Write unit tests for ranking logic

### 5.4 Route Storage (`server/src/state/routeStorage.ts`)
- [ ] Implement route version locking
- [ ] Add route preprocessing cache
- [ ] Implement route self-intersection indexing
- [ ] Add large route chunking strategy
- [ ] Implement route entry validation on join

---

## Phase 6: Server Engine Loop

### 6.1 Tick Engine (`server/src/engine/tick.ts`)
- [ ] Implement startTick function:
  - Fixed tick rate (1 Hz)
  - Process all player inputs
  - Update player states
  - Compute leaderboard
  - Broadcast state
- [ ] Implement per-player update deduplication
- [ ] Add monotonic clock enforcement
- [ ] Implement server load shedding
- [ ] Add floating-point drift correction periodic

### 6.2 Player Update Pipeline (`server/src/engine/playerUpdate.ts`)
- [ ] Implement updatePlayer function:
  - Input validation
  - Server-side speed calculation
  - Projection call
  - Off-route detection
  - Progress update (anti-jump guarded)
  - State transitions
  - Event detection
  - Confidence filtering
- [ ] Implement position history buffer (5-10 points)
- [ ] Add velocity vector consistency checks
- [ ] Implement dead reckoning smoothing
- [ ] Add progress rate limiting
- [ ] Write unit tests for update pipeline

### 6.3 Event System (`server/src/engine/events.ts`)
- [ ] Implement event generation
- [ ] Add event deduplication IDs
- [ ] Implement event logging
- [ ] Add critical error channel
- [ ] Create event audit log

---

## Phase 7: Server Network Layer

### 7.1 WebSocket Server (`server/src/network/websocket.ts`)
- [ ] Initialize WebSocket server (port 8080)
- [ ] Implement connection management
- [ ] Add heartbeat/ping-pong system
- [ ] Implement disconnect detection (5s timeout)
- [ ] Add connection health monitoring
- [ ] Implement multi-session detection
- [ ] Add participant capacity limit enforcement

### 7.2 Message Handlers (`server/src/network/handlers.ts`)
- [ ] Implement handleJoin function:
  - Validate player ID uniqueness
  - Initialize player state
  - Send initial state snapshot
- [ ] Implement handlePositionUpdate:
  - Queue update for tick processing
  - Apply rate limiting (max 5/sec)
- [ ] Implement handleReady:
  - Transition player to READY state
- [ ] Implement handlePing:
  - Respond with PONG
  - Track latency
- [ ] Implement handleRejoin:
  - Restore last state
  - Validate rejoin conditions
- [ ] Implement full resync handler
- [ ] Add input burst rate limiting

### 7.3 Broadcast System (`server/src/network/broadcast.ts`)
- [ ] Implement state snapshot broadcast
- [ ] Implement position batch broadcast
- [ ] Implement leaderboard broadcast
- [ ] Add payload size limiting
- [ ] Implement stale player suppression
- [ ] Add message sequencing (seq IDs)
- [ ] Implement client clock drift compensation

### 7.4 Protocol Implementation (`server/src/network/protocol.ts`)
- [ ] Implement message serialization
- [ ] Add protocol version checking
- [ ] Implement message validation
- [ ] Add config version locking

---

## Phase 8: Server Utilities & Monitoring

### 8.1 Logger (`server/src/utils/logger.ts`)
- [ ] Implement structured logging
- [ ] Add log levels
- [ ] Implement state transition logging
- [ ] Add error logging

### 8.2 Monitoring (`server/src/server/monitoring.ts`)
- [ ] Track active players count
- [ ] Track update latency
- [ ] Track dropped packets
- [ ] Track projection failures
- [ ] Track GPS accuracy distribution
- [ ] Implement minimum viable telemetry logging

### 8.3 Configuration (`server/src/server/config.ts`)
- [ ] Load configuration from constants
- [ ] Implement config versioning
- [ ] Add runtime config validation

---

## Phase 9: Server Entry Point

### 9.1 Main Server (`server/src/index.ts`)
- [ ] Import all modules
- [ ] Initialize race state
- [ ] Start WebSocket server
- [ ] Start tick engine
- [ ] Set up graceful shutdown
- [ ] Add system invariant assertions
- [ ] Implement hard fail safeguard

### 9.2 Server Build Setup
- [ ] Create server/package.json
- [ ] Add dependencies: ws, @turf/turf, typescript
- [ ] Add dev dependencies: ts-node-dev
- [ ] Create server/tsconfig.json
- [ ] Set up build script
- [ ] Set up dev script

---

## Phase 10: Client React Application

### 10.1 Client Setup
- [ ] Create client/package.json
- [ ] Add dependencies: react, react-dom, leaflet, @turf/turf
- [ ] Add dev dependencies: typescript, vite, @vitejs/plugin-react
- [ ] Create client/vite.config.ts
- [ ] Create client/tsconfig.json
- [ ] Create client/index.html
- [ ] Set up dev and build scripts

### 10.2 Main App (`client/src/main.tsx`)
- [ ] Set up React root
- [ ] Import App component
- [ ] Initialize error boundary

### 10.3 App Component (`client/src/app/App.tsx`)
- [ ] Create main app structure
- [ ] Integrate map component
- [ ] Integrate UI components
- [ ] Set up WebSocket connection
- [ ] Implement client error boundary

---

## Phase 11: Client Map Layer

### 11.1 Map Initialization (`client/src/map/map.ts`)
- [ ] Initialize Leaflet map
- [ ] Set up OpenStreetMap tile layer
- [ ] Configure map options
- [ ] Implement map tile failure fallback
- [ ] Add viewport auto-tracking (FOLLOW_SELF mode)

### 11.2 Route Layer (`client/src/map/routeLayer.ts`)
- [ ] Draw route polyline
- [ ] Style route line (thick, colored)
- [ ] Add route hash validation
- [ ] Implement route rendering optimization

### 11.3 Player Layer (`client/src/map/playerLayer.ts`)
- [ ] Render player markers
- [ ] Implement visual position smoothing (interpolation)
- [ ] Add snap vs interpolate threshold
- [ ] Implement visual z-order management
- [ ] Add rendering offset for overlapping markers
- [ ] Implement frame rate decoupling (60fps independent of network)

### 11.4 Checkpoint Layer (`client/src/map/checkpointLayer.ts`)
- [ ] Render checkpoint markers
- [ ] Support circle and gate geometries
- [ ] Add checkpoint visual states (passed, next)
- [ ] Implement checkpoint animations

### 11.5 Finish Line Layer (`client/src/map/finishLine.ts`)
- [ ] Render finish line
- [ ] Add checkered pattern
- [ ] Implement finish line visual feedback

---

## Phase 12: Client Network Layer

### 12.1 WebSocket Client (`client/src/network/socket.ts`)
- [ ] Implement WebSocket connection
- [ ] Add auto-reconnect logic
- [ ] Implement heartbeat/ping-pong
- [ ] Add connection health monitoring
- [ ] Implement disconnect detection
- [ ] Add background throttling detection

### 12.2 Message Handlers (`client/src/network/handlers.ts`)
- [ ] Implement handleStateSnapshot:
  - Update local state
  - Trigger re-render
- [ ] Implement handlePositionBatch:
  - Update player positions
  - Buffer for interpolation
- [ ] Implement handleLeaderboard:
  - Update leaderboard state
- [ ] Implement handleRaceEvent:
  - Show event notifications
- [ ] Implement handleCriticalError:
  - Show blocking UI
  - Stop race
- [ ] Implement message sequencing (discard old seq)

### 12.3 GPS Client (`client/src/network/gps.ts`)
- [ ] Implement Geolocation API integration
- [ ] Add GPS permission handling
- [ ] Implement GPS state handling (OK, WEAK, LOST)
- [ ] Add GPS accuracy filtering
- [ ] Implement update rate fallback (normal: 1Hz, low battery: 0.5Hz)
- [ ] Add GPS unavailable handling

---

## Phase 13: Client State Management

### 13.1 State Store (`client/src/state/store.ts`)
- [ ] Implement simple global store
- [ ] Define store structure:
  - players
  - leaderboard
  - raceState
  - selfPlayer
- [ ] Implement state updates
- [ ] Add state snapshot comparison
- [ ] Implement memory bounding (limit buffers)

### 13.2 Interpolation System (`client/src/state/interpolation.ts`)
- [ ] Implement position interpolation
- [ ] Add render timeline adjustment
- [ ] Implement client clock drift handling
- [ ] Add dead reckoning (200-300ms max)
- [ ] Implement large jump snap logic

---

## Phase 14: Client UI Components

### 14.1 HUD Component (`client/src/ui/HUD.tsx`)
- [ ] Display current speed
- [ ] Display progress percentage
- [ ] Display current rank
- [ ] Display next checkpoint distance
- [ ] Add GPS status indicator
- [ ] Add connection status indicator

### 14.2 Leaderboard Component (`client/src/ui/Leaderboard.tsx`)
- [ ] Display live leaderboard
- [ ] Show player positions
- [ ] Highlight self player
- [ ] Show checkpoint progress
- [ ] Implement smooth rank updates

### 14.3 Status Component (`client/src/ui/Status.tsx`)
- [ ] Display race state
- [ ] Display player state
- [ ] Show error messages
- [ ] Show event notifications
- [ ] Add warning indicators

### 14.4 Join Screen (`client/src/ui/JoinScreen.tsx`)
- [ ] Player name input
- [ ] Join button
- [ ] GPS permission request
- [ ] Connection status

### 14.5 Race Control (`client/src/ui/RaceControl.tsx`)
- [ ] Ready button
- [ ] Leave race button
- [ ] Admin controls (if admin role)

---

## Phase 15: Assets

### 15.1 Asset Definitions (`assets/assets.json`)
- [ ] Define car icon prompt
- [ ] Define checkpoint marker prompt
- [ ] Define finish line prompt
- [ ] Define player marker self prompt
- [ ] Define hazard zone prompt
- [ ] Define UI element prompts

### 15.2 Asset Generation
- [ ] Generate car icon using AI tool
- [ ] Generate checkpoint markers
- [ ] Generate finish line graphic
- [ ] Generate UI icons
- [ ] Add asset stubs with descriptions

---

## Phase 16: GitHub Pages (UI Mockup)

### 16.1 Overview Page (`docs/index.html`)
- [ ] Create landing page with app overview
- [ ] Describe core features
- [ ] Show UI mockup screenshots/diagrams
- [ ] Explain tech stack
- [ ] Add getting started section
- [ ] Style with modern CSS
- [ ] Make responsive

### 16.2 Additional Documentation
- [ ] Create API documentation
- [ ] Add architecture diagrams
- [ ] Include deployment guide

---

## Phase 17: CI/CD Setup

### 17.1 GitHub Actions Workflow
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Set up Node.js environment
- [ ] Install dependencies
- [ ] Build client
- [ ] Deploy to GitHub Pages
- [ ] Configure deployment triggers (push to main)

### 17.2 GitHub Pages Configuration
- [ ] Enable GitHub Pages in repo settings
- [ ] Set source to docs/ directory
- [ ] Configure custom domain (optional)
- [ ] Test deployment

---

## Phase 18: Testing & Hardening

### 18.1 Unit Tests
- [ ] Write projection tests
- [ ] Write progress calculation tests
- [ ] Write checkpoint tests
- [ ] Write finish line tests
- [ ] Write validation tests
- [ ] Write state machine tests
- [ ] Write leaderboard tests

### 18.2 Integration Tests
- [ ] Test WebSocket connection
- [ ] Test message flow
- [ ] Test state synchronization
- [ ] Test reconnection logic

### 18.3 Simulation Tests
- [ ] Create GPS trace replay system
- [ ] Test with simulated high-speed movement
- [ ] Test with GPS noise
- [ ] Test with route loops
- [ ] Test with multiple players

### 18.4 Edge Case Testing
- [ ] Test GPS jumps
- [ ] Test route deviation
- [ ] Test teleport detection
- [ ] Test concurrent updates
- [ ] Test connection drops
- [ ] Test server restart

### 18.5 Load Testing
- [ ] Test with 50+ simulated players
- [ ] Measure server CPU/memory
- [ ] Measure latency
- [ ] Test WebSocket fanout

---

## Phase 19: Review & Refinement

### 19.1 Spec Compliance Review
- [ ] Verify all algorithms implemented per spec
- [ ] Verify all edge cases handled
- [ ] Verify all state transitions correct
- [ ] Verify all constants match spec

### 19.2 Code Quality Review
- [ ] Review TypeScript types
- [ ] Check for code duplication
- [ ] Verify error handling
- [ ] Check logging completeness

### 19.3 Performance Review
- [ ] Profile projection performance
- [ ] Optimize hot paths
- [ ] Check memory usage
- [ ] Verify update rates

### 19.4 Security Review
- [ ] Verify input sanitization
- [ ] Check rate limiting
- [ ] Verify anti-cheat measures
- [ ] Review error message exposure

### 19.5 Documentation Review
- [ ] Update README
- [ ] Verify inline comments
- [ ] Check API docs
- [ ] Update deployment guide

---

## Phase 20: Final Polish

### 20.1 UI Polish
- [ ] Refine styling
- [ ] Add animations
- [ ] Improve responsiveness
- [ ] Add loading states

### 20.2 Error Handling
- [ ] Add user-friendly error messages
- [ ] Implement graceful degradation
- [ ] Add safe mode logic

### 20.3 Monitoring
- [ ] Add runtime metrics
- [ ] Set up error tracking
- [ ] Add performance monitoring

### 20.4 Deployment
- [ ] Deploy to production
- [ ] Verify CI/CD
- [ ] Test live deployment
- [ ] Monitor initial usage

---

## Milestones & Commits

### Milestone 1: Foundation
- Repository setup
- Shared layer complete
- GitHub Pages mockup live

### Milestone 2: Server Core
- Geometry engine complete
- Race rules engine complete
- State management complete

### Milestone 3: Server Network
- WebSocket layer complete
- Tick engine complete
- Server fully functional

### Milestone 4: Client Core
- React app structure
- Map rendering
- Network layer

### Milestone 5: Client UI
- All UI components
- State management
- Interpolation

### Milestone 6: Integration
- End-to-end working
- Testing complete
- CI/CD active

### Milestone 7: Production Ready
- All edge cases handled
- Performance optimized
- Documentation complete

---

## Success Criteria

- [ ] Server handles 100+ concurrent players
- [ ] GPS projection accuracy within 5m
- [ ] Leaderboard updates within 1s
- [ ] Client renders at 60fps
- [ ] Reconnection works reliably
- [ ] All edge cases from spec handled
- [ ] CI/CD deploys automatically
- [ ] GitHub Pages shows professional mockup
- [ ] Code is well-documented
- [ ] Tests cover critical paths

---

## Notes

- Each major phase should be committed separately
- Use descriptive commit messages
- Tag releases for milestones
- Keep journal updated with progress
- Review spec cyclically during implementation
