/**
 * Advanced Anti-Cheat Detection Service
 * 
 * Uses AI/ML patterns to detect cheating behaviors in racing
 * Analyzes GPS data, speed patterns, and behavioral anomalies
 */

import { logger } from '../utils/logger';

export interface GPSDataPoint {
  sessionId: string;
  participantId: string;
  timestamp: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  source: 'gps' | 'simulation' | 'mock';
  quality: 'high' | 'medium' | 'low';
  satelliteCount?: number;
  hdop?: number;
  vdop?: number;
}

export interface AnomalyDetection {
  type: 'speed_spike' | 'teleportation' | 'impossible_trajectory' | 'gps_spoofing' | 'pattern_anomaly' | 'behavioral_inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  evidence: any;
  timestamp: number;
}

export interface CheatDetectionResult {
  participantId: string;
  sessionId: string;
  isCheating: boolean;
  confidence: number;
  anomalies: AnomalyDetection[];
  riskScore: number; // 0-100
  recommendations: string[];
}

export interface AntiCheatConfig {
  // Speed detection thresholds
  maxSpeed: number; // km/h
  maxAcceleration: number; // km/h per second
  maxDeceleration: number; // km/h per second
  
  // Teleportation detection
  maxDistancePerUpdate: number; // meters
  minTimeBetweenUpdates: number; // milliseconds
  
  // GPS quality thresholds
  minAccuracy: number; // meters
  minSatelliteCount: number;
  maxHdop: number;
  maxVdop: number;
  
  // Pattern analysis
  windowSize: number; // number of data points to analyze
  anomalyThreshold: number; // standard deviations from mean
}

export class AntiCheatService {
  private config: AntiCheatConfig;
  private dataHistory: Map<string, GPSDataPoint[]> = new Map();
  private baselineProfiles: Map<string, any> = new Map();
  
  // ML Model placeholders (in real implementation, these would be trained models)
  private speedAnomalyModel: any = null;
  private trajectoryModel: any = null;
  private behaviorModel: any = null;

  constructor(config?: Partial<AntiCheatConfig>) {
    this.config = {
      maxSpeed: 350, // km/h - reasonable max for racing
      maxAcceleration: 50, // km/h per second
      maxDeceleration: 60, // km/h per second
      maxDistancePerUpdate: 200, // meters
      minTimeBetweenUpdates: 500, // milliseconds
      minAccuracy: 50, // meters
      minSatelliteCount: 4,
      maxHdop: 4.0,
      maxVdop: 4.0,
      windowSize: 20,
      anomalyThreshold: 2.5,
      ...config
    };
  }

  /**
   * Analyze GPS data for cheating patterns
   */
  async analyzeGPSData(dataPoint: GPSDataPoint): Promise<CheatDetectionResult> {
    const participantId = dataPoint.participantId;
    const sessionId = dataPoint.sessionId;
    
    // Store data point
    this.storeDataPoint(participantId, dataPoint);
    
    // Get historical data
    const history = this.dataHistory.get(participantId) || [];
    
    // Perform various analyses
    const anomalies: AnomalyDetection[] = [];
    
    // 1. Speed analysis
    const speedAnomalies = this.analyzeSpeedPatterns(history);
    anomalies.push(...speedAnomalies);
    
    // 2. Trajectory analysis
    const trajectoryAnomalies = this.analyzeTrajectory(history);
    anomalies.push(...trajectoryAnomalies);
    
    // 3. GPS quality analysis
    const qualityAnomalies = this.analyzeGPSQuality(dataPoint, history);
    anomalies.push(...qualityAnomalies);
    
    // 4. Pattern analysis
    const patternAnomalies = this.analyzePatterns(history);
    anomalies.push(...patternAnomalies);
    
    // 5. Behavioral analysis
    const behavioralAnomalies = this.analyzeBehavior(history);
    anomalies.push(...behavioralAnomalies);
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(anomalies);
    
    // Determine if cheating is likely
    const isCheating = riskScore > 70; // Threshold for cheating detection
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(anomalies);
    
    const result: CheatDetectionResult = {
      participantId,
      sessionId,
      isCheating,
      confidence: Math.min(riskScore / 100, 1),
      anomalies,
      riskScore,
      recommendations
    };
    
    // Log significant findings
    if (isCheating) {
      logger.warn(`Cheat detected for participant ${participantId}`, {
        riskScore,
        anomalies: anomalies.length,
        sessionId
      });
    }
    
    return result;
  }

