/**
 * Map Updates Simulation Test
 * 
 * Tests real-time map updates, GPS tracking, and position broadcasting
 * with multiple simulation clients
 */

import { test, expect } from '@playwright/test';
import { WebSocket } from 'ws';

interface SimulationClient {
  id: string;
  name: string;
  ws: WebSocket;
  position: Position;
  connected: boolean;
}

interface Position {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: number;
}

interface MapUpdate {
  type: 'position_update' | 'checkpoint_reached' | 'sector_entered' | 'sector_exited';
  clientId: string;
  data: any;
  timestamp: number;
}

test.describe('Map Updates Simulation', () => {
  const BASE_URL = 'http://localhost';
  const WS_URL = 'ws://localhost/ws';
  const clients: SimulationClient[] = [];
  
  test.beforeEach(async () => {
    // Clear existing clients
    clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close();
      }
    });
    clients.length = 0;
  });

  test.afterEach(async () => {
    // Clean up clients
    clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close();
      }
    });
    clients.length = 0;
  });

  test('Multiple clients position broadcasting', async ({ page }) => {
    test.setTimeout(30000);
    
    // Create multiple simulation clients
    const clientCount = 5;
    const connectedClients: SimulationClient[] = [];
    
    for (let i = 0; i < clientCount; i++) {
      const client = await createSimulationClient(`client-${i}`, `Test Client ${i}`);
      if (client) {
        connectedClients.push(client);
      }
    }
    
    expect(connectedClients.length).toBe(clientCount);
    
    // Subscribe to position updates
    const updates: MapUpdate[] = [];
    
    connectedClients.forEach(client => {
      client.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'position_update') {
            updates.push({
              type: 'position_update',
              clientId: client.id,
              data: message.data,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.log('Invalid message format:', error);
        }
      });
    });
    
    // Start position broadcasting
    const raceTrack = generateRaceTrack();
    let updateCount = 0;
    
    const broadcastInterval = setInterval(() => {
      connectedClients.forEach((client, index) => {
        const newPosition = calculateNextPosition(client.position, raceTrack, index);
        client.position = newPosition;
        
        // Broadcast position update
        const updateMessage = {
          type: 'position_update',
          clientId: client.id,
          data: {
            position: newPosition,
            lap: Math.floor(updateCount / raceTrack.checkpoints.length) + 1,
            speed: newPosition.speed,
            heading: newPosition.heading
          },
          timestamp: Date.now()
        };
        
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(updateMessage));
        }
      });
      
      updateCount++;
      
      // Stop after 20 updates per client
      if (updateCount >= 20) {
        clearInterval(broadcastInterval);
      }
    }, 500); // Update every 500ms
    
    // Wait for broadcasting to complete
    await new Promise(resolve => setTimeout(resolve, 12000));
    
    // Verify position updates were received
    expect(updates.length).toBeGreaterThan(0);
    
    // Check that all clients received updates
    const clientIds = new Set(updates.map(u => u.clientId));
    expect(clientIds.size).toBe(clientCount);
    
    // Verify position data integrity
    updates.forEach(update => {
      expect(update.data.position).toHaveProperty('lat');
      expect(update.data.position).toHaveProperty('lng');
      expect(update.data.position).toHaveProperty('speed');
      expect(update.data.position).toHaveProperty('heading');
      expect(update.data.position.lat).toBeGreaterThanOrEqual(-90);
      expect(update.data.position.lat).toBeLessThanOrEqual(90);
      expect(update.data.position.lng).toBeGreaterThanOrEqual(-180);
      expect(update.data.position.lng).toBeLessThanOrEqual(180);
    });
    
    console.log(`✅ Position broadcasting test completed: ${updates.length} updates from ${clientCount} clients`);
  });

  test('Checkpoint detection and notifications', async ({ page }) => {
    test.setTimeout(25000);
    
    // Create a test client
    const client = await createSimulationClient('checkpoint-test', 'Checkpoint Test Client');
    expect(client).toBeTruthy();
    
    const checkpointEvents: any[] = [];
    
    // Listen for checkpoint events
    client.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'checkpoint_reached' || message.type === 'sector_update') {
          checkpointEvents.push(message);
        }
      } catch (error) {
        console.log('Invalid message format:', error);
      }
    });
    
    // Create a track with checkpoints
    const track = generateRaceTrack();
    
    // Move client through checkpoints
    for (let i = 0; i < track.checkpoints.length; i++) {
      const checkpoint = track.checkpoints[i];
      client.position = {
        lat: checkpoint.lat,
        lng: checkpoint.lng,
        speed: 50 + Math.random() * 30,
        heading: calculateHeading(client.position, track.checkpoints[(i + 1) % track.checkpoints.length]),
        timestamp: Date.now()
      };
      
      // Send position update
      const updateMessage = {
        type: 'position_update',
        clientId: client.id,
        data: {
          position: client.position,
          checkpointIndex: i,
          lap: 1
        },
        timestamp: Date.now()
      };
      
      client.ws.send(JSON.stringify(updateMessage));
      
      // Wait for checkpoint detection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Verify checkpoint events were generated
    expect(checkpointEvents.length).toBeGreaterThan(0);
    
    // Check checkpoint event structure
    checkpointEvents.forEach(event => {
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('clientId');
      expect(event).toHaveProperty('data');
      expect(event).toHaveProperty('timestamp');
    });
    
    console.log(`✅ Checkpoint detection test completed: ${checkpointEvents.length} checkpoint events`);
  });

  test('Real-time map synchronization', async ({ page }) => {
    test.setTimeout(20000);
    
    // Create multiple clients for synchronization test
    const clientCount = 3;
    const connectedClients: SimulationClient[] = [];
    const allPositions: { [clientId: string]: Position[] } = {};
    
    for (let i = 0; i < clientCount; i++) {
      const client = await createSimulationClient(`sync-test-${i}`, `Sync Test Client ${i}`);
      if (client) {
        connectedClients.push(client);
        allPositions[client.id] = [];
      }
    }
    
    expect(connectedClients.length).toBe(clientCount);
    
    // Set up position tracking
    connectedClients.forEach(client => {
      client.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'position_broadcast') {
            // This would be a broadcast from server with all client positions
            if (message.data.positions) {
              message.data.positions.forEach((pos: any) => {
                if (allPositions[pos.clientId]) {
                  allPositions[pos.clientId].push(pos.position);
                }
              });
            }
          }
        } catch (error) {
          console.log('Invalid message format:', error);
        }
      });
    });
    
    // Simulate synchronized movement
    const raceTrack = generateRaceTrack();
    const updateCount = 15;
    
    for (let i = 0; i < updateCount; i++) {
      connectedClients.forEach((client, index) => {
        const newPosition = calculateNextPosition(client.position, raceTrack, index);
        client.position = newPosition;
        
        const updateMessage = {
          type: 'position_update',
          clientId: client.id,
          data: {
            position: newPosition,
            syncIndex: i
          },
          timestamp: Date.now()
        };
        
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(updateMessage));
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Wait for final synchronization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify synchronization
    Object.keys(allPositions).forEach(clientId => {
      const positions = allPositions[clientId];
      expect(positions.length).toBeGreaterThan(0);
      
      // Check position continuity
      for (let i = 1; i < positions.length; i++) {
        const distance = calculateDistance(positions[i-1], positions[i]);
        expect(distance).toBeLessThan(1000); // Should be reasonable distance between updates
      }
    });
    
    console.log(`✅ Map synchronization test completed: ${clientCount} clients synchronized`);
  });

  /**
   * Helper function to create a simulation client
   */
  async function createSimulationClient(id: string, name: string): Promise<SimulationClient | null> {
    return new Promise((resolve) => {
      const ws = new WebSocket(WS_URL);
      
      ws.on('open', () => {
        const client: SimulationClient = {
          id,
          name,
          ws,
          position: {
            lat: 37.7749 + (Math.random() - 0.5) * 0.01,
            lng: -122.4194 + (Math.random() - 0.5) * 0.01,
            speed: 0,
            heading: Math.random() * 360,
            timestamp: Date.now()
          },
          connected: true
        };
        
        // Send client registration
        ws.send(JSON.stringify({
          type: 'client_register',
          clientId: id,
          clientName: name,
          timestamp: Date.now()
        }));
        
        clients.push(client);
        resolve(client);
      });
      
      ws.on('error', (error) => {
        console.log(`WebSocket error for client ${id}:`, error);
        resolve(null);
      });
      
      ws.on('close', () => {
        const client = clients.find(c => c.id === id);
        if (client) {
          client.connected = false;
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(null);
      }, 5000);
    });
  }

  /**
   * Generate a race track with checkpoints
   */
  function generateRaceTrack() {
    const centerLat = 37.7749;
    const centerLng = -122.4194;
    const radius = 0.005; // ~500m radius
    
    const checkpoints = [];
    const checkpointCount = 8;
    
    for (let i = 0; i < checkpointCount; i++) {
      const angle = (i / checkpointCount) * 2 * Math.PI;
      checkpoints.push({
        id: `checkpoint-${i}`,
        lat: centerLat + radius * Math.cos(angle),
        lng: centerLng + radius * Math.sin(angle),
        radius: 50 // 50m checkpoint radius
      });
    }
    
    return {
      id: 'test-track',
      name: 'Test Track',
      center: { lat: centerLat, lng: centerLng },
      radius,
      checkpoints
    };
  }

  /**
   * Calculate next position on track
   */
  function calculateNextPosition(current: Position, track: any, clientIndex: number): Position {
    const speed = 40 + Math.random() * 20; // 40-60 km/h
    const timeDelta = 0.5; // 500ms in seconds
    const distance = (speed * 1000 / 3600) * timeDelta; // Distance in meters
    
    // Simple circular motion around track
    const angle = (Date.now() / 10000 + clientIndex * 0.5) % (2 * Math.PI);
    const newLat = track.center.lat + (track.radius * Math.cos(angle)) * 0.001;
    const newLng = track.center.lng + (track.radius * Math.sin(angle)) * 0.001;
    
    const heading = calculateHeading(current, { lat: newLat, lng: newLng, speed, heading: 0, timestamp: Date.now() });
    
    return {
      lat: newLat,
      lng: newLng,
      speed,
      heading,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate heading between two positions
   */
  function calculateHeading(from: Position, to: Position): number {
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;
    return (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
  }

  /**
   * Calculate distance between two positions
   */
  function calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
});
