/**
 * GPS Tracking Service
 * 
 * Handles client-side GPS tracking for race sessions
 * Uses the browser's Geolocation API to track driver position
 */

export interface PositionData {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  timestamp: number;
  // Enhanced tracking data
  sessionId: string;
  deviceId?: string;
  source: 'gps' | 'simulation' | 'mock';
  quality: 'high' | 'medium' | 'low';
  satelliteCount?: number;
  hdop?: number; // Horizontal dilution of precision
  vdop?: number; // Vertical dilution of precision
}

export interface GPSConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  updateInterval: number;
}

export interface SimulationConfig {
  // Route simulation
  routeType: 'circular' | 'linear' | 'figure8' | 'custom';
  centerLat: number;
  centerLng: number;
  radius: number; // in meters
  speed: number; // in km/h
  // Data quality simulation
  accuracyVariation: number; // GPS accuracy variation in meters
  signalLoss: boolean; // Simulate occasional signal loss
  drift: boolean; // Simulate GPS drift
  // Advanced simulation
  satelliteCount: number;
  hdopRange: [number, number];
  vdopRange: [number, number];
}

export interface GPSTrackingOptions {
  sessionId: string;
  onPositionUpdate?: (position: PositionData) => void;
  onError?: (error: Error) => void;
  config?: Partial<GPSConfig>;
  // Enhanced options
  deviceId?: string;
  enableSimulation?: boolean;
  simulationConfig?: SimulationConfig;
}

const DEFAULT_CONFIG: GPSConfig = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  updateInterval: 1000,
};

export class GPSTrackingService {
  private watchId: number | null = null;
  private isTracking = false;
  private config: GPSConfig;
  private sessionId: string;
  public onPositionUpdate?: (position: PositionData) => void;
  public onError?: (error: Error) => void;
  private lastPosition: PositionData | null = null;
  private positionHistory: PositionData[] = [];
  private maxHistorySize = 1000;
  
  // Enhanced tracking features
  private deviceId: string;
  private enableSimulation: boolean;
  private simulationConfig?: SimulationConfig;
  private simulationInterval?: NodeJS.Timeout;
  private simulationAngle = 0;
  private simulationTime = 0;

  constructor(options: GPSTrackingOptions) {
    this.sessionId = options.sessionId;
    this.onPositionUpdate = options.onPositionUpdate;
    this.onError = options.onError;
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.deviceId = options.deviceId || this.generateDeviceId();
    this.enableSimulation = options.enableSimulation || false;
    this.simulationConfig = options.simulationConfig;
  }

