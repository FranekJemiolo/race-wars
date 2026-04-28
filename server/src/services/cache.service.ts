/**
 * Cache Service
 * 
 * Handles caching using Redis for improved performance:
 * - Session data caching
 * - User data caching
 * - Leaderboard caching
 * - Track data caching
 * - Cache invalidation
 */

// @ts-ignore - Redis types will be available after npm install
import { createClient, RedisClientType } from 'redis';

export interface CacheConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  defaultTTL?: number; // seconds
}

const DEFAULT_CONFIG: CacheConfig = {
  host: 'localhost',
  port: 6379,
  db: 0,
  defaultTTL: 300, // 5 minutes
};

export class CacheService {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private isConnected = false;

  constructor(config?: CacheConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        url: this.config.url,
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db,
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('Disconnected from Redis');
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.config.defaultTTL;
      await this.client.setEx(key, expiry, serialized);
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Failed to delete cache:', error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Failed to delete cache pattern:', error);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Failed to check cache existence:', error);
      return false;
    }
  }

  /**
   * Set a value with no expiration
   */
  async setPermanent(key: string, value: any): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized);
    } catch (error) {
      console.error('Failed to set permanent cache:', error);
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('Failed to increment cache:', error);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      return await this.client.decr(key);
    } catch (error) {
      console.error('Failed to decrement cache:', error);
      return 0;
    }
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Cache session data
   */
  async cacheSession(sessionId: string, data: any): Promise<void> {
    await this.set(`session:${sessionId}`, data, 600); // 10 minutes
  }

  /**
   * Get cached session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    return await this.get(`session:${sessionId}`);
  }

  /**
   * Invalidate session cache
   */
  async invalidateSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  /**
   * Cache user data
   */
  async cacheUser(userId: string, data: any): Promise<void> {
    await this.set(`user:${userId}`, data, 1800); // 30 minutes
  }

  /**
   * Get cached user data
   */
  async getUser(userId: string): Promise<any | null> {
    return await this.get(`user:${userId}`);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.del(`user:${userId}`);
  }

  /**
   * Cache leaderboard
   */
  async cacheLeaderboard(sessionId: string, data: any): Promise<void> {
    await this.set(`leaderboard:${sessionId}`, data, 30); // 30 seconds
  }

  /**
   * Get cached leaderboard
   */
  async getLeaderboard(sessionId: string): Promise<any | null> {
    return await this.get(`leaderboard:${sessionId}`);
  }

  /**
   * Invalidate leaderboard cache
   */
  async invalidateLeaderboard(sessionId: string): Promise<void> {
    await this.del(`leaderboard:${sessionId}`);
  }

  /**
   * Cache track data
   */
  async cacheTrack(trackId: string, data: any): Promise<void> {
    await this.setPermanent(`track:${trackId}`, data);
  }

  /**
   * Get cached track data
   */
  async getTrack(trackId: string): Promise<any | null> {
    return await this.get(`track:${trackId}`);
  }

  /**
   * Invalidate track cache
   */
  async invalidateTrack(trackId: string): Promise<void> {
    await this.del(`track:${trackId}`);
  }

  /**
   * Clear all cache
   */
  async flushAll(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Failed to flush cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    if (!this.client || !this.isConnected) {
      return { keys: 0, memory: '0B' };
    }

    try {
      const keys = await this.client.dbSize();
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1] : '0B';

      return { keys, memory };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { keys: 0, memory: '0B' };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Check if connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export function getCacheService(config?: CacheConfig): CacheService {
  if (!cacheService) {
    cacheService = new CacheService(config);
  }
  return cacheService;
}

export function resetCacheService(): void {
  if (cacheService) {
    cacheService = null;
  }
}
