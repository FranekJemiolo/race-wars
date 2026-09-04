import React, { useState, useEffect } from 'react';
import { getRaceAdminEventsService, RaceEvent, EventTemplate, Priority, Category, EventType, EventTarget } from '../../services/raceAdminEvents.service';

interface MobileAdminEventPanelProps {
  raceId: string;
  adminId: string;
  className?: string;
}

export const MobileAdminEventPanel: React.FC<MobileAdminEventPanelProps> = ({
  raceId,
  adminId,
  className = ''
}) => {
  const eventsService = getRaceAdminEventsService();
  
  const [activeTab, setActiveTab] = useState<'quick' | 'create' | 'templates' | 'history'>('quick');
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RaceEvent | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'information' as EventType,
    target: 'all' as EventTarget,
    priority: 'medium' as Priority,
    category: 'general' as Category,
    title: '',
    message: '',
    requiresAck: false,
    recipientIds: [] as string[]
  });

  useEffect(() => {
    loadEvents();
    loadTemplates();
    
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

  const handleQuickAction = async (actionType: string) => {
    try {
      switch (actionType) {
        case 'safety_car':
          await eventsService.triggerSafetyCar('Debris on track at Turn 3', 12);
          alert('Safety car deployed!');
          break;
        case 'red_flag':
          await eventsService.sendEmergencyAlert('RED FLAG: Race stopped due to severe weather', 'critical');
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
            message: 'Heavy rain detected approaching the circuit.',
            metadata: { source: 'admin_panel' as const }
          } as any);
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
            metadata: { source: 'admin_panel' as const }
          } as any);
          alert('Race start notification sent!');
          break;
        case 'penalty_warning':
          await eventsService.broadcastToAll({
            senderId: adminId,
            senderName: 'Race Administrator',
            raceId,
            type: 'warning',
            priority: 'high',
            category: 'administrative',
            title: '⚠️ Track Limits Warning',
            message: 'Multiple drivers exceeding track limits. Please stay within track boundaries.',
            requiresAck: true,
            metadata: { source: 'admin_panel' as const }
          } as any);
          alert('Penalty warning sent!');
          break;
      }
      
      loadEvents();
    } catch (error) {
      console.error('Failed to send quick action:', error);
      alert('Failed to send quick action');
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.title || !formData.message) {
      alert('Please fill in title and message');
      return;
    }

    setIsCreating(true);
    
    try {
      const event = await eventsService.createEvent({
        ...formData,
        senderId: adminId,
        senderName: 'Race Administrator',
        raceId,
        data: { recipientIds: formData.recipientIds },
        metadata: {
          source: 'admin_panel',
          tags: [formData.type, formData.category]
        }
      });

      await eventsService.sendEvent(event);
      alert('Event sent successfully!');
      
      // Reset form
      setFormData({
        type: 'information',
        target: 'all',
        priority: 'medium',
        category: 'general',
        title: '',
        message: '',
        requiresAck: false,
        recipientIds: []
      });
      
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseTemplate = async (template: EventTemplate) => {
    try {
      const event = await eventsService.useTemplate(template.id, {
        senderId: adminId,
        raceId,
        data: {
          raceName: 'Current Race',
          reason: 'Track conditions',
          violation: 'Track limits',
          condition: 'Wet track',
          location: 'Turn 3'
        }
      });

      await eventsService.sendEvent(event);
      alert('Template event sent successfully!');
      loadEvents();
    } catch (error) {
      console.error('Failed to use template:', error);
      alert('Failed to use template');
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

  return (
    <div className={`mobile-admin-event-panel bg-[#090d16] text-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-3.5">
          <div>
            <h1 className="text-base font-bold font-orbitron text-white flex items-center gap-2">
              <span>⚡</span> Event Control HUD
            </h1>
            <p className="text-[11px] text-gray-400 font-mono-numbers">RACE ID: {raceId}</p>
          </div>
          
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg touch-manipulation transition-colors"
          >
            <span className="text-lg">⚡</span>
          </button>
        </div>

        {/* Quick Actions Dropdown */}
        {showQuickActions && (
          <div className="absolute top-14 right-3 bg-[#111728] border border-white/15 rounded-xl shadow-2xl p-2 z-50 min-w-[200px] space-y-1.5 backdrop-blur-md">
            <button
              onClick={() => handleQuickAction('safety_car')}
              className="w-full px-3 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-lg text-left text-xs font-bold font-orbitron touch-manipulation flex items-center gap-2"
            >
              <span>🟡</span> Safety Car
            </button>
            <button
              onClick={() => handleQuickAction('red_flag')}
              className="w-full px-3 py-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-left text-xs font-bold font-orbitron touch-manipulation flex items-center gap-2"
            >
              <span>🔴</span> Red Flag
            </button>
            <button
              onClick={() => handleQuickAction('weather_warning')}
              className="w-full px-3 py-2 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-lg text-left text-xs font-bold font-orbitron touch-manipulation flex items-center gap-2"
            >
              <span>🌦️</span> Weather Alert
            </button>
            <button
              onClick={() => handleQuickAction('race_start')}
              className="w-full px-3 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg text-left text-xs font-bold font-orbitron touch-manipulation flex items-center gap-2"
            >
              <span>🏁</span> Start Race
            </button>
            <button
              onClick={() => handleQuickAction('penalty_warning')}
              className="w-full px-3 py-2 bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-lg text-left text-xs font-bold font-orbitron touch-manipulation flex items-center gap-2"
            >
              <span>⚠️</span> Warning
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-t border-white/10">
          {['quick', 'create', 'templates', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 text-xs font-bold font-orbitron uppercase tracking-wider touch-manipulation transition-all ${
                activeTab === tab
                  ? 'text-[#00ff88] border-b-2 border-[#00ff88] bg-white/5'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === 'quick' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold font-orbitron text-gray-300 uppercase tracking-wider mb-3">
              One-Touch Flag Operations
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickAction('safety_car')}
                className="cockpit-card-interactive p-4 text-center touch-manipulation border-amber-500/30 hover:border-amber-500/60"
              >
                <div className="text-2xl mb-1">🟡</div>
                <p className="font-bold text-xs font-orbitron text-amber-400">Safety Car</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Deploy safety car</p>
              </button>
              
              <button
                onClick={() => handleQuickAction('red_flag')}
                className="cockpit-card-interactive p-4 text-center touch-manipulation border-red-500/30 hover:border-red-500/60"
              >
                <div className="text-2xl mb-1">🔴</div>
                <p className="font-bold text-xs font-orbitron text-red-400">Red Flag</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Halt session</p>
              </button>
              
              <button
                onClick={() => handleQuickAction('weather_warning')}
                className="cockpit-card-interactive p-4 text-center touch-manipulation border-cyan-500/30 hover:border-cyan-500/60"
              >
                <div className="text-2xl mb-1">🌦️</div>
                <p className="font-bold text-xs font-orbitron text-cyan-400">Weather</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Rain alert</p>
              </button>
              
              <button
                onClick={() => handleQuickAction('race_start')}
                className="cockpit-card-interactive p-4 text-center touch-manipulation border-emerald-500/30 hover:border-emerald-500/60"
              >
                <div className="text-2xl mb-1">🏁</div>
                <p className="font-bold text-xs font-orbitron text-emerald-400">Start Race</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Green light</p>
              </button>
              
              <button
                onClick={() => handleQuickAction('penalty_warning')}
                className="cockpit-card-interactive p-4 text-center touch-manipulation border-orange-500/30 hover:border-orange-500/60"
              >
                <div className="text-2xl mb-1">⚠️</div>
                <p className="font-bold text-xs font-orbitron text-orange-400">Warning</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Track limits</p>
              </button>
              
              <button
                onClick={() => setActiveTab('create')}
                className="cockpit-card-interactive p-4 text-center touch-manipulation border-white/20 hover:border-white/40"
              >
                <div className="text-2xl mb-1">📢</div>
                <p className="font-bold text-xs font-orbitron text-white">Custom</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Compose notice</p>
              </button>
            </div>

            {/* Recent Events */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Recent Events</h3>
              <div className="space-y-2">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center gap-3 text-sm">
                    <span>{getEventTypeIcon(event.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{event.title}</p>
                      <p className="text-xs text-gray-400">{formatTime(event.timestamp)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Create Event</h2>
            
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
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
                  <option value="weather_alert">Weather Alert</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

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
                  <option value="specific">Specific Participants</option>
                </select>
              </div>

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

              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Event title..."
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Event message..."
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresAck}
                  onChange={(e) => setFormData({...formData, requiresAck: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm">Require acknowledgment</span>
              </div>

              <button
                onClick={handleCreateEvent}
                disabled={isCreating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 touch-manipulation"
              >
                {isCreating ? 'Creating...' : 'Send Event'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Event Templates</h2>
            
            <div className="space-y-3">
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
            <h2 className="text-lg font-semibold mb-4">Event History</h2>
            
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getEventTypeIcon(event.type)}</span>
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-gray-400">
                          {formatTime(event.timestamp)} • {event.senderName}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm">{event.message}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">{event.target}</span>
                    <span className="text-xs text-gray-400">{event.category}</span>
                    {event.requiresAck && (
                      <span className="text-xs text-blue-400">Requires Ack</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">⚡</span>
            <span className="text-xs text-gray-400">Quick</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📝</span>
            <span className="text-xs text-gray-400">Create</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📋</span>
            <span className="text-xs text-gray-400">Templates</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📚</span>
            <span className="text-xs text-gray-400">History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
