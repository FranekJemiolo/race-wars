import React, { useState, useEffect, useRef } from 'react';
import { getRaceAdminEventsService, RaceEvent, EventAction, Priority } from '../services/raceAdminEvents.service';

interface ParticipantNotificationSystemProps {
  participantId: string;
  raceId: string;
  className?: string;
}

interface Notification extends RaceEvent {
  isRead: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: number;
  response?: string;
}

export const ParticipantNotificationSystem: React.FC<ParticipantNotificationSystemProps> = ({
  participantId,
  raceId,
  className = ''
}) => {
  const eventsService = getRaceAdminEventsService();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showAckDialog, setShowAckDialog] = useState(false);
  const [ackResponse, setAckResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load existing notifications
    loadNotifications();
    
    // Subscribe to new events
    const unsubscribe = eventsService.subscribeToParticipantEvents(participantId, (event) => {
      handleNewEvent(event);
    });
    
    // Initialize notification sound
    notificationSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
    
    return unsubscribe;
  }, [participantId, raceId]);

  const loadNotifications = async () => {
    try {
      const participantEvents = await eventsService.getParticipantEvents(participantId);
      const unreadEvents = await eventsService.getUnreadEvents(participantId);
      
      const notificationsWithStatus: Notification[] = participantEvents.map(event => ({
        ...event,
        isRead: !unreadEvents.includes(event),
        isAcknowledged: false
      }));
      
      setNotifications(notificationsWithStatus);
      setUnreadCount(unreadEvents.length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleNewEvent = (event: RaceEvent) => {
    const newNotification: Notification = {
      ...event,
      isRead: false,
      isAcknowledged: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound for urgent/critical events
    if (event.priority === 'urgent' || event.priority === 'critical') {
      playNotificationSound();
    }
    
    // Show immediate alert for critical events
    if (event.priority === 'critical') {
      showImmediateAlert(event);
    }
  };

  const playNotificationSound = () => {
    if (notificationSound.current) {
      notificationSound.current.play().catch(() => {
        // Ignore errors from audio playback
      });
    }
  };

  const showImmediateAlert = (event: RaceEvent) => {
    // Create browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(event.title, {
        body: event.message,
        icon: '/favicon.ico',
        tag: event.id,
        requireInteraction: true
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    // Also show in-app alert
    alert(`🚨 ${event.title}\n\n${event.message}`);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleAcknowledge = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowAckDialog(true);
  };

  const submitAcknowledgment = async () => {
    if (!selectedNotification) return;
    
    setIsProcessing(true);
    
    try {
      await eventsService.acknowledgeEvent(
        selectedNotification.id,
        participantId,
        ackResponse
      );
      
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === selectedNotification.id
          ? {
              ...notification,
              isAcknowledged: true,
              acknowledgedAt: Date.now(),
              response: ackResponse
            }
          : notification
      ));
      
      setShowAckDialog(false);
      setSelectedNotification(null);
      setAckResponse('');
      
      // Show success message
      showSuccessMessage('Event acknowledged successfully');
    } catch (error) {
      console.error('Failed to acknowledge event:', error);
      showErrorMessage('Failed to acknowledge event');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async (action: EventAction, notification: Notification) => {
    try {
      // Handle different action types
      switch (action.action) {
        case 'acknowledge_safety_car':
          await eventsService.acknowledgeEvent(notification.id, participantId, 'Safety car acknowledged');
          break;
        case 'acknowledge_penalty':
          await eventsService.acknowledgeEvent(notification.id, participantId, 'Penalty acknowledged');
          break;
        case 'acknowledge_disqualification':
          await eventsService.acknowledgeEvent(notification.id, participantId, 'Disqualification acknowledged');
          break;
        case 'appeal_penalty':
          // Open appeal dialog or navigate to appeal page
          showInfoMessage('Penalty appeal feature coming soon');
          break;
        default:
          showInfoMessage(`Action "${action.action}" handled`);
      }
      
      // Update notification status
      setNotifications(prev => prev.map(n => 
        n.id === notification.id
          ? { ...n, isAcknowledged: true, acknowledgedAt: Date.now() }
          : n
      ));
    } catch (error) {
      console.error('Failed to handle action:', error);
      showErrorMessage('Failed to handle action');
    }
  };

  const showSuccessMessage = (message: string) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const showErrorMessage = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const showInfoMessage = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'low': return 'border-gray-600 bg-gray-800';
      case 'medium': return 'border-blue-600 bg-blue-900';
      case 'high': return 'border-orange-600 bg-orange-900';
      case 'urgent': return 'border-red-600 bg-red-900';
      case 'critical': return 'border-red-800 bg-red-950';
      default: return 'border-gray-600 bg-gray-800';
    }
  };

  const getPriorityIcon = (priority: Priority): string => {
    switch (priority) {
      case 'low': return '📄';
      case 'medium': return '📋';
      case 'high': return '⚠️';
      case 'urgent': return '🚨';
      case 'critical': return '🔴';
      default: return '📢';
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => (
    <div
      className={`border-l-4 p-4 cursor-pointer transition-all ${getPriorityColor(notification.priority)} ${
        !notification.isRead ? 'bg-opacity-20' : ''
      }`}
      onClick={() => {
        markAsRead(notification.id);
        setSelectedNotification(notification);
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">{getPriorityIcon(notification.priority)}</span>
          <div>
            <h4 className="font-semibold">{notification.title}</h4>
            <p className="text-sm text-gray-400">
              {notification.senderName} • {formatTime(notification.timestamp)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
          {notification.isAcknowledged && (
            <span className="text-green-500 text-sm">✓</span>
          )}
        </div>
      </div>
      
      <p className="text-gray-300 mb-3 line-clamp-2">{notification.message}</p>
      
      {notification.requiresAck && !notification.isAcknowledged && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-yellow-400">⚠️ Requires acknowledgment</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAcknowledge(notification);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation"
          >
            Acknowledge
          </button>
        </div>
      )}
      
      {notification.actions && notification.actions.length > 0 && (
        <div className="flex gap-2 mt-3">
          {notification.actions.map((action) => (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                handleAction(action, notification);
              }}
              className={`px-3 py-1 rounded text-sm touch-manipulation ${
                action.style === 'primary' ? 'bg-blue-600 hover:bg-blue-700' :
                action.style === 'secondary' ? 'bg-gray-600 hover:bg-gray-700' :
                action.style === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                'bg-green-600 hover:bg-green-700'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`participant-notification-system ${className}`}>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 bg-gray-800 hover:bg-gray-700 rounded-lg touch-manipulation"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute top-12 right-0 w-96 max-h-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Notification Detail */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{selectedNotification.title}</h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">
                From: {selectedNotification.senderName} • {formatTime(selectedNotification.timestamp)}
              </p>
              <p className="text-sm text-gray-400 mb-2">
                Priority: {selectedNotification.priority.toUpperCase()} • {selectedNotification.category}
              </p>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300">{selectedNotification.message}</p>
            </div>
            
            {selectedNotification.requiresAck && !selectedNotification.isAcknowledged && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAcknowledge(selectedNotification)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium touch-manipulation"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation"
                >
                  Close
                </button>
              </div>
            )}
            
            {selectedNotification.isAcknowledged && (
              <div className="mb-4 p-3 bg-green-900 rounded-lg">
                <p className="text-green-400 text-sm">✓ Acknowledged</p>
                {selectedNotification.response && (
                  <p className="text-gray-300 text-sm mt-1">Response: {selectedNotification.response}</p>
                )}
              </div>
            )}
            
            {selectedNotification.actions && selectedNotification.actions.length > 0 && (
              <div className="flex gap-2">
                {selectedNotification.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action, selectedNotification)}
                    className={`flex-1 py-2 rounded text-sm touch-manipulation ${
                      action.style === 'primary' ? 'bg-blue-600 hover:bg-blue-700' :
                      action.style === 'secondary' ? 'bg-gray-600 hover:bg-gray-700' :
                      action.style === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                      'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acknowledgment Dialog */}
      {showAckDialog && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Acknowledge Event</h3>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">{selectedNotification.message}</p>
              <p className="text-sm text-gray-400">
                Please confirm you have read and understood this message.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Response (optional)</label>
              <textarea
                value={ackResponse}
                onChange={(e) => setAckResponse(e.target.value)}
                placeholder="Add your response..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={submitAcknowledgment}
                disabled={isProcessing}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 touch-manipulation"
              >
                {isProcessing ? 'Processing...' : 'Acknowledge'}
              </button>
              <button
                onClick={() => {
                  setShowAckDialog(false);
                  setSelectedNotification(null);
                  setAckResponse('');
                }}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
