import Geolocation from '@react-native-community/geolocation';

export interface PositionData {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  timestamp: number;
}

export interface GPSConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  updateInterval: number;
}

const DEFAULT_CONFIG: GPSConfig = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  updateInterval: 1000,
};

export interface GPSTrackingOptions {
  sessionId: string;
  onPositionUpdate?: (position: PositionData) => void;
  onError?: (error: Error) => void;
  config?: Partial<GPSConfig>;
}

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

  constructor(options: GPSTrackingOptions) {
    this.sessionId = options.sessionId;
    this.onPositionUpdate = options.onPositionUpdate;
    this.onError = options.onError;
    this.config = {...DEFAULT_CONFIG, ...options.config};
  }

  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.warn('GPS tracking is already active');
      return;
    }

    try {
      await this.requestPermission();

      this.watchId = Geolocation.watchPosition(
        this.handlePositionSuccess.bind(this),
        this.handlePositionError.bind(this),
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
          distanceFilter: 0,
        },
      );

      this.isTracking = true;
      console.log('GPS tracking started for session:', this.sessionId);
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    console.log('GPS tracking stopped for session:', this.sessionId);
  }

  private async requestPermission(): Promise<void> {
    // TODO: Implement permission request using react-native-permissions
    console.log('Requesting GPS permission');
  }

  private handlePositionSuccess(position: any): void {
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

    this.lastPosition = positionData;
    this.addToHistory(positionData);

    if (this.onPositionUpdate) {
      this.onPositionUpdate(positionData);
    }
  }

  private handlePositionError(error: any): void {
    const errorMessage = this.getGeolocationErrorMessage(error);
    const errorObj = new Error(errorMessage);
    this.handleError(errorObj);
  }

  private handleError(error: Error): void {
    console.error('GPS tracking error:', error.message);
    if (this.onError) {
      this.onError(error);
    }
  }

  private addToHistory(position: PositionData): void {
    this.positionHistory.push(position);
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }
  }

  getLastPosition(): PositionData | null {
    return this.lastPosition;
  }

  getPositionHistory(): PositionData[] {
    return [...this.positionHistory];
  }

  clearHistory(): void {
    this.positionHistory = [];
  }

  updateConfig(newConfig: Partial<GPSConfig>): void {
    this.config = {...this.config, ...newConfig};
  }

  isTrackingActive(): boolean {
    return this.isTracking;
  }

  private getGeolocationErrorMessage(error: any): string {
    switch (error.code) {
      case 1:
        return 'Location permission denied';
      case 2:
        return 'Location position unavailable';
      case 3:
        return 'Location request timeout';
      default:
        return 'Unknown location error';
    }
  }

  static async getCurrentPosition(
    options?: any,
  ): Promise<PositionData> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
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
          reject(new Error('Failed to get current position'));
        },
        options,
      );
    });
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  static calculateSpeed(
    pos1: PositionData,
    pos2: PositionData,
  ): number {
    const distance = this.calculateDistance(
      pos1.lat,
      pos1.lng,
      pos2.lat,
      pos2.lng,
    );
    const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000; // seconds
    if (timeDiff === 0) return 0;
    return (distance / timeDiff) * 3.6; // km/h
  }

  static isAvailable(): boolean {
    return typeof Geolocation !== 'undefined';
  }
}
