/**
 * Message Queue Service
 * 
 * Handles message queuing using NATS for asynchronous processing:
 * - Publishing messages
 * - Subscribing to topics
 * - Request-reply pattern
 * - Queue groups for load balancing
 * - Message durability
 */

// @ts-ignore - NATS types will be available after npm install
import { connect, NatsConnection, StringCodec, JetStreamClient, JetStreamManager } from 'nats';

export interface MessageQueueConfig {
  url?: string;
  servers?: string[];
  name?: string;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}

const DEFAULT_CONFIG: MessageQueueConfig = {
  url: 'nats://localhost:4222',
  name: 'race-wars',
  reconnect: true,
  maxReconnectAttempts: 10,
};

export class MessageQueueService {
  private nc: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private jsm: JetStreamManager | null = null;
  private sc = StringCodec();
  private config: MessageQueueConfig;
  private isConnected = false;

  constructor(config?: MessageQueueConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Connect to NATS
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.nc = await connect({
        servers: this.config.servers,
        url: this.config.url,
        name: this.config.name,
        reconnect: this.config.reconnect,
        maxReconnectAttempts: this.config.maxReconnectAttempts,
      });

      this.js = this.nc.jetstream();
      this.jsm = await this.nc.jetstreamManager();
      this.isConnected = true;
      console.log('Connected to NATS');
    } catch (error) {
      console.error('Failed to connect to NATS:', error);
      throw error;
    }
  }

  /**
   * Disconnect from NATS
   */
  async disconnect(): Promise<void> {
    if (this.nc && this.isConnected) {
      await this.nc.close();
      this.isConnected = false;
      console.log('Disconnected from NATS');
    }
  }

  /**
   * Publish a message to a subject
   */
  async publish(subject: string, data: any): Promise<void> {
    if (!this.nc || !this.isConnected) {
      console.warn('NATS not connected, skipping publish');
      return;
    }

    try {
      const payload = JSON.stringify(data);
      this.nc.publish(subject, this.sc.encode(payload));
    } catch (error) {
      console.error('Failed to publish message:', error);
    }
  }

  /**
   * Subscribe to a subject
   */
  async subscribe(subject: string, callback: (data: any) => void, queueGroup?: string): Promise<void> {
    if (!this.nc || !this.isConnected) {
      console.warn('NATS not connected, skipping subscribe');
      return;
    }

    try {
      const sub = queueGroup
        ? this.nc.subscribe(subject, { queue: queueGroup })
        : this.nc.subscribe(subject);

      (async () => {
        for await (const msg of sub) {
          try {
            const data = JSON.parse(this.sc.decode(msg.data));
            callback(data);
          } catch (error) {
            console.error('Failed to process message:', error);
          }
        }
      })();
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  }

  /**
   * Publish to a JetStream stream
   */
  async publishToStream(streamName: string, subject: string, data: any): Promise<void> {
    if (!this.js || !this.isConnected) {
      console.warn('JetStream not connected, skipping publish');
      return;
    }

    try {
      await this.jsm.streams.add({ name: streamName, subjects: [subject] });
      const payload = JSON.stringify(data);
      await this.js.publish(subject, this.sc.encode(payload));
    } catch (error) {
      console.error('Failed to publish to stream:', error);
    }
  }

  /**
   * Create a consumer for a stream
   */
  async createConsumer(streamName: string, consumerName: string, config: any): Promise<void> {
    if (!this.jsm || !this.isConnected) {
      console.warn('JetStream not connected, skipping consumer creation');
      return;
    }

    try {
      await this.jsm.consumers.add(streamName, {
        name: consumerName,
        ...config,
      });
    } catch (error) {
      console.error('Failed to create consumer:', error);
    }
  }

  /**
   * Consume messages from a stream
   */
  async consume(streamName: string, consumerName: string, callback: (data: any) => void): Promise<void> {
    if (!this.js || !this.isConnected) {
      console.warn('JetStream not connected, skipping consume');
      return;
    }

    try {
      const consumer = await this.js.consumers.get(streamName, consumerName);
      const iterator = await consumer.consume();

      (async () => {
        for await (const msg of iterator) {
          try {
            const data = JSON.parse(this.sc.decode(msg.data));
            callback(data);
            msg.ack();
          } catch (error) {
            console.error('Failed to process message:', error);
            msg.nak();
          }
        }
      })();
    } catch (error) {
      console.error('Failed to consume from stream:', error);
    }
  }

  /**
   * Request-reply pattern
   */
  async request(subject: string, data: any, timeout = 5000): Promise<any> {
    if (!this.nc || !this.isConnected) {
      throw new Error('NATS not connected');
    }

    try {
      const payload = JSON.stringify(data);
      const response = await this.nc.request(subject, this.sc.encode(payload), { timeout });
      return JSON.parse(this.sc.decode(response.data));
    } catch (error) {
      console.error('Failed to make request:', error);
      throw error;
    }
  }

  /**
   * Reply to a request
   */
  async reply(msg: any, data: any): Promise<void> {
    if (!this.nc || !this.isConnected) {
      console.warn('NATS not connected, skipping reply');
      return;
    }

    try {
      const payload = JSON.stringify(data);
      msg.respond(this.sc.encode(payload));
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  }

  /**
   * Create a KV store
   */
  async createKVStore(bucketName: string): Promise<void> {
    if (!this.jsm || !this.isConnected) {
      console.warn('JetStream not connected, skipping KV store creation');
      return;
    }

    try {
      await this.jsm.kv.create(bucketName);
    } catch (error) {
      console.error('Failed to create KV store:', error);
    }
  }

  /**
   * Get a value from KV store
   */
  async getKV(bucketName: string, key: string): Promise<any | null> {
    if (!this.js || !this.isConnected) {
      return null;
    }

    try {
      const kv = this.js.views.kv(bucketName);
      const entry = await kv.get(key);
      if (!entry) return null;
      return JSON.parse(this.sc.decode(entry.value));
    } catch (error) {
      console.error('Failed to get KV value:', error);
      return null;
    }
  }

  /**
   * Set a value in KV store
   */
  async setKV(bucketName: string, key: string, value: any): Promise<void> {
    if (!this.js || !this.isConnected) {
      console.warn('JetStream not connected, skipping KV set');
      return;
    }

    try {
      const kv = this.js.views.kv(bucketName);
      const payload = JSON.stringify(value);
      await kv.put(key, this.sc.encode(payload));
    } catch (error) {
      console.error('Failed to set KV value:', error);
    }
  }

  /**
   * Delete a value from KV store
   */
  async deleteKV(bucketName: string, key: string): Promise<void> {
    if (!this.js || !this.isConnected) {
      console.warn('JetStream not connected, skipping KV delete');
      return;
    }

    try {
      const kv = this.js.views.kv(bucketName);
      await kv.delete(key);
    } catch (error) {
      console.error('Failed to delete KV value:', error);
    }
  }

  /**
   * Publish session update
   */
  async publishSessionUpdate(sessionId: string, data: any): Promise<void> {
    await this.publish(`session.${sessionId}.update`, data);
  }

  /**
   * Subscribe to session updates
   */
  async subscribeSessionUpdates(sessionId: string, callback: (data: any) => void): Promise<void> {
    await this.subscribe(`session.${sessionId}.update`, callback);
  }

  /**
   * Publish position update
   */
  async publishPositionUpdate(sessionId: string, participantId: string, data: any): Promise<void> {
    await this.publish(`session.${sessionId}.position.${participantId}`, data);
  }

  /**
   * Subscribe to position updates
   */
  async subscribePositionUpdates(sessionId: string, callback: (data: any) => void): Promise<void> {
    await this.subscribe(`session.${sessionId}.position.>`, callback);
  }

  /**
   * Publish incident
   */
  async publishIncident(sessionId: string, data: any): Promise<void> {
    await this.publishToStream('incidents', `incidents.${sessionId}`, data);
  }

  /**
   * Subscribe to incidents
   */
  async subscribeIncidents(sessionId: string, callback: (data: any) => void): Promise<void> {
    await this.consume('incidents', `incidents-${sessionId}`, callback);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MessageQueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): MessageQueueConfig {
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
let messageQueueService: MessageQueueService | null = null;

export function getMessageQueueService(config?: MessageQueueConfig): MessageQueueService {
  if (!messageQueueService) {
    messageQueueService = new MessageQueueService(config);
  }
  return messageQueueService;
}

export function resetMessageQueueService(): void {
  if (messageQueueService) {
    messageQueueService = null;
  }
}
