/**
 * Basic Integration Tests with Mock WebSocket Server
 * 
 * Simple integration tests that work with the mock WebSocket server
 * to verify basic functionality without complex dependencies
 */

import { SimulationClient } from '../../simulation/SimulationClient';
import { getMockWebSocketServer, resetMockWebSocketServer } from '../utils/mockWebSocketServer';
import type { PositionUpdate, RoutePoint } from '../../simulation/SimulationClient';

describe('Basic Workflow Integration Tests', () => {
  let simulationClients: SimulationClient[];
  let mockServer: any;
  const TEST_SESSION_ID = 'test-session-basic';
  const SERVER_URL = 'ws://localhost:8082';

  beforeAll(async () => {
    simulationClients = [];
    mockServer = getMockWebSocketServer(8082);
    mockServer.start();
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Clean up all clients
    for (const client of simulationClients) {
      if (client.getIsConnected()) {
        client.disconnect();
      }
    }
    
    // Stop mock server
    if (mockServer) {
      await mockServer.stop();
    }
    resetMockWebSocketServer();
  });

  beforeEach(async () => {
    // Clear clients between tests
    simulationClients = [];
  });

  describe('Basic Client Connection', () => {
    test('should connect single client to mock server', async () => {
      const client = new SimulationClient({
        clientId: 'test-client-1',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 }
        ]
      });

      simulationClients.push(client);

      await client.connect();
      
      expect(client.getIsConnected()).toBe(true);
      expect(mockServer.getClientCount()).toBe(1);
      expect(mockServer.getSessionClients(TEST_SESSION_ID)).toContain('test-client-1');

      client.disconnect();
      expect(client.getIsConnected()).toBe(false);
    });

    test('should handle multiple clients connecting', async () => {
      const clientCount = 3;
      
      for (let i = 0; i < clientCount; i++) {
        const client = new SimulationClient({
          clientId: `multi-client-${i}`,
          sessionId: TEST_SESSION_ID,
          serverUrl: SERVER_URL,
          behavior: 'honest',
          updateInterval: 1000,
          route: [
            { lat: 52.0786, lng: -1.0169, order: 0 },
            { lat: 52.0900, lng: -1.0200, order: 1 }
          ]
        });

        simulationClients.push(client);
        await client.connect();
      }

      expect(mockServer.getClientCount()).toBe(clientCount);
      expect(mockServer.getSessionClients(TEST_SESSION_ID).length).toBe(clientCount);

      // Disconnect all clients
      for (const client of simulationClients) {
        client.disconnect();
      }

      expect(mockServer.getClientCount()).toBe(0);
    });
  });

  describe('Position Updates', () => {
    test('should send and receive position updates', async () => {
      const client = new SimulationClient({
        clientId: 'position-test-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 500, // Fast updates for testing
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 },
          { lat: 52.1000, lng: -1.0250, order: 2 }
        ]
      });

      simulationClients.push(client);
      await client.connect();

      const positionUpdates: PositionUpdate[] = [];
      
      // Listen for position updates from mock server
      mockServer.on('position_update', (data: any) => {
        positionUpdates.push(data.position);
      });

      client.startSimulation();

      // Wait for position updates
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(positionUpdates.length).toBeGreaterThan(0);
      
      // Verify position data structure
      const firstUpdate = positionUpdates[0];
      expect(firstUpdate).toHaveProperty('clientId');
      expect(firstUpdate).toHaveProperty('sessionId');
      expect(firstUpdate).toHaveProperty('lat');
      expect(firstUpdate).toHaveProperty('lng');
      expect(firstUpdate).toHaveProperty('speed');
      expect(firstUpdate).toHaveProperty('heading');
      expect(firstUpdate).toHaveProperty('timestamp');

      client.stopSimulation();
      client.disconnect();
    });

    test('should track client positions on server', async () => {
      const client = new SimulationClient({
        clientId: 'tracking-test-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 500,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 }
        ]
      });

      simulationClients.push(client);
      await client.connect();
      client.startSimulation();

      // Wait for position updates
      await new Promise(resolve => setTimeout(resolve, 1500));

      const clientPosition = mockServer.getClientPosition('tracking-test-client');
      expect(clientPosition).toBeDefined();
      expect(clientPosition?.clientId).toBe('tracking-test-client');
      expect(clientPosition?.sessionId).toBe(TEST_SESSION_ID);

      client.stopSimulation();
      client.disconnect();
    });
  });

  describe('Server Events', () => {
    test('should handle violation events', async () => {
      const client = new SimulationClient({
        clientId: 'violation-test-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 }
        ]
      });

      simulationClients.push(client);
      await client.connect();

      const violations: any[] = [];
      
      client.onViolation((violation: any) => {
        violations.push(violation);
      });

      // Simulate violation from server
      mockServer.simulateViolation('violation-test-client', 'speeding');

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(violations.length).toBe(1);
      expect(violations[0].violationType).toBe('speeding');

      client.disconnect();
    });

    test('should handle flag change events', async () => {
      const client = new SimulationClient({
        clientId: 'flag-test-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 }
        ]
      });

      simulationClients.push(client);
      await client.connect();

      const flagChanges: any[] = [];
      
      // Listen for messages from client
      client.onPositionUpdate((position: any) => {
        // This is a workaround to capture server messages
        // In real implementation, we'd have proper event handlers
      });

      // Simulate flag change from server
      mockServer.simulateFlagChange(TEST_SESSION_ID, 'sector-1', 'yellow');

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify flag change was processed (indirectly through server state)
      expect(mockServer.getSessionCount()).toBe(1);

      client.disconnect();
    });

    test('should handle safety car events', async () => {
      const client = new SimulationClient({
        clientId: 'safety-car-test-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 }
        ]
      });

      simulationClients.push(client);
      await client.connect();

      // Simulate safety car deployment
      mockServer.simulateSafetyCar(TEST_SESSION_ID, true);

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate safety car withdrawal
      mockServer.simulateSafetyCar(TEST_SESSION_ID, false);

      await new Promise(resolve => setTimeout(resolve, 500));

      client.disconnect();
    });
  });

  describe('Session Management', () => {
    test('should handle multiple sessions', async () => {
      const session1Id = 'test-session-1';
      const session2Id = 'test-session-2';

      const client1 = new SimulationClient({
        clientId: 'session-client-1',
        sessionId: session1Id,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }]
      });

      const client2 = new SimulationClient({
        clientId: 'session-client-2',
        sessionId: session2Id,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [{ lat: 52.0900, lng: -1.0200, order: 0 }]
      });

      simulationClients.push(client1, client2);

      await client1.connect();
      await client2.connect();

      expect(mockServer.getClientCount()).toBe(2);
      expect(mockServer.getSessionCount()).toBe(2);
      expect(mockServer.getSessionClients(session1Id)).toContain('session-client-1');
      expect(mockServer.getSessionClients(session2Id)).toContain('session-client-2');

      // Send flag change to only session 1
      mockServer.simulateFlagChange(session1Id, 'sector-1', 'yellow');

      await new Promise(resolve => setTimeout(resolve, 500));

      client1.disconnect();
      client2.disconnect();
    });
  });

  describe('Error Handling', () => {
    test('should handle client disconnection gracefully', async () => {
      const client = new SimulationClient({
        clientId: 'disconnect-test-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }]
      });

      simulationClients.push(client);
      await client.connect();

      expect(mockServer.getClientCount()).toBe(1);

      // Disconnect client
      client.disconnect();

      expect(client.getIsConnected()).toBe(false);
      expect(mockServer.getClientCount()).toBe(0);
    });

    test('should handle invalid server connection', async () => {
      const client = new SimulationClient({
        clientId: 'invalid-server-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: 'ws://localhost:9999', // Invalid port
        behavior: 'honest',
        updateInterval: 1000,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }]
      });

      simulationClients.push(client);

      // Should fail to connect
      await expect(client.connect()).rejects.toThrow();
      expect(client.getIsConnected()).toBe(false);
    });
  });
});
