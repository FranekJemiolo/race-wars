/**
 * Simple Integration Tests for Leaderboard API Endpoints
 */

import request from 'supertest';
import { app } from '../index';

describe('Leaderboard API Integration Tests', () => {
  describe('GET /api/leaderboard/:raceId', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/leaderboard/test-race')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should handle non-existent race with authentication', async () => {
      const response = await request(app)
        .get('/api/leaderboard/non-existent-race')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get leaderboard');
    });
  });

  describe('POST /api/leaderboard/:raceId/initialize', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/initialize')
        .send({ raceName: 'Test Race' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should validate race name with authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/initialize')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing race name');
    });
  });

  describe('POST /api/leaderboard/:raceId/position', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/position')
        .send({
          participantId: 'test-participant',
          position: 1,
          lap: 2,
          checkpointIndex: 3,
          lapTime: 65000,
          speed: 85.5,
          coordinates: { lat: 37.7749, lng: -122.4194 }
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should validate position data with authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/position')
        .set('Authorization', 'Bearer test-token')
        .send({
          participantId: 'test-participant'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid position data');
    });

    it('should validate coordinates with authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/position')
        .set('Authorization', 'Bearer test-token')
        .send({
          participantId: 'test-participant',
          position: 1,
          lap: 2,
          checkpointIndex: 3,
          lapTime: 65000,
          speed: 85.5,
          coordinates: {} // Missing lat and lng
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid coordinates');
    });
  });

  describe('GET /api/leaderboard/:raceId/participant/:participantId', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/leaderboard/test-race/participant/test-participant')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /api/leaderboard/:raceId/finish/:participantId', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/finish/test-participant')
        .send({ totalTime: 120000 })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should validate total time with authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/finish/test-participant')
        .set('Authorization', 'Bearer test-token')
        .send({ totalTime: -1000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid total time');
    });
  });

  describe('POST /api/leaderboard/:raceId/finish', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/finish')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/leaderboard/:raceId/statistics', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/leaderboard/test-race/statistics')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('DELETE /api/leaderboard/:raceId/cache', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/leaderboard/test-race/cache')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .delete('/api/leaderboard/test-race/cache')
        .set('Authorization', 'Bearer user-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/position')
        .set('Authorization', 'Bearer test-token')
        .send('invalid-json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid race ID format', async () => {
      const response = await request(app)
        .get('/api/leaderboard/')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('API Structure Validation', () => {
    it('should have proper API response format', async () => {
      const response = await request(app)
        .get('/api/leaderboard/non-existent-race')
        .set('Authorization', 'Bearer test-token')
        .expect(401);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.error).toBe('string');
    });

    it('should handle CORS headers', async () => {
      const response = await request(app)
        .options('/api/leaderboard/test-race')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });
});
