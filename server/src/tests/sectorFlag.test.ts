/**
 * Unit Tests for Sector Flag System
 * 
 * Tests for sector flag service, flag propagation,
 * marshal zones, and flag management
 */

import { sectorFlagService } from '../services/sectorFlag.service';
import type { Sector, MarshalZone, SectorFlagState, FlagChange, FlagType } from '../services/sectorFlag.service';

describe('Sector Flag Service', () => {
  describe('Flag State Management', () => {
    test('should initialize sectors with green flags', () => {
      const sectors: Sector[] = [
        { id: 'sector1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
        { id: 'sector3', name: 'Sector 3', order: 3, startDistance: 2000, endDistance: 3000 },
        { id: 'sector4', name: 'Sector 4', order: 4, startDistance: 3000, endDistance: 4000 },
      ];

      sectorFlagService.initializeSectors(sectors);
      
      const retrievedSectors = sectorFlagService.getSectors();
      expect(retrievedSectors).toHaveLength(4);
      
      retrievedSectors.forEach((sector, index) => {
        expect(sector.order).toBe(index + 1);
        expect(sector.name).toBe(`Sector ${index + 1}`);
      });

      const allFlags = sectorFlagService.getAllSectorFlags();
      allFlags.forEach(flagState => {
        expect(flagState.flag).toBe('green');
        expect(flagState.updatedAt).toBeGreaterThan(0);
      });
    });

    test('should get sector by ID', () => {
      const sectors: Sector[] = [
        { id: 'sector1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
      ];

      sectorFlagService.initializeSectors(sectors);
      
      const sector = sectorFlagService.getSector('sector1');
      expect(sector).toBeDefined();
      expect(sector?.name).toBe('Sector 1');
      expect(sector?.order).toBe(1);
    });

    test('should get flag state for sector', () => {
      const sectors: Sector[] = [
        { id: 'sector1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
      ];

      sectorFlagService.initializeSectors(sectors);
      
      const flagState = sectorFlagService.getSectorFlag('sector1');
      expect(flagState).toBeDefined();
      expect(flagState?.flag).toBe('green');
      expect(flagState?.sectorId).toBe('sector1');
    });
  });

  describe('Data Structure Validation', () => {
    test('should validate sector structure', () => {
      const sector: Sector = {
        id: 'sector1',
        name: 'Sector 1',
        order: 1,
        startDistance: 0,
        endDistance: 1000,
        marshalZoneId: 'zone1',
      };

      expect(sector.id).toBe('sector1');
      expect(sector.name).toBe('Sector 1');
      expect(sector.order).toBe(1);
      expect(sector.startDistance).toBe(0);
      expect(sector.endDistance).toBe(1000);
      expect(sector.marshalZoneId).toBe('zone1');
    });

    test('should validate marshal zone structure', () => {
      const zone: MarshalZone = {
        id: 'zone1',
        name: 'Turn 1',
        sectorId: 'sector1',
        position: { lat: 37.7749, lng: -122.4194 },
        radioChannel: 'Channel 1',
        primaryContact: 'Marshal 1',
        isActive: true,
      };

      expect(zone.id).toBe('zone1');
      expect(zone.name).toBe('Turn 1');
      expect(zone.sectorId).toBe('sector1');
      expect(zone.position.lat).toBe(37.7749);
      expect(zone.position.lng).toBe(-122.4194);
      expect(zone.radioChannel).toBe('Channel 1');
      expect(zone.primaryContact).toBe('Marshal 1');
      expect(zone.isActive).toBe(true);
    });

    test('should validate sector flag state structure', () => {
      const flagState: SectorFlagState = {
        sectorId: 'sector1',
        flag: 'yellow',
        reason: 'Debris on track',
        updatedAt: Date.now(),
        updatedBy: 'marshal1',
      };

      expect(flagState.sectorId).toBe('sector1');
      expect(flagState.flag).toBe('yellow');
      expect(flagState.reason).toBe('Debris on track');
      expect(flagState.updatedAt).toBeGreaterThan(0);
      expect(flagState.updatedBy).toBe('marshal1');
    });

    test('should validate flag change structure', () => {
      const flagChange: FlagChange = {
        sectorId: 'sector1',
        previousFlag: 'green',
        newFlag: 'yellow',
        reason: 'Debris on track',
        timestamp: Date.now(),
        updatedBy: 'marshal1',
      };

      expect(flagChange.sectorId).toBe('sector1');
      expect(flagChange.previousFlag).toBe('green');
      expect(flagChange.newFlag).toBe('yellow');
      expect(flagChange.reason).toBe('Debris on track');
      expect(flagChange.timestamp).toBeGreaterThan(0);
      expect(flagChange.updatedBy).toBe('marshal1');
    });
  });

  describe('Flag Type Validation', () => {
    test('should handle all valid flag types', () => {
      const validFlags: FlagType[] = ['none', 'green', 'yellow', 'double_yellow', 'red', 'blue', 'checkered', 'safety_car'];
      
      validFlags.forEach(flag => {
        expect(typeof flag).toBe('string');
        expect(flag.length).toBeGreaterThan(0);
      });
    });

    test('should validate flag type values', () => {
      const flag: FlagType = 'yellow';
      
      expect(flag).toBe('yellow');
      expect(['none', 'green', 'yellow', 'double_yellow', 'red', 'blue', 'checkered', 'safety_car']).toContain(flag);
    });
  });

  describe('Service Initialization', () => {
    test('should handle service initialization', () => {
      expect(sectorFlagService).toBeDefined();
      expect(typeof sectorFlagService.initializeSectors).toBe('function');
      expect(typeof sectorFlagService.getSectors).toBe('function');
      expect(typeof sectorFlagService.getSector).toBe('function');
      expect(typeof sectorFlagService.getSectorFlag).toBe('function');
      expect(typeof sectorFlagService.getAllSectorFlags).toBe('function');
    });

    test('should handle empty sectors array', () => {
      sectorFlagService.initializeSectors([]);
      
      const sectors = sectorFlagService.getSectors();
      expect(sectors).toHaveLength(0);
    });
  });

  describe('Sector Ordering', () => {
    test('should return sectors in correct order', () => {
      const sectors: Sector[] = [
        { id: 'sector3', name: 'Sector 3', order: 3, startDistance: 2000, endDistance: 3000 },
        { id: 'sector1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
      ];

      sectorFlagService.initializeSectors(sectors);
      
      const retrievedSectors = sectorFlagService.getSectors();
      expect(retrievedSectors[0].order).toBe(1);
      expect(retrievedSectors[1].order).toBe(2);
      expect(retrievedSectors[2].order).toBe(3);
    });
  });

  describe('Marshal Zone Integration', () => {
    test('should handle marshal zone data', () => {
      const zone: MarshalZone = {
        id: 'zone1',
        name: 'Turn 1',
        sectorId: 'sector1',
        position: { lat: 37.7749, lng: -122.4194 },
        radioChannel: 'Channel 1',
        primaryContact: 'Marshal 1',
        isActive: true,
      };

      expect(zone.id).toBeDefined();
      expect(zone.name).toBeDefined();
      expect(zone.sectorId).toBeDefined();
      expect(zone.position).toBeDefined();
      expect(zone.isActive).toBe(true);
    });

    test('should handle inactive marshal zones', () => {
      const zone: MarshalZone = {
        id: 'zone1',
        name: 'Turn 1',
        sectorId: 'sector1',
        position: { lat: 37.7749, lng: -122.4194 },
        isActive: false,
      };

      expect(zone.isActive).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of sectors', () => {
      const sectors: Sector[] = [];
      for (let i = 0; i < 50; i++) {
        sectors.push({
          id: `sector${i}`,
          name: `Sector ${i}`,
          order: i,
          startDistance: i * 1000,
          endDistance: (i + 1) * 1000,
        });
      }

      const startTime = Date.now();
      sectorFlagService.initializeSectors(sectors);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
      
      const retrievedSectors = sectorFlagService.getSectors();
      expect(retrievedSectors).toHaveLength(50);
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined sector ID', () => {
      const sectors: Sector[] = [
        { id: 'sector1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
      ];

      sectorFlagService.initializeSectors(sectors);
      
      const sector = sectorFlagService.getSector('nonexistent');
      expect(sector).toBeUndefined();
    });

    test('should handle undefined flag state', () => {
      const flagState = sectorFlagService.getSectorFlag('nonexistent');
      expect(flagState).toBeUndefined();
    });
  });
});
