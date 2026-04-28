/**
 * End-to-End Tests for Notification Workflow
 * 
 * Tests the complete notification workflow from creation
 * through delivery to user preferences and history
 */

import { notificationService } from '../../services/notification.service';
import type { CreateNotificationRequest, NotificationPreferences } from '../../services/notification.service';

describe('Notification Workflow E2E Tests', () => {
  describe('Complete Notification Creation Workflow', () => {
    test('should handle complete notification creation workflow', async () => {
      const userId = 'driver-1';
      
      // Step 1: Create notification
      const request: CreateNotificationRequest = {
        userId,
        type: 'race_starting',
        title: 'Race Starting Soon',
        message: 'The race will start in 5 minutes',
        priority: 'high',
      };
      
      const notification = await notificationService.createNotification(request);
      
      expect(notification).toBeDefined();
      expect(notification.userId).toBe(userId);
      expect(notification.type).toBe('race_starting');
      expect(notification.priority).toBe('high');
      expect(notification.read).toBe(false);
      
      // Step 2: Retrieve user notifications
      const notifications = await notificationService.getUserNotifications(userId);
      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
      
      // Step 3: Mark notification as read
      await notificationService.markNotificationAsRead(notification.id, userId);
      
      // Step 4: Verify notification is marked as read
      const updatedNotifications = await notificationService.getUserNotifications(userId);
      const readNotification = updatedNotifications.find(n => n.id === notification.id);
      expect(readNotification?.read).toBe(true);
    });
  });

  describe('Complete Notification Preferences Workflow', () => {
    test('should handle complete notification preferences workflow', async () => {
      const userId = 'driver-1';
      
      // Step 1: Get default preferences
      const preferences = await notificationService.getUserNotificationPreferences(userId);
      expect(preferences).toBeDefined();
      expect(preferences.userId).toBe(userId);
      expect(preferences.enableEmail).toBe(true);
      expect(preferences.enablePush).toBe(true);
      expect(preferences.enableInApp).toBe(true);
      
      // Step 2: Update preferences
      const updates: Partial<NotificationPreferences> = {
        enableEmail: false,
        enablePush: true,
        raceNotifications: false,
      };
      
      const updated = await notificationService.updateNotificationPreferences(userId, updates);
      expect(updated.enableEmail).toBe(false);
      expect(updated.enablePush).toBe(true);
      expect(updated.raceNotifications).toBe(false);
      
      // Step 3: Verify preferences persist
      const verified = await notificationService.getUserNotificationPreferences(userId);
      expect(verified.enableEmail).toBe(false);
      expect(verified.raceNotifications).toBe(false);
    });
  });

  describe('Complete Multi-Notification Workflow', () => {
    test('should handle multiple notifications for different events', async () => {
      const userId = 'driver-1';
      
      // Step 1: Create race notification
      const raceRequest: CreateNotificationRequest = {
        userId,
        type: 'race_started',
        title: 'Race Started',
        message: 'The race has started',
        priority: 'high',
      };
      
      const raceNotification = await notificationService.createNotification(raceRequest);
      expect(raceNotification.type).toBe('race_started');
      
      // Step 2: Create flag notification
      const flagRequest: CreateNotificationRequest = {
        userId,
        type: 'flag_change',
        title: 'Yellow Flag',
        message: 'Yellow flag in sector 2',
        data: { sector: 2, flag: 'yellow' },
        priority: 'medium',
      };
      
      const flagNotification = await notificationService.createNotification(flagRequest);
      expect(flagNotification.type).toBe('flag_change');
      
      // Step 3: Create penalty notification
      const penaltyRequest: CreateNotificationRequest = {
        userId,
        type: 'penalty',
        title: 'Penalty Issued',
        message: 'You have received a time penalty',
        data: { penaltyType: 'time', value: 5 },
        priority: 'urgent',
      };
      
      const penaltyNotification = await notificationService.createNotification(penaltyRequest);
      expect(penaltyNotification.type).toBe('penalty');
      
      // Step 4: Retrieve all notifications
      const allNotifications = await notificationService.getUserNotifications(userId);
      expect(allNotifications.length).toBeGreaterThanOrEqual(3);
      
      // Step 5: Mark all as read
      await notificationService.markAllNotificationsAsRead(userId);
      
      // Step 6: Verify all are read
      const finalNotifications = await notificationService.getUserNotifications(userId);
      finalNotifications.forEach(n => {
        expect(n.read).toBe(true);
      });
    });
  });

  describe('Complete Notification Deletion Workflow', () => {
    test('should handle complete notification deletion workflow', async () => {
      const userId = 'driver-1';
      
      // Step 1: Create notification
      const request: CreateNotificationRequest = {
        userId,
        type: 'position_update',
        title: 'Position Update',
        message: 'You are now in position 3',
        data: { position: 3 },
      };
      
      const notification = await notificationService.createNotification(request);
      expect(notification).toBeDefined();
      
      // Step 2: Delete notification
      await notificationService.deleteNotification(notification.id, userId);
      
      // Step 3: Verify notification is deleted
      const notifications = await notificationService.getUserNotifications(userId);
      const deleted = notifications.find(n => n.id === notification.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('Complete Notification Priority Workflow', () => {
    test('should handle notifications with different priorities', async () => {
      const userId = 'driver-1';
      
      // Step 1: Create low priority notification
      const lowRequest: CreateNotificationRequest = {
        userId,
        type: 'checkpoint',
        title: 'Checkpoint Passed',
        message: 'You passed checkpoint 1',
        priority: 'low',
      };
      
      const lowNotification = await notificationService.createNotification(lowRequest);
      expect(lowNotification.priority).toBe('low');
      
      // Step 2: Create medium priority notification
      const mediumRequest: CreateNotificationRequest = {
        userId,
        type: 'flag_change',
        title: 'Blue Flag',
        message: 'Faster car approaching',
        priority: 'medium',
      };
      
      const mediumNotification = await notificationService.createNotification(mediumRequest);
      expect(mediumNotification.priority).toBe('medium');
      
      // Step 3: Create high priority notification
      const highRequest: CreateNotificationRequest = {
        userId,
        type: 'race_starting',
        title: 'Race Starting',
        message: 'Race will start soon',
        priority: 'high',
      };
      
      const highNotification = await notificationService.createNotification(highRequest);
      expect(highNotification.priority).toBe('high');
      
      // Step 4: Create urgent priority notification
      const urgentRequest: CreateNotificationRequest = {
        userId,
        type: 'penalty',
        title: 'Urgent Penalty',
        message: 'Immediate action required',
        priority: 'urgent',
      };
      
      const urgentNotification = await notificationService.createNotification(urgentRequest);
      expect(urgentNotification.priority).toBe('urgent');
    });
  });

  describe('Complete Notification Expiration Workflow', () => {
    test('should handle notification expiration', async () => {
      const userId = 'driver-1';
      
      // Step 1: Create notification with expiration
      const request: CreateNotificationRequest = {
        userId,
        type: 'race_starting',
        title: 'Temporary Notification',
        message: 'This will expire',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      };
      
      const notification = await notificationService.createNotification(request);
      expect(notification.expiresAt).toBeDefined();
      
      // Step 2: Create notification without expiration
      const permanentRequest: CreateNotificationRequest = {
        userId,
        type: 'race_finished',
        title: 'Permanent Notification',
        message: 'This will not expire',
      };
      
      const permanentNotification = await notificationService.createNotification(permanentRequest);
      expect(permanentNotification.expiresAt).toBeUndefined();
    });
  });

  describe('Complete Notification Data Workflow', () => {
    test('should handle notifications with custom data', async () => {
      const userId = 'driver-1';
      
      // Step 1: Create notification with complex data
      const request: CreateNotificationRequest = {
        userId,
        type: 'flag_change',
        title: 'Sector Flag Update',
        message: 'Flag changed in sector 2',
        data: {
          sector: 2,
          flag: 'yellow',
          reason: 'Debris on track',
          estimatedClearTime: Date.now() + 300000,
          affectedDrivers: ['driver-2', 'driver-3'],
        },
      };
      
      const notification = await notificationService.createNotification(request);
      expect(notification.data).toBeDefined();
      expect(notification.data?.sector).toBe(2);
      expect(notification.data?.flag).toBe('yellow');
      expect(notification.data?.affectedDrivers).toContain('driver-2');
    });
  });

  describe('Complete Pagination Workflow', () => {
    test('should handle notification pagination', async () => {
      const userId = 'driver-1';
      
      // Step 1: Create multiple notifications
      for (let i = 0; i < 20; i++) {
        const request: CreateNotificationRequest = {
          userId,
          type: 'position_update',
          title: `Position Update ${i}`,
          message: `You are in position ${i + 1}`,
          data: { position: i + 1 },
        };
        
        await notificationService.createNotification(request);
      }
      
      // Step 2: Retrieve first page
      const page1 = await notificationService.getUserNotifications(userId, 10, 0);
      expect(page1.length).toBeLessThanOrEqual(10);
      
      // Step 3: Retrieve second page
      const page2 = await notificationService.getUserNotifications(userId, 10, 10);
      expect(page2.length).toBeLessThanOrEqual(10);
      
      // Step 4: Verify no duplicates
      const allIds = [...page1, ...page2].map(n => n.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });

  describe('Edge Case Workflows', () => {
    test('should handle rapid notification creation', async () => {
      const userId = 'driver-1';
      const requests: CreateNotificationRequest[] = [];
      
      // Create 10 notifications rapidly
      for (let i = 0; i < 10; i++) {
        requests.push({
          userId,
          type: 'position_update',
          title: `Update ${i}`,
          message: `Message ${i}`,
        });
      }
      
      const startTime = Date.now();
      const results = await Promise.all(
        requests.map(request => notificationService.createNotification(request))
      );
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    test('should handle special characters in notifications', async () => {
      const userId = 'driver-1';
      
      const request: CreateNotificationRequest = {
        userId,
        type: 'flag_change',
        title: 'Test with émojis 🏁 and spëcial chårs',
        message: 'Message with <html> tags & symbols',
        data: { special: 'value with "quotes" and \'apostrophes\'' },
      };
      
      const notification = await notificationService.createNotification(request);
      expect(notification.title).toContain('🏁');
    });
  });

  describe('Data Consistency Workflow', () => {
    test('should maintain consistency across operations', async () => {
      const userId = 'driver-1';
      
      // Create notification
      const request: CreateNotificationRequest = {
        userId,
        type: 'race_starting',
        title: 'Test',
        message: 'Test message',
      };
      
      const notification = await notificationService.createNotification(request);
      
      // Retrieve multiple times
      const notifications1 = await notificationService.getUserNotifications(userId);
      const notifications2 = await notificationService.getUserNotifications(userId);
      const notifications3 = await notificationService.getUserNotifications(userId);
      
      expect(notifications1.length).toBe(notifications2.length);
      expect(notifications2.length).toBe(notifications3.length);
    });
  });

  describe('Performance Workflow', () => {
    test('should handle large number of notifications efficiently', async () => {
      const userId = 'driver-1';
      
      // Create 50 notifications
      const requests: CreateNotificationRequest[] = [];
      for (let i = 0; i < 50; i++) {
        requests.push({
          userId,
          type: 'position_update',
          title: `Update ${i}`,
          message: `Message ${i}`,
        });
      }
      
      const startTime = Date.now();
      await Promise.all(
        requests.map(request => notificationService.createNotification(request))
      );
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
      
      // Retrieve all notifications
      const allNotifications = await notificationService.getUserNotifications(userId, 100);
      expect(allNotifications.length).toBeGreaterThanOrEqual(50);
    });
  });
});
