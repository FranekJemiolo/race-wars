import { pool } from '../index';

export interface Notification {
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

export interface NotificationPreferences {
  userId: string;
  enableEmail: boolean;
  enablePush: boolean;
  enableInApp: boolean;
  raceNotifications: boolean;
  flagNotifications: boolean;
  penaltyNotifications: boolean;
}

export class NotificationRepository {
  async create(notification: Omit<Notification, 'id'>): Promise<Notification> {
    const result = await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, data, priority, read, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        crypto.randomUUID(),
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data),
        notification.priority,
        false,
        notification.createdAt,
        notification.expiresAt
      ]
    );

    return result.rows[0] as Notification;
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows as Notification[];
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications 
       SET read = true 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications 
       SET read = true 
       WHERE user_id = $1 AND read = false`,
      [userId]
    );
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  async deleteExpired(): Promise<void> {
    await pool.query(
      `DELETE FROM notifications 
       WHERE expires_at < NOW()`
    );
  }

  async findById(id: string): Promise<Notification | null> {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] as Notification : null;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 AND read = false 
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }
}

export const notificationRepository = new NotificationRepository();