  /**
   * Store GPS data point for analysis
   */
  private storeDataPoint(participantId: string, dataPoint: GPSDataPoint): void {
    if (!this.dataHistory.has(participantId)) {
      this.dataHistory.set(participantId, []);
    }
    
    const history = this.dataHistory.get(participantId)!;
    history.push(dataPoint);
    
    // Limit history size
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Analyze speed patterns for anomalies
   */
  private analyzeSpeedPatterns(history: GPSDataPoint[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    if (history.length < 1) return anomalies;
    
    const latest = history[history.length - 1];
    
    // Check for excessive speed in the latest reading
    if (latest.speed > this.config.maxSpeed) {
      anomalies.push({
        type: 'speed_spike',
        severity: 'high',
        confidence: Math.min(latest.speed / this.config.maxSpeed, 1),
        description: `Speed ${latest.speed} km/h exceeds maximum ${this.config.maxSpeed} km/h`,
        evidence: { speed: latest.speed, maxSpeed: this.config.maxSpeed },
        timestamp: latest.timestamp
      });
    }
    
    // Check acceleration/deceleration if we have at least 2 points
    if (history.length >= 2) {
      const prev = history[history.length - 2];
      const curr = latest;
      
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      if (timeDiff > 0) {
        const speedDiff = curr.speed - prev.speed;
        const acceleration = speedDiff / timeDiff;
        
        // Check for excessive acceleration
        if (acceleration > this.config.maxAcceleration) {
          anomalies.push({
            type: 'impossible_trajectory',
            severity: 'medium',
            confidence: Math.min(acceleration / this.config.maxAcceleration, 1),
            description: `Acceleration ${acceleration.toFixed(1)} km/h/s exceeds maximum ${this.config.maxAcceleration} km/h/s`,
            evidence: { acceleration, maxAcceleration: this.config.maxAcceleration },
            timestamp: curr.timestamp
          });
        }
        
        // Check for excessive deceleration
        if (acceleration < -this.config.maxDeceleration) {
          anomalies.push({
            type: 'impossible_trajectory',
            severity: 'medium',
            confidence: Math.min(Math.abs(acceleration) / this.config.maxDeceleration, 1),
            description: `Deceleration ${Math.abs(acceleration).toFixed(1)} km/h/s exceeds maximum ${this.config.maxDeceleration} km/h/s`,
            evidence: { deceleration: Math.abs(acceleration), maxDeceleration: this.config.maxDeceleration },
            timestamp: curr.timestamp
          });
        }
      }
    }
    
    return anomalies;
  }

  /**
   * Analyze trajectory for teleportation or impossible movement
   */
  private analyzeTrajectory(history: GPSDataPoint[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    if (history.length < 2) return anomalies;
    
    const prev = history[history.length - 2];
    const curr = history[history.length - 1];
    
    const distance = this.calculateDistance(prev, curr);
    const timeDiff = curr.timestamp - prev.timestamp;
    
    // Check for teleportation (impossible distance in short time)
    if (distance > this.config.maxDistancePerUpdate && timeDiff < this.config.minTimeBetweenUpdates) {
      anomalies.push({
        type: 'teleportation',
        severity: 'critical',
        confidence: Math.min(distance / this.config.maxDistancePerUpdate, 1),
        description: `Teleportation detected: moved ${distance.toFixed(1)}m in ${timeDiff}ms`,
        evidence: { distance, timeDiff, maxDistance: this.config.maxDistancePerUpdate },
        timestamp: curr.timestamp
      });
    }
    
    // Check for impossible trajectory (sharp turns at high speed)
    if (prev.speed > 50 && curr.speed > 50) { // Only check at high speeds
      const headingDiff = Math.abs(curr.heading - prev.heading);
      const normalizedHeadingDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;
      
      if (normalizedHeadingDiff > 90) { // Sharp turn
        anomalies.push({
          type: 'impossible_trajectory',
          severity: 'medium',
          confidence: Math.min(normalizedHeadingDiff / 90, 1),
          description: `Sharp turn ${normalizedHeadingDiff.toFixed(1)}° at high speed ${curr.speed} km/h`,
          evidence: { headingChange: normalizedHeadingDiff, speed: curr.speed },
          timestamp: curr.timestamp
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Analyze GPS quality for spoofing indicators
   */
  private analyzeGPSQuality(dataPoint: GPSDataPoint, history: GPSDataPoint[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // Check for consistently perfect GPS (possible spoofing)
    if (dataPoint.accuracy < 1 && dataPoint.satelliteCount && dataPoint.satelliteCount > 15) {
      const perfectGPSCount = history.filter(p => 
        p.accuracy < 1 && p.satelliteCount && p.satelliteCount > 15
      ).length;
      
      if (perfectGPSCount > 10) {
        anomalies.push({
          type: 'gps_spoofing',
          severity: 'medium',
          confidence: Math.min(perfectGPSCount / 20, 1),
          description: 'Consistently perfect GPS readings may indicate spoofing',
          evidence: { perfectGPSCount, accuracy: dataPoint.accuracy, satelliteCount: dataPoint.satelliteCount },
          timestamp: dataPoint.timestamp
        });
      }
    }
    
    // Check for stuck GPS (no movement but GPS updates)
    if (history.length >= 5) {
      const recent = history.slice(-5);
      const positions = recent.map(p => ({ lat: p.lat, lng: p.lng }));
      const hasMovement = positions.some((pos, i) => {
        if (i === 0) return false;
        const distance = this.calculateDistance(
          { lat: positions[i-1].lat, lng: positions[i-1].lng } as any,
          pos as any
        );
        return distance > 1; // More than 1 meter
      });
      
      if (!hasMovement && recent.some(p => p.speed > 0)) {
        anomalies.push({
          type: 'gps_spoofing',
          severity: 'low',
          confidence: 0.7,
          description: 'GPS reports movement but position coordinates are static',
          evidence: { recentPositions: positions, speeds: recent.map(p => p.speed) },
          timestamp: dataPoint.timestamp
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Analyze patterns using statistical methods
   */
  private analyzePatterns(history: GPSDataPoint[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    if (history.length < this.config.windowSize) return anomalies;
    
    const window = history.slice(-this.config.windowSize);
    
    // Analyze speed patterns
    const speeds = window.map(p => p.speed);
    const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const stdSpeed = Math.sqrt(speeds.reduce((sq, n) => sq + Math.pow(n - meanSpeed, 2), 0) / speeds.length);
    
    // Check for speed anomalies
    for (const speed of speeds) {
      const zScore = Math.abs((speed - meanSpeed) / stdSpeed);
      if (zScore > this.config.anomalyThreshold) {
        anomalies.push({
          type: 'pattern_anomaly',
          severity: 'low',
          confidence: Math.min(zScore / this.config.anomalyThreshold, 1),
          description: `Speed ${speed.toFixed(1)} km/h is ${zScore.toFixed(1)} standard deviations from mean`,
          evidence: { speed, meanSpeed, stdSpeed, zScore },
          timestamp: window.find(p => p.speed === speed)?.timestamp || Date.now()
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Analyze behavioral patterns
   */
  private analyzeBehavior(history: GPSDataPoint[]): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    if (history.length < 10) return anomalies;
    
    const recent = history.slice(-10);
    
    // Check for robotic behavior (perfectly consistent intervals)
    const intervals = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i].timestamp - recent[i-1].timestamp);
    }
    
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sq, n) => sq + Math.pow(n - meanInterval, 2), 0) / intervals.length;
    const stdInterval = Math.sqrt(intervalVariance);
    
    // Very low variance in intervals suggests robotic behavior
    if (stdInterval < 10 && meanInterval < 2000) { // Less than 10ms variance and frequent updates
      anomalies.push({
        type: 'behavioral_inconsistency',
        severity: 'medium',
        confidence: Math.min(1 - stdInterval / 10, 1),
        description: 'Update intervals are too consistent, suggesting automated behavior',
        evidence: { meanInterval, stdInterval, intervals },
        timestamp: recent[recent.length - 1].timestamp
      });
    }
    
    return anomalies;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(anomalies: AnomalyDetection[]): number {
    if (anomalies.length === 0) return 0;
    
    let totalScore = 0;
    let weightSum = 0;
    
    for (const anomaly of anomalies) {
      const severityWeight = {
        low: 1,
        medium: 3,
        high: 7,
        critical: 10
      }[anomaly.severity];
      
      totalScore += anomaly.confidence * severityWeight * 10;
      weightSum += severityWeight * 10;
    }
    
    return weightSum > 0 ? Math.min(totalScore / weightSum * 100, 100) : 0;
  }

  /**
   * Generate recommendations based on detected anomalies
   */
  private generateRecommendations(anomalies: AnomalyDetection[]): string[] {
    const recommendations: string[] = [];
    
    const anomalyTypes = new Set(anomalies.map(a => a.type));
    
    if (anomalyTypes.has('speed_spike')) {
      recommendations.push('Review speed readings for possible GPS errors or speed modifications');
    }
    
    if (anomalyTypes.has('teleportation')) {
      recommendations.push('Investigate possible GPS spoofing or location manipulation');
    }
    
    if (anomalyTypes.has('impossible_trajectory')) {
      recommendations.push('Check for trajectory manipulation or physics violations');
    }
    
    if (anomalyTypes.has('gps_spoofing')) {
      recommendations.push('Verify GPS source and check for spoofed signals');
    }
    
    if (anomalyTypes.has('pattern_anomaly')) {
      recommendations.push('Monitor for unusual patterns in speed or movement');
    }
    
    if (anomalyTypes.has('behavioral_inconsistency')) {
      recommendations.push('Review participant behavior for automated or robotic patterns');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring for suspicious activity');
    }
    
    return recommendations;
  }

  /**
   * Calculate distance between two GPS points
   */
  private calculateDistance(point1: GPSDataPoint | { lat: number; lng: number }, point2: GPSDataPoint | { lat: number; lng: number }): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get participant's data history
   */
  getParticipantHistory(participantId: string): GPSDataPoint[] {
    return this.dataHistory.get(participantId) || [];
  }

  /**
   * Clear data history for a participant
   */
  clearParticipantHistory(participantId: string): void {
    this.dataHistory.delete(participantId);
  }

  /**
   * Update anti-cheat configuration
   */
  updateConfig(newConfig: Partial<AntiCheatConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Anti-cheat configuration updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): AntiCheatConfig {
    return { ...this.config };
  }
}

// Singleton instance
let antiCheatService: AntiCheatService | null = null;

export function getAntiCheatService(config?: Partial<AntiCheatConfig>): AntiCheatService {
  if (!antiCheatService) {
    antiCheatService = new AntiCheatService(config);
  }
  return antiCheatService;
}
