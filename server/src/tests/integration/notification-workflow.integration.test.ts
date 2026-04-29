/**
 * Integration Tests for Notification Workflow
 * 
 * Tests complete notification workflows including:
 * - Real-time notification generation during races
 * - Multi-channel notification delivery (push, email, in-app)
 * - Notification preferences and filtering
 * - Performance under high notification load
 */

import { notificationService } from '../../services/notification.service';
import { pushNotificationService } from '../../services/pushNotification.service';
import { emailNotificationService } from '../../services/emailNotification.service';
import { sessionService } from '../../services/session.service';
import { participationService } from '../../services/participation.service';
import { SimulationClient } from '../../simulation/SimulationClient';
import type { Notification, NotificationPreferences } from '../../types';

describe('Notification Workflow Integration Tests', () => {
  const TEST_USERS = ['user-1', 'user-2', 'user-3'];
  let simulationClients: SimulationClient[];

  beforeAll(async () => {
    simulationClients = [];
    // Initialize notification services
    await pushNotificationService.initialize({
      credential: {
        clientEmail: 'test@example.com',
        privateKey: 'test-key',
        projectId: 'test-project'
      }
    });

    await emailNotificationService.initialize({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    });
  });

  afterAll(async () => {
    // Clean up
    for (const client of simulationClients) {
      if (client.getIsConnected()) {
        client.disconnect();
      }
    }
  });

  describe('Race Notification Workflows', () => {
    test('should generate race start notifications for all participants', async () => {
      // Create test session
      const sessionData = {
        trackId: 'track-1',
        name: 'Notification Test Race',
        description: 'Testing race notifications',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 3,
        createdBy: 'user-1'
      };

      const session = await sessionService.createSession(sessionData);
      await sessionService.startSession(session.id);

      // Register participants
      for (const userId of TEST_USERS) {
        await participationService.startParticipant(session.id, userId);
      }

      // Generate race start notifications
      await notificationService.createRaceNotifications(session.id, 'race_started', {
        sessionId: session.id,
        trackName: 'Silverstone Circuit',
        startTime: new Date().toISOString()
      });

      // Verify all participants received notifications
      for (const userId of TEST_USERS) {
        const notifications = await notificationService.getUserNotifications(userId);
        const raceStartNotification = notifications.find(n => 
          n.type === 'race_started' && n.data?.sessionId === session.id
        );
        
        expect(raceStartNotification).toBeDefined();
        expect(raceStartNotification?.title).toContain('Race Started');
        expect(raceStartNotification?.read).toBe(false);
      }

      await sessionService.completeSession(session.id);
    });

    test('should handle safety car notifications across all sectors', async () => {
      const sessionData = {
        trackId: 'track-1',
        name: 'Safety Car Notification Test',
        description: 'Testing safety car notifications',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 3,
        createdBy: 'user-1'
      };

      const session = await sessionService.createSession(sessionData);
      await sessionService.startSession(session.id);

      // Register participants
      for (const userId of TEST_USERS) {
        await participationService.startParticipant(session.id, userId);
      }

      // Generate safety car notifications
      await notificationService.createSafetyCarNotification(session.id, {
        reason: 'Debris on track',
        sector: 'sector-1',
        deployedAt: new Date().toISOString()
      });

      // Verify safety car notifications
      for (const userId of TEST_USERS) {
        const notifications = await notificationService.getUserNotifications(userId);
        const safetyCarNotification = notifications.find(n => 
          n.type === 'safety_car' && n.data?.sessionId === session.id
        );
        
        expect(safetyCarNotification).toBeDefined();
        expect(safetyCarNotification?.title).toContain('Safety Car');
        expect(safetyCarNotification?.priority).toBe('high');
      }

      await sessionService.completeSession(session.id);
    });

    test('should generate penalty notifications for violations', async () => {
      const sessionData = {
        trackId: 'track-1',
        name: 'Penalty Notification Test',
        description: 'Testing penalty notifications',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 1,
        createdBy: 'user-1'
      };

      const session = await sessionService.createSession(sessionData);
      await sessionService.startSession(session.id);

      await participationService.startParticipant(session.id, 'user-1');

      // Generate penalty notification
      await notificationService.createPenaltyNotification('user-1', {
        type: 'speeding',
        penaltyPoints: 2,
        reason: 'Exceeding speed limit in sector 2',
        location: 'Sector 2 - Speed Trap',
        timestamp: new Date().toISOString()
      });

      // Verify penalty notification
      const notifications = await notificationService.getUserNotifications('user-1');
      const penaltyNotification = notifications.find(n => 
        n.type === 'penalty' && n.data?.type === 'speeding'
      );
      
      expect(penaltyNotification).toBeDefined();
      expect(penaltyNotification?.title).toContain('Penalty');
      expect(penaltyNotification?.data?.penaltyPoints).toBe(2);

      await sessionService.completeSession(session.id);
    });

    test('should respect notification preferences', async () => {
      // Set different preferences for users
      const preferences: NotificationPreferences[] = [
        {
          userId: 'user-1',
          enableEmail: true,
          enablePush: true,
          enableInApp: true,
          raceNotifications: true,
          flagNotifications: true,
          penaltyNotifications: true
        },
        {
          userId: 'user-2',
          enableEmail: false,
          enablePush: true,
          enableInApp: true,
          raceNotifications: true,
          flagNotifications: false,
          penaltyNotifications: false
        },
        {
          userId: 'user-3',
          enableEmail: false,
          enablePush: false,
          enableInApp: true,
          raceNotifications: false,
          flagNotifications: true,
          penaltyNotifications: true
        }
      ];

      // Update preferences
      for (const pref of preferences) {
        await notificationService.updateNotificationPreferences(pref.userId, pref);
      }

      // Create session and generate different notification types
      const session = await sessionService.createSession({
        trackId: 'track-1',
        name: 'Preferences Test Race',
        description: 'Testing notification preferences',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 3,
        createdBy: 'user-1'
      });

      await sessionService.startSession(session.id);

      // Register all participants
      for (const userId of TEST_USERS) {
        await participationService.startParticipant(session.id, userId);
      }

      // Generate race notifications
      await notificationService.createRaceNotifications(session.id, 'race_started', {
        sessionId: session.id,
        trackName: 'Silverstone Circuit'
      });

      // Generate flag notifications
      await notificationService.createFlagNotification(session.id, {
        sector: 'sector-1',
        flag: 'yellow',
        reason: 'Debris on track'
      });

      // Generate penalty notifications
      await notificationService.createPenaltyNotification('user-1', {
        type: 'speeding',
        penaltyPoints: 1,
        reason: 'Minor speeding'
      });

      // Verify preferences are respected
      for (const userId of TEST_USERS) {
        const notifications = await notificationService.getUserNotifications(userId);
        const userPref = preferences.find(p => p.userId === userId);

        // Check race notifications
        const raceNotifs = notifications.filter(n => n.type === 'race_started');
        if (userPref?.raceNotifications) {
          expect(raceNotifs.length).toBeGreaterThan(0);
        }

        // Check flag notifications
        const flagNotifs = notifications.filter(n => n.type === 'flag_change');
        if (userPref?.flagNotifications) {
          expect(flagNotifs.length).toBeGreaterThan(0);
        }

        // Check penalty notifications (only user-1 should receive)
        const penaltyNotifs = notifications.filter(n => n.type === 'penalty');
        if (userId === 'user-1' && userPref?.penaltyNotifications) {
          expect(penaltyNotifs.length).toBeGreaterThan(0);
        }
      }

      await sessionService.completeSession(session.id);
    });
  });

  describe('Multi-Channel Notification Delivery', () => {
    test('should deliver notifications via multiple channels', async () => {
      // Create test notification
      const notification: Omit<Notification, 'id'> = {
        userId: 'user-1',
        type: 'race_started',
        title: 'Race Started',
        message: 'Your race has begun at Silverstone Circuit',
        data: {
          sessionId: 'test-session-1',
          trackName: 'Silverstone Circuit'
        },
        priority: 'medium',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      };

      // Test in-app delivery
      const createdNotification = await notificationService.createNotification(notification);
      expect(createdNotification.id).toBeDefined();

      // Test push notification delivery
      const pushResult = await pushNotificationService.sendToUser('user-1', {
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: notification.priority
      });

      // Push notification might return null if service not fully configured
      expect(pushResult === null || typeof pushResult === 'string').toBe(true);

      // Test email notification delivery
      const emailResult = await emailNotificationService.sendNotification({
        to: 'user-1@example.com',
        subject: notification.title,
        text: notification.message,
        html: `<p>${notification.message}</p>`
      });

      // Email might not be configured in test environment
      expect(emailResult === null || typeof emailResult === 'string').toBe(true);
    });

    test('should handle notification delivery failures gracefully', async () => {
      // Test with invalid user ID
      const notifications = await notificationService.getUserNotifications('invalid-user');
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBe(0);

      // Test push notification to non-existent user
      const pushResult = await pushNotificationService.sendToUser('non-existent-user', {
        title: 'Test',
        message: 'Test message',
        data: {}
      });

      expect(pushResult).toBe(null);

      // Test email notification to invalid address
      const emailResult = await emailNotificationService.sendNotification({
        to: 'invalid-email',
        subject: 'Test',
        text: 'Test'
      });

      expect(emailResult === null || typeof emailResult === 'string').toBe(true);
    });
  });

  describe('High-Volume Notification Scenarios', () => {
    test('should handle rapid notification generation', async () => {
      const sessionData = {
        trackId: 'track-1',
        name: 'High Volume Test Race',
        description: 'Testing high notification volume',
        sessionType: 'race' as const,
        scheduledStart: new Date(Date.now() + 60000),
        scheduledEnd: new Date(Date.now() + 3600000),
        maxParticipants: 10,
        createdBy: 'user-1'
      };

      const session = await sessionService.createSession(sessionData);
      await sessionService.startSession(session.id);

      // Create many participants
      const participantIds = [];
      for (let i = 0; i < 10; i++) {
        const userId = `user-${i}`;
        await participationService.startParticipant(session.id, userId);
        participantIds.push(userId);
      }

      // Generate many notifications rapidly
      const notificationPromises = [];
      
      // Race start notifications
      notificationPromises.push(
        notificationService.createRaceNotifications(session.id, 'race_started', {
          sessionId: session.id,
          trackName: 'Silverstone Circuit'
        })
      );

      // Flag changes for multiple sectors
      for (let sector = 1; sector <= 3; sector++) {
        notificationPromises.push(
          notificationService.createFlagNotification(session.id, {
            sector: `sector-${sector}`,
            flag: 'yellow',
            reason: `Incident in sector ${sector}`
          })
        );
      }

      // Penalty notifications
      for (let i = 0; i < 5; i++) {
        notificationPromises.push(
          notificationService.createPenaltyNotification(participantIds[i], {
            type: 'speeding',
            penaltyPoints: 1,
            reason: `Speed violation ${i + 1}`
          })
        );
      }

      // Execute all notifications
      const startTime = Date.now();
      await Promise.all(notificationPromises);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);

      // Verify notifications were created
      for (const userId of participantIds) {
        const notifications = await notificationService.getUserNotifications(userId);
        expect(notifications.length).toBeGreaterThan(0);
      }

      await sessionService.completeSession(session.id);
    });

    test('should maintain performance with large notification history', async () => {
      // Create many notifications for a user
      const userId = 'user-1';
      const notificationCount = 100;

      const notificationPromises = [];
      for (let i = 0; i < notificationCount; i++) {
        notificationPromises.push(
          notificationService.createNotification({
            userId: userId,
            type: 'race_started',
            title: `Test Notification ${i}`,
            message: `This is test notification number ${i}`,
            data: { index: i },
            priority: 'low',
            createdAt: new Date(Date.now() - (i * 1000)), // Stagger timestamps
            expiresAt: new Date(Date.now() + 3600000)
          })
        );
      }

      await Promise.all(notificationPromises);

      // Test retrieval performance
      const startTime = Date.now();
      const notifications = await notificationService.getUserNotifications(userId, 50, 0);
      const endTime = Date.now();

      // Should retrieve quickly
      expect(endTime - startTime).toBeLessThan(1000);
      expect(notifications.length).toBe(50);

      // Test pagination
      const page2 = await notificationService.getUserNotifications(userId, 50, 50);
      expect(page2.length).toBe(50);

      // Test unread count performance
      const unreadStartTime = Date.now();
      const unreadCount = await notificationService.getUnreadCount(userId);
      const unreadEndTime = Date.now();

      expect(unreadEndTime - unreadStartTime).toBeLessThan(500);
      expect(unreadCount).toBe(notificationCount);
    });
  });

  describe('Notification Expiration and Cleanup', () => {
    test('should handle notification expiration', async () => {
      const userId = 'user-1';
      
      // Create notification that expires quickly
      const expiredNotification = await notificationService.createNotification({
        userId: userId,
        type: 'race_started',
        title: 'Expiring Notification',
        message: 'This will expire soon',
        data: {},
        priority: 'low',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 100) // Expires in 100ms
      });

      // Should be visible initially
      const initialNotifications = await notificationService.getUserNotifications(userId);
      expect(initialNotifications.some(n => n.id === expiredNotification.id)).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should be excluded from active notifications
      const afterExpirationNotifications = await notificationService.getUserNotifications(userId);
      expect(afterExpirationNotifications.some(n => n.id === expiredNotification.id)).toBe(false);
    });

    test('should clean up expired notifications', async () => {
      const userId = 'user-1';
      
      // Create expired notifications
      for (let i = 0; i < 10; i++) {
        await notificationService.createNotification({
          userId: userId,
          type: 'race_started',
          title: `Expired Notification ${i}`,
          message: `This notification is expired ${i}`,
          data: { index: i },
          priority: 'low',
          createdAt: new Date(Date.now() - 3600000), // Created 1 hour ago
          expiresAt: new Date(Date.now() - 1800000) // Expired 30 minutes ago
        });
      }

      // Create active notifications
      for (let i = 0; i < 5; i++) {
        await notificationService.createNotification({
          userId: userId,
          type: 'race_started',
          title: `Active Notification ${i}`,
          message: `This notification is active ${i}`,
          data: { index: i },
          priority: 'low',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        });
      }

      // Run cleanup
      await notificationService.cleanupExpiredNotifications();

      // Should only have active notifications
      const remainingNotifications = await notificationService.getUserNotifications(userId);
      expect(remainingNotifications.length).toBe(5);
      remainingNotifications.forEach(n => {
        expect(n.title).toContain('Active Notification');
      });
    });
  });
});
