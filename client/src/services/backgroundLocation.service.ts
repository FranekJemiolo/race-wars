/**
 * Background Location Tracking Service
 * 
 * Handles background location tracking for race sessions
 * Uses the Background Geolocation API where available
 * Falls back to standard geolocation with wake locks
 */

import type { PositionData } from './gpsTracking.service';

export interface BackgroundLocationConfig {
  desiredAccuracy: 'high' | 'medium' | 'low';
  updateInterval: number; // milliseconds
  stopOnTerminate: boolean;
  startOnBoot: boolean;
  distanceFilter: number; // meters
  notificationTitle: string;
  notificationText: string;
}

const DEFAULT_CONFIG: BackgroundLocationConfig = {
  desiredAccuracy: 'high',
  updateInterval: 1000,
  stopOnTerminate: false,
  startOnBoot: false,
  distanceFilter: 0,
  notificationTitle: 'Race Wars',
  notificationText: 'Tracking your location during the race',
};

export class BackgroundLocationService {
  private config: BackgroundLocationConfig;
  private isTracking = false;
  private watchId: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private onPositionUpdate?: (position: PositionData) => void;
  private onError?: (error: Error) => void;
  private sessionId: string;
  private positionBuffer: PositionData[] = [];
  private syncInterval: number | null = null;

  constructor(sessionId: string, config?: Partial<BackgroundLocationConfig>) {
    this.sessionId = sessionId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start background location tracking
   */
  async startTracking(
    onPositionUpdate?: (position: PositionData) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (this.isTracking) {
      console.warn('Background location tracking is already active');
      return;
    }

    this.onPositionUpdate = onPositionUpdate;
    this.onError = onError;

    try {
      // Try to use Background Geolocation API if available
      if ('BackgroundGeolocation' in window) {
        await this.startBackgroundGeolocation();
      } else {
        // Fall back to standard geolocation with wake lock
        await this.startStandardGeolocation();
      }

      this.isTracking = true;
      console.log('Background location tracking started for session:', this.sessionId);
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Stop background location tracking
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    try {
      // Stop Background Geolocation if active
      if ('BackgroundGeolocation' in window) {
        const bgGeo = (window as any).BackgroundGeolocation;
        await bgGeo.stop();
      }

      // Stop standard geolocation if active
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      // Release wake lock
      if (this.wakeLock) {
        await this.wakeLock.release();
        this.wakeLock = null;
      }

      // Clear sync interval
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      this.isTracking = false;
      console.log('Background location tracking stopped for session:', this.sessionId);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Check if background tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get current configuration
   */
  getConfig(): BackgroundLocationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BackgroundLocationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get buffered positions
   */
  getBufferedPositions(): PositionData[] {
    return [...this.positionBuffer];
  }

  /**
   * Clear position buffer
   */
  clearBuffer(): void {
    this.positionBuffer = [];
  }

  /**
   * Start using Background Geolocation API
   */
  private async startBackgroundGeolocation(): Promise<void> {
    const bgGeo = (window as any).BackgroundGeolocation;

    await bgGeo.configure({
      desiredAccuracy: this.config.desiredAccuracy,
      stationaryRadius: this.config.distanceFilter,
      distanceFilter: this.config.distanceFilter,
      stopOnTerminate: this.config.stopOnTerminate,
      startOnBoot: this.config.startOnBoot,
      locationTimeout: 30,
      notification: {
        title: this.config.notificationTitle,
        text: this.config.notificationText,
      },
    });

    bgGeo.on('location', (location: any) => {
      const positionData: PositionData = {
        lat: location.latitude,
        lng: location.longitude,
        speed: location.speed || 0,
        heading: location.bearing || 0,
        accuracy: location.accuracy,
        altitude: location.altitude,
        altitudeAccuracy: location.altitudeAccuracy,
        timestamp: location.time || Date.now(),
      };

      this.handlePositionUpdate(positionData);
    });

    bgGeo.on('error', (error: any) => {
      this.handleError(new Error(error.message || 'Background geolocation error'));
    });

    await bgGeo.start();
  }

  /**
   * Start using standard geolocation with wake lock
   */
  private async startStandardGeolocation(): Promise<void> {
    // Request wake lock to keep app running in background
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch (error) {
      console.warn('Could not acquire wake lock:', error);
    }

    // Start standard geolocation
    this.watchId = navigator.geolocation.watchPosition(
      this.handlePositionSuccess.bind(this),
      this.handlePositionError.bind(this),
      {
        enableHighAccuracy: this.config.desiredAccuracy === 'high',
        timeout: 30000,
        maximumAge: 0,
      }
    );

    // Set up periodic sync to ensure app stays alive
    this.syncInterval = window.setInterval(() => {
      this.syncBufferedPositions();
    }, this.config.updateInterval);
  }

  /**
   * Handle successful position update
   */
  private handlePositionSuccess(position: GeolocationPosition): void {
    const positionData: PositionData = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      speed: position.coords.speed || 0,
      heading: position.coords.heading || 0,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
      timestamp: position.timestamp,
    };

    this.handlePositionUpdate(positionData);
  }

  /**
   * Handle position error
   */
  private handlePositionError(error: GeolocationPositionError): void {
    const errorMessage = this.getGeolocationErrorMessage(error);
    this.handleError(new Error(errorMessage));
  }

  /**
   * Handle position update
   */
  private handlePositionUpdate(position: PositionData): void {
    this.positionBuffer.push(position);

    // Limit buffer size
    if (this.positionBuffer.length > 1000) {
      this.positionBuffer.shift();
    }

    if (this.onPositionUpdate) {
      this.onPositionUpdate(position);
    }
  }

  /**
   * Sync buffered positions to server
   */
  private syncBufferedPositions(): void {
    if (this.positionBuffer.length === 0) {
      return;
    }

    // In a real implementation, this would send positions to the server
    console.log(`Syncing ${this.positionBuffer.length} positions for session:`, this.sessionId);
    
    // Clear buffer after sync
    this.positionBuffer = [];
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('Background location tracking error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Get human-readable error message
   */
  private getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'User denied the request for geolocation';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable';
      case error.TIMEOUT:
        return 'The request to get user location timed out';
      default:
        return 'An unknown error occurred getting location';
    }
  }

  /**
   * Check if background geolocation is available
   */
  static isBackgroundGeolocationAvailable(): boolean {
    return 'BackgroundGeolocation' in window;
  }

  /**
   * Check if wake lock is available
   */
  static isWakeLockAvailable(): boolean {
    return 'wakeLock' in navigator;
  }

  /**
   * Get current battery level
   */
  static async getBatteryLevel(): Promise<number> {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return battery.level * 100;
    }
    return -1; // Not available
  }

  /**
   * Check if device is charging
   */
  static async isCharging(): Promise<boolean> {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return battery.charging;
    }
    return false; // Not available
  }
}

// Singleton instance
let backgroundLocationService: BackgroundLocationService | null = null;

export function getBackgroundLocationService(
  sessionId: string,
  config?: Partial<BackgroundLocationConfig>
): BackgroundLocationService {
  if (!backgroundLocationService || backgroundLocationService['sessionId'] !== sessionId) {
    backgroundLocationService = new BackgroundLocationService(sessionId, config);
  }
  return backgroundLocationService;
}

export function resetBackgroundLocationService(): void {
  if (backgroundLocationService) {
    backgroundLocationService.stopTracking();
    backgroundLocationService = null;
  }
}
