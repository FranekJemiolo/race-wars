# Real-Time Leaderboard Architecture

## Overview
A comprehensive real-time leaderboard system that tracks race positions, lap times, and provides live updates to all connected clients via WebSocket connections.

## Architecture Components

### 1. Data Models

#### LeaderboardEntry
```typescript
interface LeaderboardEntry {
  id: string;
  raceId: string;
  participantId: string;
  userId: string;
  username: string;
  currentPosition: number;
  previousPosition: number;
  currentLap: number;
  totalLaps: number;
  lapTime: number;
  bestLapTime: number;
  totalTime: number;
  gapToLeader: number;
  gapToPrevious: number;
  lastCheckpointTime: number;
  speed: number;
  status: 'racing' | 'finished' | 'dnf' | 'pit';
  positionHistory: PositionUpdate[];
  lastUpdate: Date;
}
```

#### PositionUpdate
```typescript
interface PositionUpdate {
  timestamp: Date;
  position: number;
  lap: number;
  checkpointIndex: number;
  lapTime: number;
  speed: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}
```

#### RaceLeaderboard
```typescript
interface RaceLeaderboard {
  raceId: string;
  raceName: string;
  status: 'active' | 'finished' | 'paused';
  startTime: Date;
  totalParticipants: number;
  finishedParticipants: number;
  entries: LeaderboardEntry[];
  lastUpdate: Date;
}
```

### 2. Database Schema

#### leaderboard_entries Table
- id (UUID, Primary Key)
- race_id (UUID, Foreign Key)
- participant_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- current_position (INTEGER)
- previous_position (INTEGER)
- current_lap (INTEGER)
- total_laps (INTEGER)
- lap_time (BIGINT) - milliseconds
- best_lap_time (BIGINT) - milliseconds
- total_time (BIGINT) - milliseconds
- gap_to_leader (BIGINT) - milliseconds
- gap_to_previous (BIGINT) - milliseconds
- last_checkpoint_time (TIMESTAMP WITH TIME ZONE)
- speed (DECIMAL(8,2))
- status (VARCHAR(20))
- position_history (JSONB)
- last_update (TIMESTAMP WITH TIME ZONE)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)

#### race_leaderboards Table
- id (UUID, Primary Key)
- race_id (UUID, Foreign Key, Unique)
- race_name (VARCHAR(255))
- status (VARCHAR(20))
- start_time (TIMESTAMP WITH TIME ZONE)
- total_participants (INTEGER)
- finished_participants (INTEGER)
- entries (JSONB) - Cached leaderboard data
- last_update (TIMESTAMP WITH TIME ZONE)
- created_at (TIMESTAMP WITH TIME ZONE)
- updated_at (TIMESTAMP WITH TIME ZONE)

### 3. Service Layer

#### LeaderboardService
- `initializeRaceLeaderboard(raceId: string): Promise<void>`
- `updatePosition(raceId: string, participantId: string, positionData: PositionUpdate): Promise<void>`
- `getLeaderboard(raceId: string): Promise<RaceLeaderboard>`
- `getParticipantPosition(raceId: string, participantId: string): Promise<LeaderboardEntry>`
- `finishRace(raceId: string): Promise<void>`
- `resetLeaderboard(raceId: string): Promise<void>`

#### LeaderboardWebSocketService
- `broadcastLeaderboardUpdate(raceId: string, leaderboard: RaceLeaderboard): Promise<void>`
- `subscribeToRace(raceId: string, clientId: string): Promise<void>`
- `unsubscribeFromRace(raceId: string, clientId: string): Promise<void>`
- `handlePositionUpdate(message: PositionUpdateMessage): Promise<void>`

### 4. API Endpoints

#### GET /api/leaderboard/:raceId
- Returns current leaderboard for a race
- Supports pagination for large races
- Includes real-time position updates

#### POST /api/leaderboard/:raceId/position
- Updates participant position
- Validates position data
- Triggers leaderboard recalculation

#### GET /api/leaderboard/:raceId/participant/:participantId
- Returns detailed participant information
- Includes position history and lap times

#### WebSocket Events
- `leaderboard_update` - Full leaderboard update
- `position_update` - Individual position change
- `race_status_change` - Race start/finish/pause

### 5. Real-Time Updates

#### Position Update Flow
1. Client sends position update via WebSocket
2. Server validates and processes update
3. LeaderboardService recalculates positions
4. WebSocketService broadcasts updates to all subscribers
5. Clients update UI with new positions

#### Optimization Strategies
- Batch position updates (every 500ms)
- Differential updates (only send changed positions)
- Client-side prediction for smooth animations
- Connection pooling for WebSocket management

### 6. Performance Considerations

#### Database Optimization
- Indexes on race_id, participant_id, current_position
- Partitioning by race_id for large datasets
- Caching frequent leaderboard queries
- Connection pooling for high concurrency

#### Memory Management
- In-memory leaderboard cache for active races
- LRU cache for completed race leaderboards
- Efficient data structures for position calculations
- Garbage collection for old position data

#### Scalability
- Horizontal scaling with Redis for distributed caching
- Load balancing for WebSocket connections
- Microservice architecture for leaderboard service
- CDN for static leaderboard data

### 7. Testing Strategy

#### Unit Tests
- LeaderboardService methods
- Position calculation algorithms
- Data validation and sanitization
- WebSocket message handling

#### Integration Tests
- API endpoint functionality
- Database operations
- WebSocket event broadcasting
- Cache invalidation

#### E2E Tests
- Real-time position updates
- Multi-client synchronization
- Leaderboard accuracy under load
- WebSocket connection handling

#### Performance Tests
- Concurrent user simulation
- Large race scenarios (100+ participants)
- Memory usage under sustained load
- Database query optimization

### 8. Error Handling

#### Validation
- Position update data validation
- Race status verification
- Participant authorization checks
- Data type and range validation

#### Recovery
- Automatic reconnection for WebSocket clients
- Leaderboard state recovery from database
- Graceful degradation during high load
- Fallback to polling if WebSocket fails

#### Monitoring
- Position update frequency monitoring
- WebSocket connection health checks
- Database query performance tracking
- Memory usage alerts

### 9. Security

#### Authentication
- WebSocket connection authentication
- Race participation authorization
- API endpoint access control
- Rate limiting for position updates

#### Data Integrity
- Position update validation
- Anti-cheat integration
- Race result verification
- Audit logging for all changes
