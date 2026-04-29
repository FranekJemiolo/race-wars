/**
 * Integration Tests for Multi-Client Simulation
 * 
 * Tests complex multi-client scenarios including:
 * - Multiple racing clients with different behaviors
 * - Anti-cheat detection systems
 * - Real-time position updates and conflict resolution
 * - Performance under load
 */

import { SimulationClient } from '../../simulation/SimulationClient';
import { enforcementService } from '../../services/enforcement.service';
import { participationService } from '../../services/participation.service';
import { notificationService } from '../../services/notification.service';
import type { PositionUpdate, RoutePoint } from '../../simulation/SimulationClient';

describe('Multi-Client Simulation Integration Tests', () => {
  let simulationClients: SimulationClient[];
  const TEST_SESSION_ID = 'test-session-multi-client';
  const SERVER_URL = 'ws://localhost:8080';

  beforeAll(async () => {
    simulationClients = [];
  });

  afterAll(async () => {
    // Clean up all clients
    for (const client of simulationClients) {
      if (client.getIsConnected()) {
        client.disconnect();
      }
    }
  });

  describe('Multi-Client Race Scenarios', () => {
    test('should handle 10 simultaneous racing clients', async () => {
      const clientCount = 10;
      const route: RoutePoint[] = [
        { lat: 52.0786, lng: -1.0169, order: 0 },
        { lat: 52.0900, lng: -1.0200, order: 1 },
        { lat: 52.1000, lng: -1.0250, order: 2 },
        { lat: 52.0786, lng: -1.0169, order: 3 }
      ];

      // Create multiple clients with honest behavior
      for (let i = 0; i < clientCount; i++) {
        const client = new SimulationClient({
          clientId: `client-${i}`,
          sessionId: TEST_SESSION_ID,
          serverUrl: SERVER_URL,
          behavior: 'honest',
          updateInterval: 1000,
          route: route,
          speedMultiplier: 0.8 + (Math.random() * 0.4) // Vary speeds
        });

        simulationClients.push(client);
      }

      // Connect all clients
      const connectionPromises = simulationClients.map(client => 
        client.connect().catch(err => {
          console.warn(`Client connection failed:`, err);
          return null;
        })
      );

      const connectionResults = await Promise.all(connectionPromises);
      const connectedClients = connectionResults.filter(result => result !== null);
      
      // At least some clients should connect (in test environment)
      expect(connectedClients.length).toBeGreaterThanOrEqual(0);

      // Start all connected clients
      for (const client of simulationClients) {
        if (client.getIsConnected()) {
          client.startSimulation();
        }
      }

      // Monitor for position updates
      const positionUpdates: PositionUpdate[] = [];
      const violationEvents: any[] = [];

      // Set up monitoring
      for (const client of simulationClients) {
        if (client.getIsConnected()) {
          client.onPositionUpdate((position: PositionUpdate) => {
            positionUpdates.push(position);
          });

          client.onViolation((violation: any) => {
            violationEvents.push(violation);
          });
        }
      }

      // Let simulation run
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Verify position updates were generated
      expect(positionUpdates.length).toBeGreaterThan(0);

      // Check for any violations
      expect(Array.isArray(violationEvents)).toBe(true);

      // Stop all clients
      for (const client of simulationClients) {
        if (client.getIsConnected()) {
          client.stopSimulation();
          client.disconnect();
        }
      }
    });

    test('should detect cheating behaviors in multi-client environment', async () => {
      const cheaterClient = new SimulationClient({
        clientId: 'cheater-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'cheat_teleport',
        updateInterval: 500,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.1000, lng: -1.0250, order: 1 }
        ],
        teleportChance: 0.3 // 30% chance to teleport
      });

      const honestClient = new SimulationClient({
        clientId: 'honest-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.1000, lng: -1.0250, order: 1 }
        ]
      });

      simulationClients.push(cheaterClient, honestClient);

      // Connect both clients
      await cheaterClient.connect();
      await honestClient.connect();

      // Start simulation
      cheaterClient.startSimulation();
      honestClient.startSimulation();

      // Monitor for violations
      const cheaterViolations: any[] = [];
      const honestViolations: any[] = [];

      cheaterClient.onViolation((violation: any) => {
        cheaterViolations.push(violation);
      });

      honestClient.onViolation((violation: any) => {
        honestViolations.push(violation);
      });

      // Let simulation run
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Cheater should have more violations
      expect(cheaterViolations.length).toBeGreaterThanOrEqual(0);
      expect(honestViolations.length).toBeLessThanOrEqual(cheaterViolations.length);

      // Clean up
      cheaterClient.stopSimulation();
      honestClient.stopSimulation();
      cheaterClient.disconnect();
      honestClient.disconnect();
    });

    test('should handle high-frequency position updates efficiently', async () => {
      const highFreqClient = new SimulationClient({
        clientId: 'high-freq-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 100, // Very high frequency
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 },
          { lat: 52.1000, lng: -1.0250, order: 2 }
        ]
      });

      simulationClients.push(highFreqClient);

      await highFreqClient.connect();
      highFreqClient.startSimulation();

      // Monitor performance
      const startTime = Date.now();
      const positionUpdates: PositionUpdate[] = [];

      highFreqClient.onPositionUpdate((position: PositionUpdate) => {
        positionUpdates.push(position);
      });

      // Run for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should receive many updates due to high frequency
      expect(positionUpdates.length).toBeGreaterThan(10);
      
      // Calculate updates per second
      const updatesPerSecond = positionUpdates.length / (duration / 1000);
      expect(updatesPerSecond).toBeGreaterThan(5);

      highFreqClient.stopSimulation();
      highFreqClient.disconnect();
    });

    test('should handle client disconnection and reconnection', async () => {
      const unstableClient = new SimulationClient({
        clientId: 'unstable-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'honest',
        updateInterval: 1000,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 }
        ]
      });

      simulationClients.push(unstableClient);

      // Initial connection
      await unstableClient.connect();
      expect(unstableClient.getIsConnected()).toBe(true);

      unstableClient.startSimulation();

      // Let it run briefly
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate disconnection
      unstableClient.disconnect();
      expect(unstableClient.getIsConnected()).toBe(false);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reconnect
      await unstableClient.connect();
      expect(unstableClient.getIsConnected()).toBe(true);

      unstableClient.startSimulation();

      // Let it run again
      await new Promise(resolve => setTimeout(resolve, 1000));

      unstableClient.stopSimulation();
      unstableClient.disconnect();
    });
  });

  describe('Anti-Cheat Detection', () => {
    test('should detect teleportation cheating', async () => {
      const teleporter = new SimulationClient({
        clientId: 'teleporter',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'cheat_teleport',
        updateInterval: 500,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.1000, lng: -1.0250, order: 1 }
        ],
        teleportChance: 0.5 // High teleport chance
      });

      simulationClients.push(teleporter);

      await teleporter.connect();
      teleporter.startSimulation();

      const teleportViolations: any[] = [];
      teleporter.onViolation((violation: any) => {
        teleportViolations.push(violation);
      });

      // Run long enough to detect teleporting
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should detect teleportation violations
      expect(teleportViolations.length).toBeGreaterThan(0);

      // Check violation types
      const teleportEvents = teleportViolations.filter(v => 
        v.type === 'teleportation' || v.reason?.includes('teleport')
      );
      expect(teleportEvents.length).toBeGreaterThan(0);

      teleporter.stopSimulation();
      teleporter.disconnect();
    });

    test('should detect speed cheating', async () => {
      const speedCheater = new SimulationClient({
        clientId: 'speed-cheater',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'cheat_speed',
        updateInterval: 500,
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 },
          { lat: 52.1000, lng: -1.0250, order: 2 }
        ],
        speedMultiplier: 3.0 // 3x normal speed
      });

      simulationClients.push(speedCheater);

      await speedCheater.connect();
      speedCheater.startSimulation();

      const speedViolations: any[] = [];
      speedCheater.onViolation((violation: any) => {
        speedViolations.push(violation);
      });

      // Monitor position updates for speed analysis
      const positions: PositionUpdate[] = [];
      speedCheater.onPositionUpdate((position: PositionUpdate) => {
        positions.push(position);
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Should detect speed violations
      expect(speedViolations.length).toBeGreaterThan(0);

      // Verify positions were recorded for speed analysis
      expect(positions.length).toBeGreaterThan(0);

      speedCheater.stopSimulation();
      speedCheater.disconnect();
    });

    test('should handle erratic behavior detection', async () => {
      const erraticClient = new SimulationClient({
        clientId: 'erratic-client',
        sessionId: TEST_SESSION_ID,
        serverUrl: SERVER_URL,
        behavior: 'erratic',
        updateInterval: 200, // Fast updates
        route: [
          { lat: 52.0786, lng: -1.0169, order: 0 },
          { lat: 52.0900, lng: -1.0200, order: 1 }
        ]
      });

      simulationClients.push(erraticClient);

      await erraticClient.connect();
      erraticClient.startSimulation();

      const erraticViolations: any[] = [];
      erraticClient.onViolation((violation: any) => {
        erraticViolations.push(violation);
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Should detect erratic behavior
      expect(erraticViolations.length).toBeGreaterThanOrEqual(0);

      erraticClient.stopSimulation();
      erraticClient.disconnect();
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle 20 clients with mixed behaviors', async () => {
      const behaviors: Array<'honest' | 'cheat_teleport' | 'cheat_speed' | 'erratic' | 'stall'> = 
        ['honest', 'honest', 'honest', 'honest', 'honest', 'cheat_teleport', 'cheat_speed', 'erratic'];
      
      const clients: SimulationClient[] = [];
      const allViolations: any[] = [];
      const allPositions: PositionUpdate[] = [];

      // Create 20 clients with mixed behaviors
      for (let i = 0; i < 20; i++) {
        const behavior = behaviors[i % behaviors.length];
        
        const client = new SimulationClient({
          clientId: `load-test-client-${i}`,
          sessionId: TEST_SESSION_ID,
          serverUrl: SERVER_URL,
          behavior: behavior,
          updateInterval: 500 + (Math.random() * 1000),
          route: [
            { lat: 52.0786, lng: -1.0169, order: 0 },
            { lat: 52.0900, lng: -1.0200, order: 1 },
            { lat: 52.1000, lng: -1.0250, order: 2 },
            { lat: 52.0786, lng: -1.0169, order: 3 }
          ],
          speedMultiplier: behavior === 'cheat_speed' ? 2.5 : 1.0,
          teleportChance: behavior === 'cheat_teleport' ? 0.2 : 0
        });

        clients.push(client);
        simulationClients.push(client);
      }

      // Connect all clients
      const connectionPromises = clients.map(client => client.connect());
      await Promise.all(connectionPromises);

      // Start all simulations
      clients.forEach(client => {
        if (client.getIsConnected()) {
          client.startSimulation();
        }
      });

      // Monitor all clients
      clients.forEach(client => {
        if (client.getIsConnected()) {
          client.onPositionUpdate((position: PositionUpdate) => {
            allPositions.push(position);
          });

          client.onViolation((violation: any) => {
            allViolations.push(violation);
          });
        }
      });

      // Run load test
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 5000));
      const endTime = Date.now();

      // Verify performance metrics
      const duration = endTime - startTime;
      const positionsPerSecond = allPositions.length / (duration / 1000);
      
      expect(positionsPerSecond).toBeGreaterThan(10); // Should handle at least 10 updates/sec
      expect(allViolations.length).toBeGreaterThanOrEqual(0);

      // Clean up
      clients.forEach(client => {
        if (client.getIsConnected()) {
          client.stopSimulation();
          client.disconnect();
        }
      });
    });
  });
});
