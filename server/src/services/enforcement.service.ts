/**
 * Enforcement Service - Handles speed zone detection, speed traps, and penalty calculations
 * 
 * This service provides the core game mechanics for the enforcement layer:
 * - Speed zone detection (point-in-polygon using PostGIS)
 * - Speed limit checking
 * - Speed trap triggering
 * - Penalty calculation
 * - Route deviation detection
 * - Checkpoint violation detection
 */

import { enforcementZoneRepository } from '../database/repositories';
import type { EnforcementZone } from '../database/repositories/enforcementZone.repository';

export interface Position {
  lat: number;
  lng: number;
  speed: number; // in km/h
  heading?: number; // in degrees
  timestamp: number;
}

export interface SpeedZoneViolation {
  zoneId: string;
  zoneName: string;
  zoneType: 'normal' | 'restricted' | 'max_speed_cap';
  speedLimit: number;
  actualSpeed: number;
  overSpeed: number;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  timestamp: number;
  position: { lat: number; lng: number };
}

export interface SpeedTrapTrigger {
  trapId: string;
  trapName: string;
  speed: number;
  limit: number;
  overSpeed: number;
  direction?: 'inbound' | 'outbound' | 'both';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  timestamp: number;
  position: { lat: number; lng: number };
}

export interface PenaltyCalculation {
  type: 'time' | 'points' | 'alert';
  value: number;
  reason: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
}

export class EnforcementService {
  private activeViolations: Map<string, SpeedZoneViolation[]> = new Map();
  private speedTrapHistory: Map<string, SpeedTrapTrigger[]> = new Map();

  /**
   * Check if a position is within any enforcement zone
   */
  async checkSpeedZones(position: Position, routeId: string): Promise<SpeedZoneViolation[]> {
    const violations: SpeedZoneViolation[] = [];
    
    // Get all enforcement zones for the route
    const zones = await enforcementZoneRepository.findByRoute(routeId);
    
    for (const zone of zones) {
      if (zone.zone_type === 'SPEED_ZONE' || zone.zone_type === 'RADAR_ZONE') {
        const inZone = await enforcementZoneRepository.isPointInZone(zone.id, position.lat, position.lng);
        
        if (inZone && zone.speed_limit_kmh) {
          const violation = this.checkSpeedLimit(position, zone);
          if (violation) {
            violations.push(violation);
          }
        }
      }
    }
    
    return violations;
  }

