/**
 * Sector Flag Service
 * 
 * Handles sector-based flag system for race management including:
 * - Per-sector flag state management
 * - Flag propagation rules (yellow propagates to following sectors)
 * - Marshal zone integration
 * - Flag notifications to drivers
 */

export type FlagType = 'none' | 'green' | 'yellow' | 'double_yellow' | 'red' | 'blue' | 'checkered' | 'safety_car';

export interface Sector {
  id: string;
  name: string;
  order: number;
  startDistance: number; // meters from start/finish
  endDistance: number; // meters from start/finish
  marshalZoneId?: string;
}

export interface MarshalZone {
  id: string;
  name: string;
  sectorId: string;
  position: {
    lat: number;
    lng: number;
  };
  radioChannel?: string;
  primaryContact?: string;
  isActive: boolean;
}

export interface SectorFlagState {
  sectorId: string;
  flag: FlagType;
  reason?: string;
  updatedAt: number;
  updatedBy?: string;
}

export interface FlagChange {
  sectorId: string;
  previousFlag: FlagType;
  newFlag: FlagType;
  reason: string;
  timestamp: number;
  updatedBy?: string;
}

export class SectorFlagService {
  private sectorStates: Map<string, SectorFlagState> = new Map();
  private sectors: Map<string, Sector> = new Map();
  private marshalZones: Map<string, MarshalZone> = new Map();
  private flagHistory: FlagChange[] = [];

  /**
   * Initialize sectors for a track
   */
  initializeSectors(sectors: Sector[]): void {
    this.sectors.clear();
    this.sectorStates.clear();
    
    for (const sector of sectors) {
      this.sectors.set(sector.id, sector);
      this.sectorStates.set(sector.id, {
        sectorId: sector.id,
        flag: 'green',
        updatedAt: Date.now()
      });
    }
  }

