/**
 * E2E Tests for GPS Tracking Workflow
 * 
 * Tests the complete GPS tracking workflow including:
 * - GPS tracking service initialization and start/stop
 * - Position updates and history
 * - GPS smoothing algorithms
 * - Background location tracking
 * - Power optimization
 * - Integration between services
 */

import { GPSTrackingService, getGPSTrackingService, resetGPSTrackingService } from '../services/gpsTracking.service';
import { GPSSmoothingService } from '../services/gpsSmoothing.service';
import { BackgroundLocationService, getBackgroundLocationService, resetBackgroundLocationService } from '../services/backgroundLocation.service';
import { GPSPowerOptimizationService, getGPSPowerOptimizationService, resetGPSPowerOptimizationService } from '../services/gpsPowerOptimization.service';
import type { PositionData } from '../services/gpsTracking.service';

describe('GPS Tracking E2E Workflow', () => {
  let gpsService: GPSTrackingService;
  let smoothingService: GPSSmoothingService;
  let backgroundService: BackgroundLocationService;
  let powerService: GPSPowerOptimizationService;

  beforeEach(() => {
    resetGPSTrackingService();
    resetBackgroundLocationService();
    resetGPSPowerOptimizationService();

    gpsService = getGPSTrackingService({
      sessionId: 'test-session-1',
      config: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        updateInterval: 1000,
      },
    });

    smoothingService = new GPSSmoothingService();
    backgroundService = getBackgroundLocationService('test-session-1');
    powerService = getGPSPowerOptimizationService();
  });

  afterEach(() => {
    if (gpsService) {
      gpsService.stopTracking();
    }
    if (backgroundService) {
      backgroundService.stopTracking();
    }
    if (powerService) {
      powerService.stopMonitoring();
    }
  });

  describe('Complete GPS Tracking Workflow', () => {
    test('should handle complete tracking session with smoothing', async () => {
      const positions: PositionData[] = [];
      
      gpsService.onPositionUpdate = (position) => {
        const smoothed = smoothingService.smoothPosition(position);
        positions.push(smoothed);
      };

      await gpsService.startTracking();

      // Simulate position updates
      const mockPositions: PositionData[] = [
        { lat: 37.7754, lng: -122.4184, speed: 50, heading: 90, accuracy: 10, timestamp: Date.now() },
        { lat: 37.7755, lng: -122.4185, speed: 52, heading: 91, accuracy: 10, timestamp: Date.now() + 1000 },
        { lat: 37.7756, lng: -122.4186, speed: 54, heading: 92, accuracy: 10, timestamp: Date.now() + 2000 },
      ];

      // Manually trigger position updates (in real scenario, geolocation API would do this)
      mockPositions.forEach(pos => {
        const mockCoords = {
          latitude: pos.lat,
          longitude: pos.lng,
          speed: pos.speed,
          heading: pos.heading,
          accuracy: pos.accuracy,
          altitude: pos.altitude ?? null,
          altitudeAccuracy: pos.altitudeAccuracy ?? null,
        } as GeolocationCoordinates;
        (mockCoords as any).toJSON = () => ({});

        const mockPosition = {
          coords: mockCoords,
          timestamp: pos.timestamp,
        } as GeolocationPosition;
        (mockPosition as any).toJSON = () => ({});

        gpsService['handlePositionSuccess'](mockPosition);
      });

      expect(positions.length).toBeGreaterThan(0);
      expect(gpsService.isTrackingActive()).toBe(true);

      gpsService.stopTracking();
      expect(gpsService.isTrackingActive()).toBe(false);
    });

    test('should handle position history management', async () => {
      await gpsService.startTracking();

      const history = gpsService.getPositionHistory();
      expect(Array.isArray(history)).toBe(true);

      gpsService.clearPositionHistory();
      expect(gpsService.getPositionHistory().length).toBe(0);

      gpsService.stopTracking();
    });
  });

  describe('GPS Smoothing Workflow', () => {
    test('should apply kalman filter smoothing', () => {
      smoothingService.updateConfig({ algorithm: 'kalman' });

      const positions: PositionData[] = [
        { lat: 37.7754, lng: -122.4184, speed: 50, heading: 90, accuracy: 10, timestamp: Date.now() },
        { lat: 37.7755, lng: -122.4185, speed: 52, heading: 91, accuracy: 10, timestamp: Date.now() + 1000 },
        { lat: 37.7756, lng: -122.4186, speed: 54, heading: 92, accuracy: 10, timestamp: Date.now() + 2000 },
      ];

      const smoothed = positions.map(p => smoothingService.smoothPosition(p));

      expect(smoothed.length).toBe(positions.length);
      smoothed.forEach((pos, i) => {
        expect(pos.lat).toBeDefined();
        expect(pos.lng).toBeDefined();
      });
    });

    test('should detect outliers in position data', () => {
      const positions: PositionData[] = [
        { lat: 37.7754, lng: -122.4184, speed: 50, heading: 90, accuracy: 10, timestamp: Date.now() },
        { lat: 37.7755, lng: -122.4185, speed: 52, heading: 91, accuracy: 10, timestamp: Date.now() + 1000 },
        { lat: 37.7756, lng: -122.4186, speed: 54, heading: 92, accuracy: 10, timestamp: Date.now() + 2000 },
        { lat: 40.0000, lng: -120.0000, speed: 200, heading: 0, accuracy: 100, timestamp: Date.now() + 3000 }, // Outlier
      ];

      const outliers = GPSSmoothingService.detectOutliers(positions, 3);

      expect(outliers.length).toBe(positions.length);
      expect(outliers[3]).toBe(true); // Last position should be detected as outlier
    });

    test('should resample positions to fixed interval', () => {
      const positions: PositionData[] = [
        { lat: 37.7754, lng: -122.4184, speed: 50, heading: 90, accuracy: 10, timestamp: 0 },
        { lat: 37.7755, lng: -122.4185, speed: 52, heading: 91, accuracy: 10, timestamp: 2000 },
        { lat: 37.7756, lng: -122.4186, speed: 54, heading: 92, accuracy: 10, timestamp: 4000 },
      ];

      const resampled = GPSSmoothingService.resamplePositions(positions, 1000);

      expect(resampled.length).toBeGreaterThan(positions.length);
    });
  });

  describe('Background Location Workflow', () => {
    test('should handle background tracking lifecycle', async () => {
      const positions: PositionData[] = [];

      backgroundService.startTracking(
        (position) => {
          positions.push(position);
        },
        (error) => {
          console.error('Background tracking error:', error);
        }
      );

      // Check if service is tracking
      expect(backgroundService.isTrackingActive()).toBe(true);

      // Get buffered positions
      const buffered = backgroundService.getBufferedPositions();
      expect(Array.isArray(buffered)).toBe(true);

      await backgroundService.stopTracking();
      expect(backgroundService.isTrackingActive()).toBe(false);
    });

    test('should handle configuration updates', () => {
      const newConfig = {
        desiredAccuracy: 'medium' as const,
        updateInterval: 2000,
      };

      backgroundService.updateConfig(newConfig);

      const config = backgroundService.getConfig();
      expect(config.desiredAccuracy).toBe('medium');
      expect(config.updateInterval).toBe(2000);
    });
  });

  describe('Power Optimization Workflow', () => {
    test('should adapt tracking based on battery level', async () => {
      let currentMode: string = '';

      powerService.startMonitoring(
        (mode) => {
          currentMode = mode;
        },
        () => {
          console.warn('Critical battery');
        }
      );

      const interval = powerService.getRecommendedUpdateInterval();
      expect(interval).toBeGreaterThan(0);

      const accuracy = powerService.getRecommendedAccuracy();
      expect(['high', 'medium', 'low']).toContain(accuracy);

      powerService.stopMonitoring();
    });

    test('should estimate battery drain', () => {
      const drain = GPSPowerOptimizationService.estimateBatteryDrain(
        1000, // 1 second interval
        'high',
        60 // 60 minutes
      );

      expect(drain).toBeGreaterThan(0);
      expect(drain).toBeLessThan(100); // Should not exceed 100%
    });

    test('should calculate estimated tracking time', () => {
      const time = GPSPowerOptimizationService.getEstimatedTrackingTime(
        100, // 100% battery
        1000, // 1 second interval
        'high'
      );

      expect(time).toBeGreaterThan(0);
    });
  });

  describe('Integration Workflow', () => {
    test('should integrate GPS tracking with smoothing and power optimization', async () => {
      const positions: PositionData[] = [];
      let powerMode: string = '';

      // Start power monitoring
      powerService.startMonitoring(
        (mode) => {
          powerMode = mode;
        }
      );

      // Get optimized config
      const optimizedConfig = powerService.getOptimizedConfig();

      // Configure GPS service with power-optimized settings
      gpsService.updateConfig({
        updateInterval: optimizedConfig.updateInterval || 1000,
      });

      // Configure smoothing
      smoothingService.updateConfig({ algorithm: 'kalman' });

      // Start tracking
      gpsService.onPositionUpdate = (position) => {
        const smoothed = smoothingService.smoothPosition(position);
        positions.push(smoothed);
      };

      await gpsService.startTracking();

      // Simulate position updates
      const mockPositions: PositionData[] = [
        { lat: 37.7754, lng: -122.4184, speed: 50, heading: 90, accuracy: 10, timestamp: Date.now() },
        { lat: 37.7755, lng: -122.4185, speed: 52, heading: 91, accuracy: 10, timestamp: Date.now() + 1000 },
      ];

      mockPositions.forEach(pos => {
        const mockCoords = {
          latitude: pos.lat,
          longitude: pos.lng,
          speed: pos.speed,
          heading: pos.heading,
          accuracy: pos.accuracy,
          altitude: pos.altitude ?? null,
          altitudeAccuracy: pos.altitudeAccuracy ?? null,
        } as GeolocationCoordinates;
        (mockCoords as any).toJSON = () => ({});

        const mockPosition = {
          coords: mockCoords,
          timestamp: pos.timestamp,
        } as GeolocationPosition;
        (mockPosition as any).toJSON = () => ({});

        gpsService['handlePositionSuccess'](mockPosition);
      });

      expect(positions.length).toBeGreaterThan(0);
      expect(powerMode).toBeDefined();

      // Cleanup
      gpsService.stopTracking();
      powerService.stopMonitoring();
    });

    test('should handle error scenarios gracefully', async () => {
      let errorReceived = false;

      gpsService.onError = (error) => {
        errorReceived = true;
      };

      // Try to start tracking without geolocation support
      const originalGeolocation = navigator.geolocation;
      delete (navigator as any).geolocation;

      try {
        await gpsService.startTracking();
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Restore geolocation
      (navigator as any).geolocation = originalGeolocation;
    });
  });

  describe('Performance Tests', () => {
    test('should handle high-frequency position updates', async () => {
      const positions: PositionData[] = [];
      const updateCount = 100;

      gpsService.onPositionUpdate = (position) => {
        positions.push(position);
      };

      await gpsService.startTracking();

      const startTime = Date.now();

      for (let i = 0; i < updateCount; i++) {
        const mockCoords = {
          latitude: 37.7754 + (i * 0.0001),
          longitude: -122.4184 + (i * 0.0001),
          speed: 50 + i,
          heading: 90 + i,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
        } as GeolocationCoordinates;
        (mockCoords as any).toJSON = () => ({});

        const mockPosition = {
          coords: mockCoords,
          timestamp: Date.now() + (i * 10),
        } as GeolocationPosition;
        (mockPosition as any).toJSON = () => ({});

        gpsService['handlePositionSuccess'](mockPosition);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(positions.length).toBe(updateCount);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second

      gpsService.stopTracking();
    });

    test('should handle large position history', async () => {
      await gpsService.startTracking();

      // Add many positions to history
      for (let i = 0; i < 1500; i++) {
        const mockCoords = {
          latitude: 37.7754 + (i * 0.0001),
          longitude: -122.4184 + (i * 0.0001),
          speed: 50,
          heading: 90,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
        } as GeolocationCoordinates;
        (mockCoords as any).toJSON = () => ({});

        const mockPosition = {
          coords: mockCoords,
          timestamp: Date.now() + (i * 10),
        } as GeolocationPosition;
        (mockPosition as any).toJSON = () => ({});

        gpsService['handlePositionSuccess'](mockPosition);
      }

      const history = gpsService.getPositionHistory();
      expect(history.length).toBeLessThanOrEqual(1000); // Should be limited to maxHistorySize

      gpsService.stopTracking();
    });
  });

  describe('Data Consistency Tests', () => {
    test('should maintain data consistency across service restarts', async () => {
      const positions1: PositionData[] = [];

      gpsService.onPositionUpdate = (position) => {
        positions1.push(position);
      };

      await gpsService.startTracking();

      const mockCoords = {
        latitude: 37.7754,
        longitude: -122.4184,
        speed: 50,
        heading: 90,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
      } as GeolocationCoordinates;
      (mockCoords as any).toJSON = () => ({});

      const mockPosition = {
        coords: mockCoords,
        timestamp: Date.now(),
      } as GeolocationPosition;
      (mockPosition as any).toJSON = () => ({});

      gpsService['handlePositionSuccess'](mockPosition);

      gpsService.stopTracking();

      // Reset and restart
      resetGPSTrackingService();
      gpsService = getGPSTrackingService({
        sessionId: 'test-session-1',
      });

      const positions2: PositionData[] = [];
      gpsService.onPositionUpdate = (position) => {
        positions2.push(position);
      };

      await gpsService.startTracking();

      const mockCoords2 = {
        latitude: 37.7755,
        longitude: -122.4185,
        speed: 52,
        heading: 91,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
      } as GeolocationCoordinates;
      (mockCoords2 as any).toJSON = () => ({});

      const mockPosition2 = {
        coords: mockCoords2,
        timestamp: Date.now(),
      } as GeolocationPosition;
      (mockPosition2 as any).toJSON = () => ({});

      gpsService['handlePositionSuccess'](mockPosition2);

      expect(positions1.length).toBe(1);
      expect(positions2.length).toBe(1);

      gpsService.stopTracking();
    });
  });
});
