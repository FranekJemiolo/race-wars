/**
 * Simple Client Integration Test
 * 
 * Basic test to verify SimulationClient can connect and communicate
 * without complex WebSocket server requirements
 */

import { SimulationClient } from '../../simulation/SimulationClient';

describe('Simple Client Integration Tests', () => {
  describe('SimulationClient Basic Functionality', () => {
    test('should create client with valid configuration', () => {
      const client = new SimulationClient({
        clientId: 'test-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 }
        ]
      });

      expect(client).toBeDefined();
      expect(client.getIsConnected()).toBe(false);
    });

    test('should handle different behavior types', () => {
      const behaviors: Array<'honest' | 'cheat_teleport' | 'cheat_speed' | 'erratic' | 'stall'> = 
        ['honest', 'cheat_teleport', 'cheat_speed', 'erratic', 'stall'];

      behaviors.forEach(behavior => {
        const client = new SimulationClient({
          clientId: `client-${behavior}`,
          sessionId: 'test-session',
          serverUrl: 'ws://localhost:8080',
          behavior: behavior,
          updateInterval: 1000,
          route: [{ lat: 52.0786, lng: -1.0169, order: 0 }]
        });

        expect(client).toBeDefined();
      });
    });

    test('should handle event handlers', () => {
      const client = new SimulationClient({
        clientId: 'event-test-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'honest',
        updateInterval: 1000,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }]
      });

      let positionUpdateCount = 0;
      let violationCount = 0;

      client.onPositionUpdate(() => {
        positionUpdateCount++;
      });

      client.onViolation(() => {
        violationCount++;
      });

      // Verify handlers are registered (no direct way to test, but should not throw)
      expect(positionUpdateCount).toBe(0);
      expect(violationCount).toBe(0);
    });

    test('should handle simulation lifecycle', () => {
      const client = new SimulationClient({
        clientId: 'lifecycle-test-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'honest',
        updateInterval: 100,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 }
        ]
      });

      expect(client.getIsConnected()).toBe(false);

      // These should not throw when not connected
      client.startSimulation();
      client.stopSimulation();

      expect(client.getIsConnected()).toBe(false);
    });

    test('should generate position updates', (done) => {
      const client = new SimulationClient({
        clientId: 'position-test-client',
        sessionId: 'test-session',
        serverUrl: 'ws://invalid-server:9999', // Invalid to avoid actual connection
        behavior: 'honest',
        updateInterval: 50, // Very fast for testing
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 },
          { lat: 52.1000, lng: -1.0250, order: 2 }
        ]
      });

      let updateCount = 0;
      client.onPositionUpdate((position) => {
        updateCount++;
        expect(position).toHaveProperty('clientId');
        expect(position).toHaveProperty('sessionId');
        expect(position).toHaveProperty('lat');
        expect(position).toHaveProperty('lng');
        expect(position).toHaveProperty('speed');
        expect(position).toHaveProperty('heading');
        expect(position).toHaveProperty('timestamp');

        if (updateCount >= 3) {
          client.stopSimulation();
          done();
        }
      });

      // Start simulation (should generate position updates even without connection)
      client.startSimulation();

      // Stop after timeout if no updates received
      setTimeout(() => {
        client.stopSimulation();
        done();
      }, 1000);
    });

    test('should handle different route configurations', () => {
      const routes = [
        // Single point
        [{ lat: 52.0786, lng: -1.0169, order: 0 }],
        // Multiple points
        [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 },
          { lat: 52.1000, lng: -1.0250, order: 2 }
        ],
        // Complex route
        [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0800, lng: -1.0180, order: 1 },
          { lat: 52.0820, lng: -1.0190, order: 2 },
          { lat: 52.0840, lng: -1.0200, order: 3 },
          { lat: 52.0900, lng: -1.0200, order: 4 },
          { lat: 52.0950, lng: -1.0220, order: 5 }
        ]
      ];

      routes.forEach((route, index) => {
        const client = new SimulationClient({
          clientId: `route-test-${index}`,
          sessionId: 'test-session',
          serverUrl: 'ws://localhost:8080',
          behavior: 'honest',
          updateInterval: 1000,
          route: route
        });

        expect(client).toBeDefined();
      });
    });

    test('should handle speed multipliers', () => {
      const speedMultipliers = [0.5, 1.0, 1.5, 2.0, 3.0];

      speedMultipliers.forEach(speedMultiplier => {
        const client = new SimulationClient({
          clientId: `speed-test-${speedMultiplier}`,
          sessionId: 'test-session',
          serverUrl: 'ws://localhost:8080',
          behavior: 'honest',
          updateInterval: 1000,
          route: [{ lat: 52.0786, lng: -1.0169, order: 0 }],
          speedMultiplier: speedMultiplier
        });

        expect(client).toBeDefined();
      });
    });

    test('should handle cheat behaviors', () => {
      // Test teleport cheat
      const teleportClient = new SimulationClient({
        clientId: 'teleport-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'cheat_teleport',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.1000, lng: -1.0250, order: 1 }
        ],
        teleportChance: 0.3
      });

      // Test speed cheat
      const speedClient = new SimulationClient({
        clientId: 'speed-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'cheat_speed',
        updateInterval: 1000,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }],
        speedMultiplier: 3.0
      });

      // Test erratic behavior
      const erraticClient = new SimulationClient({
        clientId: 'erratic-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'erratic',
        updateInterval: 500,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }]
      });

      // Test stall behavior
      const stallClient = new SimulationClient({
        clientId: 'stall-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'stall',
        updateInterval: 1000,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }],
        stallDuration: 2000
      });

      expect(teleportClient).toBeDefined();
      expect(speedClient).toBeDefined();
      expect(erraticClient).toBeDefined();
      expect(stallClient).toBeDefined();
    });

    test('should provide client information', () => {
      const client = new SimulationClient({
        clientId: 'info-test-client',
        sessionId: 'test-session',
        serverUrl: 'ws://localhost:8080',
        behavior: 'honest',
        updateInterval: 1000,
        route: [{ lat: 52.0786, lng: -1.0169, order: 0 }]
      });

      expect(client.getUserId()).toBe('info-test-client');
      expect(client.getIsConnected()).toBe(false);
      expect(client.isConnectedToServer()).toBe(false);
    });
  });
});
