import WebSocket from 'ws';

export interface SimulationConfig {
  clientId: string;
  sessionId: string;
  serverUrl: string;
  behavior: 'honest' | 'cheat_teleport' | 'cheat_speed' | 'erratic' | 'stall';
  updateInterval: number;
  route?: RoutePoint[];
  speedMultiplier?: number;
  teleportChance?: number;
  stallDuration?: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  order: number;
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

export class SimulationClient {
  private config: SimulationConfig;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private currentPositionIndex = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private currentSpeed = 0;
  private currentHeading = 0;
  private isStalled = false;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.config.serverUrl);

      this.ws.on('open', () => {
        console.log(`Client ${this.config.clientId} connected`);
        this.isConnected = true;
        this.sendJoinMessage();
        resolve();
      });

      this.ws.on('error', (error) => {
        console.error(`Client ${this.config.clientId} error:`, error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(`Client ${this.config.clientId} disconnected`);
        this.isConnected = false;
        this.stop();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data.toString());
      });
    });
  }

  private sendJoinMessage(): void {
    if (!this.ws) return;

    const message = {
      type: 'join_session',
      sessionId: this.config.sessionId,
      clientId: this.config.clientId,
    };

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'session_started':
          console.log(`Client ${this.config.clientId}: Session started`);
          this.startSimulation();
          break;
        case 'session_paused':
          console.log(`Client ${this.config.clientId}: Session paused`);
          this.stop();
          break;
        case 'session_ended':
          console.log(`Client ${this.config.clientId}: Session ended`);
          this.stop();
          break;
        case 'incident_detected':
          console.log(`Client ${this.config.clientId}: Incident detected - ${message.incidentType}`);
          break;
      }
    } catch (error) {
      console.error(`Client ${this.config.clientId}: Error parsing message`, error);
    }
  }

  startSimulation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.sendPositionUpdate();
    }, this.config.updateInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private sendPositionUpdate(): void {
    if (!this.ws || !this.isConnected) return;

    const position = this.calculateNextPosition();
    const update: PositionUpdate = {
      clientId: this.config.clientId,
      sessionId: this.config.sessionId,
      lat: position.lat,
      lng: position.lng,
      speed: position.speed,
      heading: position.heading,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify({
      type: 'position_update',
      data: update,
    }));
  }

  private calculateNextPosition(): { lat: number; lng: number; speed: number; heading: number } {
    if (!this.config.route || this.config.route.length === 0) {
      return this.generateRandomPosition();
    }

    // Handle stall behavior
    if (this.config.behavior === 'stall' && this.isStalled) {
      return {
        lat: this.config.route[this.currentPositionIndex].lat,
        lng: this.config.route[this.currentPositionIndex].lng,
        speed: 0,
        heading: this.currentHeading,
      };
    }

    // Move to next point in route
    const currentPoint = this.config.route[this.currentPositionIndex];
    const nextIndex = (this.currentPositionIndex + 1) % this.config.route.length;
    const nextPoint = this.config.route[nextIndex];

    // Calculate heading
    this.currentHeading = this.calculateHeading(currentPoint, nextPoint);

    // Calculate speed based on behavior
    let speed = this.calculateSpeed(currentPoint, nextPoint);

    // Apply behavior modifications
    const modifiedPosition = this.applyBehavior(currentPoint, nextPoint, speed);

    this.currentPositionIndex = nextIndex;
    this.currentSpeed = modifiedPosition.speed;

    return modifiedPosition;
  }

  private applyBehavior(
    currentPoint: RoutePoint,
    nextPoint: RoutePoint,
    baseSpeed: number,
  ): { lat: number; lng: number; speed: number; heading: number } {
    let lat = nextPoint.lat;
    let lng = nextPoint.lng;
    let speed = baseSpeed;
    let heading = this.currentHeading;

    switch (this.config.behavior) {
      case 'honest':
        // No modifications
        break;

      case 'cheat_teleport':
        // Randomly teleport to a different position
        if (Math.random() < (this.config.teleportChance || 0.1)) {
          const teleportOffset = 0.001;
          lat += (Math.random() - 0.5) * teleportOffset;
          lng += (Math.random() - 0.5) * teleportOffset;
          console.log(`Client ${this.config.clientId}: Teleporting!`);
        }
        break;

      case 'cheat_speed':
        // Artificially increase speed
        speed *= this.config.speedMultiplier || 2;
        break;

      case 'erratic':
        // Add random jitter to position
        const jitter = 0.0001;
        lat += (Math.random() - 0.5) * jitter;
        lng += (Math.random() - 0.5) * jitter;
        heading += (Math.random() - 0.5) * 30;
        break;

      case 'stall':
        // Randomly stall
        if (!this.isStalled && Math.random() < 0.05) {
          this.isStalled = true;
          setTimeout(() => {
            this.isStalled = false;
          }, this.config.stallDuration || 5000);
          console.log(`Client ${this.config.clientId}: Stalling!`);
        }
        if (this.isStalled) {
          speed = 0;
        }
        break;
    }

    return { lat, lng, speed, heading };
  }

  private generateRandomPosition(): { lat: number; lng: number; speed: number; heading: number } {
    // Generate random position around a center point
    const centerLat = 37.7749;
    const centerLng = -122.4194;
    const offset = 0.01;

    return {
      lat: centerLat + (Math.random() - 0.5) * offset,
      lng: centerLng + (Math.random() - 0.5) * offset,
      speed: Math.random() * 100,
      heading: Math.random() * 360,
    };
  }

  private calculateSpeed(point1: RoutePoint, point2: RoutePoint): number {
    const distance = this.calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng);
    const time = this.config.updateInterval / 1000; // Convert to seconds
    return (distance / time) * 3.6; // Convert to km/h
  }

  private calculateHeading(point1: RoutePoint, point2: RoutePoint): number {
    const lat1 = (point1.lat * Math.PI) / 180;
    const lat2 = (point2.lat * Math.PI) / 180;
    const lng1 = (point1.lng * Math.PI) / 180;
    const lng2 = (point2.lng * Math.PI) / 180;

    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  disconnect(): void {
    this.stop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }
}
