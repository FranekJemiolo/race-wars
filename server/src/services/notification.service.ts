import { pool } from '../database';
import { notificationRepository } from '../database/repositories/notification.repository';
import { userRepository } from '../database/repositories/user.repository';
import { raceRepository } from '../database/repositories/race.repository';

export interface NotificationData {
  id: string;
  userId: string;
  type: 'race_starting' | 'race_started' | 'race_finished' | 'flag_change' | 'safety_car' | 'penalty' | 'checkpoint' | 'position_update';
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationData['type'];
  title: string;
  message: string;
  data?: any;
  priority?: NotificationData['priority'];
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  enableEmail: boolean;
  enablePush: boolean;
  enableInApp: boolean;
  raceNotifications: boolean;
  flagNotifications: boolean;
  penaltyNotifications: boolean;
}

class NotificationService {
  async createNotification(request: CreateNotificationRequest): Promise<NotificationData> {
    const notification = await notificationRepository.create({
      id: crypto.randomUUID(),
      userId: request.userId,
      type: request.type,
      title: request.title,
      message: request.message,
      data: request.data,
      priority: request.priority || 'medium',
      read: false,
      createdAt: new Date(),
      expiresAt: request.expiresAt
    });

    // Send real-time notification via WebSocket
    await this.sendRealTimeNotification(notification);

    // Send push notification if enabled
    const preferences = await this.getUserNotificationPreferences(request.userId);
    if (preferences.enablePush) {
      await this.sendPushNotification(notification, preferences);
    }

    // Send email notification if enabled
    if (preferences.enableEmail) {
      await this.sendEmailNotification(notification, preferences);
    }

    return notification;
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0): Promise<NotificationData[]> {
    return await notificationRepository.findByUserId(userId, limit, offset);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await notificationRepository.delete(notificationId, userId);
  }

  async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const preferences = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (preferences.rows.length === 0) {
      // Create default preferences
      return await this.createUserNotificationPreferences(userId);
    }