  /**
   * Get all sectors
   */
  getSectors(): Sector[] {
    return Array.from(this.sectors.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get sector by ID
   */
  getSector(sectorId: string): Sector | undefined {
    return this.sectors.get(sectorId);
  }

  /**
   * Get flag state for a sector
   */
  getSectorFlag(sectorId: string): SectorFlagState | undefined {
    return this.sectorStates.get(sectorId);
  }

  /**
   * Get all sector flag states
   */
  getAllSectorFlags(): SectorFlagState[] {
    return Array.from(this.sectorStates.values());
  }

  /**
   * Set flag for a specific sector
   */
  setSectorFlag(
    sectorId: string,
    flag: FlagType,
    reason?: string,
    updatedBy?: string,
    propagate: boolean = true
  ): FlagChange[] {
    const currentState = this.sectorStates.get(sectorId);
    const previousFlag = currentState?.flag || 'none';
    
    if (previousFlag === flag) {
      return [];
    }

    const change: FlagChange = {
      sectorId,
      previousFlag,
      newFlag: flag,
      reason: reason || 'Manual flag change',
      timestamp: Date.now(),
      updatedBy
    };

    // Update the sector state
    this.sectorStates.set(sectorId, {
      sectorId,
      flag,
      reason,
      updatedAt: Date.now(),
      updatedBy
    });

    this.flagHistory.push(change);

    const changes: FlagChange[] = [change];

    // Apply flag propagation rules
    if (propagate) {
      const propagatedChanges = this.applyFlagPropagation(sectorId, flag, reason, updatedBy);
      changes.push(...propagatedChanges);
    }

    return changes;
  }

  /**
   * Apply flag propagation rules based on flag type
   */
  private applyFlagPropagation(
    sourceSectorId: string,
    flag: FlagType,
    reason?: string,
    updatedBy?: string
  ): FlagChange[] {
    const changes: FlagChange[] = [];
    const sourceSector = this.sectors.get(sourceSectorId);
    
    if (!sourceSector) {
      return changes;
    }

    const allSectors = this.getSectors();
    const sourceIndex = allSectors.findIndex(s => s.id === sourceSectorId);

    switch (flag) {
      case 'yellow':
        // Yellow flag propagates to the next 2 sectors
        for (let i = 1; i <= 2; i++) {
          const nextIndex = (sourceIndex + i) % allSectors.length;
          const nextSector = allSectors[nextIndex];
          
          if (nextSector) {
            const currentState = this.sectorStates.get(nextSector.id);
            if (currentState?.flag === 'green') {
              const change = this.setSectorFlag(
                nextSector.id,
                'yellow',
                reason || 'Yellow flag propagation',
                updatedBy,
                false // Don't propagate further
              );
              changes.push(...change);
            }
          }
        }
        break;

      case 'double_yellow':
        // Double yellow propagates to the next 3 sectors
        for (let i = 1; i <= 3; i++) {
          const nextIndex = (sourceIndex + i) % allSectors.length;
          const nextSector = allSectors[nextIndex];
          
          if (nextSector) {
            const currentState = this.sectorStates.get(nextSector.id);
            if (currentState?.flag === 'green' || currentState?.flag === 'yellow') {
              const change = this.setSectorFlag(
                nextSector.id,
                'double_yellow',
                reason || 'Double yellow flag propagation',
                updatedBy,
                false
              );
              changes.push(...change);
            }
          }
        }
        break;

      case 'red':
        // Red flag applies to all sectors
        for (const sector of allSectors) {
          if (sector.id !== sourceSectorId) {
            const currentState = this.sectorStates.get(sector.id);
            if (currentState?.flag !== 'red') {
              const change = this.setSectorFlag(
                sector.id,
                'red',
                reason || 'Red flag propagation',
                updatedBy,
                false
              );
              changes.push(...change);
            }
          }
        }
        break;

      case 'safety_car':
        // Safety car applies to all sectors
        for (const sector of allSectors) {
          if (sector.id !== sourceSectorId) {
            const currentState = this.sectorStates.get(sector.id);
            if (currentState?.flag !== 'safety_car') {
              const change = this.setSectorFlag(
                sector.id,
                'safety_car',
                reason || 'Safety car deployment',
                updatedBy,
                false
              );
              changes.push(...change);
            }
          }
        }
        break;

      case 'green':
        // Green flag only clears the specific sector
        // No propagation needed
        break;

      case 'blue':
        // Blue flag is driver-specific, doesn't propagate
        break;

      case 'checkered':
        // Checkered flag applies to all sectors at end of race
        for (const sector of allSectors) {
          if (sector.id !== sourceSectorId) {
            const currentState = this.sectorStates.get(sector.id);
            if (currentState?.flag !== 'checkered') {
              const change = this.setSectorFlag(
                sector.id,
                'checkered',
                reason || 'Race finished',
                updatedBy,
                false
              );
              changes.push(...change);
            }
          }
        }
        break;
    }

    return changes;
  }

  /**
   * Get flag for a specific position on track
   */
  getFlagAtPosition(distanceMeters: number): FlagType {
    const sectors = this.getSectors();
    
    for (const sector of sectors) {
      if (distanceMeters >= sector.startDistance && distanceMeters < sector.endDistance) {
        const state = this.sectorStates.get(sector.id);
        return state?.flag || 'green';
      }
    }
    
    // If not in any sector, return green
    return 'green';
  }

  /**
   * Get sector by position
   */
  getSectorAtPosition(distanceMeters: number): Sector | undefined {
    const sectors = this.getSectors();
    
    for (const sector of sectors) {
      if (distanceMeters >= sector.startDistance && distanceMeters < sector.endDistance) {
        return sector;
      }
    }
    
    return undefined;
  }

  /**
   * Clear all flags (reset to green)
   */
  clearAllFlags(updatedBy?: string): FlagChange[] {
    const changes: FlagChange[] = [];
    
    for (const [sectorId, state] of this.sectorStates) {
      if (state.flag !== 'green') {
        const change = this.setSectorFlag(
          sectorId,
          'green',
          'Clear all flags',
          updatedBy,
          false
        );
        changes.push(...change);
      }
    }
    
    return changes;
  }

  /**
   * Get flag history
   */
  getFlagHistory(limit: number = 100): FlagChange[] {
    return this.flagHistory.slice(-limit);
  }

  /**
   * Get active yellow flag sectors
   */
  getYellowFlagSectors(): Sector[] {
    const sectors: Sector[] = [];
    
    for (const [sectorId, state] of this.sectorStates) {
      if (state.flag === 'yellow' || state.flag === 'double_yellow') {
        const sector = this.sectors.get(sectorId);
        if (sector) {
          sectors.push(sector);
        }
      }
    }
    
    return sectors.sort((a, b) => a.order - b.order);
  }

  /**
   * Get active red flag sectors
   */
  getRedFlagSectors(): Sector[] {
    const sectors: Sector[] = [];
    
    for (const [sectorId, state] of this.sectorStates) {
      if (state.flag === 'red') {
        const sector = this.sectors.get(sectorId);
        if (sector) {
          sectors.push(sector);
        }
      }
    }
    
    return sectors.sort((a, b) => a.order - b.order);
  }

  /**
   * Check if any sector has a specific flag
   */
  hasFlag(flag: FlagType): boolean {
    for (const state of this.sectorStates.values()) {
      if (state.flag === flag) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get overall track status flag
   * Returns the most severe flag across all sectors
   */
  getOverallTrackStatus(): FlagType {
    const flagSeverity: Record<FlagType, number> = {
      none: 0,
      green: 1,
      blue: 2,
      yellow: 3,
      double_yellow: 4,
      safety_car: 5,
      red: 6,
      checkered: 7
    };

    let maxSeverity = 0;
    let overallFlag: FlagType = 'green';

    for (const state of this.sectorStates.values()) {
      const severity = flagSeverity[state.flag] || 0;
      if (severity > maxSeverity) {
        maxSeverity = severity;
        overallFlag = state.flag;
      }
    }

    return overallFlag;
  }

  /**
   * Set blue flag for a specific driver (driver-specific warning)
   */
  setBlueFlagForDriver(driverId: string, sectorId: string, reason?: string): FlagChange {
    // Blue flags are driver-specific and don't change sector state
    // This is a placeholder for driver-specific blue flag tracking
    const change: FlagChange = {
      sectorId,
      previousFlag: 'none',
      newFlag: 'blue',
      reason: reason || 'Faster car approaching',
      timestamp: Date.now()
    };
    
    this.flagHistory.push(change);
    return change;
  }

  /**
   * Initialize marshal zones for a track
   */
  initializeMarshalZones(zones: MarshalZone[]): void {
    this.marshalZones.clear();
    
    for (const zone of zones) {
      this.marshalZones.set(zone.id, zone);
    }
  }

  /**
   * Get all marshal zones
   */
  getMarshalZones(): MarshalZone[] {
    return Array.from(this.marshalZones.values());
  }

  /**
   * Get marshal zone by ID
   */
  getMarshalZone(zoneId: string): MarshalZone | undefined {
    return this.marshalZones.get(zoneId);
  }

  /**
   * Get marshal zones for a sector
   */
  getMarshalZonesForSector(sectorId: string): MarshalZone[] {
    const zones: MarshalZone[] = [];
    
    for (const [id, zone] of this.marshalZones) {
      if (zone.sectorId === sectorId && zone.isActive) {
        zones.push(zone);
      }
    }
    
    return zones;
  }

  /**
   * Activate a marshal zone
   */
  activateMarshalZone(zoneId: string): void {
    const zone = this.marshalZones.get(zoneId);
    if (zone) {
      zone.isActive = true;
    }
  }

  /**
   * Deactivate a marshal zone
   */
  deactivateMarshalZone(zoneId: string): void {
    const zone = this.marshalZones.get(zoneId);
    if (zone) {
      zone.isActive = false;
    }
  }

  /**
   * Get nearest active marshal zone to a position
   */
  getNearestMarshalZone(lat: number, lng: number): MarshalZone | null {
    let nearestZone: MarshalZone | null = null;
    let minDistance = Infinity;

    for (const zone of this.marshalZones.values()) {
      if (!zone.isActive) continue;

      const distance = this.calculateDistance(lat, lng, zone.position.lat, zone.position.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = zone;
      }
    }

    return nearestZone;
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Report incident to marshal zone
   */
  reportIncidentToMarshalZone(zoneId: string, incident: any): void {
    const zone = this.marshalZones.get(zoneId);
    if (zone && zone.isActive) {
      // In a real implementation, this would send a notification to the marshal
      console.log(`Incident reported to marshal zone ${zone.name}:`, incident);
      // TODO: Integrate with notification service to alert marshals
    }
  }

  /**
   * Get marshal zone status summary
   */
  getMarshalZoneStatusSummary(): {
    totalZones: number;
    activeZones: number;
    zonesBySector: Record<string, number>;
  } {
    const zones = this.getMarshalZones();
    const activeZones = zones.filter(z => z.isActive).length;
    const zonesBySector: Record<string, number> = {};

    for (const zone of zones) {
      if (zone.isActive) {
        zonesBySector[zone.sectorId] = (zonesBySector[zone.sectorId] || 0) + 1;
      }
    }

    return {
      totalZones: zones.length,
      activeZones,
      zonesBySector
    };
  }
}

export const sectorFlagService = new SectorFlagService();
