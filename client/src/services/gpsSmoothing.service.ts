/**
 * GPS Smoothing Service
 * 
 * Provides algorithms to smooth GPS position data
 * Reduces noise and improves accuracy of position tracking
 */

import type { PositionData } from './gpsTracking.service';

export interface SmoothingConfig {
  algorithm: 'kalman' | 'moving_average' | 'exponential' | 'none';
  windowSize: number; // For moving average
  alpha: number; // For exponential smoothing (0-1)
  processNoise: number; // For Kalman filter
  measurementNoise: number; // For Kalman filter
}

const DEFAULT_CONFIG: SmoothingConfig = {
  algorithm: 'kalman',
  windowSize: 5,
  alpha: 0.3,
  processNoise: 0.01,
  measurementNoise: 0.1,
};

export class GPSSmoothingService {
  private config: SmoothingConfig;
  private positionBuffer: PositionData[] = [];
  private kalmanState: KalmanState | null = null;

  constructor(config?: Partial<SmoothingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Smooth a position reading
   */
  smoothPosition(position: PositionData): PositionData {
    switch (this.config.algorithm) {
      case 'kalman':
        return this.kalmanFilter(position);
      case 'moving_average':
        return this.movingAverage(position);
      case 'exponential':
        return this.exponentialSmoothing(position);
      case 'none':
      default:
        return position;
    }
  }

  /**
   * Update smoothing configuration
   */
  updateConfig(newConfig: Partial<SmoothingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.reset();
  }

  /**
   * Reset smoothing state
   */
  reset(): void {
    this.positionBuffer = [];
    this.kalmanState = null;
  }

  /**
   * Kalman filter implementation
   */
  private kalmanFilter(position: PositionData): PositionData {
    if (!this.kalmanState) {
      // Initialize Kalman state with first reading
      this.kalmanState = {
        x: position.lat,
        y: position.lng,
        vx: 0,
        vy: 0,
        px: this.config.measurementNoise,
        py: this.config.measurementNoise,
        pvx: 1,
        pvy: 1,
      };
      return position;
    }

    const state = this.kalmanState;
    const dt = this.positionBuffer.length > 0
      ? (position.timestamp - this.positionBuffer[this.positionBuffer.length - 1].timestamp) / 1000
      : 1;

    // Predict step
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    state.px += this.config.processNoise * dt;
    state.py += this.config.processNoise * dt;
    state.pvx += this.config.processNoise * dt;
    state.pvy += this.config.processNoise * dt;

    // Update step
    const kx = state.px / (state.px + this.config.measurementNoise);
    const ky = state.py / (state.py + this.config.measurementNoise);

    state.x += kx * (position.lat - state.x);
    state.y += ky * (position.lng - state.y);
    state.px *= (1 - kx);
    state.py *= (1 - ky);

    // Update velocity estimate
    if (this.positionBuffer.length > 0) {
      const lastPos = this.positionBuffer[this.positionBuffer.length - 1];
      const vx = (position.lat - lastPos.lat) / dt;
      const vy = (position.lng - lastPos.lng) / dt;

      const kvx = state.pvx / (state.pvx + this.config.measurementNoise);
      const kvy = state.pvy / (state.pvy + this.config.measurementNoise);

      state.vx += kvx * (vx - state.vx);
      state.vy += kvy * (vy - state.vy);
      state.pvx *= (1 - kvx);
      state.pvy *= (1 - kvy);
    }

    this.positionBuffer.push(position);
    if (this.positionBuffer.length > this.config.windowSize) {
      this.positionBuffer.shift();
    }

    return {
      ...position,
      lat: state.x,
      lng: state.y,
    };
  }

  /**
   * Moving average smoothing
   */
  private movingAverage(position: PositionData): PositionData {
    this.positionBuffer.push(position);

    if (this.positionBuffer.length > this.config.windowSize) {
      this.positionBuffer.shift();
    }

    if (this.positionBuffer.length < 2) {
      return position;
    }

    const avgLat = this.positionBuffer.reduce((sum, p) => sum + p.lat, 0) / this.positionBuffer.length;
    const avgLng = this.positionBuffer.reduce((sum, p) => sum + p.lng, 0) / this.positionBuffer.length;
    const avgSpeed = this.positionBuffer.reduce((sum, p) => sum + p.speed, 0) / this.positionBuffer.length;
    const avgHeading = this.positionBuffer.reduce((sum, p) => sum + p.heading, 0) / this.positionBuffer.length;

    return {
      ...position,
      lat: avgLat,
      lng: avgLng,
      speed: avgSpeed,
      heading: avgHeading,
    };
  }

  /**
   * Exponential smoothing
   */
  private exponentialSmoothing(position: PositionData): PositionData {
    if (this.positionBuffer.length === 0) {
      this.positionBuffer.push(position);
      return position;
    }

    const last = this.positionBuffer[this.positionBuffer.length - 1];
    const alpha = this.config.alpha;

    const smoothed: PositionData = {
      ...position,
      lat: alpha * position.lat + (1 - alpha) * last.lat,
      lng: alpha * position.lng + (1 - alpha) * last.lng,
      speed: alpha * position.speed + (1 - alpha) * last.speed,
      heading: alpha * position.heading + (1 - alpha) * last.heading,
    };

    this.positionBuffer.push(smoothed);
    if (this.positionBuffer.length > this.config.windowSize) {
      this.positionBuffer.shift();
    }

    return smoothed;
  }

  /**
   * Outlier detection using median absolute deviation
   */
  static detectOutliers(positions: PositionData[], threshold: number = 3): boolean[] {
    if (positions.length < 3) {
      return positions.map(() => false);
    }

    const latitudes = positions.map(p => p.lat);
    const longitudes = positions.map(p => p.lng);

    const latOutliers = GPSSmoothingService.calculateMADOutliers(latitudes, threshold);
    const lngOutliers = GPSSmoothingService.calculateMADOutliers(longitudes, threshold);

    return latOutliers.map((lo, i) => lo || lngOutliers[i]);
  }

  /**
   * Calculate outliers using Median Absolute Deviation
   */
  private static calculateMADOutliers(values: number[], threshold: number): boolean[] {
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const deviations = sorted.map(v => Math.abs(v - median));
    const mad = deviations[Math.floor(deviations.length / 2)];

    if (mad === 0) {
      return values.map(() => false);
    }

    const scaledMad = 1.4826 * mad; // Scale factor for normal distribution
    const zScores = values.map(v => Math.abs((v - median) / scaledMad));

    return zScores.map(z => z > threshold);
  }

  /**
   * Interpolate between two positions
   */
  static interpolatePosition(pos1: PositionData, pos2: PositionData, fraction: number): PositionData {
    return {
      lat: pos1.lat + (pos2.lat - pos1.lat) * fraction,
      lng: pos1.lng + (pos2.lng - pos1.lng) * fraction,
      speed: pos1.speed + (pos2.speed - pos1.speed) * fraction,
      heading: pos1.heading + (pos2.heading - pos1.heading) * fraction,
      accuracy: pos1.accuracy + (pos2.accuracy - pos1.accuracy) * fraction,
      altitude: pos1.altitude && pos2.altitude
        ? pos1.altitude + (pos2.altitude - pos1.altitude) * fraction
        : undefined,
      altitudeAccuracy: pos1.altitudeAccuracy && pos2.altitudeAccuracy
        ? pos1.altitudeAccuracy + (pos2.altitudeAccuracy - pos1.altitudeAccuracy) * fraction
        : undefined,
      timestamp: pos1.timestamp + (pos2.timestamp - pos1.timestamp) * fraction,
    };
  }

  /**
   * Resample positions to a fixed interval
   */
  static resamplePositions(positions: PositionData[], intervalMs: number): PositionData[] {
    if (positions.length < 2) {
      return positions;
    }

    const resampled: PositionData[] = [];
    const startTime = positions[0].timestamp;
    const endTime = positions[positions.length - 1].timestamp;

    for (let t = startTime; t <= endTime; t += intervalMs) {
      // Find the two positions to interpolate between
      let i = 0;
      while (i < positions.length - 1 && positions[i + 1].timestamp < t) {
        i++;
      }

      if (i >= positions.length - 1) {
        resampled.push(positions[positions.length - 1]);
        break;
      }

      const pos1 = positions[i];
      const pos2 = positions[i + 1];

      if (pos1.timestamp === t) {
        resampled.push(pos1);
      } else {
        const fraction = (t - pos1.timestamp) / (pos2.timestamp - pos1.timestamp);
        resampled.push(GPSSmoothingService.interpolatePosition(pos1, pos2, fraction));
      }
    }

    return resampled;
  }

  /**
   * Calculate heading from consecutive positions
   */
  static calculateHeading(pos1: PositionData, pos2: PositionData): number {
    const lat1 = (pos1.lat * Math.PI) / 180;
    const lat2 = (pos2.lat * Math.PI) / 180;
    const lng1 = (pos1.lng * Math.PI) / 180;
    const lng2 = (pos2.lng * Math.PI) / 180;

    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);

    const heading = (Math.atan2(y, x) * 180) / Math.PI;
    return (heading + 360) % 360;
  }

  /**
   * Smooth heading using circular mean
   */
  static smoothHeading(headings: number[]): number {
    if (headings.length === 0) return 0;

    const sinSum = headings.reduce((sum, h) => sum + Math.sin((h * Math.PI) / 180), 0);
    const cosSum = headings.reduce((sum, h) => sum + Math.cos((h * Math.PI) / 180), 0);

    const avgHeading = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
    return (avgHeading + 360) % 360;
  }
}

interface KalmanState {
  x: number; // Latitude estimate
  y: number; // Longitude estimate
  vx: number; // Latitude velocity
  vy: number; // Longitude velocity
  px: number; // Latitude variance
  py: number; // Longitude variance
  pvx: number; // Latitude velocity variance
  pvy: number; // Longitude velocity variance
}
