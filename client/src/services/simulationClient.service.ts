/**
 * Simulation Client Service
 * 
 * Creates fake GPS data for testing and development
 * Simulates multiple race participants with realistic movement patterns
 */

import { PositionData, SimulationConfig } from './gpsTracking.service';

export interface SimulationClientConfig {
  // Client identification
  clientId: string;
  clientName: string;
  sessionId: string;
  
  // Simulation behavior
  routeType: 'circular' | 'linear' | 'figure8' | 'custom' | 'random' | 'spline';
  centerLat: number;
  centerLng: number;
  radius: number; // in meters
  speed: number; // in km/h
  updateInterval: number; // in milliseconds
  
  // Realism settings
  accuracyVariation: number;
  signalLoss: boolean;
  drift: boolean;
  speedVariation: number; // Speed variation percentage
  
  // Advanced GPS simulation
  satelliteCount: number;
  hdopRange: [number, number];
  vdopRange: [number, number];
  
  // Custom route (for 'custom' route type)
  customWaypoints?: Array<{ lat: number; lng: number; speed?: number }>;
  
  // Callbacks
  onPositionUpdate?: (clientId: string, position: PositionData) => void;
  onError?: (clientId: string, error: Error) => void;
}

export interface RaceSimulationConfig {
  raceId: string;
  trackCenter: { lat: number; lng: number };
  trackRadius: number;
  participants: Array<{
    id: string;
    name: string;
    skill: 'beginner' | 'intermediate' | 'expert';
    vehicle: 'car' | 'motorcycle' | 'truck';
    startingPosition: number; // 0-1, position around track
  }>;
  raceDuration: number; // in seconds
}

export class SimulationClient {
  private config: SimulationClientConfig;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private currentTime = 0;
  private currentAngle = 0;
  private currentWaypointIndex = 0;
  private accumulatedDistance = 0;
  
  // Movement state
  private currentLat: number;
  private currentLng: number;
  private currentSpeed: number;
  private currentHeading: number;
  
  // Performance tracking
  private positionCount = 0;
  private lastUpdateTime = 0;

  constructor(config: SimulationClientConfig) {
    this.config = config;
    this.currentLat = config.centerLat;
    this.currentLng = config.centerLng;
    this.currentSpeed = config.speed;
    this.currentHeading = 0;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.isRunning) {
      console.warn(`Simulation client ${this.config.clientId} is already running`);
      return;
    }

    this.isRunning = true;
    this.currentTime = 0;
    this.currentAngle = this.config.startingPosition ? this.config.startingPosition * Math.PI * 2 : 0;
    this.positionCount = 0;
    this.lastUpdateTime = Date.now();

    console.log(`Starting simulation client: ${this.config.clientName} (${this.config.clientId})`);

