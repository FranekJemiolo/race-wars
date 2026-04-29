/**
 * Simple Integration Tests for Leaderboard API Endpoints
 */

import request from 'supertest';
import { app } from '../index';
import jwt from 'jsonwebtoken';
import { authService } from '../services/auth.service';

// Helper function to generate valid test tokens
async function generateTestToken(username: string, role: 'user' | 'admin' = 'user'): Promise<string> {
  const JWT_SECRET = process.env.JWT_SECRET || 'race-wars-secret-key';
  
  // Get the actual user from the auth service to get the correct userId
  const user = await authService.getUserByUsername(username);
  if (!user) {
    throw new Error(`User ${username} not found in auth service`);
  }
  
  return jwt.sign(
    { 
      userId: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

describe('Leaderboard API Integration Tests', () => {
  let validUserToken: string;
  let validAdminToken: string;

  // Initialize auth service and tokens before tests
  beforeAll(async () => {
    // Set test environment and use random ports to avoid conflicts
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0'; // Use 0 to let OS assign random port
    process.env.WS_PORT = '0'; // Use 0 to let OS assign random port
    
    // Start server manually for tests
    const { startServer } = require('../index');
    await startServer();
    
    // Ensure auth service is initialized
    authService;
    
    // Generate valid tokens
    validUserToken = await generateTestToken('testdriver', 'user');
    validAdminToken = await generateTestToken('admin', 'admin');
  });
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
        .set('Authorization', `Bearer ${validUserToken}`)
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
        .set('Authorization', `Bearer ${validUserToken}`)
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
        .set('Authorization', `Bearer ${validUserToken}`)
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
        .set('Authorization', `Bearer ${validUserToken}`)
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
        .set('Authorization', `Bearer ${validUserToken}`)
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
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/leaderboard/test-race/position')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send('invalid-json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid race ID format', async () => {
      const response = await request(app)
        .get('/api/leaderboard/')
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('API Structure Validation', () => {
    it('should have proper API response format', async () => {
      const response = await request(app)
        .get('/api/leaderboard/non-existent-race')
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(500);

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
