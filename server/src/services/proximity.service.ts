/**
 * Proximity Detection Service
 * 
 * Detects dangerous proximity between drivers on the track
 * Calculates closing speeds and alerts for potential collisions
 */

import type { Position } from './enforcement.service';

export interface DriverPosition {
  driverId: string;
  position: Position;
  speed: number; // km/h
  heading: number; // degrees
  timestamp: number;
}

export interface ProximityAlert {
  alertId: string;
  driverId: string;
  otherDriverId: string;
  distance: number; // meters
  closingSpeed: number; // km/h
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'following_too_close' | 'closing_too_fast' | 'side_by_side' | 'potential_collision';
  timestamp: number;
  position: Position;
}

export interface ProximityConfig {
  minSafeDistance: number; // meters
  criticalDistance: number; // meters
  maxClosingSpeed: number; // km/h
  criticalClosingSpeed: number; // km/h
  alertCooldown: number; // milliseconds
}

class ProximityService {
  private driverPositions: Map<string, DriverPosition> = new Map();
  private recentAlerts: Map<string, number> = new Map();
  private config: ProximityConfig = {
    minSafeDistance: 50, // 50 meters minimum safe distance
    criticalDistance: 20, // 20 meters critical distance
    maxClosingSpeed: 50, // 50 km/h closing speed threshold
    criticalClosingSpeed: 100, // 100 km/h critical closing speed
    alertCooldown: 5000 // 5 seconds between alerts for same pair
  };

  /**
   * Update driver position
   */
  updateDriverPosition(driverData: DriverPosition): void {
    this.driverPositions.set(driverData.driverId, driverData);
  }

  /**
   * Remove driver from tracking
   */
  removeDriver(driverId: string): void {
    this.driverPositions.delete(driverId);
  }

  /**
   * Get all driver positions
   */
  getAllDriverPositions(): DriverPosition[] {
    return Array.from(this.driverPositions.values());
  }

  /**
   * Check for proximity alerts for a specific driver
   */
  checkProximityAlerts(driverId: string): ProximityAlert[] {
    const alerts: ProximityAlert[] = [];
    const driver = this.driverPositions.get(driverId);

    if (!driver) {
      return alerts;
    }

    const now = Date.now();

    for (const [otherDriverId, otherDriver] of this.driverPositions) {
      if (otherDriverId === driverId) continue;

      const distance = this.calculateDistance(driver.position, otherDriver.position);
      const closingSpeed = this.calculateClosingSpeed(driver, otherDriver);

      // Check if alert cooldown has passed
      const alertKey = this.getAlertKey(driverId, otherDriverId);
      const lastAlertTime = this.recentAlerts.get(alertKey) || 0;
      
      if (now - lastAlertTime < this.config.alertCooldown) {
        continue;
      }

      // Determine alert type and severity
      const alert = this.evaluateProximity(
        driverId,
        otherDriverId,
        distance,
        closingSpeed,
        driver.position
      );

      if (alert) {
        alerts.push(alert);
        this.recentAlerts.set(alertKey, now);
      }
    }

    return alerts;
  }

  /**
   * Check all drivers for proximity alerts
   */
  checkAllProximityAlerts(): ProximityAlert[] {
    const allAlerts: ProximityAlert[] = [];

    for (const driverId of this.driverPositions.keys()) {
      const alerts = this.checkProximityAlerts(driverId);
      allAlerts.push(...alerts);
    }

    return allAlerts;
  }

  /**
   * Calculate distance between two positions in meters
   */
  private calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(pos2.lat - pos1.lat);
    const dLng = this.toRadians(pos2.lng - pos1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(pos1.lat)) * Math.cos(this.toRadians(pos2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate closing speed between two drivers
   */
  private calculateClosingSpeed(driver1: DriverPosition, driver2: DriverPosition): number {
    // Calculate relative velocity components
    const v1x = driver1.speed * Math.cos(this.toRadians(driver1.heading));
    const v1y = driver1.speed * Math.sin(this.toRadians(driver1.heading));
    const v2x = driver2.speed * Math.cos(this.toRadians(driver2.heading));
    const v2y = driver2.speed * Math.sin(this.toRadians(driver2.heading));

    // Relative velocity
    const dvx = v2x - v1x;
    const dvy = v2y - v1y;

    // Calculate direction from driver1 to driver2
    const dx = driver2.position.lng - driver1.position.lng;
    const dy = driver2.position.lat - driver1.position.lat;
    const direction = Math.atan2(dy, dx);

    // Project relative velocity onto direction vector
    const closingSpeed = dvx * Math.cos(direction) + dvy * Math.sin(direction);

    return Math.abs(closingSpeed);
  }

  /**
   * Evaluate proximity and determine if alert is needed
   */
  private evaluateProximity(
    driverId: string,
    otherDriverId: string,
    distance: number,
    closingSpeed: number,
    position: Position
  ): ProximityAlert | null {
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let type: ProximityAlert['type'] = 'following_too_close';

    // Critical distance - immediate danger
    if (distance < this.config.criticalDistance) {
      severity = 'critical';
      type = 'potential_collision';
    }
    // High closing speed - dangerous approach
    else if (closingSpeed > this.config.criticalClosingSpeed) {
      severity = 'high';
      type = 'closing_too_fast';
    }
    // Too close - following too closely
    else if (distance < this.config.minSafeDistance) {
      severity = closingSpeed > this.config.maxClosingSpeed ? 'high' : 'medium';
      type = 'following_too_close';
    }
    // Moderate closing speed - warning
    else if (closingSpeed > this.config.maxClosingSpeed) {
      severity = 'medium';
      type = 'closing_too_fast';
    }
    // Side by side - potential conflict
    else if (distance < this.config.minSafeDistance * 1.5) {
      severity = 'low';
      type = 'side_by_side';
    }
    else {
      return null; // No alert needed
    }

    return {
      alertId: crypto.randomUUID(),
      driverId,
      otherDriverId,
      distance,
      closingSpeed,
      severity,
      type,
      timestamp: Date.now(),
      position
    };
  }

  /**
   * Get alert key for cooldown tracking
   */
  private getAlertKey(driverId1: string, driverId2: string): string {
    const sorted = [driverId1, driverId2].sort();
    return `${sorted[0]}-${sorted[1]}`;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Update proximity configuration
   */
  updateConfig(newConfig: Partial<ProximityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ProximityConfig {
    return { ...this.config };
  }

  /**
   * Clear recent alerts (for testing or reset)
   */
  clearRecentAlerts(): void {
    this.recentAlerts.clear();
  }

  /**
   * Get drivers near a specific position
   */
  getDriversNearPosition(position: Position, radius: number): DriverPosition[] {
    const nearby: DriverPosition[] = [];

    for (const driver of this.driverPositions.values()) {
      const distance = this.calculateDistance(position, driver.position);
      if (distance <= radius) {
        nearby.push(driver);
      }
    }

    return nearby;
  }

  /**
   * Get driver position by ID
   */
  getDriverPosition(driverId: string): DriverPosition | undefined {
    return this.driverPositions.get(driverId);
  }

  /**
   * Clean up old positions (older than specified milliseconds)
   */
  cleanupOldPositions(maxAge: number): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [driverId, position] of this.driverPositions) {
      if (now - position.timestamp > maxAge) {
        toRemove.push(driverId);
      }
    }

    for (const driverId of toRemove) {
      this.driverPositions.delete(driverId);
    }
  }
}

export const proximityService = new ProximityService();
