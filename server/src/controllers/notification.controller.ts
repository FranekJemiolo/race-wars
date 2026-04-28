import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

export class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await notificationService.getUserNotifications(userId, limit, offset);
      
      res.json({
        notifications,
        pagination: {
          limit,
          offset,
          total: notifications.length
        }
      });
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      res.status(500).json({ error: 'Failed to get notifications' });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { notificationId } = req.body;

      if (!userId || !notificationId) {
        res.status(400).json({ error: 'User ID and notification ID required' });
        return;
      }

      await notificationService.markNotificationAsRead(notificationId, userId);
      
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await notificationService.markAllNotificationsAsRead(userId);
      
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const { notificationId } = req.params;

      if (!userId || !notificationId) {
        res.status(400).json({ error: 'User ID and Notification ID required' });
        return;
      }

      await notificationService.deleteNotification(notificationId, userId);
      
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const preferences = await notificationService.getUserNotificationPreferences(userId);
      
      res.json({ preferences });
    } catch (error) {
      logger.error('Failed to get notification preferences:', error);
      res.status(500).json({ error: 'Failed to get notification preferences' });
    }
  }

  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const preferences = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updatedPreferences = await notificationService.updateNotificationPreferences(userId, preferences);
      
      res.json({ 
        message: 'Notification preferences updated',
        preferences: updatedPreferences 
      });
    } catch (error) {
      logger.error('Failed to update notification preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const stats = await notificationService.getNotificationStats(userId);
      
      res.json({ stats });
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      res.status(500).json({ error: 'Failed to get notification stats' });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await notificationService.getUnreadCount(userId);
      
      res.json({ count });
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }
}

export const notificationController = new NotificationController();