  /**
   * Start GPS tracking
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.warn('GPS tracking is already active');
      return;
    }

    if (this.enableSimulation) {
      // Start simulation mode
      this.startSimulation();
      this.isTracking = true;
      console.log('GPS simulation started for session:', this.sessionId);
      return;
    }

    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser');
      this.handleError(error);
      throw error;
    }

    try {
      // Request permission if needed
      await this.requestPermission();

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        this.handlePositionSuccess.bind(this),
        this.handlePositionError.bind(this),
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
        }
      );

      this.isTracking = true;
      console.log('GPS tracking started for session:', this.sessionId);
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Stop GPS tracking
   */
  stopTracking(): void {
    if (this.enableSimulation && this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    console.log('GPS tracking stopped for session:', this.sessionId);
  }

  /**
   * Get current tracking status
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get last known position
   */
  getLastPosition(): PositionData | null {
    return this.lastPosition;
  }

  /**
   * Get position history
   */
  getPositionHistory(): PositionData[] {
    return [...this.positionHistory];
  }

  /**
   * Clear position history
   */
  clearPositionHistory(): void {
    this.positionHistory = [];
  }

  /**
   * Get current GPS configuration
   */
  getConfig(): GPSConfig {
    return { ...this.config };
  }

  /**
   * Update GPS configuration
   */
  updateConfig(newConfig: Partial<GPSConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart tracking if configuration changed and tracking is active
    if (this.isTracking) {
      this.stopTracking();
      this.startTracking();
    }
  }

  /**
   * Request geolocation permission
   */
  private async requestPermission(): Promise<void> {
    // For iOS 13+, we need to request permission explicitly
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (result.state === 'denied') {
          throw new Error('Geolocation permission denied');
        }
        if (result.state === 'prompt') {
          // The browser will show the permission prompt on the first watchPosition call
        }
      } catch (error) {
        console.warn('Could not query geolocation permission:', error);
      }
    }
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
      // Enhanced tracking data
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      source: 'gps',
      quality: this.determineQuality(position.coords.accuracy),
    };

    this.lastPosition = positionData;
    this.addToHistory(positionData);

    if (this.onPositionUpdate) {
      this.onPositionUpdate(positionData);
    }
  }

  /**
   * Handle position error
   */
  private handlePositionError(error: GeolocationPositionError): void {
    const errorMessage = this.getGeolocationErrorMessage(error);
    const err = new Error(errorMessage);
    this.handleError(err);
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
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('GPS tracking error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Add position to history
   */
  private addToHistory(position: PositionData): void {
    this.positionHistory.push(position);

    // Limit history size
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }
  }

  /**
   * Start simulation mode
   */
  private startSimulation(): void {
    if (!this.simulationConfig) {
      throw new Error('Simulation config is required for simulation mode');
    }

    this.simulationTime = 0;
    this.simulationAngle = 0;

    this.simulationInterval = setInterval(() => {
      const position = this.generateSimulatedPosition();
      this.lastPosition = position;
      this.addToHistory(position);

      if (this.onPositionUpdate) {
        this.onPositionUpdate(position);
      }

      this.simulationTime += this.config.updateInterval;
    }, this.config.updateInterval);
  }

  /**
   * Generate simulated GPS position
   */
  private generateSimulatedPosition(): PositionData {
    if (!this.simulationConfig) {
      throw new Error('Simulation config is required');
    }

    const { routeType, centerLat, centerLng, radius, speed, accuracyVariation, signalLoss, drift } = this.simulationConfig;
    
    let lat: number, lng: number, heading: number;
    
    switch (routeType) {
      case 'circular':
        heading = (this.simulationAngle * 180 / Math.PI) % 360;
        lat = centerLat + (radius / 111320) * Math.cos(this.simulationAngle);
        lng = centerLng + (radius / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(this.simulationAngle);
        this.simulationAngle += (speed / 3.6) / radius * (this.config.updateInterval / 1000);
        break;
        
      case 'figure8':
        const t = this.simulationAngle;
        lat = centerLat + (radius / 111320) * Math.sin(t);
        lng = centerLng + (radius / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(2 * t) / 2;
        heading = Math.atan2(Math.cos(t), Math.cos(2 * t) / 2) * 180 / Math.PI;
        this.simulationAngle += (speed / 3.6) / radius * (this.config.updateInterval / 1000);
        break;
        
      case 'linear':
        const distance = (speed / 3.6) * (this.simulationTime / 1000);
        lat = centerLat + (distance / 111320);
        lng = centerLng + (distance / (111320 * Math.cos(centerLat * Math.PI / 180))) * 0.1;
        heading = 45; // Northeast direction
        break;
        
      default:
        lat = centerLat;
        lng = centerLng;
        heading = 0;
    }

    // Add drift if enabled
    if (drift) {
      lat += (Math.random() - 0.5) * 0.00001;
      lng += (Math.random() - 0.5) * 0.00001;
    }

    // Simulate signal loss
    if (signalLoss && Math.random() < 0.01) { // 1% chance of signal loss
      return this.lastPosition || {
        lat, lng, speed: 0, heading, accuracy: 1000,
        sessionId: this.sessionId,
        deviceId: this.deviceId,
        source: 'simulation',
        quality: 'low',
        timestamp: Date.now()
      };
    }

    const accuracy = 5 + Math.random() * accuracyVariation;
    
    return {
      lat,
      lng,
      speed,
      heading,
      accuracy,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceId: this.deviceId,
      source: 'simulation',
      quality: this.determineQuality(accuracy),
      satelliteCount: this.simulationConfig.satelliteCount || 8 + Math.floor(Math.random() * 8),
      hdop: this.simulationConfig.hdopRange ? 
        this.simulationConfig.hdopRange[0] + Math.random() * (this.simulationConfig.hdopRange[1] - this.simulationConfig.hdopRange[0]) : 
        undefined,
      vdop: this.simulationConfig.vdopRange ? 
        this.simulationConfig.vdopRange[0] + Math.random() * (this.simulationConfig.vdopRange[1] - this.simulationConfig.vdopRange[0]) : 
        undefined,
    };
  }

  /**
   * Determine GPS quality based on accuracy
   */
  private determineQuality(accuracy: number): 'high' | 'medium' | 'low' {
    if (accuracy < 5) return 'high';
    if (accuracy < 20) return 'medium';
    return 'low';
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return 'device-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Calculate distance between two positions (in meters)
   */
  static calculateDistance(pos1: PositionData, pos2: PositionData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (pos1.lat * Math.PI) / 180;
    const φ2 = (pos2.lat * Math.PI) / 180;
    const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate speed between two positions (in km/h)
   */
  static calculateSpeed(pos1: PositionData, pos2: PositionData): number {
    const distance = GPSTrackingService.calculateDistance(pos1, pos2);
    const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000; // seconds

    if (timeDiff === 0) return 0;

    const speedMps = distance / timeDiff; // meters per second
    return speedMps * 3.6; // km/h
  }

  /**
   * Check if GPS is available
   */
  static isAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current position once (single shot)
   */
  static async getCurrentPosition(options?: PositionOptions): Promise<PositionData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(new Error(GPSTrackingService.getGeolocationErrorMessageStatic(error)));
        },
        options
      );
    });
  }

  /**
   * Static version of error message getter
   */
  private static getGeolocationErrorMessageStatic(error: GeolocationPositionError): string {
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
}

// Singleton instance
let gpsTrackingService: GPSTrackingService | null = null;

export function getGPSTrackingService(options: GPSTrackingOptions): GPSTrackingService {
  if (!gpsTrackingService) {
    gpsTrackingService = new GPSTrackingService(options);
  }
  return gpsTrackingService;
}

export function resetGPSTrackingService(): void {
  if (gpsTrackingService) {
    gpsTrackingService.stopTracking();
    gpsTrackingService = null;
  }
}
