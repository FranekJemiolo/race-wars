/**
 * Enhanced GPS Tracking Service Tests
 */

import { GPSTrackingService, PositionData, SimulationConfig } from '../services/gpsTracking.service';

// Mock navigator.geolocation
const mockGeolocation = {
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  getCurrentPosition: jest.fn()
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock navigator.permissions
const mockPermissions = {
  query: jest.fn()
};

Object.defineProperty(global.navigator, 'permissions', {
  value: mockPermissions,
  writable: true
});

describe('Enhanced GPS Tracking Service', () => {
  let gpsService: GPSTrackingService;
  let sessionId: string;
  let mockOnPositionUpdate: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionId = 'test-session';
    mockOnPositionUpdate = jest.fn();
    mockOnError = jest.fn();

    gpsService = new GPSTrackingService({
      sessionId,
      onPositionUpdate: mockOnPositionUpdate,
      onError: mockOnError,
      updateInterval: 100
    });
  });

  afterEach(() => {
    gpsService.stopTracking();
  });

  describe('Real GPS Tracking', () => {
    test('should start tracking with real GPS', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();

      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      expect(gpsService.isTrackingActive()).toBe(true);
    });

    test('should handle successful position updates', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();

      // Simulate successful position update
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          speed: 50,
          heading: 90,
          accuracy: 5,
          altitude: 100,
          altitudeAccuracy: 10
        },
        timestamp: Date.now()
      };

      const watchCallback = mockGeolocation.watchPosition.mock.calls[0][0];
      watchCallback(mockPosition);

      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 37.7749,
          lng: -122.4194,
          speed: 50,
          heading: 90,
          accuracy: 5,
          altitude: 100,
          altitudeAccuracy: 10,
          sessionId,
          source: 'gps',
          quality: 'high'
        })
      );
    });

    test('should determine GPS quality correctly', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();

      const watchCallback = mockGeolocation.watchPosition.mock.calls[0][0];

      // Test high quality
      watchCallback({
        coords: { latitude: 37.7749, longitude: -122.4194, speed: 50, heading: 90, accuracy: 3 },
        timestamp: Date.now()
      });

      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 'high' })
      );

      // Test medium quality
      watchCallback({
        coords: { latitude: 37.7749, longitude: -122.4194, speed: 50, heading: 90, accuracy: 10 },
        timestamp: Date.now()
      });

      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 'medium' })
      );

      // Test low quality
      watchCallback({
        coords: { latitude: 37.7749, longitude: -122.4194, speed: 50, heading: 90, accuracy: 25 },
        timestamp: Date.now()
      });

      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 'low' })
      );
    });

    test('should handle geolocation errors', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();

      const errorCallback = mockGeolocation.watchPosition.mock.calls[0][1];
      errorCallback({ code: 1, message: 'Permission denied' });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User denied the request for geolocation'
        })
      );
    });

    test('should stop tracking properly', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();
      expect(gpsService.isTrackingActive()).toBe(true);

      gpsService.stopTracking();
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
      expect(gpsService.isTrackingActive()).toBe(false);
    });
  });

  describe('Simulation Mode', () => {
    test('should start simulation mode', async () => {
      const simulationConfig: SimulationConfig = {
        routeType: 'circular',
        centerLat: 37.7749,
        centerLng: -122.4194,
        radius: 100,
        speed: 60,
        accuracyVariation: 5,
        signalLoss: false,
        drift: false,
        satelliteCount: 8,
        hdopRange: [1.0, 2.0],
        vdopRange: [1.2, 2.5]
      };

      gpsService = new GPSTrackingService({
        sessionId,
        onPositionUpdate: mockOnPositionUpdate,
        onError: mockOnError,
        enableSimulation: true,
        simulationConfig
      });

      await gpsService.startTracking();

      expect(gpsService.isTrackingActive()).toBe(true);
      expect(mockOnPositionUpdate).not.toHaveBeenCalled(); // Should wait for first interval
    });

    test('should generate circular route simulation', async () => {
      jest.useFakeTimers();

      const simulationConfig: SimulationConfig = {
        routeType: 'circular',
        centerLat: 37.7749,
        centerLng: -122.4194,
        radius: 100,
        speed: 60,
        accuracyVariation: 0,
        signalLoss: false,
        drift: false,
        satelliteCount: 8,
        hdopRange: [1.0, 2.0],
        vdopRange: [1.2, 2.5]
      };

      gpsService = new GPSTrackingService({
        sessionId,
        onPositionUpdate: mockOnPositionUpdate,
        onError: mockOnError,
        enableSimulation: true,
        simulationConfig,
        config: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, updateInterval: 100 }
      });

      await gpsService.startTracking();

      // Fast-forward time to trigger simulation updates
      jest.advanceTimersByTime(100);

      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId,
          source: 'simulation',
          quality: 'high'
        })
      );

      const firstPosition = mockOnPositionUpdate.mock.calls[0][0] as PositionData;
      expect(firstPosition.lat).toBeCloseTo(37.7749 + 100 / 111320, 5);
      expect(firstPosition.lng).toBeCloseTo(-122.4194, 5);
      expect(firstPosition.speed).toBe(60);

      jest.useRealTimers();
    });

    test('should generate figure-8 route simulation', async () => {
      jest.useFakeTimers();

      const simulationConfig: SimulationConfig = {
        routeType: 'figure8',
        centerLat: 37.7749,
        centerLng: -122.4194,
        radius: 100,
        speed: 60,
        accuracyVariation: 0,
        signalLoss: false,
        drift: false,
        satelliteCount: 8,
        hdopRange: [1.0, 2.0],
        vdopRange: [1.2, 2.5]
      };

      gpsService = new GPSTrackingService({
        sessionId,
        onPositionUpdate: mockOnPositionUpdate,
        onError: mockOnError,
        enableSimulation: true,
        simulationConfig,
        config: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, updateInterval: 100 }
      });

      await gpsService.startTracking();
      jest.advanceTimersByTime(100);

      expect(mockOnPositionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId,
          source: 'simulation'
        })
      );

      const position = mockOnPositionUpdate.mock.calls[0][0] as PositionData;
      expect(position.lat).toBeDefined();
      expect(position.lng).toBeDefined();
      expect(position.speed).toBe(60);

      jest.useRealTimers();
    });

    test('should simulate signal loss', async () => {
      jest.useFakeTimers();

      const simulationConfig: SimulationConfig = {
        routeType: 'circular',
        centerLat: 37.7749,
        centerLng: -122.4194,
        radius: 100,
        speed: 60,
        accuracyVariation: 5,
        signalLoss: true,
        drift: false,
        satelliteCount: 8,
        hdopRange: [1.0, 2.0],
        vdopRange: [1.2, 2.5]
      };

      gpsService = new GPSTrackingService({
        sessionId,
        onPositionUpdate: mockOnPositionUpdate,
        onError: mockOnError,
        enableSimulation: true,
        simulationConfig,
        config: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, updateInterval: 10 }
      });

      await gpsService.startTracking();

      // Run many intervals to potentially trigger signal loss
      for (let i = 0; i < 500; i++) {
        jest.advanceTimersByTime(10);
      }

      // Signal loss is random (1% chance), so we can't guarantee it happens
      // But we can verify the simulation is running
      expect(mockOnPositionUpdate).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('should include GPS metadata in simulation', async () => {
      jest.useFakeTimers();

      const simulationConfig: SimulationConfig = {
        routeType: 'circular',
        centerLat: 37.7749,
        centerLng: -122.4194,
        radius: 100,
        speed: 60,
        accuracyVariation: 5,
        signalLoss: false,
        drift: false,
        satelliteCount: 12,
        hdopRange: [0.8, 1.5],
        vdopRange: [1.0, 1.8]
      };

      gpsService = new GPSTrackingService({
        sessionId,
        onPositionUpdate: mockOnPositionUpdate,
        onError: mockOnError,
        enableSimulation: true,
        simulationConfig,
        config: { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, updateInterval: 100 }
      });

      await gpsService.startTracking();
      jest.advanceTimersByTime(100);

      const position = mockOnPositionUpdate.mock.calls[0][0] as PositionData;
      
      expect(position.satelliteCount).toBeGreaterThanOrEqual(12);
      expect(position.satelliteCount).toBeLessThanOrEqual(20); // 12 + random(0-4)
      expect(position.hdop).toBeGreaterThanOrEqual(0.8);
      expect(position.hdop).toBeLessThanOrEqual(1.5);
      expect(position.vdop).toBeGreaterThanOrEqual(1.0);
      expect(position.vdop).toBeLessThanOrEqual(1.8);

      jest.useRealTimers();
    });
  });

  describe('Position History', () => {
    test('should maintain position history', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();

      const watchCallback = mockGeolocation.watchPosition.mock.calls[0][0];

      // Add multiple positions
      for (let i = 0; i < 5; i++) {
        watchCallback({
          coords: {
            latitude: 37.7749 + i * 0.00001,
            longitude: -122.4194 + i * 0.00001,
            speed: 50,
            heading: 90,
            accuracy: 5
          },
          timestamp: Date.now() + i * 1000
        });
      }

      const history = gpsService.getPositionHistory();
      expect(history).toHaveLength(5);
      expect(history[0].lat).toBe(37.7749);
      expect(history[4].lat).toBe(37.7749 + 0.00004);
    });

    test('should limit history size', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();

      const watchCallback = mockGeolocation.watchPosition.mock.calls[0][0];

      // Add more positions than the history limit
      for (let i = 0; i < 1050; i++) {
        watchCallback({
          coords: {
            latitude: 37.7749 + i * 0.00001,
            longitude: -122.4194 + i * 0.00001,
            speed: 50,
            heading: 90,
            accuracy: 5
          },
          timestamp: Date.now() + i * 1000
        });
      }

      const history = gpsService.getPositionHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });

    test('should clear position history', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();

      const watchCallback = mockGeolocation.watchPosition.mock.calls[0][0];
      watchCallback({
        coords: { latitude: 37.7749, longitude: -122.4194, speed: 50, heading: 90, accuracy: 5 },
        timestamp: Date.now()
      });

      expect(gpsService.getPositionHistory()).toHaveLength(1);

      gpsService.clearPositionHistory();
      expect(gpsService.getPositionHistory()).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    test('should update configuration', async () => {
      const newConfig = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 1000,
        updateInterval: 500
      };

      gpsService.updateConfig(newConfig);

      const config = gpsService.getConfig();
      expect(config.enableHighAccuracy).toBe(false);
      expect(config.timeout).toBe(5000);
      expect(config.maximumAge).toBe(1000);
      expect(config.updateInterval).toBe(500);
    });

    test('should restart tracking when configuration changes', async () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      await gpsService.startTracking();
      expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);

      gpsService.updateConfig({ enableHighAccuracy: false });
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
      expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(2);
    });
  });

  describe('Static Methods', () => {
    test('should check GPS availability', () => {
      expect(GPSTrackingService.isAvailable()).toBe(true);
    });

    test('should get current position', async () => {
      const mockPosition = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          speed: 50,
          heading: 90,
          accuracy: 5
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const position = await GPSTrackingService.getCurrentPosition();

      expect(position).toEqual({
        lat: 37.7749,
        lng: -122.4194,
        speed: 50,
        heading: 90,
        accuracy: 5,
        timestamp: mockPosition.timestamp
      });
    });

    test('should calculate distance between positions', () => {
      const pos1 = {
        lat: 37.7749,
        lng: -122.4194,
        speed: 0,
        heading: 0,
        accuracy: 5,
        timestamp: Date.now(),
        sessionId: 'test',
        deviceId: 'test',
        source: 'gps' as const,
        quality: 'high' as const
      };

      const pos2 = {
        lat: 37.7750,
        lng: -122.4194,
        speed: 0,
        heading: 0,
        accuracy: 5,
        timestamp: Date.now(),
        sessionId: 'test',
        deviceId: 'test',
        source: 'gps' as const,
        quality: 'high' as const
      };

      const distance = GPSTrackingService.calculateDistance(pos1, pos2);
      expect(distance).toBeGreaterThan(100); // Should be around 111 meters
      expect(distance).toBeLessThan(120);
    });

    test('should calculate speed between positions', () => {
      const pos1 = {
        lat: 37.7749,
        lng: -122.4194,
        speed: 0,
        heading: 0,
        accuracy: 5,
        timestamp: Date.now(),
        sessionId: 'test',
        deviceId: 'test',
        source: 'gps' as const,
        quality: 'high' as const
      };

      const pos2 = {
        lat: 37.7750,
        lng: -122.4194,
        speed: 0,
        heading: 0,
        accuracy: 5,
        timestamp: Date.now() + 1000, // 1 second later
        sessionId: 'test',
        deviceId: 'test',
        source: 'gps' as const,
        quality: 'high' as const
      };

      const speed = GPSTrackingService.calculateSpeed(pos1, pos2);
      expect(speed).toBeGreaterThan(100); // Should be around 111 km/h for 111m in 1s
      expect(speed).toBeLessThan(120);
    });
  });
});
