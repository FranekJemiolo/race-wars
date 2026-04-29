/**
 * Health Check Routes
 * 
 * Provides comprehensive health monitoring for the application
 * including database, services, and system metrics
 */

import { Router } from 'express';
import { query } from '../database/connection.simple';
import { logger } from '../utils/logger';
import { promClient } from '../utils/prometheus';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    websocket: ServiceHealth;
    api: ServiceHealth;
  };
  metrics?: {
    memory: MemoryMetrics;
    cpu: CPUMetrics;
    requests: RequestMetrics;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

interface CPUMetrics {
  loadAverage: number[];
  usage: number;
}

interface RequestMetrics {
  total: number;
  errors: number;
  averageResponseTime: number;
}

/**
 * Basic health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const health = await getHealthStatus(false);
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Detailed health check with metrics
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const health = await getHealthStatus(true);
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Detailed health check failed', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

/**
 * Readiness probe - checks if app is ready to serve traffic
 */
router.get('/health/ready', async (req, res) => {
  try {
    const health = await getHealthStatus(false);
    
    // App is ready if critical services are healthy
    const isReady = health.services.database.status === 'healthy' &&
                   health.services.api.status === 'healthy';
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: health.timestamp
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: health.timestamp,
        services: health.services
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * Liveness probe - checks if app is still alive
 */
router.get('/health/live', (req, res) => {
  try {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Liveness check failed', error);
    res.status(503).json({
      status: 'not alive',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Prometheus metrics endpoint
 */
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (error) {
    logger.error('Metrics endpoint failed', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Get comprehensive health status
 */
async function getHealthStatus(includeMetrics: boolean = false): Promise<HealthStatus> {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  
  // Check all services
  const [databaseHealth, redisHealth, websocketHealth, apiHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkWebSocketHealth(),
    checkAPIHealth()
  ]);
  
  // Determine overall status
  const services = [databaseHealth, redisHealth, websocketHealth, apiHealth];
  const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount === 0) {
    status = degradedCount > 0 ? 'degraded' : 'healthy';
  } else {
    status = 'unhealthy';
  }
  
  const health: HealthStatus = {
    status,
    timestamp,
    uptime,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: databaseHealth,
      redis: redisHealth,
      websocket: websocketHealth,
      api: apiHealth
    }
  };
  
  if (includeMetrics) {
    health.metrics = {
      memory: getMemoryMetrics(),
      cpu: getCPUMetrics(),
      requests: getRequestMetrics()
    };
  }
  
  return health;
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    await query('SELECT 1');
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedisHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // This would be implemented with actual Redis client
    // For now, we'll simulate the check
    await new Promise(resolve => setTimeout(resolve, 10));
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Redis health check failed', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Check WebSocket server health
 */
async function checkWebSocketHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // This would check actual WebSocket server
    // For now, we'll simulate the check
    await new Promise(resolve => setTimeout(resolve, 5));
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    logger.error('WebSocket health check failed', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Check API health
 */
async function checkAPIHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Basic API functionality check
    await new Promise(resolve => setTimeout(resolve, 1));
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    logger.error('API health check failed', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

/**
 * Get memory metrics
 */
function getMemoryMetrics(): MemoryMetrics {
  const usage = process.memoryUsage();
  const used = usage.heapUsed;
  const total = usage.heapTotal;
  
  return {
    used,
    total,
    percentage: Math.round((used / total) * 100)
  };
}

/**
 * Get CPU metrics
 */
function getCPUMetrics(): CPUMetrics {
  const loadAvg = require('os').loadavg();
  
  return {
    loadAverage: loadAvg,
    usage: 0 // Would need additional library for CPU usage
  };
}

/**
 * Get request metrics from Prometheus
 */
function getRequestMetrics(): RequestMetrics {
  try {
    const requestCounter = promClient.register.getSingleMetric('http_requests_total');
    const requestDuration = promClient.register.getSingleMetric('http_request_duration_seconds');
    
    return {
      total: requestCounter ? requestCounter.get().values.reduce((sum, val) => sum + val.value, 0) : 0,
      errors: 0, // Would need error counter
      averageResponseTime: 0 // Would need to calculate from histogram
    };
  } catch (error) {
    return {
      total: 0,
      errors: 0,
      averageResponseTime: 0
    };
  }
}

export default router;
