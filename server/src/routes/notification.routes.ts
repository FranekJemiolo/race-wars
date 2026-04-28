import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Get user notifications
router.get('/', authenticateToken, notificationController.getNotifications);

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', authenticateToken, notificationController.deleteNotification);

// Get notification preferences
router.get('/preferences', authenticateToken, notificationController.getPreferences);

// Update notification preferences
router.put('/preferences', authenticateToken, notificationController.updatePreferences);

// Get notification stats
router.get('/stats', authenticateToken, notificationController.getStats);

// Get unread count
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount);

export default router;
