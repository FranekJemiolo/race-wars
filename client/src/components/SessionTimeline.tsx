/**
 * Session Timeline Component
 * 
 * Displays a timeline of events for a session including:
 * - Session start/end
 * - Incidents
 * - Penalties
 * - Flag changes
 * - Position updates
 */

import React, { useState, useEffect } from 'react';

interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'session_start' | 'session_end' | 'incident' | 'penalty' | 'flag_change' | 'checkpoint' | 'other';
  title: string;
  description?: string;
  participantId?: string;
  participantName?: string;
  carNumber?: string;
  severity?: 'minor' | 'moderate' | 'major' | 'critical';
  metadata?: any;
}

interface SessionTimelineProps {
  sessionId: string;
  onEventClick?: (event: TimelineEvent) => void;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  sessionId,
  onEventClick,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    loadTimelineEvents();
  }, [sessionId]);

  const loadTimelineEvents = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockEvents: TimelineEvent[] = [
        {
          id: 'e1',
          timestamp: Date.now() - 3600000,
          type: 'session_start',
          title: 'Session Started',
          description: 'Race session began',
        },
        {
          id: 'e2',
          timestamp: Date.now() - 3000000,
          type: 'checkpoint',
          title: 'Checkpoint Passed',
          description: 'Car #42 passed checkpoint #1',
          participantId: '1',
          participantName: 'John Doe',
          carNumber: '42',
        },
        {
          id: 'e3',
          timestamp: Date.now() - 2400000,
          type: 'flag_change',
          title: 'Yellow Flag',
          description: 'Sector 2 - Yellow flag deployed',
          metadata: { sector: 2, flag: 'yellow' },
        },
        {
          id: 'e4',
          timestamp: Date.now() - 1800000,
          type: 'incident',
          title: 'Off-Track Incident',
          description: 'Car #7 went off track in Sector 2',
          participantId: '2',
          participantName: 'Jane Smith',
          carNumber: '7',
          severity: 'moderate',
        },
        {
          id: 'e5',
          timestamp: Date.now() - 1200000,
          type: 'penalty',
          title: 'Time Penalty Assigned',
          description: '30 second penalty for speed zone violation',
          participantId: '1',
          participantName: 'John Doe',
          carNumber: '42',
          severity: 'major',
        },
        {
          id: 'e6',
          timestamp: Date.now() - 600000,
          type: 'flag_change',
          title: 'Green Flag',
          description: 'Sector 2 - Green flag, track clear',
          metadata: { sector: 2, flag: 'green' },
        },
        {
          id: 'e7',
          timestamp: Date.now() - 300000,
          type: 'checkpoint',
          title: 'Checkpoint Passed',
          description: 'Car #11 passed checkpoint #3',
          participantId: '3',
          participantName: 'Bob Johnson',
          carNumber: '11',
        },
      ];

      setEvents(mockEvents.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load timeline events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'session_start': return '🚦';
      case 'session_end': return '🏁';
      case 'incident': return '⚠️';
      case 'penalty': return '📋';
      case 'flag_change': return '🚩';
      case 'checkpoint': return '📍';
      default: return '📌';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'session_start': return 'bg-green-500';
      case 'session_end': return 'bg-gray-500';
      case 'incident': return 'bg-red-500';
      case 'penalty': return 'bg-orange-500';
      case 'flag_change': return 'bg-yellow-500';
      case 'checkpoint': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityColor = (severity?: string) => {
    if (!severity) return '';
    switch (severity) {
      case 'minor': return 'text-yellow-600';
      case 'moderate': return 'text-orange-600';
      case 'major': return 'text-red-600';
      case 'critical': return 'text-purple-600';
      default: return '';
    }
  };

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType);

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  if (isLoading) {
    return <div className="p-6">Loading timeline...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Session Timeline</h2>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Events</option>
          <option value="session_start">Session Start</option>
          <option value="session_end">Session End</option>
          <option value="incident">Incidents</option>
          <option value="penalty">Penalties</option>
          <option value="flag_change">Flag Changes</option>
          <option value="checkpoint">Checkpoints</option>
        </select>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-gray-500 italic">No events found</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Timeline events */}
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="relative pl-12 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
              >
                {/* Event dot */}
                <div className={`absolute left-2 w-4 h-4 rounded-full ${getEventTypeColor(event.type)} border-2 border-white shadow`}></div>

                {/* Event content */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getEventTypeIcon(event.type)}</span>
                      <span className="font-semibold">{event.title}</span>
                      {event.severity && (
                        <span className={`text-sm font-medium ${getSeverityColor(event.severity)}`}>
                          ({event.severity})
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-gray-600 text-sm">{event.description}</p>
                    )}
                    {event.participantName && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium">#{event.carNumber}</span>
                        <span className="text-sm text-gray-600">{event.participantName}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{formatTime(event.timestamp)}</div>
                    <div className="text-xs text-gray-400">{formatDuration(event.timestamp)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Type:</span>
                <span className="ml-2">{selectedEvent.type}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Time:</span>
                <span className="ml-2">{formatTime(selectedEvent.timestamp)}</span>
              </div>
              {selectedEvent.description && (
                <div>
                  <span className="text-sm text-gray-500">Description:</span>
                  <p className="mt-1">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.participantName && (
                <div>
                  <span className="text-sm text-gray-500">Participant:</span>
                  <span className="ml-2">#{selectedEvent.carNumber} - {selectedEvent.participantName}</span>
                </div>
              )}
              {selectedEvent.severity && (
                <div>
                  <span className="text-sm text-gray-500">Severity:</span>
                  <span className={`ml-2 font-medium ${getSeverityColor(selectedEvent.severity)}`}>
                    {selectedEvent.severity}
                  </span>
                </div>
              )}
              {selectedEvent.metadata && (
                <div>
                  <span className="text-sm text-gray-500">Metadata:</span>
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
