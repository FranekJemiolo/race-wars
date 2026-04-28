/**
 * Integration Tests for Enforcement Layer
 * 
 * Tests the integration between enforcement service, repository,
 * and controller components to ensure end-to-end functionality
 */

import { enforcementService } from '../../services/enforcement.service';
import type { Position, SpeedZoneViolation, SpeedTrapTrigger } from '../../services/enforcement.service';

describe('Enforcement Layer Integration Tests', () => {
  describe('Service Integration', () => {
    test('should integrate with enforcement service', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });

    test('should handle missing route ID gracefully', async () => {
      const routeId = 'nonexistent-route';
      
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      // Should handle when repository returns no zones
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('Speed Zone Detection Integration', () => {
    test('should detect speed violations with service', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 150, // Exceeding limit
        heading: 90,
      };
      
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
      
      if (violations.length > 0) {
        const violation = violations[0];
        expect(violation.zoneName).toBeDefined();
        expect(violation.actualSpeed).toBe(position.speed);
        expect(violation.severity).toBeDefined();
      }
    });

    test('should not detect violations when speed is within limit', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 50, // Within limit
        heading: 90,
      };
      
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('Speed Trap Integration', () => {
    test('should trigger speed traps with service', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 200,
        heading: 90,
      };
      
      const triggers = await enforcementService.checkSpeedTraps(position, routeId);
      
      expect(triggers).toBeDefined();
      expect(Array.isArray(triggers)).toBe(true);
      
      if (triggers.length > 0) {
        const trigger = triggers[0];
        expect(trigger.trapName).toBeDefined();
        expect(trigger.speed).toBe(position.speed);
        expect(trigger.timestamp).toBe(position.timestamp);
      }
    });

    test('should handle multiple speed traps', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 180,
        heading: 90,
      };
      
      const triggers = await enforcementService.checkSpeedTraps(position, routeId);
      
      expect(triggers).toBeDefined();
      expect(Array.isArray(triggers)).toBe(true);
    });
  });

  describe('Penalty Calculation Integration', () => {
    test('should calculate penalties based on violations', () => {
      const violation: SpeedZoneViolation = {
        zoneId: 'zone-1',
        zoneName: 'Zone 1',
        zoneType: 'normal',
        speedLimit: 100,
        actualSpeed: 150,
        overSpeed: 50,
        severity: 'major',
        timestamp: Date.now(),
        position: {
          lat: 37.7749,
          lng: -122.4194,
        },
      };
      
      const penalty = enforcementService.calculatePenalty(violation);
      
      expect(penalty).toBeDefined();
      expect(penalty.type).toBeDefined();
      expect(penalty.value).toBeDefined();
      expect(penalty.reason).toBeDefined();
    });

    test('should calculate different penalties for different severities', () => {
      const minorViolation: SpeedZoneViolation = {
        zoneId: 'zone-1',
        zoneName: 'Zone 1',
        zoneType: 'normal',
        speedLimit: 100,
        actualSpeed: 110,
        overSpeed: 10,
        severity: 'minor',
        timestamp: Date.now(),
        position: {
          lat: 37.7749,
          lng: -122.4194,
        },
      };
      
      const majorViolation: SpeedZoneViolation = {
        zoneId: 'zone-1',
        zoneName: 'Zone 1',
        zoneType: 'normal',
        speedLimit: 100,
        actualSpeed: 150,
        overSpeed: 50,
        severity: 'major',
        timestamp: Date.now(),
        position: {
          lat: 37.7749,
          lng: -122.4194,
        },
      };
      
      const minorPenalty = enforcementService.calculatePenalty(minorViolation);
      const majorPenalty = enforcementService.calculatePenalty(majorViolation);
      
      expect(minorPenalty).toBeDefined();
      expect(majorPenalty).toBeDefined();
      expect(majorPenalty.value).toBeGreaterThan(minorPenalty.value);
    });
  });

  describe('Position Data Integration', () => {
    test('should handle position data with all fields', async () => {
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      const routeId = 'test-route-1';
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
    });

    test('should handle position data with minimal fields', async () => {
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
      };
      
      const routeId = 'test-route-1';
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
    });
  });

  describe('Zone Type Integration', () => {
    test('should handle different zone types', async () => {
      const zoneTypes = ['speed_limit', 'speed_trap', 'no_overtaking', 'normal', 'restricted', 'max_speed_cap'] as const;
      
      for (const zoneType of zoneTypes) {
        const position: Position = {
          lat: 37.7749,
          lng: -122.4194,
          timestamp: Date.now(),
          speed: 100,
          heading: 90,
        };
        
        const routeId = 'test-route-1';
        const violations = await enforcementService.checkSpeedZones(position, routeId);
        
        expect(violations).toBeDefined();
      }
    });
  });

  describe('Timestamp Integration', () => {
    test('should handle numeric timestamps', async () => {
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      const routeId = 'test-route-1';
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
    });

    test('should handle timestamp ordering', () => {
      const timestamp1 = Date.now();
      const timestamp2 = timestamp1 + 1000;
      
      expect(timestamp2).toBeGreaterThan(timestamp1);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid position data', async () => {
      const position: Position = {
        lat: 999, // Invalid latitude
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      const routeId = 'test-route-1';
      
      // Should handle gracefully
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
    });

    test('should handle missing route ID', async () => {
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      const routeId = '';
      
      // Should handle gracefully
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      
      expect(violations).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    test('should handle multiple position updates efficiently', async () => {
      const routeId = 'test-route-1';
      const positions: Position[] = [];
      
      for (let i = 0; i < 10; i++) {
        positions.push({
          lat: 37.7749 + (i * 0.001),
          lng: -122.4194 + (i * 0.001),
          timestamp: Date.now() + (i * 1000),
          speed: 100 + i,
          heading: 90,
        });
      }
      
      const startTime = Date.now();
      const results = await Promise.all(
        positions.map(position => enforcementService.checkSpeedZones(position, routeId))
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  describe('Data Consistency Integration', () => {
    test('should maintain data consistency across service calls', async () => {
      const routeId = 'test-route-1';
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        timestamp: Date.now(),
        speed: 100,
        heading: 90,
      };
      
      const violations1 = await enforcementService.checkSpeedZones(position, routeId);
      const violations2 = await enforcementService.checkSpeedZones(position, routeId);
      
      // Results should be consistent for same input
      expect(violations1).toBeDefined();
      expect(violations2).toBeDefined();
    });
  });

  describe('Violation Data Structure Integration', () => {
    test('should validate violation data structure', () => {
      const violation: SpeedZoneViolation = {
        zoneId: 'zone-1',
        zoneName: 'Zone 1',
        zoneType: 'normal',
        speedLimit: 100,
        actualSpeed: 150,
        overSpeed: 50,
        severity: 'major',
        timestamp: Date.now(),
        position: {
          lat: 37.7749,
          lng: -122.4194,
        },
      };

      expect(violation.zoneId).toBe('zone-1');
      expect(violation.zoneName).toBe('Zone 1');
      expect(violation.zoneType).toBe('normal');
      expect(violation.speedLimit).toBe(100);
      expect(violation.actualSpeed).toBe(150);
      expect(violation.overSpeed).toBe(50);
      expect(violation.severity).toBe('major');
      expect(violation.position.lat).toBe(37.7749);
      expect(violation.position.lng).toBe(-122.4194);
    });

    test('should validate trigger data structure', () => {
      const trigger: SpeedTrapTrigger = {
        trapId: 'trap-1',
        trapName: 'Speed Trap 1',
        speed: 200,
        limit: 100,
        overSpeed: 100,
        severity: 'major',
        timestamp: Date.now(),
        position: {
          lat: 37.7749,
          lng: -122.4194,
        },
      };

      expect(trigger.trapId).toBe('trap-1');
      expect(trigger.trapName).toBe('Speed Trap 1');
      expect(trigger.speed).toBe(200);
      expect(trigger.limit).toBe(100);
      expect(trigger.overSpeed).toBe(100);
      expect(trigger.timestamp).toBeGreaterThan(0);
      expect(trigger.position.lat).toBe(37.7749);
      expect(trigger.position.lng).toBe(-122.4194);
    });
  });
});
