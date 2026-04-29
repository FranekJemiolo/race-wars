import React, { useState, useEffect } from 'react';
import { getRaceAdminEventsService, RaceEvent, EventTemplate, Priority, Category, EventType, EventTarget } from '../services/raceAdminEvents.service';

interface RaceAdminEventPanelProps {
  raceId: string;
  adminId: string;
  className?: string;
}

export const RaceAdminEventPanel: React.FC<RaceAdminEventPanelProps> = ({
  raceId,
  adminId,
  className = ''
}) => {
  const eventsService = getRaceAdminEventsService();
  
  const [activeTab, setActiveTab] = useState<'create' | 'templates' | 'history' | 'analytics'>('create');
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'information' as EventType,
    target: 'all' as EventTarget,
    priority: 'medium' as Priority,
    category: 'general' as Category,
    title: '',
    message: '',
    requiresAck: false,
    ackDeadline: '',
    scheduledTime: '',
    recipientIds: [] as string[],
    groupIds: [] as string[],
    positions: [] as number[],
    teams: [] as string[]
  });

  useEffect(() => {
    loadEvents();
    loadTemplates();
    
    // Subscribe to event updates
    const unsubscribe = eventsService.subscribeToEvents(raceId, (event) => {
      loadEvents();
    });
    
    return unsubscribe;
  }, [raceId]);

  const loadEvents = async () => {
    try {
      const eventHistory = await eventsService.getEventHistory(raceId);
      setEvents(eventHistory);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const eventTemplates = eventsService.getEventTemplates();
      setTemplates(eventTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.message) {
      alert('Please fill in title and message');
      return;
    }

    setIsCreating(true);
    
    try {
      const eventData = {
        ...formData,
        senderId: adminId,
        senderName: 'Race Administrator',
        raceId,
        data: {
          recipientIds: formData.recipientIds,
          groupIds: formData.groupIds,
          positions: formData.positions,
          teams: formData.teams
        },
        ackDeadline: formData.ackDeadline ? new Date(formData.ackDeadline).getTime() : undefined,
        metadata: {
          source: 'admin_panel',
          tags: [formData.type, formData.category]
        }
      };

      if (formData.scheduledTime) {
        const scheduledTime = new Date(formData.scheduledTime).getTime();
        await eventsService.scheduleEvent(eventData, scheduledTime);
        alert('Event scheduled successfully!');
      } else {
        const event = await eventsService.createEvent(eventData);
        await eventsService.sendEvent(event);
        alert('Event sent successfully!');
      }

      // Reset form
      setFormData({
        type: 'information',
        target: 'all',
        priority: 'medium',
        category: 'general',
        title: '',
        message: '',
        requiresAck: false,
        ackDeadline: '',
        scheduledTime: '',
        recipientIds: [],
        groupIds: [],
        positions: [],
        teams: []
      });
      
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseTemplate = async (template: EventTemplate) => {
    setSelectedTemplate(template);
    
    // Pre-fill form with template data
    setFormData({
      type: template.type,
      target: template.target,
      priority: template.defaultPriority,
      category: template.category,
      title: template.titleTemplate,
      message: template.messageTemplate,
      requiresAck: template.requiresAck || false,
      ackDeadline: '',
      scheduledTime: '',
      recipientIds: [],
      groupIds: [],
      positions: [],
      teams: []
    });
    
    setActiveTab('create');
  };

  const handleQuickAction = async (actionType: string) => {
    try {
      switch (actionType) {
        case 'safety_car':
          await eventsService.triggerSafetyCar('Debris on track at Turn 3', 12);
          alert('Safety car deployed!');
          break;
        case 'red_flag':
          await eventsService.sendEmergencyAlert('RED FLAG: Race stopped due to severe weather. All drivers must stop immediately.', 'critical');
          alert('Red flag sent!');
          break;
        case 'weather_warning':
          await eventsService.broadcastToAll({
            senderId: adminId,
            senderName: 'Race Administrator',
            raceId,
            type: 'weather_alert',
            priority: 'medium',
            category: 'safety',
            title: '🌦️ Weather Warning',
            message: 'Heavy rain detected approaching the circuit. Prepare for wet conditions.',
            metadata: { source: 'admin_panel' }
          });
          alert('Weather warning sent!');
          break;
        case 'race_start':
          await eventsService.broadcastToAll({
            senderId: adminId,
            senderName: 'Race Administrator',
            raceId,
            type: 'race_start',
            priority: 'high',
            category: 'race_control',
            title: '🏁 Race Start',
            message: 'The race is starting now! Good luck to all participants.',
            requiresAck: true,
            metadata: { source: 'admin_panel' }
          });
          alert('Race start notification sent!');
          break;
      }
      
      loadEvents();
    } catch (error) {
      console.error('Failed to send quick action:', error);
      alert('Failed to send quick action');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await eventsService.deleteEvent(eventId);
      loadEvents();
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event');
    }
  };

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'low': return 'bg-gray-600';
      case 'medium': return 'bg-blue-600';
      case 'high': return 'bg-orange-600';
      case 'urgent': return 'bg-red-600';
      case 'critical': return 'bg-red-800';
      default: return 'bg-gray-600';
    }
  };

  const getCategoryIcon = (category: Category): string => {
    switch (category) {
      case 'race_control': return '🏁';
      case 'safety': return '🛡️';
      case 'technical': return '🔧';
      case 'administrative': return '📋';
      case 'performance': return '📊';
      case 'communication': return '💬';
      case 'emergency': return '🚨';
      default: return '📄';
    }
  };

  const getEventTypeIcon = (type: EventType): string => {
    switch (type) {
      case 'race_start': return '🏁';
      case 'race_stop': return '🏁';
      case 'safety_car': return '🟡';
      case 'red_flag': return '🔴';
      case 'warning': return '⚠️';
      case 'penalty': return '📋';
      case 'weather_alert': return '🌦️';
      case 'emergency': return '🚨';
      case 'achievement': return '🏆';
      default: return '📢';
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesPriority = filterPriority === 'all' || event.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  return (
    <div className={`race-admin-event-panel bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Race Admin Events</h1>
            <p className="text-gray-400">Manage events and communications</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickAction('safety_car')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm touch-manipulation"
            >
              🟡 Safety Car
            </button>
            <button
              onClick={() => handleQuickAction('red_flag')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm touch-manipulation"
            >
              🔴 Red Flag
            </button>
            <button
              onClick={() => handleQuickAction('weather_warning')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm touch-manipulation"
            >
              🌦️ Weather
            </button>
            <button
              onClick={() => handleQuickAction('race_start')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm touch-manipulation"
            >
              🏁 Start Race
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-600">
          {['create', 'templates', 'history', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Event Creation Form */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as EventType})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value="information">Information</option>
                    <option value="announcement">Announcement</option>
                    <option value="warning">Warning</option>
                    <option value="penalty">Penalty</option>
                    <option value="safety_car">Safety Car</option>
                    <option value="weather_alert">Weather Alert</option>
                    <option value="emergency">Emergency</option>
                    <option value="achievement">Achievement</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Target */}
                <div>
                  <label className="block text-sm font-medium mb-2">Target</label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({...formData, target: e.target.value as EventTarget})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value="all">All Participants</option>
                    <option value="participants">Participants Only</option>
                    <option value="spectators">Spectators Only</option>
                    <option value="organizers">Organizers Only</option>
                    <option value="specific">Specific Participants</option>
                    <option value="position">By Position</option>
                    <option value="team">By Team</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value="general">General</option>
                    <option value="race_control">Race Control</option>
                    <option value="safety">Safety</option>
                    <option value="technical">Technical</option>
                    <option value="administrative">Administrative</option>
                    <option value="performance">Performance</option>
                    <option value="communication">Communication</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Event title..."
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>

                {/* Message */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Event message..."
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>

                {/* Options */}
                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.requiresAck}
                      onChange={(e) => setFormData({...formData, requiresAck: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Require acknowledgment</span>
                  </label>

                  {formData.requiresAck && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Acknowledgment Deadline</label>
                      <input
                        type="datetime-local"
                        value={formData.ackDeadline}
                        onChange={(e) => setFormData({...formData, ackDeadline: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Schedule for (optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateEvent}
                  disabled={isCreating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 touch-manipulation"
                >
                  {isCreating ? 'Creating...' : (formData.scheduledTime ? 'Schedule Event' : 'Send Event')}
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation"
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Event Preview</h3>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getEventTypeIcon(formData.type)}</span>
                    <div>
                      <h4 className="font-semibold">{formData.title || 'Untitled Event'}</h4>
                      <p className="text-sm text-gray-400">
                        {formData.priority.toUpperCase()} • {formData.category} • {formData.target}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300">{formData.message || 'No message content'}</p>
                  {formData.requiresAck && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm text-blue-400">⚠️ Requires acknowledgment</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Event Templates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(template.defaultPriority)}`}>
                        {template.defaultPriority.toUpperCase()}
                      </span>
                      <span className="text-lg">{getCategoryIcon(template.category)}</span>
                    </div>
                    <span className="text-sm text-gray-400">{template.type}</span>
                  </div>
                  
                  <h3 className="font-semibold mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Title:</p>
                    <p className="text-sm">{template.titleTemplate}</p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Message:</p>
                    <p className="text-sm line-clamp-2">{template.messageTemplate}</p>
                  </div>
                  
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                />
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
                  className="px-4 py-2 bg-gray-700 rounded-lg text-white"
                >
                  <option value="all">All Types</option>
                  <option value="information">Information</option>
                  <option value="warning">Warning</option>
                  <option value="safety_car">Safety Car</option>
                  <option value="emergency">Emergency</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                  className="px-4 py-2 bg-gray-700 rounded-lg text-white"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Event List */}
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{getEventTypeIcon(event.type)}</span>
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-gray-400">
                            {formatTime(event.timestamp)} • {event.senderName} • {event.target}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-2">{event.message}</p>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                          {event.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">{event.category}</span>
                        {event.requiresAck && (
                          <span className="text-xs text-blue-400">Requires Ack</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm touch-manipulation"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Event Analytics</h2>
            
            {/* Analytics would be implemented here */}
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400">Analytics dashboard coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
