/**
 * Push Notification Service
 * 
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 * Supports both Android and iOS platforms
 */

import admin from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
  ttl?: number; // Time to live in seconds
}

export interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

class PushNotificationService {
  private isInitialized = false;
  private deviceTokens: Map<string, DeviceToken[]> = new Map();

  /**
   * Initialize Firebase Admin SDK
   * Call this with your Firebase service account credentials
   */
  initialize(serviceAccountKey: any): void {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });
      this.isInitialized = true;
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Register a device token for a user
   */
  registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): void {
    const userTokens = this.deviceTokens.get(userId) || [];
    
    // Check if token already exists
    const existingIndex = userTokens.findIndex(t => t.token === token);
    
    if (existingIndex >= 0) {
      // Update existing token
      userTokens[existingIndex] = {
        ...userTokens[existingIndex],
        platform,
        isActive: true,
        updatedAt: Date.now()
      };
    } else {
      // Add new token
      userTokens.push({
        userId,
        token,
        platform,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    
    this.deviceTokens.set(userId, userTokens);
  }

  /**
   * Unregister a device token
   */
  unregisterDeviceToken(userId: string, token: string): void {
    const userTokens = this.deviceTokens.get(userId) || [];
    const filtered = userTokens.filter(t => t.token !== token);
    this.deviceTokens.set(userId, filtered);
  }

  /**
   * Deactivate a device token (soft delete)
   */
  deactivateDeviceToken(userId: string, token: string): void {
    const userTokens = this.deviceTokens.get(userId) || [];
    const tokenObj = userTokens.find(t => t.token === token);
    
    if (tokenObj) {
      tokenObj.isActive = false;
      tokenObj.updatedAt = Date.now();
    }
  }

  /**
   * Get all device tokens for a user
   */
  getDeviceTokens(userId: string): DeviceToken[] {
    return this.deviceTokens.get(userId) || [];
  }

  /**
   * Get active device tokens for a user
   */
  getActiveDeviceTokens(userId: string): DeviceToken[] {
    const tokens = this.deviceTokens.get(userId) || [];
    return tokens.filter(t => t.isActive);
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return;
    }

    const tokens = this.getActiveDeviceTokens(userId);
    
    if (tokens.length === 0) {
      console.log(`No active device tokens found for user ${userId}`);
      return;
    }

    const message: admin.messaging.Message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: payload.priority || 'high',
        ttl: payload.ttl ? payload.ttl * 1000 : undefined,
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      token: tokens[0].token, // Send to first active token
    };

    try {
      const response = await admin.messaging().send(message);
      console.log(`Push notification sent to user ${userId}:`, response);
    } catch (error) {
      console.error(`Failed to send push notification to user ${userId}:`, error);
      
      // If token is invalid, deactivate it
      if (error instanceof Error && error.message.includes('registration-token-not-registered')) {
        this.deactivateDeviceToken(userId, tokens[0].token);
      }
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], payload: PushNotificationPayload): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return;
    }

    const promises = userIds.map(userId => this.sendToUser(userId, payload));
    await Promise.allSettled(promises);
  }

  /**
   * Send push notification to all active device tokens for a user (multicast)
   */
  async sendMulticastToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return;
    }

    const tokens = this.getActiveDeviceTokens(userId);
    
    if (tokens.length === 0) {
      console.log(`No active device tokens found for user ${userId}`);
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: payload.priority || 'high',
        ttl: payload.ttl ? payload.ttl * 1000 : undefined,
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      tokens: tokens.map(t => t.token),
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`Multicast push notification sent to user ${userId}:`, {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Deactivate failed tokens
      if (response.responses) {
        response.responses.forEach((resp: admin.messaging.SendResponse, index: number) => {
          if (!resp.success) {
            this.deactivateDeviceToken(userId, tokens[index].token);
          }
        });
      }
    } catch (error) {
      console.error(`Failed to send multicast push notification to user ${userId}:`, error);
    }
  }

  /**
   * Send push notification to a specific topic
   */
  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return;
    }

    const message: admin.messaging.Message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: payload.priority || 'high',
        ttl: payload.ttl ? payload.ttl * 1000 : undefined,
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      topic,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log(`Push notification sent to topic ${topic}:`, response);
    } catch (error) {
      console.error(`Failed to send push notification to topic ${topic}:`, error);
    }
  }

  /**
   * Subscribe a device token to a topic
   */
  async subscribeToTopic(token: string, topic: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return;
    }

    try {
      await admin.messaging().subscribeToTopic(token, topic);
      console.log(`Token subscribed to topic ${topic}`);
    } catch (error) {
      console.error(`Failed to subscribe token to topic ${topic}:`, error);
    }
  }

  /**
   * Unsubscribe a device token from a topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Push notification service not initialized');
      return;
    }

    try {
      await admin.messaging().unsubscribeFromTopic(token, topic);
      console.log(`Token unsubscribed from topic ${topic}`);
    } catch (error) {
      console.error(`Failed to unsubscribe token from topic ${topic}:`, error);
    }
  }

  /**
   * Clean up inactive device tokens
   */
  cleanupInactiveTokens(maxAge: number): void {
    const now = Date.now();
    
    for (const [userId, tokens] of this.deviceTokens) {
      const activeTokens = tokens.filter(t => {
        if (!t.isActive) return false;
        if (now - t.updatedAt > maxAge) return false;
        return true;
      });
      
      this.deviceTokens.set(userId, activeTokens);
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalUsers: number;
    totalTokens: number;
    activeTokens: number;
    tokensByPlatform: Record<string, number>;
  } {
    let totalTokens = 0;
    let activeTokens = 0;
    const tokensByPlatform: Record<string, number> = {};

    for (const tokens of this.deviceTokens.values()) {
      totalTokens += tokens.length;
      activeTokens += tokens.filter(t => t.isActive).length;
      
      for (const token of tokens) {
        if (token.isActive) {
          tokensByPlatform[token.platform] = (tokensByPlatform[token.platform] || 0) + 1;
        }
      }
    }

    return {
      totalUsers: this.deviceTokens.size,
      totalTokens,
      activeTokens,
      tokensByPlatform,
    };
  }
}

export const pushNotificationService = new PushNotificationService();
