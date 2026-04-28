/**
 * Integration Tests for Notification Layer
 * 
 * Tests the integration between notification service, repository,
 * push notification service, email notification service, and other components
 */

import { notificationService } from '../../services/notification.service';
import type { NotificationData, CreateNotificationRequest, NotificationPreferences } from '../../services/notification.service';

describe('Notification Layer Integration Tests', () => {
  describe('Service Integration', () => {
    test('should integrate with notification service', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'race_starting',
        title: 'Race Starting Soon',
        message: 'The race will start in 5 minutes',
        priority: 'high',
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.userId).toBe(request.userId);
      expect(notification.type).toBe(request.type);
      expect(notification.title).toBe(request.title);
      expect(notification.message).toBe(request.message);
    });

    test('should handle notification creation with data', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'flag_change',
        title: 'Yellow Flag',
        message: 'Yellow flag in sector 2',
        data: {
          sector: 2,
          flag: 'yellow',
          reason: 'Debris on track',
        },
        priority: 'medium',
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.data).toBeDefined();
      expect(notification.data?.sector).toBe(2);
      expect(notification.data?.flag).toBe('yellow');
    });
  });

  describe('User Notifications Integration', () => {
    test('should retrieve user notifications', async () => {
      const userId = 'user1';
      
      const notifications = await notificationService.getUserNotifications(userId);
      
      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
    });

    test('should retrieve notifications with pagination', async () => {
      const userId = 'user1';
      const limit = 10;
      const offset = 0;
      
      const notifications = await notificationService.getUserNotifications(userId, limit, offset);
      
      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Notification Read Status Integration', () => {
    test('should mark notification as read', async () => {
      const notificationId = 'notification-1';
      const userId = 'user1';
      
      await notificationService.markNotificationAsRead(notificationId, userId);
      
      // Should complete without error
      expect(true).toBe(true);
    });

    test('should mark all notifications as read', async () => {
      const userId = 'user1';
      
      await notificationService.markAllNotificationsAsRead(userId);
      
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Notification Deletion Integration', () => {
    test('should delete notification', async () => {
      const notificationId = 'notification-1';
      const userId = 'user1';
      
      await notificationService.deleteNotification(notificationId, userId);
      
      // Should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Notification Preferences Integration', () => {
    test('should get user notification preferences', async () => {
      const userId = 'user1';
      
      const preferences = await notificationService.getUserNotificationPreferences(userId);
      
      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(userId);
      expect(typeof preferences.enableEmail).toBe('boolean');
      expect(typeof preferences.enablePush).toBe('boolean');
      expect(typeof preferences.enableInApp).toBe('boolean');
    });

    test('should create default preferences for new user', async () => {
      const userId = 'new-user-1';
      
      const preferences = await notificationService.getUserNotificationPreferences(userId);
      
      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(userId);
      expect(preferences.enableEmail).toBe(true);
      expect(preferences.enablePush).toBe(true);
      expect(preferences.enableInApp).toBe(true);
    });

    test('should update notification preferences', async () => {
      const userId = 'user1';
      const updates: Partial<NotificationPreferences> = {
        enableEmail: false,
        enablePush: true,
        raceNotifications: false,
      };
      
      const updated = await notificationService.updateNotificationPreferences(userId, updates);
      
      expect(updated).toBeDefined();
      expect(updated.enableEmail).toBe(false);
      expect(updated.enablePush).toBe(true);
      expect(updated.raceNotifications).toBe(false);
    });
  });

  describe('Notification Types Integration', () => {
    test('should handle race notification types', async () => {
      const types: NotificationData['type'][] = ['race_starting', 'race_started', 'race_finished'];
      
      for (const type of types) {
        const request: CreateNotificationRequest = {
          userId: 'user1',
          type,
          title: 'Race Update',
          message: 'Race status update',
        };
        
        const notification = await notificationService.createNotification(request);
        
        expect(notification).toBeDefined();
        expect(notification.type).toBe(type);
      }
    });

    test('should handle flag notification types', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'flag_change',
        title: 'Flag Change',
        message: 'Yellow flag in sector 2',
        data: { sector: 2, flag: 'yellow' },
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.type).toBe('flag_change');
    });

    test('should handle penalty notification types', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'penalty',
        title: 'Penalty Issued',
        message: 'You have received a time penalty',
        data: { penaltyType: 'time', value: 5 },
        priority: 'high',
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.type).toBe('penalty');
    });

    test('should handle position notification types', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'position_update',
        title: 'Position Update',
        message: 'You are now in position 3',
        data: { position: 3 },
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.type).toBe('position_update');
    });
  });

  describe('Priority Levels Integration', () => {
    test('should handle different priority levels', async () => {
      const priorities: NotificationData['priority'][] = ['low', 'medium', 'high', 'urgent'];
      
      for (const priority of priorities) {
        const request: CreateNotificationRequest = {
          userId: 'user1',
          type: 'race_starting',
          title: 'Test Notification',
          message: 'Test message',
          priority,
        };
        
        const notification = await notificationService.createNotification(request);
        
        expect(notification).toBeDefined();
        expect(notification.priority).toBe(priority);
      }
    });
  });

  describe('Data Structure Integration', () => {
    test('should validate notification data structure', () => {
      const notification: NotificationData = {
        id: 'notification-1',
        userId: 'user1',
        type: 'race_starting',
        title: 'Race Starting',
        message: 'Race will start soon',
        data: { sessionId: 'session-1' },
        priority: 'high',
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      };

      expect(notification.id).toBe('notification-1');
      expect(notification.userId).toBe('user1');
      expect(notification.type).toBe('race_starting');
      expect(notification.title).toBe('Race Starting');
      expect(notification.message).toBe('Race will start soon');
      expect(notification.data?.sessionId).toBe('session-1');
      expect(notification.priority).toBe('high');
      expect(notification.read).toBe(false);
      expect(notification.createdAt).toBeDefined();
      expect(notification.expiresAt).toBeDefined();
    });

    test('should validate preferences data structure', () => {
      const preferences: NotificationPreferences = {
        userId: 'user1',
        enableEmail: true,
        enablePush: true,
        enableInApp: true,
        raceNotifications: true,
        flagNotifications: true,
        penaltyNotifications: true,
      };

      expect(preferences.userId).toBe('user1');
      expect(preferences.enableEmail).toBe(true);
      expect(preferences.enablePush).toBe(true);
      expect(preferences.enableInApp).toBe(true);
      expect(preferences.raceNotifications).toBe(true);
      expect(preferences.flagNotifications).toBe(true);
      expect(preferences.penaltyNotifications).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle invalid user ID', async () => {
      const request: CreateNotificationRequest = {
        userId: '',
        type: 'race_starting',
        title: 'Test',
        message: 'Test',
      };
      
      // Should handle gracefully
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
    });

    test('should handle empty notification data', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'race_starting',
        title: '',
        message: '',
      };
      
      // Should handle gracefully
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
    });

    test('should handle missing notification ID', async () => {
      const notificationId = 'nonexistent-notification';
      const userId = 'user1';
      
      // Should handle gracefully
      await notificationService.markNotificationAsRead(notificationId, userId);
      
      expect(true).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    test('should handle rapid notification creation', async () => {
      const iterations = 10;
      const requests: CreateNotificationRequest[] = [];
      
      for (let i = 0; i < iterations; i++) {
        requests.push({
          userId: 'user1',
          type: 'race_starting',
          title: `Notification ${i}`,
          message: `Test message ${i}`,
        });
      }
      
      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => notificationService.createNotification(request))
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(iterations);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    test('should handle large notification retrieval', async () => {
      const userId = 'user1';
      const limit = 100;
      
      const startTime = Date.now();
      const notifications = await notificationService.getUserNotifications(userId, limit);
      const endTime = Date.now();
      
      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });
  });

  describe('Data Consistency Integration', () => {
    test('should maintain data consistency across operations', async () => {
      const userId = 'user1';
      
      const preferences1 = await notificationService.getUserNotificationPreferences(userId);
      
      const updates: Partial<NotificationPreferences> = {
        enableEmail: false,
      };
      
      await notificationService.updateNotificationPreferences(userId, updates);
      
      const preferences2 = await notificationService.getUserNotificationPreferences(userId);
      
      expect(preferences1).toBeDefined();
      expect(preferences2).toBeDefined();
      expect(preferences2.enableEmail).toBe(false);
    });
  });

  describe('Expiration Integration', () => {
    test('should handle notification expiration', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'race_starting',
        title: 'Temporary Notification',
        message: 'This will expire',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.expiresAt).toBeDefined();
    });

    test('should handle notifications without expiration', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'race_starting',
        title: 'Permanent Notification',
        message: 'This will not expire',
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.expiresAt).toBeUndefined();
    });
  });

  describe('Special Characters Integration', () => {
    test('should handle special characters in notification content', async () => {
      const request: CreateNotificationRequest = {
        userId: 'user1',
        type: 'race_starting',
        title: 'Test with émojis 🏁 and spëcial chårs',
        message: 'Message with <html> tags & symbols',
        data: { special: 'value with "quotes" and \'apostrophes\'' },
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.title).toContain('🏁');
    });
  });
});
