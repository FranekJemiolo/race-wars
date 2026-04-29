/**
 * Anti-Cheat Detection Service Tests
 */

import { AntiCheatService, GPSDataPoint } from '../services/antiCheat.service';

describe('Anti-Cheat Service', () => {
  let antiCheatService: AntiCheatService;
  let testSessionId: string;
  let testParticipantId: string;

  beforeEach(() => {
    antiCheatService = new AntiCheatService({
      maxSpeed: 200,
      maxAcceleration: 30,
      maxDeceleration: 40,
      maxDistancePerUpdate: 100,
      minTimeBetweenUpdates: 500,
      windowSize: 10,
      anomalyThreshold: 2.0
    });
    testSessionId = 'test-session';
    testParticipantId = 'test-participant';
  });

  describe('Speed Anomaly Detection', () => {
    test('should detect excessive speed', async () => {
      const dataPoint: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: Date.now(),
        lat: 37.7749,
        lng: -122.4194,
        speed: 250, // Exceeds maxSpeed of 200
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      const result = await antiCheatService.analyzeGPSData(dataPoint);

      expect(result.isCheating).toBe(true);
      expect(result.anomalies).toHaveLength(1);
      expect(result.anomalies[0].type).toBe('speed_spike');
      expect(result.anomalies[0].severity).toBe('high');
      expect(result.riskScore).toBeGreaterThan(50);
    });

    test('should detect excessive acceleration', async () => {
      const baseTime = Date.now();
      
      // First data point - normal speed
      const dataPoint1: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime,
        lat: 37.7749,
        lng: -122.4194,
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      // Second data point - excessive acceleration
      const dataPoint2: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime + 1000, // 1 second later
        lat: 37.7750,
        lng: -122.4194,
        speed: 150, // 100 km/h increase in 1 second = 100 km/h/s acceleration
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      await antiCheatService.analyzeGPSData(dataPoint1);
      const result = await antiCheatService.analyzeGPSData(dataPoint2);

      expect(result.isCheating).toBe(true);
      expect(result.anomalies.some(a => a.type === 'impossible_trajectory')).toBe(true);
    });

    test('should not flag normal speeds', async () => {
      const dataPoint: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: Date.now(),
        lat: 37.7749,
        lng: -122.4194,
        speed: 80, // Normal speed
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      const result = await antiCheatService.analyzeGPSData(dataPoint);

      expect(result.isCheating).toBe(false);
      expect(result.riskScore).toBe(0);
    });
  });

  describe('Teleportation Detection', () => {
    test('should detect teleportation', async () => {
      const baseTime = Date.now();
      
      // First data point
      const dataPoint1: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime,
        lat: 37.7749,
        lng: -122.4194,
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      // Second data point - teleportation (much larger distance in very short time)
      const dataPoint2: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime + 50, // Only 50ms later
        lat: 37.7800, // Much further north (~560m)
        lng: -122.4100, // Much further east (~800m)
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      await antiCheatService.analyzeGPSData(dataPoint1);
      const result = await antiCheatService.analyzeGPSData(dataPoint2);

      expect(result.isCheating).toBe(true);
      expect(result.anomalies.some(a => a.type === 'teleportation')).toBe(true);
      expect(result.anomalies.some(a => a.severity === 'critical')).toBe(true);
    });

    test('should not flag normal movement', async () => {
      const baseTime = Date.now();
      
      // First data point
      const dataPoint1: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime,
        lat: 37.7749,
        lng: -122.4194,
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      // Second data point - normal movement
      const dataPoint2: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime + 1000, // 1 second later
        lat: 37.77495, // ~5.5m north
        lng: -122.41935, // ~4.6m east
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      await antiCheatService.analyzeGPSData(dataPoint1);
      const result = await antiCheatService.analyzeGPSData(dataPoint2);

      expect(result.isCheating).toBe(false);
      expect(result.riskScore).toBeLessThan(30);
    });
  });

  describe('GPS Quality Analysis', () => {
    test('should detect consistently perfect GPS (possible spoofing)', async () => {
      const baseTime = Date.now();
      
      // Send multiple perfect GPS readings
      for (let i = 0; i < 15; i++) {
        const dataPoint: GPSDataPoint = {
          sessionId: testSessionId,
          participantId: testParticipantId,
          timestamp: baseTime + i * 1000,
          lat: 37.7749 + i * 0.00001,
          lng: -122.4194 + i * 0.00001,
          speed: 50,
          heading: 0,
          accuracy: 0.5, // Perfect accuracy
          source: 'gps',
          quality: 'high',
          satelliteCount: 20 // Perfect satellite count
        };

        await antiCheatService.analyzeGPSData(dataPoint);
      }

      const result = await antiCheatService.analyzeGPSData({
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime + 15000,
        lat: 37.7749 + 0.00015,
        lng: -122.4194 + 0.00015,
        speed: 50,
        heading: 0,
        accuracy: 0.5,
        source: 'gps',
        quality: 'high',
        satelliteCount: 20
      });

      expect(result.isCheating).toBe(true);
      expect(result.anomalies.some(a => a.type === 'gps_spoofing')).toBe(true);
    });

    test('should detect stuck GPS', async () => {
      const baseTime = Date.now();
      
      // Send GPS data showing no movement but speed > 0
      // Need to send enough points to trigger the detection
      for (let i = 0; i < 10; i++) {
        const dataPoint: GPSDataPoint = {
          sessionId: testSessionId,
          participantId: testParticipantId,
          timestamp: baseTime + i * 1000,
          lat: 37.7749, // Same position
          lng: -122.4194, // Same position
          speed: 30, // But moving
          heading: 0,
          accuracy: 5,
          source: 'gps',
          quality: 'medium'
        };

        await antiCheatService.analyzeGPSData(dataPoint);
      }

      // Send final point to trigger detection (now we have 11 points, last 5 will be analyzed)
      const result = await antiCheatService.analyzeGPSData({
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime + 10000,
        lat: 37.7749,
        lng: -122.4194,
        speed: 30,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'medium'
      });

      expect(result.isCheating).toBe(true);
      expect(result.anomalies.some(a => a.type === 'gps_spoofing')).toBe(true);
    });
  });

  describe('Pattern Analysis', () => {
    test('should detect robotic behavior', async () => {
      const baseTime = Date.now();
      
      // Send data with perfectly consistent intervals
      for (let i = 0; i < 12; i++) {
        const dataPoint: GPSDataPoint = {
          sessionId: testSessionId,
          participantId: testParticipantId,
          timestamp: baseTime + i * 500, // Perfect 500ms intervals
          lat: 37.7749 + i * 0.00001,
          lng: -122.4194 + i * 0.00001,
          speed: 50,
          heading: 0,
          accuracy: 5,
          source: 'gps',
          quality: 'medium'
        };

        await antiCheatService.analyzeGPSData(dataPoint);
      }

      const result = await antiCheatService.analyzeGPSData({
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime + 6000,
        lat: 37.7749 + 0.00012,
        lng: -122.4194 + 0.00012,
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'medium'
      });

      expect(result.anomalies.some(a => a.type === 'behavioral_inconsistency')).toBe(true);
    });
  });

  describe('Risk Score Calculation', () => {
    test('should calculate appropriate risk scores', async () => {
      const baseTime = Date.now();
      
      // Multiple anomalies should increase risk score
      const dataPoint1: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime,
        lat: 37.7749,
        lng: -122.4194,
        speed: 250, // Speed anomaly
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      const dataPoint2: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: baseTime + 50, // Very short time
        lat: 37.7800, // Far distance for teleportation
        lng: -122.4100,
        speed: 250,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      await antiCheatService.analyzeGPSData(dataPoint1);
      const result = await antiCheatService.analyzeGPSData(dataPoint2);

      expect(result.riskScore).toBeGreaterThan(70);
      expect(result.isCheating).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(1);
    });
  });

  describe('Data Management', () => {
    test('should store and retrieve participant history', async () => {
      const dataPoint: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: Date.now(),
        lat: 37.7749,
        lng: -122.4194,
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      await antiCheatService.analyzeGPSData(dataPoint);
      
      const history = antiCheatService.getParticipantHistory(testParticipantId);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(dataPoint);
    });

    test('should limit history size', async () => {
      const baseTime = Date.now();
      
      // Send more than 100 data points
      for (let i = 0; i < 120; i++) {
        const dataPoint: GPSDataPoint = {
          sessionId: testSessionId,
          participantId: testParticipantId,
          timestamp: baseTime + i * 1000,
          lat: 37.7749 + i * 0.00001,
          lng: -122.4194 + i * 0.00001,
          speed: 50,
          heading: 0,
          accuracy: 5,
          source: 'gps',
          quality: 'high'
        };

        await antiCheatService.analyzeGPSData(dataPoint);
      }

      const history = antiCheatService.getParticipantHistory(testParticipantId);
      expect(history.length).toBeLessThanOrEqual(100);
    });

    test('should clear participant history', async () => {
      const dataPoint: GPSDataPoint = {
        sessionId: testSessionId,
        participantId: testParticipantId,
        timestamp: Date.now(),
        lat: 37.7749,
        lng: -122.4194,
        speed: 50,
        heading: 0,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      };

      await antiCheatService.analyzeGPSData(dataPoint);
      expect(antiCheatService.getParticipantHistory(testParticipantId)).toHaveLength(1);
      
      antiCheatService.clearParticipantHistory(testParticipantId);
      expect(antiCheatService.getParticipantHistory(testParticipantId)).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    test('should update configuration', () => {
      const newConfig = {
        maxSpeed: 300,
        maxAcceleration: 40,
        anomalyThreshold: 3.0
      };

      antiCheatService.updateConfig(newConfig);
      
      const updatedConfig = antiCheatService.getConfig();
      expect(updatedConfig.maxSpeed).toBe(300);
      expect(updatedConfig.maxAcceleration).toBe(40);
      expect(updatedConfig.anomalyThreshold).toBe(3.0);
    });
  });
});
