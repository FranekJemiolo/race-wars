/**
 * Incident Detection Service
 * 
 * Detects incidents based on GPS position data and vehicle behavior
 * - Off-track detection
 * - Crash detection (sudden deceleration, erratic movement)
 * - Spin detection
 * - Stall detection
 */

import { incidentRepository, type Incident, type CreateIncidentInput } from '../database/repositories/incident.repository';
import type { Position } from './enforcement.service';

export interface IncidentDetectionConfig {
  offTrackThreshold: number; // meters from track centerline
  offTrackMinDuration: number; // milliseconds
  crashDecelerationThreshold: number; // m/s²
  crashSpeedThreshold: number; // km/h
  spinHeadingChangeThreshold: number; // degrees
  spinMinDuration: number; // milliseconds
  stallSpeedThreshold: number; // km/h
  stallMinDuration: number; // milliseconds
  enableAutoReporting: boolean;
}

const DEFAULT_CONFIG: IncidentDetectionConfig = {
  offTrackThreshold: 50, // 50 meters from track
  offTrackMinDuration: 2000, // 2 seconds
  crashDecelerationThreshold: 15, // 15 m/s² (~1.5g)
  crashSpeedThreshold: 30, // 30 km/h
  spinHeadingChangeThreshold: 180, // 180 degrees
  spinMinDuration: 1000, // 1 second
  stallSpeedThreshold: 5, // 5 km/h
  stallMinDuration: 5000, // 5 seconds
  enableAutoReporting: true,
};

export interface VehicleState {
  sessionId: string;
  participantId: string;
  lastPosition?: Position;
  lastSpeed?: number;
  lastHeading?: number;
  lastTimestamp?: number;
  offTrackSince?: number;
  stallSince?: number;
  spinSince?: number;
  headingChanges: number[];
}

export class IncidentDetectionService {
  private config: IncidentDetectionConfig;
  private vehicleStates: Map<string, VehicleState> = new Map();
  private trackGeometries: Map<string, any> = new Map(); // sessionId -> track geometry

