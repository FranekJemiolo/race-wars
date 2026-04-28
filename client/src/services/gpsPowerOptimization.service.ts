/**
 * GPS Power Optimization Service
 * 
 * Manages power consumption for GPS tracking
 * Adapts tracking frequency based on battery level and charging status
 */

import type { PositionData } from './gpsTracking.service';
import type { BackgroundLocationConfig } from './backgroundLocation.service';

export interface PowerConfig {
  enableAdaptiveTracking: boolean;
  batteryThreshold: number; // percentage below which to reduce tracking
  chargingHighAccuracy: boolean;
  dischargingHighAccuracy: boolean;
  adaptiveUpdateIntervals: {
    high: number; // ms when battery > 50%
    medium: number; // ms when battery 20-50%
    low: number; // ms when battery < 20%
  };
  enableBatterySaverMode: boolean;
  stopWhenBatteryCritical: boolean;
  criticalBatteryThreshold: number; // percentage
}

const DEFAULT_CONFIG: PowerConfig = {
  enableAdaptiveTracking: true,
  batteryThreshold: 20,
  chargingHighAccuracy: true,
  dischargingHighAccuracy: false,
  adaptiveUpdateIntervals: {
    high: 1000,
    medium: 2000,
    low: 5000,
  },
  enableBatterySaverMode: true,
  stopWhenBatteryCritical: false,
  criticalBatteryThreshold: 5,
};

export class GPSPowerOptimizationService {
  private config: PowerConfig;
  private currentBatteryLevel: number = 100;
  private isCharging: boolean = false;
  private currentUpdateInterval: number = 1000;
  private batteryCheckInterval: number | null = null;
  private onPowerModeChange?: (mode: PowerMode) => void;
  private onCriticalBattery?: () => void;

