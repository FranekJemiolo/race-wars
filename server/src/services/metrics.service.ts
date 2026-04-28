/**
 * Metrics Service
 * 
 * Handles Prometheus metrics collection for monitoring:
 * - HTTP request metrics
 * - WebSocket connection metrics
 * - Database query metrics
 * - Custom business metrics
 * - Health check metrics
 */

// @ts-ignore - Prometheus types will be available after npm install
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export interface MetricsConfig {
  prefix?: string;
  defaultLabels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
}

const DEFAULT_CONFIG: MetricsConfig = {
  prefix: 'race_wars_',
  defaultLabels: {
    app: 'race-wars',
  },
  collectDefaultMetrics: true,
};

export class MetricsService {
  private registry: Registry;
  private config: MetricsConfig;

  // HTTP metrics
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private httpRequestsInProgress: Gauge<string>;

  // WebSocket metrics
  private websocketConnections: Gauge<string>;
  private websocketMessagesReceived: Counter<string>;
  private websocketMessagesSent: Counter<string>;

  // Database metrics
  private dbQueryDuration: Histogram<string>;
  private dbQueryErrors: Counter<string>;

  // Business metrics
  private activeSessions: Gauge<string>;
  private activeParticipants: Gauge<string>;
  private incidentsDetected: Counter<string>;
  private penaltiesIssued: Counter<string>;

  constructor(config?: MetricsConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registry = new Registry();

    if (this.config.collectDefaultMetrics) {
      collectDefaultMetrics({ register: this.registry, prefix: this.config.prefix });
    }

    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const prefix = this.config.prefix || '';

    // HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: `${prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new Gauge({
      name: `${prefix}http_requests_in_progress`,
      help: 'Number of HTTP requests in progress',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    // WebSocket metrics
    this.websocketConnections = new Gauge({
      name: `${prefix}websocket_connections`,
      help: 'Number of active WebSocket connections',
      labelNames: ['pool'],
      registers: [this.registry],
    });

    this.websocketMessagesReceived = new Counter({
      name: `${prefix}websocket_messages_received_total`,
      help: 'Total number of WebSocket messages received',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.websocketMessagesSent = new Counter({
      name: `${prefix}websocket_messages_sent_total`,
      help: 'Total number of WebSocket messages sent',
      labelNames: ['type'],
      registers: [this.registry],
    });

    // Database metrics
    this.dbQueryDuration = new Histogram({
      name: `${prefix}db_query_duration_seconds`,
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.registry],
    });

    this.dbQueryErrors = new Counter({
      name: `${prefix}db_query_errors_total`,
      help: 'Total number of database query errors',
      labelNames: ['operation', 'table'],
      registers: [this.registry],
    });

    // Business metrics
    this.activeSessions = new Gauge({
      name: `${prefix}active_sessions`,
      help: 'Number of active racing sessions',
      registers: [this.registry],
    });

    this.activeParticipants = new Gauge({
      name: `${prefix}active_participants`,
      help: 'Number of active participants',
      labelNames: ['session_id'],
      registers: [this.registry],
    });

    this.incidentsDetected = new Counter({
      name: `${prefix}incidents_detected_total`,
      help: 'Total number of incidents detected',
      labelNames: ['type', 'severity'],
      registers: [this.registry],
    });

    this.penaltiesIssued = new Counter({
      name: `${prefix}penalties_issued_total`,
      help: 'Total number of penalties issued',
      labelNames: ['type'],
      registers: [this.registry],
    });
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe({ method, route }, duration);
  }

  /**
   * Increment/decrement HTTP requests in progress
   */
  incrementHttpRequestsInProgress(method: string, route: string): void {
    this.httpRequestsInProgress.inc({ method, route });
  }

  decrementHttpRequestsInProgress(method: string, route: string): void {
    this.httpRequestsInProgress.dec({ method, route });
  }

  /**
   * Set WebSocket connection count
   */
  setWebSocketConnections(pool: string, count: number): void {
    this.websocketConnections.set({ pool }, count);
  }

  /**
   * Record WebSocket message received
   */
  recordWebSocketMessageReceived(type: string): void {
    this.websocketMessagesReceived.inc({ type });
  }

  /**
   * Record WebSocket message sent
   */
  recordWebSocketMessageSent(type: string): void {
    this.websocketMessagesSent.inc({ type });
  }

  /**
   * Record database query
   */
  recordDbQuery(operation: string, table: string, duration: number, error = false): void {
    this.dbQueryDuration.observe({ operation, table }, duration);
    if (error) {
      this.dbQueryErrors.inc({ operation, table });
    }
  }

  /**
   * Set active sessions count
   */
  setActiveSessions(count: number): void {
    this.activeSessions.set(count);
  }

  /**
   * Set active participants count
   */
  setActiveParticipants(sessionId: string, count: number): void {
    this.activeParticipants.set({ session_id: sessionId }, count);
  }

  /**
   * Record incident detected
   */
  recordIncident(type: string, severity: string): void {
    this.incidentsDetected.inc({ type, severity });
  }

  /**
   * Record penalty issued
   */
  recordPenalty(type: string): void {
    this.penaltiesIssued.inc({ type });
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  /**
   * Get registry
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Reset all metrics
   */
  async resetMetrics(): Promise<void> {
    await this.registry.resetMetrics();
  }

  /**
   * Set default labels
   */
  setDefaultLabels(labels: Record<string, string>): void {
    this.registry.setDefaultLabels(labels);
  }

  /**
   * Clear default labels
   */
  clearDefaultLabels(): void {
    this.registry.clearDefaultLabels();
  }

  /**
   * Remove a metric
   */
  removeMetric(name: string): void {
    this.registry.removeSingleMetric(name);
  }

  /**
   * Get metric names
   */
  getMetricNames(): string[] {
    return this.registry.getMetricsAsArray().map((m: any) => m.name);
  }

  /**
   * Get content type for metrics endpoint
   */
  getContentType(): string {
    return this.registry.contentType;
  }
}

// Singleton instance
let metricsService: MetricsService | null = null;

export function getMetricsService(config?: MetricsConfig): MetricsService {
  if (!metricsService) {
    metricsService = new MetricsService(config);
  }
  return metricsService;
}

export function resetMetricsService(): void {
  if (metricsService) {
    metricsService = null;
  }
}