    this.intervalId = setInterval(() => {
      this.updatePosition();
      this.currentTime += this.config.updateInterval / 1000;
    }, this.config.updateInterval);
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log(`Stopped simulation client: ${this.config.clientName} (${this.config.clientId})`);
  }

  /**
   * Get current simulation status
   */
  getStatus(): { isRunning: boolean; positionCount: number; uptime: number } {
    return {
      isRunning: this.isRunning,
      positionCount: this.positionCount,
      uptime: this.currentTime
    };
  }

  /**
   * Update position based on simulation type
   */
  private updatePosition(): void {
    const { routeType, centerLat, centerLng, radius, speed, speedVariation, drift, signalLoss } = this.config;
    
    // Apply speed variation
    const speedMultiplier = speedVariation > 0 ? 
      1 + (Math.random() - 0.5) * (speedVariation / 100) : 1;
    const actualSpeed = speed * speedMultiplier;

    let newLat: number, newLng: number, newHeading: number;

    switch (routeType) {
      case 'circular':
        newHeading = (this.currentAngle * 180 / Math.PI) % 360;
        newLat = centerLat + (radius / 111320) * Math.cos(this.currentAngle);
        newLng = centerLng + (radius / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(this.currentAngle);
        this.currentAngle += (actualSpeed / 3.6) / radius * (this.config.updateInterval / 1000);
        break;

      case 'figure8':
        const t = this.currentAngle;
        newLat = centerLat + (radius / 111320) * Math.sin(t);
        newLng = centerLng + (radius / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(2 * t) / 2;
        newHeading = Math.atan2(Math.cos(t), Math.cos(2 * t) / 2) * 180 / Math.PI;
        this.currentAngle += (actualSpeed / 3.6) / radius * (this.config.updateInterval / 1000);
        break;

      case 'linear':
        const distance = (actualSpeed / 3.6) * (this.config.updateInterval / 1000);
        newLat = this.currentLat + (distance / 111320);
        newLng = this.currentLng + (distance / (111320 * Math.cos(this.currentLat * Math.PI / 180))) * 0.1;
        newHeading = 45;
        break;

      case 'random':
        const randomDistance = (actualSpeed / 3.6) * (this.config.updateInterval / 1000);
        const randomAngle = this.currentHeading + (Math.random() - 0.5) * 30; // ±15 degrees
        newLat = this.currentLat + (randomDistance / 111320) * Math.cos(randomAngle * Math.PI / 180);
        newLng = this.currentLng + (randomDistance / (111320 * Math.cos(this.currentLat * Math.PI / 180))) * Math.sin(randomAngle * Math.PI / 180);
        newHeading = randomAngle % 360;
        break;

      case 'spline':
        // Smooth spline-like movement
        const splineProgress = (this.currentTime % 10) / 10; // 10-second loop
        const splineX = Math.sin(splineProgress * Math.PI * 2);
        const splineY = Math.sin(splineProgress * Math.PI * 4);
        newLat = centerLat + (radius / 111320) * splineX;
        newLng = centerLng + (radius / (111320 * Math.cos(centerLat * Math.PI / 180))) * splineY;
        newHeading = Math.atan2(splineY, splineX) * 180 / Math.PI;
        break;

      case 'custom':
        if (this.config.customWaypoints && this.config.customWaypoints.length > 0) {
          const waypoint = this.config.customWaypoints[this.currentWaypointIndex];
          const targetLat = waypoint.lat;
          const targetLng = waypoint.lng;
          const targetSpeed = waypoint.speed || actualSpeed;
          
          // Calculate bearing to waypoint
          const dLat = (targetLat - this.currentLat) * Math.PI / 180;
          const dLng = (targetLng - this.currentLng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(this.currentLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = 6371e3 * c; // Distance in meters
          
          if (distance < 10) { // Reached waypoint
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.config.customWaypoints.length;
          } else {
            // Move towards waypoint
            const moveDistance = (targetSpeed / 3.6) * (this.config.updateInterval / 1000);
            const ratio = Math.min(moveDistance / distance, 1);
            newLat = this.currentLat + (targetLat - this.currentLat) * ratio;
            newLng = this.currentLng + (targetLng - this.currentLng) * ratio;
            newHeading = Math.atan2(dLng, dLat) * 180 / Math.PI;
          }
        } else {
          newLat = this.currentLat;
          newLng = this.currentLng;
          newHeading = this.currentHeading;
        }
        break;

      default:
        newLat = this.currentLat;
        newLng = this.currentLng;
        newHeading = this.currentHeading;
    }

    // Apply drift if enabled
    if (drift) {
      newLat += (Math.random() - 0.5) * 0.00001;
      newLng += (Math.random() - 0.5) * 0.00001;
    }

    // Simulate signal loss
    if (signalLoss && Math.random() < 0.005) { // 0.5% chance of signal loss
      if (this.config.onError) {
        this.config.onError(this.config.clientId, new Error('GPS signal lost'));
      }
      return;
    }

    this.currentLat = newLat;
    this.currentLng = newLng;
    this.currentSpeed = actualSpeed;
    this.currentHeading = newHeading;
    this.positionCount++;

    const position = this.createPositionData();
    
    if (this.config.onPositionUpdate) {
      this.config.onPositionUpdate(this.config.clientId, position);
    }
  }

  /**
   * Create position data object
   */
  private createPositionData(): PositionData {
    const accuracy = 3 + Math.random() * this.config.accuracyVariation;
    const quality = this.determineQuality(accuracy);

    return {
      lat: this.currentLat,
      lng: this.currentLng,
      speed: this.currentSpeed,
      heading: this.currentHeading,
      accuracy,
      timestamp: Date.now(),
      sessionId: this.config.sessionId,
      deviceId: this.config.clientId,
      source: 'simulation',
      quality,
      satelliteCount: this.config.satelliteCount + Math.floor(Math.random() * 4),
      hdop: this.config.hdopRange[0] + Math.random() * (this.config.hdopRange[1] - this.config.hdopRange[0]),
      vdop: this.config.vdopRange[0] + Math.random() * (this.config.vdopRange[1] - this.config.vdopRange[0]),
    };
  }

  /**
   * Determine GPS quality based on accuracy
   */
  private determineQuality(accuracy: number): 'high' | 'medium' | 'low' {
    if (accuracy < 5) return 'high';
    if (accuracy < 15) return 'medium';
    return 'low';
  }
}

/**
 * Multi-Client Race Simulation Manager
 */
export class RaceSimulationManager {
  private clients: Map<string, SimulationClient> = new Map();
  private isRunning = false;
  private raceConfig?: RaceSimulationConfig;

  constructor() {}

  /**
   * Start a race simulation with multiple participants
   */
  startRaceSimulation(config: RaceSimulationConfig): void {
    this.raceConfig = config;
    this.clients.clear();

    console.log(`Starting race simulation: ${config.raceId} with ${config.participants.length} participants`);

    config.participants.forEach((participant, index) => {
      const clientConfig = this.createClientConfig(participant, config, index);
      const client = new SimulationClient(clientConfig);
      
      client.start();
      this.clients.set(participant.id, client);
    });

    this.isRunning = true;
  }

  /**
   * Stop the race simulation
   */
  stopRaceSimulation(): void {
    this.clients.forEach(client => client.stop());
    this.clients.clear();
    this.isRunning = false;
    console.log('Race simulation stopped');
  }

  /**
   * Get simulation status
   */
  getSimulationStatus(): { isRunning: boolean; participants: Array<{ id: string; name: string; status: any }> } {
    const participants = Array.from(this.clients.entries()).map(([id, client]) => ({
      id,
      name: client['config']?.clientName || id,
      status: client.getStatus()
    }));

    return {
      isRunning: this.isRunning,
      participants
    };
  }

  /**
   * Create client configuration for a participant
   */
  private createClientConfig(participant: any, raceConfig: RaceSimulationConfig, index: number): SimulationClientConfig {
    // Adjust speed based on skill and vehicle
    const baseSpeed = this.getBaseSpeed(participant.vehicle, participant.skill);
    const speedVariation = participant.skill === 'expert' ? 5 : participant.skill === 'intermediate' ? 15 : 25;

    return {
      clientId: participant.id,
      clientName: participant.name,
      sessionId: raceConfig.raceId,
      routeType: 'circular',
      centerLat: raceConfig.trackCenter.lat,
      centerLng: raceConfig.trackCenter.lng,
      radius: raceConfig.trackRadius,
      speed: baseSpeed,
      updateInterval: 1000,
      accuracyVariation: 3,
      signalLoss: true,
      drift: participant.skill !== 'expert',
      speedVariation,
      satelliteCount: participant.skill === 'expert' ? 12 : participant.skill === 'intermediate' ? 9 : 6,
      hdopRange: participant.skill === 'expert' ? [0.8, 1.5] : [1.2, 2.5],
      vdopRange: participant.skill === 'expert' ? [1.0, 1.8] : [1.5, 3.0],
    };
  }

  /**
   * Get base speed based on vehicle and skill
   */
  private getBaseSpeed(vehicle: string, skill: string): number {
    const vehicleMultipliers = {
      car: 1.0,
      motorcycle: 1.2,
      truck: 0.8
    };

    const skillMultipliers = {
      beginner: 0.7,
      intermediate: 0.85,
      expert: 1.0
    };

    const baseSpeed = 80; // km/h
    return baseSpeed * (vehicleMultipliers[vehicle] || 1.0) * (skillMultipliers[skill] || 1.0);
  }
}

// Singleton instance
let simulationManager: RaceSimulationManager | null = null;

export function getSimulationManager(): RaceSimulationManager {
  if (!simulationManager) {
    simulationManager = new RaceSimulationManager();
  }
  return simulationManager;
}
