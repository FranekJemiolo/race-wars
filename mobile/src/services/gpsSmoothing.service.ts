import type {PositionData} from './gpsTracking.service';

export interface SmoothingConfig {
  algorithm: 'kalman' | 'moving_average' | 'exponential' | 'none';
  windowSize: number;
  alpha: number;
  processNoise: number;
  measurementNoise: number;
}

const DEFAULT_CONFIG: SmoothingConfig = {
  algorithm: 'kalman',
  windowSize: 5,
  alpha: 0.3,
  processNoise: 0.01,
  measurementNoise: 0.1,
};

interface KalmanState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  px: number;
  py: number;
  pvx: number;
  pvy: number;
}

export class GPSSmoothingService {
  private config: SmoothingConfig;
  private positionBuffer: PositionData[] = [];
  private kalmanState: KalmanState | null = null;

  constructor(config?: Partial<SmoothingConfig>) {
    this.config = {...DEFAULT_CONFIG, ...config};
  }

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

  updateConfig(newConfig: Partial<SmoothingConfig>): void {
    this.config = {...this.config, ...newConfig};
    this.reset();
  }

  reset(): void {
    this.positionBuffer = [];
    this.kalmanState = null;
  }

  private kalmanFilter(position: PositionData): PositionData {
    if (!this.kalmanState) {
      this.kalmanState = {
        x: position.lat,
        y: position.lng,
        vx: 0,
        vy: 0,
        px: 1,
        py: 1,
        pvx: 1,
        pvy: 1,
      };
      return position;
    }

    const state = this.kalmanState;
    const dt = 1; // Assume 1 second interval

    // Predict
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    state.px += this.config.processNoise;
    state.py += this.config.processNoise;
    state.pvx += this.config.processNoise;
    state.pvy += this.config.processNoise;

    // Update
    const kx = state.px / (state.px + this.config.measurementNoise);
    const ky = state.py / (state.py + this.config.measurementNoise);

    state.x += kx * (position.lat - state.x);
    state.y += ky * (position.lng - state.y);
    state.px *= (1 - kx);
    state.py *= (1 - ky);

    return {
      ...position,
      lat: state.x,
      lng: state.y,
    };
  }

  private movingAverage(position: PositionData): PositionData {
    this.positionBuffer.push(position);
    if (this.positionBuffer.length > this.config.windowSize) {
      this.positionBuffer.shift();
    }

    const avgLat =
      this.positionBuffer.reduce((sum, p) => sum + p.lat, 0) /
      this.positionBuffer.length;
    const avgLng =
      this.positionBuffer.reduce((sum, p) => sum + p.lng, 0) /
      this.positionBuffer.length;
    const avgSpeed =
      this.positionBuffer.reduce((sum, p) => sum + p.speed, 0) /
      this.positionBuffer.length;
    const avgHeading =
      this.positionBuffer.reduce((sum, p) => sum + p.heading, 0) /
      this.positionBuffer.length;

    return {
      ...position,
      lat: avgLat,
      lng: avgLng,
      speed: avgSpeed,
      heading: avgHeading,
    };
  }

  private exponentialSmoothing(position: PositionData): PositionData {
    if (this.positionBuffer.length === 0) {
      this.positionBuffer.push(position);
      return position;
    }

    const last = this.positionBuffer[this.positionBuffer.length - 1];
    const smoothed: PositionData = {
      ...position,
      lat: this.config.alpha * position.lat + (1 - this.config.alpha) * last.lat,
      lng: this.config.alpha * position.lng + (1 - this.config.alpha) * last.lng,
      speed:
        this.config.alpha * position.speed +
        (1 - this.config.alpha) * last.speed,
      heading:
        this.config.alpha * position.heading +
        (1 - this.config.alpha) * last.heading,
    };

    this.positionBuffer.push(smoothed);
    return smoothed;
  }

  static detectOutliers(
    positions: PositionData[],
    threshold: number = 3,
  ): boolean[] {
    const latitudes = positions.map(p => p.lat);
    const longitudes = positions.map(p => p.lng);
    const speeds = positions.map(p => p.speed);

    const latOutliers = this.calculateMADOutliers(latitudes, threshold);
    const lngOutliers = this.calculateMADOutliers(longitudes, threshold);
    const speedOutliers = this.calculateMADOutliers(speeds, threshold);

    return positions.map(
      (_, i) => latOutliers[i] || lngOutliers[i] || speedOutliers[i],
    );
  }

  private static calculateMADOutliers(
    values: number[],
    threshold: number,
  ): boolean[] {
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const deviations = sorted.map(v => Math.abs(v - median));
    const mad = deviations[Math.floor(deviations.length / 2)] || 1;

    return values.map(v => Math.abs(v - median) > threshold * mad);
  }

  static interpolatePosition(
    pos1: PositionData,
    pos2: PositionData,
    fraction: number,
  ): PositionData {
    return {
      lat: pos1.lat + (pos2.lat - pos1.lat) * fraction,
      lng: pos1.lng + (pos2.lng - pos1.lng) * fraction,
      speed: pos1.speed + (pos2.speed - pos1.speed) * fraction,
      heading: pos1.heading + (pos2.heading - pos1.heading) * fraction,
      accuracy: pos1.accuracy,
      timestamp: pos1.timestamp + (pos2.timestamp - pos1.timestamp) * fraction,
    };
  }

  static resamplePositions(
    positions: PositionData[],
    intervalMs: number,
  ): PositionData[] {
    if (positions.length < 2) return positions;

    const resampled: PositionData[] = [];
    let currentTime = positions[0].timestamp;
    let currentIndex = 0;

    while (currentIndex < positions.length - 1) {
      const pos1 = positions[currentIndex];
      const pos2 = positions[currentIndex + 1];

      if (currentTime >= pos1.timestamp && currentTime <= pos2.timestamp) {
        const fraction =
          (currentTime - pos1.timestamp) / (pos2.timestamp - pos1.timestamp);
        resampled.push(this.interpolatePosition(pos1, pos2, fraction));
        currentTime += intervalMs;
      } else if (currentTime > pos2.timestamp) {
        currentIndex++;
      } else {
        currentTime += intervalMs;
      }
    }

    return resampled;
  }

  static calculateHeading(pos1: PositionData, pos2: PositionData): number {
    const lat1 = (pos1.lat * Math.PI) / 180;
    const lat2 = (pos2.lat * Math.PI) / 180;
    const lng1 = (pos1.lng * Math.PI) / 180;
    const lng2 = (pos2.lng * Math.PI) / 180;

    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  static smoothHeading(headings: number[]): number {
    if (headings.length === 0) return 0;

    const sinSum = headings.reduce((sum, h) => sum + Math.sin((h * Math.PI) / 180), 0);
    const cosSum = headings.reduce((sum, h) => sum + Math.cos((h * Math.PI) / 180), 0);

    const avgHeading = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
    return (avgHeading + 360) % 360;
  }
}
