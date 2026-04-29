/**
 * Prometheus Metrics Utilities
 * 
 * Provides Prometheus client setup and metrics collection
 */

import { register, Counter, Histogram, Gauge } from 'prom-client';

// Create a Registry to register the metrics
const promClient = {
  register,
  Counter,
  Histogram,
  Gauge
};

// Create metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const activeConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
});

// Register metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);
register.registerMetric(databaseConnections);

export { promClient, httpRequestsTotal, httpRequestDuration, activeConnections, databaseConnections };
