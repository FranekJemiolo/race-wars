/**
 * Mock WebSocket Server for Integration Tests
 * 
 * Provides a mock WebSocket server that simulates the real race server
 * for testing multi-client simulations and integration workflows
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface MockClient {
  id: string;
  ws: WebSocket;
  sessionId: string;
  connectedAt: Date;
  lastPosition?: any;
}

export interface PositionUpdate {
  clientId: string;
  sessionId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: number;
}

export class MockWebSocketServer extends EventEmitter {
  private wss: WebSocket.Server;
  private clients: Map<string, MockClient> = new Map();
  private sessions: Map<string, Set<string>> = new Map();
  private port: number;
  private isRunning = false;

  constructor(port: number = 8081) {
    super();
    this.port = port;
    this.wss = new WebSocket.Server({ port: this.port });
    this.setupServer();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      // Handle upgrade request for WebSocket
      console.log('Mock server: New connection request');
      
      const clientId = this.extractClientId(req.url);
      const sessionId = this.extractSessionId(req.url);
      
      console.log(`Mock server: Extracted clientId: ${clientId}, sessionId: ${sessionId}`);
      
      if (!clientId || !sessionId) {
        console.log('Mock server: Missing client or session ID, closing connection');
        ws.close(1008, 'Missing client or session ID');
        return;
      }

      const client: MockClient = {
        id: clientId,
        ws,
        sessionId,
        connectedAt: new Date()
      };

      this.clients.set(clientId, client);
      
      // Add client to session
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, new Set());
      }
      this.sessions.get(sessionId)!.add(clientId);

      console.log(`Mock server: Client ${clientId} connected to session ${sessionId}`);

      ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(clientId, data.toString());
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`Mock server: Client ${clientId} error:`, error);
        this.handleDisconnect(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        clientId,
        sessionId,
        timestamp: Date.now()
      });
    });

    this.wss.on('error', (error) => {
      console.error('Mock WebSocket server error:', error);
    });
  }

  private extractClientId(url?: string): string | null {
    if (!url) return null;
    const params = new URLSearchParams(url.split('?')[1] || '');
    return params.get('clientId');
  }

  private extractSessionId(url?: string): string | null {
    if (!url) return null;
    const params = new URLSearchParams(url.split('?')[1] || '');
    return params.get('sessionId');
  }

  private handleMessage(clientId: string, message: string): void {
    try {
      const data = JSON.parse(message);
      const client = this.clients.get(clientId);
      
      if (!client) return;

      switch (data.type) {
        case 'join_session':
          this.handleJoinSession(clientId, data);
          break;
        case 'position_update':
          this.handlePositionUpdate(clientId, data);
          break;
        case 'leave_session':
          this.handleLeaveSession(clientId);
          break;
        default:
          console.log(`Mock server: Unknown message type ${data.type} from ${clientId}`);
      }
    } catch (error) {
      console.error(`Mock server: Error parsing message from ${clientId}:`, error);
    }
  }

  private handleJoinSession(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Update session if different
    if (data.sessionId && data.sessionId !== client.sessionId) {
      // Remove from old session
      const oldSession = this.sessions.get(client.sessionId);
      if (oldSession) {
        oldSession.delete(clientId);
      }

      // Add to new session
      client.sessionId = data.sessionId;
      if (!this.sessions.has(data.sessionId)) {
        this.sessions.set(data.sessionId, new Set());
      }
      this.sessions.get(data.sessionId)!.add(clientId);
    }

    this.sendToClient(clientId, {
      type: 'session_joined',
      sessionId: client.sessionId,
      timestamp: Date.now()
    });

    // Start session simulation
    setTimeout(() => {
      this.sendToClient(clientId, {
        type: 'session_started',
        sessionId: client.sessionId,
        timestamp: Date.now()
      });
    }, 1000);
  }

  private handlePositionUpdate(clientId: string, data: PositionUpdate): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastPosition = data;

    // Broadcast to other clients in the same session
    this.broadcastToSession(client.sessionId, {
      type: 'position_broadcast',
      clientId,
      position: data,
      timestamp: Date.now()
    }, clientId);

    // Emit for test listeners
    this.emit('position_update', {
      clientId,
      sessionId: client.sessionId,
      position: data
    });
  }

  private handleLeaveSession(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from session
    const session = this.sessions.get(client.sessionId);
    if (session) {
      session.delete(clientId);
    }

    this.sendToClient(clientId, {
      type: 'session_left',
      sessionId: client.sessionId,
      timestamp: Date.now()
    });
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from session
    const session = this.sessions.get(client.sessionId);
    if (session) {
      session.delete(clientId);
    }

    this.clients.delete(clientId);
    console.log(`Mock server: Client ${clientId} disconnected`);
  }

  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Mock server: Error sending to ${clientId}:`, error);
    }
  }

  private broadcastToSession(sessionId: string, message: any, excludeClientId?: string): void {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return;

    sessionClients.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  // Public methods for test control
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log(`Mock WebSocket server started on port ${this.port}`);
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning) {
        resolve();
        return;
      }

      // Close all client connections
      this.clients.forEach(client => {
        client.ws.close();
      });

      // Close server
      this.wss.close(() => {
        this.isRunning = false;
        console.log('Mock WebSocket server stopped');
        resolve();
      });
    });
  }

  public getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  public getSessionClients(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session ? Array.from(session) : [];
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public getSessionCount(): number {
    return this.sessions.size;
  }

  public simulateViolation(clientId: string, violationType: string): void {
    this.sendToClient(clientId, {
      type: 'violation_detected',
      clientId,
      violationType,
      reason: `Simulated ${violationType} violation`,
      timestamp: Date.now()
    });
  }

  public simulateFlagChange(sessionId: string, sector: string, flag: string): void {
    this.broadcastToSession(sessionId, {
      type: 'flag_change',
      sector,
      flag,
      timestamp: Date.now()
    });
  }

  public simulateSafetyCar(sessionId: string, deployed: boolean): void {
    this.broadcastToSession(sessionId, {
      type: 'safety_car',
      deployed,
      timestamp: Date.now()
    });
  }

  public getClientPosition(clientId: string): PositionUpdate | undefined {
    const client = this.clients.get(clientId);
    return client?.lastPosition;
  }

  public getServerUrl(): string {
    return `ws://localhost:${this.port}`;
  }
}

// Singleton instance for tests
let mockServerInstance: MockWebSocketServer | null = null;

export function getMockWebSocketServer(port?: number): MockWebSocketServer {
  if (!mockServerInstance) {
    mockServerInstance = new MockWebSocketServer(port);
  }
  return mockServerInstance;
}

export function resetMockWebSocketServer(): void {
  if (mockServerInstance) {
    mockServerInstance.stop().then(() => {
      mockServerInstance = null;
    });
  }
}
