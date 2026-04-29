/**
 * Integration Tests for Leaderboard API Endpoints
 * 
 * Tests the complete API functionality including database operations,
 * authentication, and WebSocket integration
 */

import request from 'supertest';
import { app } from '../../server/src/index';
import { query } from '../../server/src/database/connection.simple';

describe('Leaderboard API Integration Tests', () => {
  let authToken: string;
  let testRaceId: string;
  let testParticipantId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const userResult = await query(`
      INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, ['test-user-leaderboard', 'leaderboarduser', 'leaderboard@test.com', 'hashed_password']);

    testUserId = userResult[0]?.id || 'test-user-leaderboard';

    // Mock authentication for testing
    authToken = 'Bearer test-token';

    // Create test race
    const raceResult = await query(`
      INSERT INTO events (id, name, type, organizer_id, start_time, end_time, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, ['test-race-leaderboard', 'Test Leaderboard Race', 'TRACK_DAY', testUserId]);

    testRaceId = raceResult[0]?.id || 'test-race-leaderboard';

    // Create test participant
    const participantResult = await query(`
      INSERT INTO session_participants (id, session_id, user_id, car_number, created_at, updated_at)
      VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        car_number = EXCLUDED.car_number,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `, ['test-participant-leaderboard', testRaceId, testUserId]);

    testParticipantId = participantResult[0]?.id || 'test-participant-leaderboard';
  });

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM leaderboard_entries WHERE race_id = $1', [testRaceId]);
    await query('DELETE FROM race_leaderboards WHERE race_id = $1', [testRaceId]);
    await query('DELETE FROM position_updates WHERE race_id = $1', [testRaceId]);
    await query('DELETE FROM session_participants WHERE id = $1', [testParticipantId]);
    await query('DELETE FROM events WHERE id = $1', [testRaceId]);
    await query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('POST /api/leaderboard/:raceId/initialize', () => {
    it('should initialize a race leaderboard', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Leaderboard initialized successfully');

      // Verify leaderboard was created
      const leaderboard = await query('SELECT * FROM race_leaderboards WHERE race_id = $1', [testRaceId]);
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].race_name).toBe('Test Leaderboard Race');
      expect(leaderboard[0].status).toBe('active');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .send({ raceName: 'Test Leaderboard Race' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should validate race name', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing race name');
    });
  });

  describe('GET /api/leaderboard/:raceId', () => {
    beforeEach(async () => {
      // Ensure leaderboard is initialized for each test
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });
    });

    it('should get current leaderboard', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('raceId', testRaceId);
      expect(response.body.data).toHaveProperty('raceName', 'Test Leaderboard Race');
      expect(response.body.data).toHaveProperty('status', 'active');
      expect(response.body.data).toHaveProperty('entries');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.entries)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}?page=1&limit=10`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('pages');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });

    it('should handle non-existent race', async () => {
      const response = await request(app)
        .get('/api/leaderboard/non-existent-race')
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get leaderboard');
    });
  });

  describe('GET /api/leaderboard/:raceId/participant/:participantId', () => {
    beforeEach(async () => {
      // Initialize leaderboard and create entry
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });

      // Create leaderboard entry
      await query(`
        INSERT INTO leaderboard_entries (
          race_id, participant_id, user_id, current_position, previous_position,
          current_lap, total_laps, status
        )
        VALUES ($1, $2, $3, 1, 1, 1, 1, 'racing')
      `, [testRaceId, testParticipantId, testUserId]);
    });

    it('should get participant position', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}/participant/${testParticipantId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('participantId', testParticipantId);
      expect(response.body.data).toHaveProperty('userId', testUserId);
      expect(response.body.data).toHaveProperty('currentPosition', 1);
      expect(response.body.data).toHaveProperty('status', 'racing');
    });

    it('should return null for non-existent participant', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}/participant/non-existent-participant`)
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Participant not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}/participant/${testParticipantId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/leaderboard/:raceId/position', () => {
    beforeEach(async () => {
      // Initialize leaderboard and create entry
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });

      await query(`
        INSERT INTO leaderboard_entries (
          race_id, participant_id, user_id, current_position, previous_position,
          current_lap, total_laps, status
        )
        VALUES ($1, $2, $3, 1, 1, 1, 1, 'racing')
      `, [testRaceId, testParticipantId, testUserId]);
    });

    it('should update participant position', async () => {
      const positionData = {
        participantId: testParticipantId,
        position: 1,
        lap: 2,
        checkpointIndex: 3,
        lapTime: 65000,
        speed: 85.5,
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      };

      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/position`)
        .set('Authorization', authToken)
        .send(positionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Position update queued successfully');
    });

    it('should validate position data', async () => {
      const invalidData = {
        participantId: testParticipantId,
        // Missing required fields
      };

      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/position`)
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid position data');
    });

    it('should validate coordinates', async () => {
      const invalidData = {
        participantId: testParticipantId,
        position: 1,
        lap: 2,
        checkpointIndex: 3,
        lapTime: 65000,
        speed: 85.5,
        coordinates: {
          // Missing lat and lng
        }
      };

      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/position`)
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid coordinates');
    });

    it('should require authentication', async () => {
      const positionData = {
        participantId: testParticipantId,
        position: 1,
        lap: 2,
        checkpointIndex: 3,
        lapTime: 65000,
        speed: 85.5,
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      };

      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/position`)
        .send(positionData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/leaderboard/:raceId/finish/:participantId', () => {
    beforeEach(async () => {
      // Initialize leaderboard and create entry
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });

      await query(`
        INSERT INTO leaderboard_entries (
          race_id, participant_id, user_id, current_position, previous_position,
          current_lap, total_laps, status
        )
        VALUES ($1, $2, $3, 1, 1, 1, 1, 'racing')
      `, [testRaceId, testParticipantId, testUserId]);
    });

    it('should finish participant', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/finish/${testParticipantId}`)
        .set('Authorization', authToken)
        .send({ totalTime: 120000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Participant finished successfully');

      // Verify participant status was updated
      const entry = await query(
        'SELECT status, total_time FROM leaderboard_entries WHERE race_id = $1 AND participant_id = $2',
        [testRaceId, testParticipantId]
      );
      expect(entry[0].status).toBe('finished');
      expect(entry[0].total_time).toBe(120000);
    });

    it('should validate total time', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/finish/${testParticipantId}`)
        .set('Authorization', authToken)
        .send({ totalTime: -1000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid total time');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/finish/${testParticipantId}`)
        .send({ totalTime: 120000 })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/leaderboard/:raceId/finish', () => {
    beforeEach(async () => {
      // Initialize leaderboard
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });
    });

    it('should finish race', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/finish`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Race finished successfully');

      // Verify race status was updated
      const race = await query('SELECT status, end_time FROM race_leaderboards WHERE race_id = $1', [testRaceId]);
      expect(race[0].status).toBe('finished');
      expect(race[0].end_time).not.toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/finish`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /api/leaderboard/:raceId/statistics', () => {
    beforeEach(async () => {
      // Initialize leaderboard and create entries
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });

      // Create multiple entries for statistics
      await query(`
        INSERT INTO leaderboard_entries (
          race_id, participant_id, user_id, current_position, previous_position,
          current_lap, total_laps, lap_time, best_lap_time, speed, status
        )
        VALUES 
          ($1, $2, $3, 1, 1, 1, 1, 65000, 62000, 85.5, 'finished'),
          ($1, $4, $5, 2, 2, 1, 1, 68000, 65000, 82.0, 'finished')
      `, [testRaceId, testParticipantId, testUserId, 'test-participant-2', 'test-user-2']);
    });

    it('should get race statistics', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}/statistics`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_participants');
      expect(response.body.data).toHaveProperty('finished_participants');
      expect(response.body.data).toHaveProperty('avg_lap_time');
      expect(response.body.data).toHaveProperty('fastest_lap_time');
      expect(response.body.data).toHaveProperty('max_speed');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}/statistics`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('DELETE /api/leaderboard/:raceId/cache', () => {
    beforeEach(async () => {
      // Initialize leaderboard
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });
    });

    it('should clear cache for admin users', async () => {
      // Mock admin user
      const adminToken = 'Bearer admin-token';

      const response = await request(app)
        .delete(`/api/leaderboard/${testRaceId}/cache`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cache cleared successfully');
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/leaderboard/${testRaceId}/cache`)
        .set('Authorization', authToken)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('Admin access required');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/leaderboard/${testRaceId}/cache`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('WebSocket Integration', () => {
    it('should broadcast leaderboard updates', async () => {
      // Initialize leaderboard
      await request(app)
        .post(`/api/leaderboard/${testRaceId}/initialize`)
        .set('Authorization', authToken)
        .send({ raceName: 'Test Leaderboard Race' });

      // Create entry
      await query(`
        INSERT INTO leaderboard_entries (
          race_id, participant_id, user_id, current_position, previous_position,
          current_lap, total_laps, status
        )
        VALUES ($1, $2, $3, 1, 1, 1, 1, 'racing')
      `, [testRaceId, testParticipantId, testUserId]);

      // Update position (should trigger broadcast)
      const positionData = {
        participantId: testParticipantId,
        position: 1,
        lap: 2,
        checkpointIndex: 3,
        lapTime: 65000,
        speed: 85.5,
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      };

      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/position`)
        .set('Authorization', authToken)
        .send(positionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Note: WebSocket broadcast testing would require additional setup
      // This test verifies the API accepts the request and processes it
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database failure
      const originalQuery = query;
      (query as any) = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get(`/api/leaderboard/${testRaceId}`)
        .set('Authorization', authToken)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get leaderboard');

      // Restore original query
      (query as any) = originalQuery;
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post(`/api/leaderboard/${testRaceId}/position`)
        .set('Authorization', authToken)
        .send('invalid-json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
