/**
 * Integration Tests for Session Management Workflow
 * 
 * Tests complete session lifecycle including:
 * - Session creation and configuration
 * - Participant registration and management
 * - Session state transitions
 * - Real-time session updates
 * - Session completion and results
 */

import { sessionService } from '../../services/session.service';
import { participationService } from '../../services/participation.service';
import { enforcementService } from '../../services/enforcement.service';
import { notificationService } from '../../services/notification.service';
import { SimulationClient } from '../../simulation/SimulationClient';
import type { Session, RaceParticipant, SessionStatus } from '../../types';

describe('Session Management Integration Tests', () => {
  let testSessions: Session[] = [];
  let simulationClients: SimulationClient[];

  beforeAll(async () => {
    testSessions = [];
    simulationClients = [];
  });

  afterAll(async () => {
    // Clean up
    for (const session of testSessions) {
      try {
        await sessionService.completeSession(session.id);
      } catch (error) {
        // Session might already be completed
      }
    }

    for (const client of simulationClients) {
      if (client.getIsConnected()) {
        client.disconnect();
      }
    }
  });

  describe('Session Lifecycle Management', () => {
    test('should handle complete session lifecycle', async () => {
      // Step 1: Create session
      const sessionData = {
        trackId: 'track-1',
        name: 'Lifecycle Test Race',
        description: 'Testing complete session lifecycle',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 5,
        createdBy: 'user-1'
      };

      const session = await sessionService.createSession(sessionData);
      testSessions.push(session);
      
      expect(session.id).toBeDefined();
      expect(session.status).toBe('scheduled');
      expect(session.participants).toBe(0);

      // Step 2: Register participants
      const participantIds = ['user-1', 'user-2', 'user-3'];
      const participants: RaceParticipant[] = [];

      for (const userId of participantIds) {
        const participant = await participationService.startParticipant(session.id, userId);
        participants.push(participant);
        expect(participant.status).toBe('racing');
      }

      // Verify participant count
      const updatedSession = await sessionService.getSession(session.id);
      expect(updatedSession.participants).toBe(participantIds.length);

      // Step 3: Start session
      const startedSession = await sessionService.startSession(session.id);
      expect(startedSession.status).toBe('in_progress');
      expect(startedSession.actualStart).toBeDefined();

      // Step 4: Add participants during active session
      const lateParticipant = await participationService.startParticipant(session.id, 'user-4');
      expect(lateParticipant.status).toBe('racing');

      // Step 5: Monitor session state
      const sessionStatus = await sessionService.getSessionStatus(session.id);
      expect(sessionStatus.status).toBe('in_progress');
      expect(sessionStatus.activeParticipants).toBe(4);

      // Step 6: Complete session
      const completedSession = await sessionService.completeSession(session.id);
      expect(completedSession.status).toBe('completed');
      expect(completedSession.actualEnd).toBeDefined();

      // Step 7: Verify final results
      const results = await participationService.getRaceResults(session.id);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(4);
    });

    test('should handle session cancellation', async () => {
      const sessionData = {
        trackId: 'track-1',
        name: 'Cancellation Test Race',
        description: 'Testing session cancellation',
        sessionType: 'practice' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 3,
        createdBy: 'user-1'
      };

      const session = await sessionService.createSession(sessionData);
      testSessions.push(session);

      // Register some participants
      await participationService.startParticipant(session.id, 'user-1');
      await participationService.startParticipant(session.id, 'user-2');

      // Cancel the session
      const cancelledSession = await sessionService.cancelSession(session.id, 'Weather conditions');
      expect(cancelledSession.status).toBe('cancelled');
      expect(cancelledSession.cancellationReason).toBe('Weather conditions');

      // Verify participants are marked appropriately
      const results = await participationService.getRaceResults(session.id);
      results.forEach(result => {
        expect(result.status).toBe('dns'); // Did Not Start
      });
    });

    test('should handle session rescheduling', async () => {
      const originalStart = new Date(Date.now() + 60000);
      const originalEnd = new Date(Date.now() + 3600000);
      
      const sessionData = {
        trackId: 'track-1',
        name: 'Reschedule Test Race',
        description: 'Testing session rescheduling',
        sessionType: 'race' as const,
        scheduledStart: originalStart,
        scheduledEnd: originalEnd,
        maxParticipants: 3,
        createdBy: 'user-1'
      };

      const session = await sessionService.createSession(sessionData);
      testSessions.push(session);

      // Reschedule session
      const newStart = new Date(Date.now() + 7200000); // 2 hours later
      const newEnd = new Date(Date.now() + 10800000); // 3 hours later

      const rescheduledSession = await sessionService.rescheduleSession(session.id, newStart, newEnd);
      expect(rescheduledSession.scheduledStart).toEqual(newStart);
      expect(rescheduledSession.scheduledEnd).toEqual(newEnd);
    });
  });

  describe('Participant Management', () => {
    test('should handle participant registration and withdrawal', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Participant Management Test',
        description: 'Testing participant management',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 3,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      await sessionService.startSession(session.id);

      // Register participants
      const participant1 = await participationService.startParticipant(session.id, 'user-1');
      const participant2 = await participationService.startParticipant(session.id, 'user-2');
      
      expect(participant1.status).toBe('racing');
      expect(participant2.status).toBe('racing');

      // Simulate participant withdrawal
      const withdrawnParticipant = await participationService.withdrawParticipant(
        session.id, 
        'user-1', 
        'Technical issues'
      );
      
      expect(withdrawnParticipant.status).toBe('disconnected');
      expect(withdrawnParticipant.leftAt).toBeDefined();

      // Verify session state
      const sessionStatus = await sessionService.getSessionStatus(session.id);
      expect(sessionStatus.activeParticipants).toBe(1);

      await sessionService.completeSession(session.id);
    });

    test('should handle participant disqualification', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Disqualification Test',
        description: 'Testing participant disqualification',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 2,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      await sessionService.startSession(session.id);

      // Register participant
      await participationService.startParticipant(session.id, 'user-1');

      // Disqualify for violations
      const disqualifiedParticipant = await participationService.disqualifyParticipant(
        session.id,
        'user-1',
        'Multiple speeding violations'
      );

      expect(disqualifiedParticipant.status).toBe('disqualified');
      expect(disqualifiedParticipant.disqualificationReason).toBe('Multiple speeding violations');
      expect(disqualifiedParticipant.isDNF).toBe(true);

      await sessionService.completeSession(session.id);
    });

    test('should handle participant finish tracking', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Finish Tracking Test',
        description: 'Testing participant finish tracking',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 3,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      await sessionService.startSession(session.id);

      // Register participants
      await participationService.startParticipant(session.id, 'user-1');
      await participationService.startParticipant(session.id, 'user-2');
      await participationService.startParticipant(session.id, 'user-3');

      // Simulate participants finishing at different times
      const finishTime1 = Date.now();
      await participationService.finishParticipant(session.id, 'user-1', finishTime1, 95.5);

      const finishTime2 = finishTime1 + 5000; // 5 seconds later
      await participationService.finishParticipant(session.id, 'user-2', finishTime2, 98.2);

      const finishTime3 = finishTime1 + 12000; // 12 seconds later
      await participationService.finishParticipant(session.id, 'user-3', finishTime3, 102.1);

      // Verify results and positions
      const results = await participationService.getRaceResults(session.id);
      expect(results.length).toBe(3);

      // Check positions (1st should have lowest time)
      const sortedResults = results.sort((a, b) => a.totalTime - b.totalTime);
      expect(sortedResults[0].position).toBe(1);
      expect(sortedResults[1].position).toBe(2);
      expect(sortedResults[2].position).toBe(3);

      await sessionService.completeSession(session.id);
    });
  });

  describe('Real-time Session Updates', () => {
    test('should handle real-time position updates', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Real-time Updates Test',
        description: 'Testing real-time session updates',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 2,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      await sessionService.startSession(session.id);

      // Set up simulation clients
      const client1 = new SimulationClient({
        clientId: 'realtime-client-1',
        sessionId: session.id,
        serverUrl: 'ws://localhost:8080',
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 },
          { lat: 52.1000, lng: -1.0250, order: 2 }
        ]
      });

      const client2 = new SimulationClient({
        clientId: 'realtime-client-2',
        sessionId: session.id,
        serverUrl: 'ws://localhost:8080',
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 },
          { lat: 52.1000, lng: -1.0250, order: 2 }
        ]
      });

      simulationClients.push(client1, client2);

      // Start participants
      await participationService.startParticipant(session.id, 'user-1');
      await participationService.startParticipant(session.id, 'user-2');

      // Connect and start simulation
      await client1.connect();
      await client2.connect();
      
      client1.startSimulation();
      client2.startSimulation();

      // Monitor position updates
      const positionUpdates: any[] = [];
      
      client1.onPositionUpdate((position: any) => {
        positionUpdates.push({ client: 'client1', position });
      });

      client2.onPositionUpdate((position: any) => {
        positionUpdates.push({ client: 'client2', position });
      });

      // Let simulation run
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify position updates were received
      expect(positionUpdates.length).toBeGreaterThan(0);

      // Check session live data
      const liveData = await sessionService.getLiveData(session.id);
      expect(liveData.activeParticipants).toBe(2);
      expect(Array.isArray(liveData.positions)).toBe(true);

      // Clean up
      client1.stopSimulation();
      client2.stopSimulation();
      client1.disconnect();
      client2.disconnect();

      await sessionService.completeSession(session.id);
    });

    test('should handle session state broadcasting', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'State Broadcasting Test',
        description: 'Testing session state broadcasting',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 2,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      // Track state changes
      const stateChanges: Array<{ status: SessionStatus; timestamp: number }> = [];

      // Monitor session status changes
      const originalGetSessionStatus = sessionService.getSessionStatus;
      sessionService.getSessionStatus = async (sessionId: string) => {
        const status = await originalGetSessionStatus(sessionId);
        stateChanges.push({ status: status.status, timestamp: Date.now() });
        return status;
      };

      // Start session
      await sessionService.startSession(session.id);
      
      // Complete session
      await sessionService.completeSession(session.id);

      // Verify state transitions
      expect(stateChanges.length).toBeGreaterThan(0);
      const statuses = stateChanges.map(change => change.status);
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('completed');
    });
  });

  describe('Session Configuration and Rules', () => {
    test('should enforce session participant limits', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Limit Test Race',
        description: 'Testing participant limits',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 2,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      // Register participants up to limit
      await participationService.startParticipant(session.id, 'user-1');
      await participationService.startParticipant(session.id, 'user-2');

      // Try to register one more (should fail)
      await expect(
        participationService.startParticipant(session.id, 'user-3')
      ).rejects.toThrow();

      await sessionService.completeSession(session.id);
    });

    test('should handle session type specific rules', async () => {
      // Test practice session (more lenient rules)
      const practiceSession = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Practice Session',
        description: 'Testing practice session rules',
        sessionType: 'practice' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 10,
        createdBy: 'user-1'
      });
      testSessions.push(practiceSession);

      await sessionService.startSession(practiceSession.id);

      // Practice should allow late joins more easily
      await participationService.startParticipant(practiceSession.id, 'user-1');
      
      // Should be able to join and leave freely in practice
      await participationService.withdrawParticipant(practiceSession.id, 'user-1');
      await participationService.startParticipant(practiceSession.id, 'user-2');

      await sessionService.completeSession(practiceSession.id);

      // Test qualifying session (stricter rules)
      const qualifyingSession = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Qualifying Session',
        description: 'Testing qualifying session rules',
        sessionType: 'qualifying' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 1800000), // Shorter
        maxParticipants: 5,
        createdBy: 'user-1'
      });
      testSessions.push(qualifyingSession);

      await sessionService.startSession(qualifyingSession.id);

      // Qualifying should have stricter timing
      await participationService.startParticipant(qualifyingSession.id, 'user-1');
      
      const results = await participationService.getRaceResults(qualifyingSession.id);
      expect(results.length).toBe(1);

      await sessionService.completeSession(qualifyingSession.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle concurrent session operations', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Concurrent Operations Test',
        description: 'Testing concurrent session operations',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 5,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      // Try concurrent participant registrations
      const registrationPromises = [];
      for (let i = 1; i <= 5; i++) {
        registrationPromises.push(
          participationService.startParticipant(session.id, `user-${i}`)
        );
      }

      const results = await Promise.allSettled(registrationPromises);
      
      // All should succeed
      const successfulRegistrations = results.filter(result => result.status === 'fulfilled');
      expect(successfulRegistrations.length).toBe(5);

      await sessionService.completeSession(session.id);
    });

    test('should handle session timeout scenarios', async () => {
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Timeout Test Race',
        description: 'Testing session timeout handling',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 2,
        createdBy: 'user-1'
      });
      testSessions.push(session);

      await sessionService.startSession(session.id);

      // Register participants
      await participationService.startParticipant(session.id, 'user-1');
      await participationService.startParticipant(session.id, 'user-2');

      // Simulate session timeout (force completion)
      const timeoutSession = await sessionService.handleSessionTimeout(session.id);
      expect(timeoutSession.status).toBe('completed');

      // Participants should be marked as DNF if they didn't finish
      const results = await participationService.getRaceResults(session.id);
      results.forEach(result => {
        if (result.status !== 'finished') {
          expect(result.status).toBe('dnf');
        }
      });
    });
  });
});
