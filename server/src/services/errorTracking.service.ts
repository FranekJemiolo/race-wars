/**
 * Error Tracking Service
 * 
 * Handles error tracking using Sentry:
 * - Error capture and reporting
 * - Performance monitoring
 * - User context tracking
 * - Release tracking
 * - Breadcrumb recording
 */

// @ts-ignore - Sentry types will be available after npm install
import * as Sentry from '@sentry/node';
// @ts-ignore
import { ProfilingIntegration } from '@sentry/profiling-node';

export interface ErrorTrackingConfig {
  dsn: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

const DEFAULT_CONFIG: Partial<ErrorTrackingConfig> = {
  environment: process.env.NODE_ENV || 'development',
  sampleRate: 1.0,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
};

export class ErrorTrackingService {
  private config: ErrorTrackingConfig;
  private isInitialized = false;

  constructor(config: ErrorTrackingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize Sentry
   */
  initialize(): void {
    if (this.isInitialized) return;

    try {
      const integrations: any[] = [];

      // Add profiling integration if configured
      if (this.config.profilesSampleRate && this.config.profilesSampleRate > 0) {
        integrations.push(new ProfilingIntegration());
      }

      Sentry.init({
        dsn: this.config.dsn,
        environment: this.config.environment,
        release: this.config.release,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.tracesSampleRate,
        profilesSampleRate: this.config.profilesSampleRate,
        integrations,
      });

      this.isInitialized = true;
      console.log('Sentry error tracking initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: {
    user?: any;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }): string | undefined {
    if (!this.isInitialized) return undefined;

    try {
      return Sentry.captureException(error, {
        user: context?.user,
        tags: context?.tags,
        extra: context?.extra,
        level: context?.level || 'error',
      });
    } catch (err) {
      console.error('Failed to capture exception:', err);
      return undefined;
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, context?: {
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }): string | undefined {
    if (!this.isInitialized) return undefined;

    try {
      return Sentry.captureMessage(message, {
        level: context?.level || 'info',
        tags: context?.tags,
        extra: context?.extra,
      });
    } catch (err) {
      console.error('Failed to capture message:', err);
      return undefined;
    }
  }

  /**
   * Set user context
   */
  setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
  }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser(user);
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser(null);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  /**
   * Set a tag
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      console.error('Failed to set tag:', error);
    }
  }

  /**
   * Set multiple tags
   */
  setTags(tags: Record<string, string>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setTags(tags);
    } catch (error) {
      console.error('Failed to set tags:', error);
    }
  }

  /**
   * Set extra context
   */
  setExtra(key: string, value: any): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setExtra(key, value);
    } catch (error) {
      console.error('Failed to set extra:', error);
    }
  }

  /**
   * Set multiple extra context
   */
  setExtras(extras: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setExtras(extras);
    } catch (error) {
      console.error('Failed to set extras:', error);
    }
  }

  /**
   * Add a breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    category?: string;
    message?: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, any>;
  }): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb(breadcrumb);
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  /**
   * Start a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): any {
    if (!this.isInitialized) return null;

    try {
      return Sentry.startTransaction({ name, op });
    } catch (error) {
      console.error('Failed to start transaction:', error);
      return null;
    }
  }

  /**
   * Set context
   */
  setContext(key: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setContext(key, context);
    } catch (error) {
      console.error('Failed to set context:', error);
    }
  }

  /**
   * Configure scope
   */
  configureScope(callback: (scope: any) => void): void {
    if (!this.isInitialized) return;

    try {
      Sentry.configureScope(callback);
    } catch (error) {
      console.error('Failed to configure scope:', error);
    }
  }

  /**
   * Flush pending events
   */
  async flush(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await Sentry.flush(timeout);
      return true;
    } catch (error) {
      console.error('Failed to flush:', error);
      return false;
    }
  }

  /**
   * Close Sentry
   */
  async close(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await Sentry.close(timeout);
      this.isInitialized = false;
      console.log('Sentry error tracking closed');
      return true;
    } catch (error) {
      console.error('Failed to close Sentry:', error);
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorTrackingConfig {
    return { ...this.config };
  }

  /**
   * Check if initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let errorTrackingService: ErrorTrackingService | null = null;

export function getErrorTrackingService(config: ErrorTrackingConfig): ErrorTrackingService {
  if (!errorTrackingService) {
    errorTrackingService = new ErrorTrackingService(config);
  }
  return errorTrackingService;
}

export function resetErrorTrackingService(): void {
  if (errorTrackingService) {
    errorTrackingService = null;
  }
}
