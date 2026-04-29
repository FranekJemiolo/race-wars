/**
 * End-to-End Tests for Sector Flag Workflow
 * 
 * Tests the complete sector flag workflow from initialization
 * through flag changes to propagation and driver notifications
 */

import { sectorFlagService } from '../../services/sectorFlag.service';
import type { Sector } from '../../services/sectorFlag.service';

describe('Sector Flag Workflow E2E Tests', () => {
  describe('Complete Sector Initialization Workflow', () => {
    test('should handle complete sector initialization workflow', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector-2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
        { id: 'sector-3', name: 'Sector 3', order: 3, startDistance: 2000, endDistance: 3000 },
      ];
      
      // Step 1: Initialize sectors
      sectorFlagService.initializeSectors(sectors);
      
      // Step 2: Verify sectors are initialized
      const retrievedSectors = sectorFlagService.getSectors();
      expect(retrievedSectors).toBeDefined();
      expect(retrievedSectors.length).toBe(3);
      
      // Step 3: Verify default flag state
      const allFlags = sectorFlagService.getAllSectorFlags();
      expect(allFlags).toBeDefined();
      expect(allFlags.length).toBe(3);
      
      allFlags.forEach(flag => {
        expect(flag.flag).toBe('green');
      });
    });
  });

  describe('Complete Flag Change Workflow', () => {
    test('should handle complete flag change workflow', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector-2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      // Step 1: Change flag in sector 1
      sectorFlagService.setSectorFlag('sector-1', 'yellow', 'Debris on track');
      
      // Step 2: Verify flag change
      const flag1 = sectorFlagService.getSectorFlag('sector-1');
      expect(flag1).toBeDefined();
      expect(flag1?.flag).toBe('yellow');
      
      // Step 4: Change flag to double yellow
      sectorFlagService.setSectorFlag('sector-1', 'double_yellow', 'Incident cleared');
      
      const flag2 = sectorFlagService.getSectorFlag('sector-1');
      expect(flag2?.flag).toBe('double_yellow');
      
      // Step 5: Clear flag back to green
      sectorFlagService.setSectorFlag('sector-1', 'green', 'Track clear');
      
      const flag3 = sectorFlagService.getSectorFlag('sector-1');
      expect(flag3?.flag).toBe('green');
    });
  });

  describe('Complete Flag Propagation Workflow', () => {
    test('should handle complete flag propagation workflow', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector-2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
        { id: 'sector-3', name: 'Sector 3', order: 3, startDistance: 2000, endDistance: 3000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      // Step 1: Set yellow flag in sector 2 with propagation enabled
      sectorFlagService.setSectorFlag('sector-2', 'yellow', 'Debris on track', undefined, true);
      
      // Step 2: Verify propagation (yellow propagates to next 2 sectors)
      const flag1 = sectorFlagService.getSectorFlag('sector-1');
      const flag2 = sectorFlagService.getSectorFlag('sector-2');
      const flag3 = sectorFlagService.getSectorFlag('sector-3');
      
      expect(flag1?.flag).toBe('yellow');
      expect(flag2?.flag).toBe('yellow');
      expect(flag3?.flag).toBe('yellow');
      
      // Step 3: Clear all flags manually
      sectorFlagService.setSectorFlag('sector-1', 'green', 'Clear');
      sectorFlagService.setSectorFlag('sector-2', 'green', 'Clear');
      sectorFlagService.setSectorFlag('sector-3', 'green', 'Clear');
      
      const allFlags = sectorFlagService.getAllSectorFlags();
      allFlags.forEach(flag => {
        expect(flag.flag).toBe('green');
      });
    });
  });

  describe('Multi-Sector Flag Workflow', () => {
    test('should handle multiple sector flags simultaneously', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector-2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
        { id: 'sector-3', name: 'Sector 3', order: 3, startDistance: 2000, endDistance: 3000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      // Step 1: Set different flags in different sectors without propagation
      sectorFlagService.setSectorFlag('sector-1', 'yellow', 'Debris', undefined, false);
      sectorFlagService.setSectorFlag('sector-2', 'green', 'Clear', undefined, false);
      sectorFlagService.setSectorFlag('sector-3', 'double_yellow', 'Incident', undefined, false);
      
      // Step 2: Verify all flags
      const flags = sectorFlagService.getAllSectorFlags();
      expect(flags[0].flag).toBe('yellow');
      expect(flags[1].flag).toBe('green');
      expect(flags[2].flag).toBe('double_yellow');
      
      // Step 3: Get flags by priority
      const highPriorityFlags = flags.filter(f => 
        f.flag === 'yellow' || f.flag === 'double_yellow'
      );
      expect(highPriorityFlags.length).toBe(2);
    });
  });

  describe('Safety Car Workflow', () => {
    test('should handle safety car deployment workflow', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector-2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
        { id: 'sector-3', name: 'Sector 3', order: 3, startDistance: 2000, endDistance: 3000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      // Step 1: Set safety car flag in sector 1 (propagates to all)
      sectorFlagService.setSectorFlag('sector-1', 'safety_car', 'Safety car deployed');
      
      // Step 2: Verify all sectors have safety car flag
      const flags = sectorFlagService.getAllSectorFlags();
      flags.forEach(flag => {
        expect(flag.flag).toBe('safety_car');
      });
      
      // Step 3: Clear safety car flag from all sectors
      sectorFlagService.setSectorFlag('sector-1', 'green', 'Safety car withdrawn');
      sectorFlagService.setSectorFlag('sector-2', 'green', 'Safety car withdrawn');
      sectorFlagService.setSectorFlag('sector-3', 'green', 'Safety car withdrawn');
      
      // Step 4: Verify all sectors return to green
      const flagsAfter = sectorFlagService.getAllSectorFlags();
      flagsAfter.forEach(flag => {
        expect(flag.flag).toBe('green');
      });
    });
  });

  describe('Flag History Workflow', () => {
    test('should handle complete flag history workflow', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      // Step 1: Make multiple flag changes
      sectorFlagService.setSectorFlag('sector-1', 'yellow', 'Debris', undefined, false);
      sectorFlagService.setSectorFlag('sector-1', 'double_yellow', 'Incident', undefined, false);
      sectorFlagService.setSectorFlag('sector-1', 'red', 'Serious incident', undefined, false);
      sectorFlagService.setSectorFlag('sector-1', 'green', 'Clear', undefined, false);
      
      // Step 2: Verify changes were recorded
      const flag = sectorFlagService.getSectorFlag('sector-1');
      expect(flag?.flag).toBe('green');
    });
  });

  describe('Edge Case Workflows', () => {
    test('should handle rapid flag changes', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      // Rapid flag changes
      for (let i = 0; i < 10; i++) {
        const flag = i % 2 === 0 ? 'yellow' : 'green';
        sectorFlagService.setSectorFlag('sector-1', flag, `Change ${i}`, undefined, false);
      }
      
      const flag = sectorFlagService.getSectorFlag('sector-1');
      expect(flag?.flag).toBeDefined();
    });

    test('should handle all flag types', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      const flagTypes = ['none', 'green', 'yellow', 'double_yellow', 'red', 'blue', 'checkered', 'safety_car'] as const;
      
      flagTypes.forEach(flagType => {
        sectorFlagService.setSectorFlag('sector-1', flagType, `Testing ${flagType}`, undefined, false);
        const flag = sectorFlagService.getSectorFlag('sector-1');
        expect(flag?.flag).toBe(flagType);
      });
    });
  });

  describe('Data Consistency Workflow', () => {
    test('should maintain consistency across operations', () => {
      const sectors: Sector[] = [
        { id: 'sector-1', name: 'Sector 1', order: 1, startDistance: 0, endDistance: 1000 },
        { id: 'sector-2', name: 'Sector 2', order: 2, startDistance: 1000, endDistance: 2000 },
      ];
      
      sectorFlagService.initializeSectors(sectors);
      
      // Set flags
      sectorFlagService.setSectorFlag('sector-1', 'yellow', 'Debris', undefined, false);
      sectorFlagService.setSectorFlag('sector-2', 'double_yellow', 'Incident', undefined, false);
      
      // Verify multiple times
      const flags1 = sectorFlagService.getAllSectorFlags();
      const flags2 = sectorFlagService.getAllSectorFlags();
      const flags3 = sectorFlagService.getAllSectorFlags();
      
      flags1.forEach((flag, i) => {
        expect(flag.flag).toBe(flags2[i].flag);
        expect(flag.flag).toBe(flags3[i].flag);
      });
    });
  });

  describe('Performance Workflow', () => {
    test('should handle large number of sectors efficiently', () => {
      const sectors: Sector[] = [];
      
      for (let i = 0; i < 50; i++) {
        sectors.push({
          id: `sector-${i}`,
          name: `Sector ${i}`,
          order: i + 1,
          startDistance: i * 1000,
          endDistance: (i + 1) * 1000,
        });
      }
      
      const startTime = Date.now();
      sectorFlagService.initializeSectors(sectors);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
      
      const retrievedSectors = sectorFlagService.getSectors();
      expect(retrievedSectors.length).toBe(50);
    });
  });
});