  constructor(config?: Partial<IncidentDetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process a position update and detect incidents
   */
  async processPositionUpdate(
    sessionId: string,
    participantId: string,
    position: Position,
    trackGeometry?: any
  ): Promise<Incident | null> {
    const stateKey = `${sessionId}:${participantId}`;
    let state = this.vehicleStates.get(stateKey);

    if (!state) {
      state = {
        sessionId,
        participantId,
        headingChanges: [],
      };
      this.vehicleStates.set(stateKey, state);
    }

    // Store track geometry if provided
    if (trackGeometry) {
      this.trackGeometries.set(sessionId, trackGeometry);
    }

    const detectedIncident = await this.detectIncidents(state, position);

    // Update state
    state.lastPosition = position;
    state.lastSpeed = position.speed || 0;
    state.lastHeading = position.heading || 0;
    state.lastTimestamp = position.timestamp || Date.now();

    return detectedIncident;
  }

  /**
   * Detect various types of incidents
   */
  private async detectIncidents(state: VehicleState, position: Position): Promise<Incident | null> {
    // Check for off-track
    const offTrackIncident = await this.detectOffTrack(state, position);
    if (offTrackIncident) return offTrackIncident;

    // Check for crash
    const crashIncident = await this.detectCrash(state, position);
    if (crashIncident) return crashIncident;

    // Check for spin
    const spinIncident = await this.detectSpin(state, position);
    if (spinIncident) return spinIncident;

    // Check for stall
    const stallIncident = await this.detectStall(state, position);
    if (stallIncident) return stallIncident;

    return null;
  }

  /**
   * Detect off-track incident
   */
  private async detectOffTrack(state: VehicleState, position: Position): Promise<Incident | null> {
    const trackGeometry = this.trackGeometries.get(state.sessionId);
    if (!trackGeometry) return null;

    // Calculate distance from track centerline
    const distanceFromTrack = this.calculateDistanceFromTrack(position, trackGeometry);

    if (distanceFromTrack > this.config.offTrackThreshold) {
      if (!state.offTrackSince) {
        state.offTrackSince = Date.now();
      } else if (Date.now() - state.offTrackSince > this.config.offTrackMinDuration) {
        // Off-track for too long, report incident
        const incident = await this.reportIncident({
          sessionId: state.sessionId,
          participantId: state.participantId,
          type: 'off_track',
          severity: this.determineOffTrackSeverity(distanceFromTrack),
          locationLat: position.lat,
          locationLng: position.lng,
          description: `Vehicle ${this.config.offTrackThreshold.toFixed(0)}m off track`,
          tags: ['auto-detected', 'off-track'],
          metadata: {
            distanceFromTrack,
            duration: Date.now() - state.offTrackSince,
          },
        });

        state.offTrackSince = undefined;
        return incident;
      }
    } else {
      state.offTrackSince = undefined;
    }

    return null;
  }

  /**
   * Detect crash incident
   */
  private async detectCrash(state: VehicleState, position: Position): Promise<Incident | null> {
    if (!state.lastPosition || !state.lastTimestamp) return null;

    const currentSpeed = position.speed || 0;
    const lastSpeed = state.lastSpeed || 0;
    const timeDiff = (position.timestamp || Date.now()) - state.lastTimestamp;

    if (timeDiff <= 0) return null;

    // Calculate deceleration
    const speedDiff = lastSpeed - currentSpeed; // km/h
    const deceleration = (speedDiff * 1000 / 3600) / (timeDiff / 1000); // m/s²

    // Check for crash conditions
    if (
      deceleration > this.config.crashDecelerationThreshold &&
      lastSpeed > this.config.crashSpeedThreshold
    ) {
      const incident = await this.reportIncident({
        sessionId: state.sessionId,
        participantId: state.participantId,
        type: 'crash',
        severity: this.determineCrashSeverity(deceleration, lastSpeed),
        locationLat: position.lat,
        locationLng: position.lng,
        description: `Sudden deceleration detected: ${deceleration.toFixed(1)} m/s²`,
        tags: ['auto-detected', 'crash'],
        metadata: {
          deceleration,
          speedBefore: lastSpeed,
          speedAfter: currentSpeed,
        },
      });

      return incident;
    }

    return null;
  }

  /**
   * Detect spin incident
   */
  private async detectSpin(state: VehicleState, position: Position): Promise<Incident | null> {
    if (!state.lastHeading) return null;

    const currentHeading = position.heading || 0;
    const lastHeading = state.lastHeading;
    const headingChange = Math.abs(currentHeading - lastHeading);

    // Normalize heading change to 0-360
    const normalizedChange = headingChange > 180 ? 360 - headingChange : headingChange;

    state.headingChanges.push(normalizedChange);
    if (state.headingChanges.length > 10) {
      state.headingChanges.shift();
    }

    // Calculate total heading change over recent positions
    const totalHeadingChange = state.headingChanges.reduce((sum, change) => sum + change, 0);

    if (totalHeadingChange > this.config.spinHeadingChangeThreshold) {
      if (!state.spinSince) {
        state.spinSince = Date.now();
      } else if (Date.now() - state.spinSince > this.config.spinMinDuration) {
        const incident = await this.reportIncident({
          sessionId: state.sessionId,
          participantId: state.participantId,
          type: 'spin',
          severity: 'moderate',
          locationLat: position.lat,
          locationLng: position.lng,
          description: `Spin detected: ${totalHeadingChange.toFixed(0)}° heading change`,
          tags: ['auto-detected', 'spin'],
          metadata: {
            totalHeadingChange,
          },
        });

        state.spinSince = undefined;
        state.headingChanges = [];
        return incident;
      }
    } else {
      state.spinSince = undefined;
    }

    return null;
  }

  /**
   * Detect stall incident
   */
  private async detectStall(state: VehicleState, position: Position): Promise<Incident | null> {
    const currentSpeed = position.speed || 0;

    if (currentSpeed < this.config.stallSpeedThreshold) {
      if (!state.stallSince) {
        state.stallSince = Date.now();
      } else if (Date.now() - state.stallSince > this.config.stallMinDuration) {
        const incident = await this.reportIncident({
          sessionId: state.sessionId,
          participantId: state.participantId,
          type: 'stall',
          severity: 'minor',
          locationLat: position.lat,
          locationLng: position.lng,
          description: 'Vehicle stalled on track',
          tags: ['auto-detected', 'stall'],
          metadata: {
            stallDuration: Date.now() - state.stallSince,
          },
        });

        state.stallSince = undefined;
        return incident;
      }
    } else {
      state.stallSince = undefined;
    }

    return null;
  }

  /**
   * Calculate distance from track centerline
   */
  private calculateDistanceFromTrack(position: Position, trackGeometry: any): number {
    // This is a simplified implementation
    // In production, use PostGIS ST_Distance with the actual track geometry
    // For now, return a placeholder value
    return 0;
  }

  /**
   * Determine off-track severity based on distance
   */
  private determineOffTrackSeverity(distance: number): 'minor' | 'moderate' | 'major' | 'critical' {
    if (distance < 100) return 'minor';
    if (distance < 200) return 'moderate';
    if (distance < 500) return 'major';
    return 'critical';
  }

  /**
   * Determine crash severity based on deceleration and speed
   */
  private determineCrashSeverity(deceleration: number, speed: number): 'minor' | 'moderate' | 'major' | 'critical' {
    if (deceleration < 20 && speed < 50) return 'minor';
    if (deceleration < 30 && speed < 80) return 'moderate';
    if (deceleration < 40 && speed < 120) return 'major';
    return 'critical';
  }

  /**
   * Report an incident
   */
  private async reportIncident(input: CreateIncidentInput): Promise<Incident | null> {
    if (!this.config.enableAutoReporting) return null;

    try {
      return await incidentRepository.create({
        ...input,
        reportedBy: 'system',
      });
    } catch (error) {
      console.error('Failed to report incident:', error);
      return null;
    }
  }

  /**
   * Set track geometry for a session
   */
  setTrackGeometry(sessionId: string, geometry: any): void {
    this.trackGeometries.set(sessionId, geometry);
  }

  /**
   * Clear track geometry for a session
   */
  clearTrackGeometry(sessionId: string): void {
    this.trackGeometries.delete(sessionId);
  }

  /**
   * Clear vehicle state for a participant
   */
  clearVehicleState(sessionId: string, participantId: string): void {
    const stateKey = `${sessionId}:${participantId}`;
    this.vehicleStates.delete(stateKey);
  }

  /**
   * Clear all states for a session
   */
  clearSession(sessionId: string): void {
    this.trackGeometries.delete(sessionId);
    
    for (const [key, state] of this.vehicleStates.entries()) {
      if (state.sessionId === sessionId) {
        this.vehicleStates.delete(key);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<IncidentDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): IncidentDetectionConfig {
    return { ...this.config };
  }
}

// Singleton instance
let incidentDetectionService: IncidentDetectionService | null = null;

export function getIncidentDetectionService(config?: Partial<IncidentDetectionConfig>): IncidentDetectionService {
  if (!incidentDetectionService) {
    incidentDetectionService = new IncidentDetectionService(config);
  }
  return incidentDetectionService;
}

export function resetIncidentDetectionService(): void {
  if (incidentDetectionService) {
    incidentDetectionService = null;
  }
}
