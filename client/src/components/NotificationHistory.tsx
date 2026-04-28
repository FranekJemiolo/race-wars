/**
 * Notification History Component
 * 
 * Displays a list of user's notifications with filtering,
 * search, and pagination capabilities
 */

import React, { useState, useEffect } from 'react';

interface NotificationData {
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

interface NotificationHistoryProps {
  userId: string;
}

const NotificationHistory: React.FC<NotificationHistoryProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

  const itemsPerPage = 20;

  useEffect(() => {
    loadNotifications();
  }, [userId, filter, searchTerm, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Load notifications from API
      // const response = await notificationService.getUserNotifications(
      //   userId, 
      //   itemsPerPage, 
      //   (page - 1) * itemsPerPage
      // );
      
      // Mock data for now
      const mockNotifications: NotificationData[] = [
        {
          id: '1',
          userId: userId,
          type: 'race_starting',
          title: 'Race Starting Soon',
          message: 'Your race "Morning Practice" is starting in 10 minutes',
          priority: 'high',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        },
        {
          id: '2',
          userId: userId,
          type: 'penalty',
          title: 'Speed Violation',
          message: 'Speed limit exceeded: 85 km/h in 60 km/h zone',
          priority: 'urgent',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          data: { speed: 85, limit: 60, location: 'Sector 2' },
        },
        {
          id: '3',
          userId: userId,
          type: 'flag_change',
          title: 'Yellow Flag',
          message: 'Yellow flag displayed in Sector 3 - Hazard on track',
          priority: 'high',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          id: '4',
          userId: userId,
          type: 'race_finished',
          title: 'Race Completed',
          message: 'Congratulations! You finished the race in 3rd position',
          priority: 'medium',
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
      ];

      setNotifications(mockNotifications);
      setTotalPages(Math.ceil(mockNotifications.length / itemsPerPage));
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Mark notification as read via API
      // await notificationService.markNotificationAsRead(notificationId, userId);
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Mark all notifications as read via API
      // await notificationService.markAllNotificationsAsRead(userId);
      
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // TODO: Delete notification via API
      // await notificationService.deleteNotification(notificationId, userId);
      
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
      setSelectedNotification(null);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(notification => {
        if (filter === 'unread') return !notification.read;
        if (filter === 'read') return notification.read;
        return notification.type === filter;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getNotificationIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'race_starting':
      case 'race_started':
      case 'race_finished':
        return '🏁';
      case 'flag_change':
        return '🚩';
      case 'safety_car':
        return '🏎️';
      case 'penalty':
        return '⚠️';
      case 'checkpoint':
        return '📍';
      case 'position_update':
        return '📊';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: NotificationData['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const filteredNotifications = getFilteredNotifications();
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Notification History</h1>
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="race_starting">Race Starting</option>
              <option value="race_started">Race Started</option>
              <option value="race_finished">Race Finished</option>
              <option value="flag_change">Flag Changes</option>
              <option value="safety_car">Safety Car</option>
              <option value="penalty">Penalties</option>
              <option value="checkpoint">Checkpoints</option>
              <option value="position_update">Position Updates</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {paginatedNotifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-4xl mb-4">📭</div>
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    {!notification.read && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((page - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(page * itemsPerPage, filteredNotifications.length)} of{' '}
                {filteredNotifications.length} notifications
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">
                  {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedNotification.title}
                </h2>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {getNotificationIcon(selectedNotification.type)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedNotification.priority)}`}>
                    {selectedNotification.priority}
                  </span>
                </div>

                <p className="text-gray-700">
                  {selectedNotification.message}
                </p>

                <div className="text-sm text-gray-500">
                  <p>Type: {selectedNotification.type.replace('_', ' ')}</p>
                  <p>Date: {selectedNotification.createdAt.toLocaleString()}</p>
                  <p>Status: {selectedNotification.read ? 'Read' : 'Unread'}</p>
                </div>

                {selectedNotification.data && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h3>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(selectedNotification.data, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  {!selectedNotification.read && (
                    <button
                      onClick={() => markAsRead(selectedNotification.id)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(selectedNotification.id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