  constructor(config?: Partial<PowerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start power optimization monitoring
   */
  async startMonitoring(
    onPowerModeChange?: (mode: PowerMode) => void,
    onCriticalBattery?: () => void
  ): Promise<void> {
    this.onPowerModeChange = onPowerModeChange;
    this.onCriticalBattery = onCriticalBattery;

    // Get initial battery status
    await this.updateBatteryStatus();

    // Start periodic battery checks
    this.batteryCheckInterval = window.setInterval(() => {
      this.checkBatteryStatus();
    }, 30000); // Check every 30 seconds

    // Listen for battery events if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => this.handleBatteryLevelChange(battery.level * 100));
        battery.addEventListener('chargingchange', () => this.handleChargingChange(battery.charging));
      });
    }
  }

  /**
   * Stop power optimization monitoring
   */
  stopMonitoring(): void {
    if (this.batteryCheckInterval) {
      clearInterval(this.batteryCheckInterval);
      this.batteryCheckInterval = null;
    }
  }

  /**
   * Get recommended update interval based on current battery status
   */
  getRecommendedUpdateInterval(): number {
    if (!this.config.enableAdaptiveTracking) {
      return this.config.adaptiveUpdateIntervals.high;
    }

    if (this.isCharging) {
      return this.config.adaptiveUpdateIntervals.high;
    }

    if (this.currentBatteryLevel > 50) {
      return this.config.adaptiveUpdateIntervals.high;
    } else if (this.currentBatteryLevel > this.config.batteryThreshold) {
      return this.config.adaptiveUpdateIntervals.medium;
    } else {
      return this.config.adaptiveUpdateIntervals.low;
    }
  }

  /**
   * Get recommended accuracy setting
   */
  getRecommendedAccuracy(): 'high' | 'medium' | 'low' {
    if (this.isCharging && this.config.chargingHighAccuracy) {
      return 'high';
    }

    if (!this.isCharging && !this.config.dischargingHighAccuracy) {
      return 'medium';
    }

    if (this.currentBatteryLevel < this.config.batteryThreshold) {
      return 'low';
    }

    return 'high';
  }

  /**
   * Get current power mode
   */
  getCurrentPowerMode(): PowerMode {
    if (this.isCharging) {
      return 'charging';
    }

    if (this.currentBatteryLevel > 50) {
      return 'high_performance';
    } else if (this.currentBatteryLevel > this.config.batteryThreshold) {
      return 'balanced';
    } else if (this.currentBatteryLevel > this.config.criticalBatteryThreshold) {
      return 'power_saver';
    } else {
      return 'critical';
    }
  }

  /**
   * Get optimized background location config
   */
  getOptimizedConfig(): Partial<BackgroundLocationConfig> {
    return {
      desiredAccuracy: this.getRecommendedAccuracy(),
      updateInterval: this.getRecommendedUpdateInterval(),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PowerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.checkBatteryStatus();
  }

  /**
   * Get current battery level
   */
  getCurrentBatteryLevel(): number {
    return this.currentBatteryLevel;
  }

  /**
   * Check if device is charging
   */
  isDeviceCharging(): boolean {
    return this.isCharging;
  }

  /**
   * Update battery status
   */
  private async updateBatteryStatus(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        this.currentBatteryLevel = battery.level * 100;
        this.isCharging = battery.charging;
      }
    } catch (error) {
      console.warn('Could not get battery status:', error);
    }
  }

  /**
   * Check battery status and adjust tracking
   */
  private checkBatteryStatus(): void {
    this.updateBatteryStatus().then(() => {
      const newInterval = this.getRecommendedUpdateInterval();
      const newMode = this.getCurrentPowerMode();

      if (newInterval !== this.currentUpdateInterval) {
        this.currentUpdateInterval = newInterval;
        if (this.onPowerModeChange) {
          this.onPowerModeChange(newMode);
        }
      }

      // Check for critical battery
      if (
        this.config.stopWhenBatteryCritical &&
        this.currentBatteryLevel <= this.config.criticalBatteryThreshold &&
        !this.isCharging
      ) {
        if (this.onCriticalBattery) {
          this.onCriticalBattery();
        }
      }
    });
  }

  /**
   * Handle battery level change
   */
  private handleBatteryLevelChange(level: number): void {
    this.currentBatteryLevel = level;
    this.checkBatteryStatus();
  }

  /**
   * Handle charging change
   */
  private handleChargingChange(charging: boolean): void {
    this.isCharging = charging;
    this.checkBatteryStatus();
  }

  /**
   * Calculate estimated battery drain for GPS tracking
   */
  static estimateBatteryDrain(
    updateInterval: number,
    accuracy: 'high' | 'medium' | 'low',
    durationMinutes: number
  ): number {
    // Base drain rates (percentage per hour)
    const baseDrainRates = {
      high: 15, // High accuracy GPS
      medium: 8, // Medium accuracy
      low: 3, // Low accuracy
    };

    const updatesPerHour = (3600000 / updateInterval);
    const drainPerHour = baseDrainRates[accuracy] * (updatesPerHour / 60); // Scale by update frequency
    const drainForDuration = (drainPerHour * durationMinutes) / 60;

    return drainForDuration;
  }

  /**
   * Get estimated remaining tracking time
   */
  static getEstimatedTrackingTime(
    currentBattery: number,
    updateInterval: number,
    accuracy: 'high' | 'medium' | 'low'
  ): number {
    const drainPerHour = GPSPowerOptimizationService.estimateBatteryDrain(
      updateInterval,
      accuracy,
      60
    );

    if (drainPerHour === 0) return Infinity;

    return (currentBattery / drainPerHour) * 60; // minutes
  }

  /**
   * Check if battery API is available
   */
  static isBatteryAPIAvailable(): boolean {
    return 'getBattery' in navigator;
  }
}

export type PowerMode = 'charging' | 'high_performance' | 'balanced' | 'power_saver' | 'critical';

// Singleton instance
let gpsPowerOptimizationService: GPSPowerOptimizationService | null = null;

export function getGPSPowerOptimizationService(config?: Partial<PowerConfig>): GPSPowerOptimizationService {
  if (!gpsPowerOptimizationService) {
    gpsPowerOptimizationService = new GPSPowerOptimizationService(config);
  }
  return gpsPowerOptimizationService;
}

export function resetGPSPowerOptimizationService(): void {
  if (gpsPowerOptimizationService) {
    gpsPowerOptimizationService.stopMonitoring();
    gpsPowerOptimizationService = null;
  }
}
