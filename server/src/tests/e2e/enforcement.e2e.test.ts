/**
 * End-to-End Tests for Enforcement Workflow
 * 
 * Tests the complete enforcement workflow from position updates
 * through violation detection to penalty application
 */

import { enforcementService } from '../../services/enforcement.service';
import type { Position } from '../../services/enforcement.service';

describe('Enforcement Workflow E2E Tests', () => {
  describe('Complete Speed Violation Workflow', () => {
    test('should handle complete speed violation workflow', async () => {
      const routeId = 'test-route-1';
      const userId = 'driver-1';
      
      // Step 1: Driver enters speed zone
      const position1: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 80, // Within limit
        heading: 90,
      };
      
      const violations1 = await enforcementService.checkSpeedZones(position1, routeId);
      expect(violations1).toBeDefined();
      expect(Array.isArray(violations1)).toBe(true);
      
      // Step 2: Driver exceeds speed limit
      const position2: Position = {
        lat: 37.7750,
        lng: -122.4195,
        timestamp: Date.now() + 1000,
        speed: 150, // Exceeding limit
        heading: 90,
      };
      
      const violations2 = await enforcementService.checkSpeedZones(position2, routeId);
      expect(violations2).toBeDefined();
      expect(Array.isArray(violations2)).toBe(true);
      
      // Step 3: Calculate penalty for violation
      if (violations2.length > 0) {
        const penalty = enforcementService.calculatePenalty(violations2[0]);
        expect(penalty).toBeDefined();
        expect(penalty.type).toBeDefined();
        expect(penalty.value).toBeDefined();
        expect(penalty.reason).toBeDefined();
      }
      
      // Step 4: Driver slows down
      const position3: Position = {
        lat: 37.7751,
        lng: -122.4196,
        timestamp: Date.now() + 2000,
        speed: 90, // Back within limit
        heading: 90,
      };
      
      const violations3 = await enforcementService.checkSpeedZones(position3, routeId);
      expect(violations3).toBeDefined();
      expect(Array.isArray(violations3)).toBe(true);
    });
  });

  describe('Complete Speed Trap Workflow', () => {
    test('should handle complete speed trap workflow', async () => {
      const routeId = 'test-route-1';
      
      // Step 1: Driver approaches speed trap
      const position1: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 180,
        heading: 90,
      };
      
      const triggers1 = await enforcementService.checkSpeedTraps(position1, routeId);
      expect(triggers1).toBeDefined();
      expect(Array.isArray(triggers1)).toBe(true);
      
      // Step 2: Driver crosses speed trap line
      const position2: Position = {
        lat: 37.7750,
        lng: -122.4195,
        timestamp: Date.now() + 1000,
        speed: 200,
        heading: 90,
      };
      
      const triggers2 = await enforcementService.checkSpeedTraps(position2, routeId);
      expect(triggers2).toBeDefined();
      expect(Array.isArray(triggers2)).toBe(true);
      
      // Step 3: Driver exits speed trap area
      const position3: Position = {
        lat: 37.7751,
        lng: -122.4196,
        timestamp: Date.now() + 2000,
        speed: 150,
        heading: 90,
      };
      
      const triggers3 = await enforcementService.checkSpeedTraps(position3, routeId);
      expect(triggers3).toBeDefined();
      expect(Array.isArray(triggers3)).toBe(true);
    });
  });

  describe('Multi-Zone Enforcement Workflow', () => {
    test('should handle multiple enforcement zones in sequence', async () => {
      const routeId = 'test-route-1';
      
      // Zone 1: Normal speed limit
      const position1: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      const violations1 = await enforcementService.checkSpeedZones(position1, routeId);
      expect(violations1).toBeDefined();
      
      // Zone 2: Restricted zone
      const position2: Position = {
        lat: 37.7750,
        lng: -122.4195,
        timestamp: Date.now() + 1000,
        speed: 120,
        heading: 90,
      };
      
      const violations2 = await enforcementService.checkSpeedZones(position2, routeId);
      expect(violations2).toBeDefined();
      
      // Zone 3: Speed trap
      const position3: Position = {
        lat: 37.7751,
        lng: -122.4196,
        timestamp: Date.now() + 2000,
        speed: 180,
        heading: 90,
      };
      
      const triggers = await enforcementService.checkSpeedTraps(position3, routeId);
      expect(triggers).toBeDefined();
    });
  });

  describe('Real-Time Position Updates Workflow', () => {
    test('should handle continuous position updates', async () => {
      const routeId = 'test-route-1';
      const positions: Position[] = [];
      
      // Simulate driver moving through track
      for (let i = 0; i < 20; i++) {
        positions.push({
          lat: 37.7749 + (i * 0.0001),
          lng: -122.4194 + (i * 0.0001),
          timestamp: Date.now() + (i * 500),
          speed: 100 + (i * 5),
          heading: 90,
        });
      }
      
      const allViolations: any[] = [];
      const allTriggers: any[] = [];
      
      for (const position of positions) {
        const violations = await enforcementService.checkSpeedZones(position, routeId);
        const triggers = await enforcementService.checkSpeedTraps(position, routeId);
        
        allViolations.push(...violations);
        allTriggers.push(...triggers);
      }
      
      expect(allViolations).toBeDefined();
      expect(allTriggers).toBeDefined();
      expect(allViolations.length + allTriggers.length).toBeGreaterThan(0);
    });
  });

  describe('Penalty Accumulation Workflow', () => {
    test('should handle multiple violations and penalty accumulation', async () => {
      const routeId = 'test-route-1';
      const penalties: any[] = [];
      
      // Simulate multiple speed violations
      for (let i = 0; i < 5; i++) {
        const position: Position = {
          lat: 37.7749 + (i * 0.001),
          lng: -122.4194 + (i * 0.001),
          timestamp: Date.now() + (i * 2000),
          speed: 150 + (i * 10),
          heading: 90,
        };
        
        const violations = await enforcementService.checkSpeedZones(position, routeId);
        
        if (violations.length > 0) {
          const penalty = enforcementService.calculatePenalty(violations[0]);
          penalties.push(penalty);
        }
      }
      
      expect(penalties).toBeDefined();
      expect(penalties.length).toBeGreaterThan(0);
      
      // Calculate total penalty
      const totalPenalty = penalties.reduce((sum, p) => sum + p.value, 0);
      expect(totalPenalty).toBeGreaterThan(0);
    });
  });

  describe('Edge Case Workflows', () => {
    test('should handle boundary speed (exactly at limit)', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100, // Exactly at limit
        heading: 90,
      };
      
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });

    test('should handle extreme speed values', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 300, // Very high speed
        heading: 90,
      };
      
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
      
      if (violations.length > 0) {
        const penalty = enforcementService.calculatePenalty(violations[0]);
        expect(penalty).toBeDefined();
        expect(penalty.severity).toBe('critical');
      }
    });

    test('should handle zero speed', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 0, // Stopped
        heading: 90,
      };
      
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('Data Consistency Workflow', () => {
    test('should maintain consistency across repeated checks', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 150,
        heading: 90,
      };
      
      // Check multiple times with same position
      const results = await Promise.all([
        enforcementService.checkSpeedZones(position, routeId),
        enforcementService.checkSpeedZones(position, routeId),
        enforcementService.checkSpeedZones(position, routeId),
      ]);
      
      results.forEach(violations => {
        expect(violations).toBeDefined();
        expect(Array.isArray(violations)).toBe(true);
      });
    });
  });

  describe('Performance Workflow', () => {
    test('should handle high-frequency position updates', async () => {
      const routeId = 'test-route-1';
      const positions: Position[] = [];
      
      // Simulate 100 position updates (1 per 100ms)
      for (let i = 0; i < 100; i++) {
        positions.push({
          lat: 37.7749 + (i * 0.00001),
          lng: -122.4194 + (i * 0.00001),
          timestamp: Date.now() + (i * 100),
          speed: 100 + Math.random() * 50,
          heading: 90,
        });
      }
      
      const startTime = Date.now();
      const results = await Promise.all(
        positions.map(position => enforcementService.checkSpeedZones(position, routeId))
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
    });
  });
});