    return preferences.rows[0] as NotificationPreferences;
  }

  async createUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const result = await pool.query(
      `INSERT INTO notification_preferences (user_id, enable_email, enable_push, enable_in_app, race_notifications, flag_notifications, penalty_notifications)
       VALUES ($1, true, true, true, true, true, true)
       RETURNING *`,
      [userId]
    );

    return result.rows[0] as NotificationPreferences;
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const setClause = Object.keys(preferences).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const result = await pool.query(
      `UPDATE notification_preferences 
       SET ${setClause}
       WHERE user_id = $1
       RETURNING *`,
      [...Object.values(preferences), userId]
    );

    return result.rows[0] as NotificationPreferences;
  }

  async sendRealTimeNotification(notification: NotificationData): Promise<void> {
    // This would integrate with WebSocket service
    // For now, we'll emit to a notification channel
    console.log(`Real-time notification: ${notification.type} for user ${notification.userId}`, notification);
    
    // TODO: Integrate with WebSocket service
    // await websocketService.sendToUser(notification.userId, {
    //   type: 'notification',
    //   data: notification
    // });
  }

  async sendPushNotification(notification: NotificationData, preferences: NotificationPreferences): Promise<void> {
    // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
    console.log(`Push notification: ${notification.type} for user ${notification.userId}`, notification);
    
    // Mock push notification implementation
    /*
    const pushPayload = {
      to: preferences.pushToken,
      notification: {
        title: notification.title,
        body: notification.message,
        data: notification.data,
        priority: notification.priority,
        sound: 'default'
      }
    };

    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FCM_SERVER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pushPayload)
    });
    */
  }

  async sendEmailNotification(notification: NotificationData, preferences: NotificationPreferences): Promise<void> {
    // TODO: Integrate with email service
    console.log(`Email notification: ${notification.type} for user ${notification.userId}`, notification);
    
    // Mock email implementation
    /*
    const emailContent = {
      to: preferences.email,
      subject: notification.title,
      text: notification.message,
      html: this.generateEmailHTML(notification)
    };

    await emailService.send(emailContent);
    */
  }

  generateEmailHTML(notification: NotificationData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin: 0 0 10px 0;">${notification.title}</h2>
          <p style="color: #666; line-height: 1.5;">${notification.message}</p>
          ${notification.data ? `
            <div style="background: #e9ecef; padding: 15px; border-radius: 4px; margin-top: 10px;">
              <h4 style="color: #333; margin: 0 0 5px 0;">Details</h4>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(notification.data, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated notification from Race Wars.</p>
        </div>
      </div>
    `;
  }

  async createRaceNotifications(raceId: string, type: 'starting' | 'started' | 'finished'): Promise<void> {
    // Get all participants for the race
    const participants = await pool.query(
      `SELECT user_id FROM race_participants WHERE race_id = $1`,
      [raceId]
    );

    // Create notifications for all participants
    for (const participant of participants.rows) {
      const userId = participant.user_id;
      
      if (type === 'starting') {
        await this.createNotification({
          userId,
          type: 'race_starting',
          title: 'Race Starting Soon',
          message: 'The race you registered for is about to start!',
          data: { raceId },
          priority: 'high',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        });
      } else if (type === 'started') {
        await this.createNotification({
          userId,
          type: 'race_started',
          title: 'Race Started!',
          message: 'The race has started! Good luck!',
          data: { raceId },
          priority: 'high'
        });
      } else if (type === 'finished') {
        await this.createNotification({
          userId,
          type: 'race_finished',
          title: 'Race Finished',
          message: 'The race has finished. Check your results!',
          data: { raceId },
          priority: 'medium'
        });
      }
    }
  }

  async createFlagNotification(raceId: string, flagType: string, message: string): Promise<void> {
    // Get all participants and spectators for the race
    const participants = await pool.query(
      `SELECT user_id FROM race_participants WHERE race_id = $1
       UNION SELECT user_id FROM race_spectators WHERE race_id = $1`,
      [raceId]
    );

    // Create flag notifications for all participants and spectators
    for (const participant of participants.rows) {
      await this.createNotification({
        userId: participant.user_id,
        type: 'flag_change',
        title: `Race Flag: ${flagType.toUpperCase()}`,
        message: message,
        data: { raceId, flagType },
        priority: 'high'
      });
    }
  }

  async createSafetyCarNotification(raceId: string, action: 'deployed' | 'recalled', message: string): Promise<void> {
    // Get all participants and spectators for the race
    const participants = await pool.query(
      `SELECT user_id FROM race_participants WHERE race_id = $1
       UNION SELECT user_id FROM race_spectators WHERE race_id = $1`,
      [raceId]
    );

    // Create safety car notifications
    for (const participant of participants.rows) {
      await this.createNotification({
        userId: participant.user_id,
        type: 'safety_car',
        title: `Safety Car ${action === 'deployed' ? 'Deployed' : 'Recalled'}`,
        message: message,
        data: { raceId, action },
        priority: 'high'
      });
    }
  }

  async createPenaltyNotification(userId: string, penalty: any, message: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'penalty',
      title: 'Race Penalty',
      message: message,
      data: { penalty },
      priority: 'medium'
    });
  }

  async createCheckpointNotification(userId: string, checkpoint: any, message: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'checkpoint',
      title: 'Checkpoint Reached',
      message: message,
      data: { checkpoint },
      priority: 'low'
    });
  }

  async cleanupExpiredNotifications(): Promise<void> {
    await notificationRepository.deleteExpired();
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  async getNotificationStats(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN type = 'race_started' THEN 1 END) as race_notifications,
        COUNT(CASE WHEN type = 'flag_change' THEN 1 END) as flag_notifications,
        COUNT(CASE WHEN type = 'penalty' THEN 1 END) as penalty_notifications
       FROM notifications 
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY user_id`,
      [userId]
    );

    return result.rows[0];
  }
}

export const notificationService = new NotificationService();
