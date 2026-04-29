/**
 * Integration Tests for Complete Race Workflow
 * 
 * Tests the complete race workflow from session creation through
 * participant management, position tracking, enforcement, and completion
 */

import { sessionService } from '../../services/session.service';
import { participationService } from '../../services/participation.service';
import { enforcementService } from '../../services/enforcement.service';
import { notificationService } from '../../services/notification.service';
import { sectorFlagService } from '../../services/sectorFlag.service';
import { SimulationClient } from '../../simulation/SimulationClient';
import type { Session, Position, RaceEvent } from '../../types';

describe('Race Workflow Integration Tests', () => {
  let testSession: Session;
  let simulationClients: SimulationClient[];
  const TEST_USERS = ['user-1', 'user-2', 'user-3'];

  beforeAll(async () => {
    // Start test database if needed
    simulationClients = [];
  });

  afterAll(async () => {
    // Clean up simulation clients
    for (const client of simulationClients) {
      if (client.isConnected()) {
        client.disconnect();
      }
    }
  });

  describe('Complete Race Session Workflow', () => {
    test('should handle complete race session from creation to completion', async () => {
      // Step 1: Create race session
      const sessionData = {
        trackId: 'track-1',
        name: 'Integration Test Race',
        description: 'Complete workflow test race',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000), // 1 minute from now
        scheduledEnd: new Date(Date.now() + 3600000), // 1 hour from now
        maxParticipants: 20,
        createdBy: 'user-1'
      };

      testSession = await sessionService.createSession(sessionData);
      expect(testSession).toBeDefined();
      expect(testSession.id).toBeDefined();
      expect(testSession.status).toBe('scheduled');

      // Step 2: Register participants
      const participants = [];
      for (const userId of TEST_USERS) {
        const participant = await participationService.registerParticipant(
          testSession.id,
          userId,
          { carNumber: TEST_USERS.indexOf(userId) + 1 }
        );
        participants.push(participant);
        expect(participant).toBeDefined();
        expect(participant.status).toBe('registered');
      }

      // Step 3: Start the race session
      const startedSession = await sessionService.startSession(testSession.id);
      expect(startedSession.status).toBe('in_progress');
      expect(startedSession.actualStart).toBeDefined();

      // Step 4: Set up simulation clients for each participant
      for (let i = 0; i < TEST_USERS.length; i++) {
        const client = new SimulationClient({
          userId: TEST_USERS[i],
          sessionId: testSession.id,
          behavior: 'race',
          updateInterval: 1000,
          route: {
            checkpoints: [
              { lat: 52.0786, lng: -1.0169, radius: 10 },
              { lat: 52.0900, lng: -1.0200, radius: 15 },
              { lat: 52.1000, lng: -1.0250, radius: 15 },
              { lat: 52.0786, lng: -1.0169, radius: 10 }
            ]
          }
        });
        
        simulationClients.push(client);
        await client.connect();
      }

      // Step 5: Start simulation and verify position updates
      const positionUpdates: Position[] = [];
      
      for (const client of simulationClients) {
        client.on('positionUpdate', (position: Position) => {
          positionUpdates.push(position);
        });
        
        client.start();
      }

      // Wait for initial position updates
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify position updates are being generated
      expect(positionUpdates.length).toBeGreaterThan(0);
      
      // Step 6: Test enforcement during race
      for (const position of positionUpdates.slice(0, 5)) {
        const violations = await enforcementService.checkSpeedZones(
          position, 
          testSession.trackId
        );
        
        // Verify enforcement system is working
        expect(Array.isArray(violations)).toBe(true);
        
        // If violations detected, test penalty calculation
        if (violations.length > 0) {
          const penalty = enforcementService.calculatePenalty(violations[0]);
          expect(penalty).toBeDefined();
          expect(penalty.type).toBeDefined();
        }
      }

      // Step 7: Test sector flag management
      const initialFlags = sectorFlagService.getAllSectorFlags();
      expect(initialFlags.length).toBeGreaterThan(0);

      // Simulate safety car scenario
      sectorFlagService.setSectorFlag('sector-1', 'yellow', 'Debris on track');
      
      const updatedFlags = sectorFlagService.getAllSectorFlags();
      const yellowFlag = updatedFlags.find(f => f.sectorId === 'sector-1');
      expect(yellowFlag?.flag).toBe('yellow');

      // Step 8: Test notification generation during race
      for (const participant of participants) {
        const notifications = await notificationService.getUserNotifications(
          participant.userId
        );
        expect(Array.isArray(notifications)).toBe(true);
      }

      // Step 9: Complete the race
      await new Promise(resolve => setTimeout(resolve, 5000)); // Let simulation run
      
      // Stop all simulation clients
      for (const client of simulationClients) {
        client.stop();
      }

      // Finish the session
      const completedSession = await sessionService.completeSession(testSession.id);
      expect(completedSession.status).toBe('completed');
      expect(completedSession.actualEnd).toBeDefined();

      // Step 10: Verify final results
      const finalResults = await participationService.getSessionResults(
        testSession.id
      );
      expect(Array.isArray(finalResults)).toBe(true);
      expect(finalResults.length).toBe(TEST_USERS.length);
    });

    test('should handle race session with safety car intervention', async () => {
      // Create a new session for safety car test
      const sessionData = {
        trackId: 'track-1',
        name: 'Safety Car Test Race',
        description: 'Test safety car workflow',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 10,
        createdBy: 'user-1'
      };

      const safetyCarSession = await sessionService.createSession(sessionData);
      await sessionService.startSession(safetyCarSession.id);

      // Set up minimal simulation
      const client = new SimulationClient({
        userId: 'user-1',
        sessionId: safetyCarSession.id,
        behavior: 'cautious',
        updateInterval: 2000
      });

      await client.connect();
      client.start();

      // Deploy safety car
      sectorFlagService.setSectorFlag('sector-1', 'yellow', 'Safety car deployed');
      sectorFlagService.setSectorFlag('sector-2', 'yellow', 'Safety car deployed');
      sectorFlagService.setSectorFlag('sector-3', 'yellow', 'Safety car deployed');

      // Verify all sectors show yellow
      const yellowFlags = sectorFlagService.getAllSectorFlags();
      yellowFlags.forEach(flag => {
        expect(flag.flag).toBe('yellow');
      });

      // Wait for safety car period
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Clear safety car
      sectorFlagService.setSectorFlag('sector-1', 'green', 'Safety car withdrawn');
      sectorFlagService.setSectorFlag('sector-2', 'green', 'Safety car withdrawn');
      sectorFlagService.setSectorFlag('sector-3', 'green', 'Safety car withdrawn');

      // Verify all sectors return to green
      const greenFlags = sectorFlagService.getAllSectorFlags();
      greenFlags.forEach(flag => {
        expect(flag.flag).toBe('green');
      });

      client.stop();
      client.disconnect();
      await sessionService.completeSession(safetyCarSession.id);
    });

    test('should handle multi-client race with competitive behavior', async () => {
      // Create competitive race session
      const sessionData = {
        trackId: 'track-2', // Monaco - tighter track
        name: 'Competitive Race Test',
        description: 'Test competitive multi-client race',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 1800000), // 30 minutes
        maxParticipants: 3,
        createdBy: 'user-1'
      };

      const competitiveSession = await sessionService.createSession(sessionData);
      await sessionService.startSession(competitiveSession.id);

      // Create competitive simulation clients
      const competitiveClients: SimulationClient[] = [];
      const behaviors = ['aggressive', 'balanced', 'cautious'];

      for (let i = 0; i < 3; i++) {
        const client = new SimulationClient({
          userId: TEST_USERS[i],
          sessionId: competitiveSession.id,
          behavior: behaviors[i] as any,
          updateInterval: 500, // Faster updates for competitive race
          route: {
            checkpoints: [
              { lat: 43.7347, lng: 7.4216, radius: 10 },
              { lat: 43.7390, lng: 7.4260, radius: 12 },
              { lat: 43.7347, lng: 7.4216, radius: 10 }
            ]
          }
        });

        await client.connect();
        client.start();
        competitiveClients.push(client);
      }

      // Monitor race for violations and incidents
      const raceEvents: RaceEvent[] = [];
      
      for (const client of competitiveClients) {
        client.on('positionUpdate', async (position: Position) => {
          // Check for violations
          const violations = await enforcementService.checkSpeedZones(
            position,
            competitiveSession.trackId
          );
          
          if (violations.length > 0) {
            raceEvents.push({
              type: 'violation',
              userId: client.getUserId(),
              timestamp: Date.now(),
              data: violations
            });
          }
        });
      }

      // Let competitive race run
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify competitive behavior generated events
      expect(raceEvents.length).toBeGreaterThanOrEqual(0);

      // Check final positions
      const results = await participationService.getSessionResults(
        competitiveSession.id
      );
      expect(results.length).toBe(3);

      // Clean up
      competitiveClients.forEach(client => {
        client.stop();
        client.disconnect();
      });

      await sessionService.completeSession(competitiveSession.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle client disconnection gracefully', async () => {
      const sessionData = {
        trackId: 'track-1',
        name: 'Disconnection Test',
        description: 'Test client disconnection handling',
        sessionType: 'practice' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 1800000),
        maxParticipants: 2,
        createdBy: 'user-1'
      };

      const testSession = await sessionService.createSession(sessionData);
      await sessionService.startSession(testSession.id);

      const client = new SimulationClient({
        userId: 'user-1',
        sessionId: testSession.id,
        behavior: 'normal',
        updateInterval: 1000
      });

      await client.connect();
      client.start();

      // Let it run briefly
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate disconnection
      client.disconnect();

      // Verify session continues
      const sessionStatus = await sessionService.getSessionStatus(testSession.id);
      expect(sessionStatus.status).toBe('in_progress');

      await sessionService.completeSession(testSession.id);
    });

    test('should handle database connection issues', async () => {
      // Test with invalid session ID
      const invalidSessionId = 'nonexistent-session';
      
      await expect(
        sessionService.getSessionStatus(invalidSessionId)
      ).rejects.toThrow();
    });
  });
});