  /**
   * Check if speed exceeds limit in a zone
   */
  private checkSpeedLimit(position: Position, zone: EnforcementZone): SpeedZoneViolation | null {
    if (!zone.speed_limit_kmh) {
      return null;
    }
    
    const overSpeed = position.speed - zone.speed_limit_kmh;
    
    if (overSpeed <= 0) {
      return null;
    }
    
    // Calculate severity based on how much over the limit
    const severity = this.calculateSeverity(overSpeed, zone.speed_limit_kmh);
    
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      zoneType: zone.zone_type === 'SPEED_ZONE' ? 'normal' : zone.zone_type === 'RADAR_ZONE' ? 'restricted' : 'max_speed_cap',
      speedLimit: zone.speed_limit_kmh,
      actualSpeed: position.speed,
      overSpeed,
      severity,
      timestamp: position.timestamp,
      position: { lat: position.lat, lng: position.lng }
    };
  }

  /**
   * Calculate severity based on speed over limit
   */
  private calculateSeverity(overSpeed: number, speedLimit: number): 'minor' | 'moderate' | 'major' | 'critical' {
    const percentage = (overSpeed / speedLimit) * 100;
    
    if (percentage < 10) return 'minor';
    if (percentage < 20) return 'moderate';
    if (percentage < 40) return 'major';
    return 'critical';
  }

  /**
   * Check if position triggers a speed trap
   */
  async checkSpeedTraps(position: Position, routeId: string): Promise<SpeedTrapTrigger[]> {
    const triggers: SpeedTrapTrigger[] = [];
    
    // Get all enforcement zones that are speed traps
    const traps = await enforcementZoneRepository.findByType(routeId, 'SPEED_TRAP');
    
    for (const trap of traps) {
      const inZone = await enforcementZoneRepository.isPointInZone(trap.id, position.lat, position.lng);
      
      if (inZone) {
        // Check if this is a new trigger (not recently triggered)
        const playerHistory = this.speedTrapHistory.get(routeId) || [];
        const recentTrigger = playerHistory.find(
          t => t.trapId === trap.id && 
          (position.timestamp - t.timestamp) < 5000 // 5 second cooldown
        );
        
        if (!recentTrigger) {
          const trigger = this.createSpeedTrapTrigger(position, trap);
          triggers.push(trigger);
          
          // Add to history
          playerHistory.push(trigger);
          this.speedTrapHistory.set(routeId, playerHistory);
        }
      }
    }
    
    return triggers;
  }

  /**
   * Create a speed trap trigger
   */
  private createSpeedTrapTrigger(position: Position, trap: EnforcementZone): SpeedTrapTrigger {
    const overSpeed = trap.speed_limit_kmh ? Math.max(0, position.speed - trap.speed_limit_kmh) : 0;
    const severity = trap.speed_limit_kmh ? this.calculateSeverity(overSpeed, trap.speed_limit_kmh) : 'minor';
    
    return {
      trapId: trap.id,
      trapName: trap.name,
      speed: position.speed,
      limit: trap.speed_limit_kmh || 0,
      overSpeed,
      direction: trap.trigger_direction === 0 ? 'inbound' : trap.trigger_direction === 180 ? 'outbound' : 'both',
      severity,
      timestamp: position.timestamp,
      position: { lat: position.lat, lng: position.lng }
    };
  }

  /**
   * Calculate penalty based on violation
   */
  calculatePenalty(violation: SpeedZoneViolation | SpeedTrapTrigger): PenaltyCalculation {
    const severity = violation.severity;
    const overSpeed = violation.overSpeed;
    
    // Base penalty calculation
    let penaltyValue = 0;
    let penaltyType: 'time' | 'points' | 'alert' = 'alert';
    
    switch (severity) {
      case 'minor':
        penaltyValue = 1; // 1 alert point
        penaltyType = 'alert';
        break;
      case 'moderate':
        penaltyValue = 5; // 5 seconds or 5 points
        penaltyType = 'time';
        break;
      case 'major':
        penaltyValue = 15; // 15 seconds or 15 points
        penaltyType = 'time';
        break;
      case 'critical':
        penaltyValue = 30; // 30 seconds or 30 points
        penaltyType = 'time';
        break;
    }
    
    // Additional penalty for extreme over-speed
    if (overSpeed > 50) {
      penaltyValue += 10;
    }
    
    const actualSpeed = 'actualSpeed' in violation ? violation.actualSpeed : violation.speed;
    const speedLimit = 'speedLimit' in violation ? violation.speedLimit : violation.limit;
    
    return {
      type: penaltyType,
      value: penaltyValue,
      reason: `Speed violation: ${actualSpeed} km/h in ${speedLimit} km/h zone`,
      severity
    };
  }

  /**
   * Check for route deviation
   */
  checkRouteDeviation(
    position: Position,
    routePoints: Array<{ lat: number; lng: number }>,
    toleranceMeters: number = 50
  ): boolean {
    if (routePoints.length < 2) {
      return false;
    }
    
    // Find the closest point on the route
    let minDistance = Infinity;
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const distance = this.pointToSegmentDistance(
        position,
        routePoints[i],
        routePoints[i + 1]
      );
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    
    return minDistance > toleranceMeters;
  }

  /**
   * Check for checkpoint violation (wrong direction or missed)
   */
  checkCheckpointViolation(
    position: Position,
    checkpoint: { lat: number; lng: number; radius: number; requiredDirection?: number },
    previousPosition?: Position
  ): { missed: boolean; wrongDirection: boolean } {
    const distance = this.calculateDistance(
      position.lat,
      position.lng,
      checkpoint.lat,
      checkpoint.lng
    );
    
    const missed = distance > checkpoint.radius;
    
    let wrongDirection = false;
    
    if (checkpoint.requiredDirection && previousPosition) {
      const actualDirection = this.calculateBearing(
        previousPosition.lat,
        previousPosition.lng,
        position.lat,
        position.lng
      );
      
      const directionDiff = Math.abs(actualDirection - checkpoint.requiredDirection);
      wrongDirection = directionDiff > 45; // Allow 45 degree tolerance
    }
    
    return { missed, wrongDirection };
  }

  /**
   * Calculate distance between two points in meters using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Calculate distance from point to line segment
   */
  private pointToSegmentDistance(
    point: Position,
    segmentStart: { lat: number; lng: number },
    segmentEnd: { lat: number; lng: number }
  ): number {
    const A = point.lat - segmentStart.lat;
    const B = point.lng - segmentStart.lng;
    const C = segmentEnd.lat - segmentStart.lat;
    const D = segmentEnd.lng - segmentStart.lng;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = segmentStart.lat;
      yy = segmentStart.lng;
    } else if (param > 1) {
      xx = segmentEnd.lat;
      yy = segmentEnd.lng;
    } else {
      xx = segmentStart.lat + param * C;
      yy = segmentStart.lng + param * D;
    }
    
    const dx = point.lat - xx;
    const dy = point.lng - yy;
    
    return Math.sqrt(dx * dx + dy * dy) * 111320; // Convert to meters (approximate)
  }

  /**
   * Calculate bearing between two points
   */
  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = this.toRadians(lng2 - lng1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    const bearing = Math.atan2(y, x);
    return (this.toDegrees(bearing) + 360) % 360;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  /**
   * Get active violations for a player
   */
  getActiveViolations(sessionId: string): SpeedZoneViolation[] {
    return this.activeViolations.get(sessionId) || [];
  }

  /**
   * Clear violations for a session
   */
  clearViolations(sessionId: string): void {
    this.activeViolations.delete(sessionId);
    this.speedTrapHistory.delete(sessionId);
  }

  /**
   * Get risk level for a player based on violations
   */
  getRiskLevel(sessionId: string): number {
    const violations = this.getActiveViolations(sessionId);
    
    if (violations.length === 0) return 0;
    
    const severityWeights = {
      minor: 1,
      moderate: 3,
      major: 7,
      critical: 15
    };
    
    const totalRisk = violations.reduce((sum, v) => {
      return sum + (severityWeights[v.severity] || 0);
    }, 0);
    
    // Normalize to 0-100 scale
    return Math.min(100, totalRisk);
  }
}

export const enforcementService = new EnforcementService();
