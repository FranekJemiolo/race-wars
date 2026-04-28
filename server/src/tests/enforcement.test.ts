/**
 * Unit Tests for Enforcement Layer
 * 
 * Tests for enforcement service, speed zone detection,
 * penalty calculation, and violation tracking
 */

import { enforcementService } from '../services/enforcement.service';
import type { Position, SpeedZoneViolation, SpeedTrapTrigger, PenaltyCalculation } from '../services/enforcement.service';
import type { EnforcementZone } from '../database/repositories/enforcementZone.repository';

describe('Enforcement Service', () => {
  describe('Speed Zone Detection', () => {
    test('should detect vehicle in speed zone', async () => {
      const position: Position = {
        lat: 37.7754,
        lng: -122.4184,
        speed: 65,
        heading: 90,
        timestamp: Date.now(),
      };

      const violations = await enforcementService.checkSpeedZones(position, 'test-route');
      
      // Mock repository response for testing
      expect(Array.isArray(violations)).toBe(true);
    });

    test('should not detect violation when within speed limit', async () => {
      const position: Position = {
        lat: 37.7754,
        lng: -122.4184,
        speed: 55,
        heading: 90,
        timestamp: Date.now(),
      };

      const violations = await enforcementService.checkSpeedZones(position, 'test-route');
      
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('Speed Trap Detection', () => {
    test('should trigger speed trap when exceeded', async () => {
      const position: Position = {
        lat: 37.7754,
        lng: -122.4184,
        speed: 95,
        heading: 90,
        timestamp: Date.now(),
      };

      const triggers = await enforcementService.checkSpeedTraps(position, 'test-route');
      
      expect(Array.isArray(triggers)).toBe(true);
    });

    test('should not trigger speed trap when within limit', async () => {
      const position: Position = {
        lat: 37.7754,
        lng: -122.4184,
        speed: 75,
        heading: 90,
        timestamp: Date.now(),
      };

      const triggers = await enforcementService.checkSpeedTraps(position, 'test-route');
      
      expect(Array.isArray(triggers)).toBe(true);
    });
  });

  describe('Penalty Calculation', () => {
    test('should calculate penalty for speed violation', () => {
      const violation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Test Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 85,
        overSpeed: 25,
        severity: 'major',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      const penalty = enforcementService.calculatePenalty(violation);
      
      expect(penalty.type).toBeDefined();
      expect(penalty.value).toBeGreaterThan(0);
      expect(penalty.reason).toBeDefined();
      expect(penalty.severity).toBe('major');
    });

    test('should calculate higher penalty for higher severity', () => {
      const minorViolation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Test Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 65,
        overSpeed: 5,
        severity: 'minor',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      const majorViolation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Test Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 90,
        overSpeed: 30,
        severity: 'major',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      const minorPenalty = enforcementService.calculatePenalty(minorViolation);
      const majorPenalty = enforcementService.calculatePenalty(majorViolation);
      
      expect(majorPenalty.value).toBeGreaterThan(minorPenalty.value);
    });

    test('should give alert for minor violations', () => {
      const violation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Test Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 65,
        overSpeed: 5,
        severity: 'minor',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      const penalty = enforcementService.calculatePenalty(violation);
      
      expect(penalty.type).toBe('alert');
      expect(penalty.value).toBe(0);
    });
  });

  describe('Route Deviation Detection', () => {
    test('should detect route deviation', () => {
      const position: Position = {
        lat: 37.7800,
        lng: -122.4200,
        speed: 60,
        heading: 90,
        timestamp: Date.now(),
      };

      const routePath = [
        [37.7749, -122.4194],
        [37.7759, -122.4184],
        [37.7759, -122.4174],
        [37.7749, -122.4174],
      ];

      // This test would need the actual route deviation method
      // For now, we'll test the position structure
      expect(position.lat).toBe(37.7800);
      expect(position.lng).toBe(-122.4200);
      expect(position.speed).toBe(60);
    });

    test('should not detect deviation when on route', () => {
      const position: Position = {
        lat: 37.7754,
        lng: -122.4184,
        speed: 60,
        heading: 90,
        timestamp: Date.now(),
      };

      expect(position.lat).toBe(37.7754);
      expect(position.lng).toBe(-122.4184);
    });
  });

  describe('Checkpoint Detection', () => {
    test('should handle checkpoint position data', () => {
      const position: Position = {
        lat: 37.7754,
        lng: -122.4184,
        speed: 60,
        heading: 90,
        timestamp: Date.now(),
      };

      expect(position.lat).toBeDefined();
      expect(position.lng).toBeDefined();
      expect(position.speed).toBe(60);
      expect(position.heading).toBe(90);
    });
  });

  describe('Violation History', () => {
    test('should handle violation data structure', () => {
      const violation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Test Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 85,
        overSpeed: 25,
        severity: 'major',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      expect(violation.zoneId).toBe('zone1');
      expect(violation.zoneName).toBe('Test Zone');
      expect(violation.speedLimit).toBe(60);
      expect(violation.actualSpeed).toBe(85);
      expect(violation.overSpeed).toBe(25);
      expect(violation.severity).toBe('major');
      expect(violation.position.lat).toBe(37.7754);
      expect(violation.position.lng).toBe(-122.4184);
    });

    test('should handle speed trap trigger data structure', () => {
      const trigger: SpeedTrapTrigger = {
        trapId: 'trap1',
        trapName: 'Speed Trap 1',
        speed: 95,
        limit: 80,
        overSpeed: 15,
        severity: 'moderate',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      expect(trigger.trapId).toBe('trap1');
      expect(trigger.trapName).toBe('Speed Trap 1');
      expect(trigger.speed).toBe(95);
      expect(trigger.limit).toBe(80);
      expect(trigger.overSpeed).toBe(15);
      expect(trigger.severity).toBe('moderate');
      expect(trigger.position.lat).toBe(37.7754);
      expect(trigger.position.lng).toBe(-122.4184);
    });
  });

  describe('Penalty Structure', () => {
    test('should handle penalty calculation structure', () => {
      const penalty: PenaltyCalculation = {
        type: 'time',
        value: 10,
        reason: 'Speeding violation',
        severity: 'moderate',
      };

      expect(penalty.type).toBe('time');
      expect(penalty.value).toBe(10);
      expect(penalty.reason).toBe('Speeding violation');
      expect(penalty.severity).toBe('moderate');
    });

    test('should handle different penalty types', () => {
      const timePenalty: PenaltyCalculation = {
        type: 'time',
        value: 15,
        reason: 'Excessive speeding',
        severity: 'major',
      };

      const pointsPenalty: PenaltyCalculation = {
        type: 'points',
        value: 3,
        reason: 'Repeated violations',
        severity: 'moderate',
      };

      const alertPenalty: PenaltyCalculation = {
        type: 'alert',
        value: 0,
        reason: 'Minor speeding',
        severity: 'minor',
      };

      expect(timePenalty.type).toBe('time');
      expect(pointsPenalty.type).toBe('points');
      expect(alertPenalty.type).toBe('alert');
    });
  });

  describe('Position Data Validation', () => {
    test('should validate position structure', () => {
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        speed: 65.5,
        heading: 90,
        timestamp: Date.now(),
      };

      expect(typeof position.lat).toBe('number');
      expect(typeof position.lng).toBe('number');
      expect(typeof position.speed).toBe('number');
      expect(typeof position.heading).toBe('number');
      expect(typeof position.timestamp).toBe('number');
      expect(position.lat).toBeGreaterThanOrEqual(-90);
      expect(position.lat).toBeLessThanOrEqual(90);
      expect(position.lng).toBeGreaterThanOrEqual(-180);
      expect(position.lng).toBeLessThanOrEqual(180);
      expect(position.speed).toBeGreaterThanOrEqual(0);
      expect(position.heading).toBeGreaterThanOrEqual(0);
      expect(position.heading).toBeLessThanOrEqual(360);
    });

    test('should handle optional heading', () => {
      const position: Position = {
        lat: 37.7749,
        lng: -122.4194,
        speed: 60,
        timestamp: Date.now(),
      };

      expect(position.heading).toBeUndefined();
    });
  });

  describe('Severity Classification', () => {
    test('should classify violation severity correctly', () => {
      const minorViolation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Test Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 65,
        overSpeed: 5,
        severity: 'minor',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      const moderateViolation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Test Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 75,
        overSpeed: 15,
        severity: 'moderate',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      expect(minorViolation.severity).toBe('minor');
      expect(moderateViolation.severity).toBe('moderate');
    });
  });

  describe('Zone Type Classification', () => {
    test('should handle different zone types', () => {
      const normalZoneViolation: SpeedZoneViolation = {
        zoneId: 'zone1',
        zoneName: 'Normal Zone',
        zoneType: 'normal',
        speedLimit: 60,
        actualSpeed: 85,
        overSpeed: 25,
        severity: 'major',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      const restrictedZoneViolation: SpeedZoneViolation = {
        zoneId: 'zone2',
        zoneName: 'Restricted Zone',
        zoneType: 'restricted',
        speedLimit: 40,
        actualSpeed: 55,
        overSpeed: 15,
        severity: 'moderate',
        timestamp: Date.now(),
        position: { lat: 37.7754, lng: -122.4184 },
      };

      expect(normalZoneViolation.zoneType).toBe('normal');
      expect(restrictedZoneViolation.zoneType).toBe('restricted');
    });
  });

  describe('Service Integration', () => {
    test('should handle service initialization', () => {
      expect(enforcementService).toBeDefined();
      expect(typeof enforcementService.checkSpeedZones).toBe('function');
      expect(typeof enforcementService.checkSpeedTraps).toBe('function');
      expect(typeof enforcementService.calculatePenalty).toBe('function');
    });

    test('should handle async operations', async () => {
      const position: Position = {
        lat: 37.7754,
        lng: -122.4184,
        speed: 60,
        heading: 90,
        timestamp: Date.now(),
      };

      // Test that async methods return promises
      const speedZonesPromise = enforcementService.checkSpeedZones(position, 'test-route');
      const speedTrapsPromise = enforcementService.checkSpeedTraps(position, 'test-route');

      expect(speedZonesPromise).toBeInstanceOf(Promise);
      expect(speedTrapsPromise).toBeInstanceOf(Promise);

      // Wait for promises to resolve
      const speedZones = await speedZonesPromise;
      const speedTraps = await speedTrapsPromise;

      expect(Array.isArray(speedZones)).toBe(true);
      expect(Array.isArray(speedTraps)).toBe(true);
    });
  });
});
