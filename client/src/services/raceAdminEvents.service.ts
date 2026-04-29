/**
 * Race Admin Events Service
 * 
 * Manages admin-to-participant communication, alerts, and event broadcasting
 * Provides real-time event delivery and notification system
 */

export interface RaceEvent {
  id: string;
  type: EventType;
  target: EventTarget;
  senderId: string;
  senderName: string;
  raceId: string;
  timestamp: number;
  title: string;
  message: string;
  priority: Priority;
  category: Category;
  data?: any; // Additional event-specific data
  expiresAt?: number; // Auto-expire time
  requiresAck?: boolean; // Requires acknowledgment
  ackDeadline?: number; // Deadline for acknowledgment
  actions?: EventAction[]; // Available actions for recipients
  metadata?: EventMetadata;
}

export interface EventAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'input';
  style: 'primary' | 'secondary' | 'danger' | 'success';
  action: string; // Action identifier
  data?: any; // Action-specific data
  required?: boolean; // Whether this action is required
}

export interface EventMetadata {
  source: 'admin_panel' | 'auto_system' | 'emergency' | 'schedule';
  originalRecipient?: string; // For forwarded events
  replyTo?: string; // Event ID this is replying to
  threadId?: string; // For conversation threads
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
    description: string;
  };
  attachments?: EventAttachment[];
}

export interface EventAttachment {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface EventDeliveryStatus {
  eventId: string;
  recipientId: string;
  status: 'pending' | 'delivered' | 'read' | 'acknowledged' | 'failed';
  deliveredAt?: number;
  readAt?: number;
  acknowledgedAt?: number;
  failureReason?: string;
  retryCount?: number;
}

export interface EventAcknowledgment {
  eventId: string;
  participantId: string;
  acknowledged: boolean;
  response?: string;
  timestamp: number;
  actions?: string[]; // Actions taken
}

export type EventType = 
  | 'race_start' | 'race_stop' | 'race_pause' | 'race_resume'
  | 'safety_car' | 'safety_car_end' | 'red_flag' | 'red_flag_end'
  | 'warning' | 'penalty' | 'disqualification' | 'black_flag'
  | 'pit_lane_open' | 'pit_lane_closed' | 'track_limit_warning'
  | 'weather_alert' | 'track_condition' | 'debris_warning'
  | 'technical_issue' | 'system_maintenance' | 'schedule_change'
  | 'congratulations' | 'achievement' | 'record_break' | 'milestone'
  | 'information' | 'reminder' | 'announcement' | 'emergency'
  | 'custom';

export type EventTarget = 
  | 'all' | 'participants' | 'spectators' | 'organizers'
  | 'specific' | 'position' | 'team' | 'group';

export type Priority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export type Category = 
  | 'race_control' | 'safety' | 'technical' | 'administrative'
  | 'performance' | 'communication' | 'emergency' | 'general';

interface RaceAdminEventsService {
  // Event Creation and Management
  createEvent(event: Omit<RaceEvent, 'id' | 'timestamp'>): Promise<RaceEvent>;
  updateEvent(eventId: string, updates: Partial<RaceEvent>): Promise<RaceEvent>;
  deleteEvent(eventId: string): Promise<boolean>;
  cancelEvent(eventId: string): Promise<boolean>;

  // Event Delivery
  sendEvent(event: RaceEvent): Promise<EventDeliveryStatus[]>;
  sendDirectMessage(recipientId: string, event: Omit<RaceEvent, 'target'>): Promise<EventDeliveryStatus>;
  broadcastToAll(event: Omit<RaceEvent, 'target'>): Promise<EventDeliveryStatus[]>;
  sendToGroup(target: EventTarget, groupIds: string[], event: Omit<RaceEvent, 'target'>): Promise<EventDeliveryStatus[]>;

  // Event Templates
  getEventTemplates(): EventTemplate[];
  createTemplate(template: EventTemplate): Promise<EventTemplate>;
  useTemplate(templateId: string, customizations: Partial<RaceEvent>): Promise<RaceEvent>;

  // Event History and Tracking
  getEventHistory(raceId: string, filters?: EventFilters): Promise<RaceEvent[]>;
  getEventDeliveryStatus(eventId: string): Promise<EventDeliveryStatus[]>;
  getParticipantEvents(participantId: string): Promise<RaceEvent[]>;
  getUnreadEvents(participantId: string): Promise<RaceEvent[]>;

  // Acknowledgments and Responses
  acknowledgeEvent(eventId: string, participantId: string, response?: string): Promise<EventAcknowledgment>;
  getEventAcknowledgments(eventId: string): Promise<EventAcknowledgment[]>;
  requireAcknowledgment(eventId: string, deadline: number): Promise<boolean>;

  // Event Scheduling
  scheduleEvent(event: Omit<RaceEvent, 'id' | 'timestamp'>, scheduledTime: number): Promise<RaceEvent>;
  cancelScheduledEvent(eventId: string): Promise<boolean>;
  getScheduledEvents(raceId: string): Promise<RaceEvent[]>;

  // Emergency and Critical Events
  sendEmergencyAlert(message: string, priority: 'urgent' | 'critical'): Promise<EventDeliveryStatus[]>;
  triggerSafetyCar(reason: string, deploymentLap?: number): Promise<EventDeliveryStatus[]>;
  issuePenalty(participantId: string, penaltyType: string, reason: string): Promise<EventDeliveryStatus>;
  disqualifyParticipant(participantId: string, reason: string): Promise<EventDeliveryStatus>;

  // Event Analytics
  getEventAnalytics(raceId: string): Promise<EventAnalytics>;
  getDeliveryReport(eventId: string): Promise<DeliveryReport>;
  getParticipantEngagement(participantId: string): Promise<EngagementMetrics>;

  // Event Subscriptions and Notifications
  subscribeToEvents(raceId: string, callback: (event: RaceEvent) => void): () => void;
  subscribeToParticipantEvents(participantId: string, callback: (event: RaceEvent) => void): () => void;
  unsubscribeAll(): void;

  // Event Validation and Safety
  validateEvent(event: Omit<RaceEvent, 'id' | 'timestamp'>): ValidationResult;
  checkEventLimits(adminId: string): Promise<LimitCheck>;
  rateLimitCheck(adminId: string): Promise<boolean>;
}

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  category: Category;
  type: EventType;
  defaultPriority: Priority;
  target: EventTarget;
  titleTemplate: string;
  messageTemplate: string;
  variables: TemplateVariable[];
  actions?: EventAction[];
  requiresAck?: boolean;
  metadata?: Partial<EventMetadata>;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  description: string;
}

export interface EventFilters {
  type?: EventType;
  priority?: Priority;
  category?: Category;
  target?: EventTarget;
  senderId?: string;
  startTime?: number;
  endTime?: number;
  unreadOnly?: boolean;
  requiresAck?: boolean;
}

export interface EventAnalytics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByPriority: Record<Priority, number>;
  deliveryRate: number;
  readRate: number;
  acknowledgmentRate: number;
  averageResponseTime: number;
  mostActiveHour: number;
  peakEventTimes: number[];
}

export interface DeliveryReport {
  eventId: string;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  readCount: number;
  acknowledgmentCount: number;
  deliveryStatuses: EventDeliveryStatus[];
  failureReasons: Record<string, number>;
}

export interface EngagementMetrics {
  totalEventsReceived: number;
  eventsRead: number;
  eventsAcknowledged: number;
  averageResponseTime: number;
  lastActivity: number;
  preferredCommunicationTime: number;
  actionCompletionRate: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LimitCheck {
  withinLimits: boolean;
  currentUsage: number;
  limit: number;
  resetTime: number;
  remainingEvents: number;
}

class RaceAdminEventsServiceImpl implements RaceAdminEventsService {
  private events: Map<string, RaceEvent> = new Map();
  private deliveryStatuses: Map<string, EventDeliveryStatus[]> = new Map();
  private acknowledgments: Map<string, EventAcknowledgment[]> = new Map();
  private templates: Map<string, EventTemplate> = new Map();
  private scheduledEvents: Map<string, RaceEvent> = new Map();
  private eventSubscriptions: Map<string, ((event: RaceEvent) => void)[]> = new Map();
  private participantSubscriptions: Map<string, ((event: RaceEvent) => void)[]> = new Map();

  constructor() {
    this.initializeTemplates();
    this.startScheduledEventProcessor();
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTemplates(): void {
    const templates: EventTemplate[] = [
      {
        id: 'race_start',
        name: 'Race Start',
        description: 'Official race start notification',
        category: 'race_control',
        type: 'race_start',
        defaultPriority: 'high',
        target: 'participants',
        titleTemplate: '🏁 Race Start - {raceName}',
        messageTemplate: 'The race is starting now! Good luck to all participants. Remember to follow all safety protocols and race etiquette.',
        variables: [
          { name: 'raceName', type: 'text', required: true, description: 'Name of the race' }
        ],
        requiresAck: true
      },
      {
        id: 'safety_car',
        name: 'Safety Car Deployment',
        description: 'Safety car deployment notification',
        category: 'safety',
        type: 'safety_car',
        defaultPriority: 'urgent',
        target: 'participants',
        titleTemplate: '🟡 Safety Car Deployed',
        messageTemplate: 'Safety car has been deployed due to: {reason}. Reduce speed immediately and follow the safety car. No overtaking allowed.',
        variables: [
          { name: 'reason', type: 'text', required: true, description: 'Reason for safety car' },
          { name: 'deploymentLap', type: 'number', required: false, description: 'Lap number of deployment' }
        ],
        requiresAck: true
      },
      {
        id: 'penalty_warning',
        name: 'Penalty Warning',
        description: 'Warning for rule violations',
        category: 'administrative',
        type: 'warning',
        defaultPriority: 'high',
        target: 'specific',
        titleTemplate: '⚠️ Penalty Warning',
        messageTemplate: 'You have received a warning for: {violation}. Please adjust your driving behavior immediately. Further violations may result in penalties.',
        variables: [
          { name: 'violation', type: 'select', required: true, description: 'Type of violation', 
            options: ['Speeding', 'Track Limits', 'Dangerous Driving', 'Blocking', 'Ignoring Flags'] },
          { name: 'details', type: 'text', required: false, description: 'Additional details' }
        ],
        requiresAck: true
      },
      {
        id: 'weather_alert',
        name: 'Weather Alert',
        description: 'Weather condition notification',
        category: 'safety',
        type: 'weather_alert',
        defaultPriority: 'medium',
        target: 'all',
        titleTemplate: '🌦️ Weather Alert',
        messageTemplate: 'Weather conditions have changed: {condition}. {additionalInfo}. Please adjust your driving accordingly.',
        variables: [
          { name: 'condition', type: 'select', required: true, description: 'Weather condition',
            options: ['Rain', 'Heavy Rain', 'Storm', 'Fog', 'Strong Winds', 'Clearing'] },
          { name: 'additionalInfo', type: 'text', required: false, description: 'Additional information' }
        ]
      },
      {
        id: 'track_condition',
        name: 'Track Condition Update',
        description: 'Track surface condition notification',
        category: 'safety',
        type: 'track_condition',
        defaultPriority: 'medium',
        target: 'participants',
        titleTemplate: '🛣️ Track Condition Update',
        messageTemplate: 'Track conditions at {location}: {condition}. Exercise caution when approaching this area.',
        variables: [
          { name: 'location', type: 'text', required: true, description: 'Track location' },
          { name: 'condition', type: 'select', required: true, description: 'Track condition',
            options: ['Wet', 'Debris on Track', 'Oil', 'Gravel', 'Standing Water', 'Damp'] }
        ]
      },
      {
        id: 'achievement',
        name: 'Achievement Unlocked',
        description: 'Personal achievement notification',
        category: 'performance',
        type: 'achievement',
        defaultPriority: 'low',
        target: 'specific',
        titleTemplate: '🏆 Achievement: {achievementName}',
        messageTemplate: 'Congratulations! You\'ve unlocked the "{achievementName}" achievement: {description}. This is your {achievementNumber} achievement!',
        variables: [
          { name: 'achievementName', type: 'text', required: true, description: 'Achievement name' },
          { name: 'description', type: 'text', required: true, description: 'Achievement description' },
          { name: 'achievementNumber', type: 'number', required: false, description: 'Achievement count' }
        ]
      },
      {
        id: 'emergency_broadcast',
        name: 'Emergency Broadcast',
        description: 'Critical emergency notification',
        category: 'emergency',
        type: 'emergency',
        defaultPriority: 'critical',
        target: 'all',
        titleTemplate: '🚨 EMERGENCY: {emergencyType}',
        messageTemplate: 'EMERGENCY: {emergencyType}. {instructions}. All participants must follow emergency procedures immediately.',
        variables: [
          { name: 'emergencyType', type: 'select', required: true, description: 'Type of emergency',
            options: ['Medical Emergency', 'Track Invasion', 'Severe Weather', 'Security Threat', 'Technical Failure'] },
          { name: 'instructions', type: 'text', required: true, description: 'Emergency instructions' }
        ],
        requiresAck: true
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private startScheduledEventProcessor(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [eventId, event] of this.scheduledEvents) {
        if (event.timestamp <= now) {
          this.sendEvent(event);
          this.scheduledEvents.delete(eventId);
        }
      }
    }, 1000); // Check every second
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  async createEvent(event: Omit<RaceEvent, 'id' | 'timestamp'>): Promise<RaceEvent> {
    const newEvent: RaceEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now()
    };

    // Validate event
    const validation = this.validateEvent(newEvent);
    if (!validation.valid) {
      throw new Error(`Invalid event: ${validation.errors.join(', ')}`);
    }

    // Check rate limits
    const rateLimitOk = await this.rateLimitCheck(event.senderId);
    if (!rateLimitOk) {
      throw new Error('Rate limit exceeded. Please wait before sending more events.');
    }

    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async updateEvent(eventId: string, updates: Partial<RaceEvent>): Promise<RaceEvent> {
    const existingEvent = this.events.get(eventId);
    if (!existingEvent) {
      throw new Error('Event not found');
    }

    const updatedEvent = { ...existingEvent, ...updates };
    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return this.events.delete(eventId);
  }

  async cancelEvent(eventId: string): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event) return false;

    // If scheduled, remove from scheduled events
    if (this.scheduledEvents.has(eventId)) {
      this.scheduledEvents.delete(eventId);
    }

    // Mark as cancelled
    await this.updateEvent(eventId, { 
      message: `[CANCELLED] ${event.message}`,
      expiresAt: Date.now() // Expire immediately
    });

    return true;
  }

  async sendEvent(event: RaceEvent): Promise<EventDeliveryStatus[]> {
    const recipients = await this.getRecipientsForEvent(event);
    const deliveryPromises = recipients.map(recipient => 
      this.deliverEvent(event, recipient)
    );

    const results = await Promise.all(deliveryPromises);
    this.deliveryStatuses.set(event.id, results);

    // Notify subscribers
    this.notifyEventSubscribers(event);

    return results;
  }

  async sendDirectMessage(recipientId: string, event: Omit<RaceEvent, 'target'>): Promise<EventDeliveryStatus> {
    const fullEvent: RaceEvent = {
      ...event,
      target: 'specific',
      id: this.generateEventId(),
      timestamp: Date.now()
    };

    const status = await this.deliverEvent(fullEvent, recipientId);
    this.deliveryStatuses.set(fullEvent.id, [status]);
    this.notifyEventSubscribers(fullEvent);

    return status;
  }

  async broadcastToAll(event: Omit<RaceEvent, 'target'>): Promise<EventDeliveryStatus[]> {
    const fullEvent: RaceEvent = {
      ...event,
      target: 'all',
      id: this.generateEventId(),
      timestamp: Date.now()
    };

    return this.sendEvent(fullEvent);
  }

  async sendToGroup(target: EventTarget, groupIds: string[], event: Omit<RaceEvent, 'target'>): Promise<EventDeliveryStatus[]> {
    const recipients = await this.getGroupRecipients(target, groupIds);
    const fullEvent: RaceEvent = {
      ...event,
      target,
      id: this.generateEventId(),
      timestamp: Date.now()
    };

    const deliveryPromises = recipients.map(recipient => 
      this.deliverEvent(fullEvent, recipient)
    );

    const results = await Promise.all(deliveryPromises);
    this.deliveryStatuses.set(fullEvent.id, results);
    this.notifyEventSubscribers(fullEvent);

    return results;
  }

  private async deliverEvent(event: RaceEvent, recipientId: string): Promise<EventDeliveryStatus> {
    const status: EventDeliveryStatus = {
      eventId: event.id,
      recipientId,
      status: 'delivered',
      deliveredAt: Date.now()
    };

    // Simulate delivery processing
    try {
      // In a real implementation, this would send via WebSocket or push notification
      console.log(`Delivering event ${event.id} to participant ${recipientId}`);
      
      // Auto-mark as read for immediate events
      if (event.priority === 'critical' || event.type === 'emergency') {
        status.status = 'read';
        status.readAt = Date.now();
      }

      return status;
    } catch (error) {
      status.status = 'failed';
      status.failureReason = error instanceof Error ? error.message : 'Unknown error';
      return status;
    }
  }

  private async getRecipientsForEvent(event: RaceEvent): Promise<string[]> {
    // Mock implementation - in real app, this would query the race participants
    const mockParticipants = [
      'driver-1', 'driver-2', 'driver-3', 'driver-4', 
      'driver-5', 'driver-6', 'driver-7', 'driver-8'
    ];

    switch (event.target) {
      case 'all':
        return mockParticipants;
      case 'participants':
        return mockParticipants;
      case 'spectators':
        return ['spectator-1', 'spectator-2'];
      case 'organizers':
        return ['organizer-1', 'admin-1'];
      case 'specific':
        return event.data?.recipientIds || [];
      case 'position':
        // Filter by position
        return mockParticipants.filter(id => {
          const position = parseInt(id.split('-')[1]);
          return event.data?.positions?.includes(position);
        });
      case 'team':
        // Filter by team
        return mockParticipants.filter(id => 
          event.data?.teams?.includes(this.getParticipantTeam(id))
        );
      case 'group':
        return event.data?.groupMembers || [];
      default:
        return [];
    }
  }

  private async getGroupRecipients(target: EventTarget, groupIds: string[]): Promise<string[]> {
    // Mock implementation for group-based targeting
    const groupMembers: Record<string, string[]> = {
      'team-red': ['driver-1', 'driver-2', 'driver-3', 'driver-4'],
      'team-blue': ['driver-5', 'driver-6', 'driver-7', 'driver-8'],
      'front-runners': ['driver-1', 'driver-2'],
      'mid-field': ['driver-3', 'driver-4', 'driver-5', 'driver-6'],
      'back-markers': ['driver-7', 'driver-8']
    };

    const recipients: string[] = [];
    for (const groupId of groupIds) {
      if (groupMembers[groupId]) {
        recipients.push(...groupMembers[groupId]);
      }
    }

    return [...new Set(recipients)]; // Remove duplicates
  }

  private getParticipantTeam(participantId: string): string {
    // Mock team assignment
    const driverNumber = parseInt(participantId.split('-')[1]);
    return driverNumber <= 4 ? 'team-red' : 'team-blue';
  }

  private notifyEventSubscribers(event: RaceEvent): void {
    // Notify race-wide subscribers
    const raceSubscribers = this.eventSubscriptions.get(event.raceId) || [];
    raceSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event subscription callback:', error);
      }
    });

    // Notify individual participant subscribers
    const deliveryStatuses = this.deliveryStatuses.get(event.id) || [];
    deliveryStatuses.forEach(status => {
      const participantSubscribers = this.participantSubscriptions.get(status.recipientId) || [];
      participantSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in participant subscription callback:', error);
        }
      });
    });
  }

  getEventTemplates(): EventTemplate[] {
    return Array.from(this.templates.values());
  }

  async createTemplate(template: EventTemplate): Promise<EventTemplate> {
    const newTemplate = { ...template, id: this.generateEventId() };
    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async useTemplate(templateId: string, customizations: Partial<RaceEvent>): Promise<RaceEvent> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const event: RaceEvent = {
      id: this.generateEventId(),
      type: template.type,
      target: template.target,
      senderId: customizations.senderId || 'system',
      senderName: customizations.senderName || 'Race Administrator',
      raceId: customizations.raceId || '',
      timestamp: Date.now(),
      title: this.processTemplate(template.titleTemplate, customizations.data || {}),
      message: this.processTemplate(template.messageTemplate, customizations.data || {}),
      priority: customizations.priority || template.defaultPriority,
      category: template.category,
      requiresAck: customizations.requiresAck ?? template.requiresAck,
      actions: template.actions,
      metadata: { ...template.metadata, ...customizations.metadata },
      ...customizations
    };

    return event;
  }

  async getEventHistory(raceId: string, filters?: EventFilters): Promise<RaceEvent[]> {
    let events = Array.from(this.events.values()).filter(event => event.raceId === raceId);

    if (filters) {
      if (filters.type) events = events.filter(event => event.type === filters.type);
      if (filters.priority) events = events.filter(event => event.priority === filters.priority);
      if (filters.category) events = events.filter(event => event.category === filters.category);
      if (filters.target) events = events.filter(event => event.target === filters.target);
      if (filters.senderId) events = events.filter(event => event.senderId === filters.senderId);
      if (filters.startTime) events = events.filter(event => event.timestamp >= filters.startTime);
      if (filters.endTime) events = events.filter(event => event.timestamp <= filters.endTime);
      if (filters.requiresAck) events = events.filter(event => event.requiresAck === filters.requiresAck);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getEventDeliveryStatus(eventId: string): Promise<EventDeliveryStatus[]> {
    return this.deliveryStatuses.get(eventId) || [];
  }

  async getParticipantEvents(participantId: string): Promise<RaceEvent[]> {
    const participantEvents: RaceEvent[] = [];
    
    for (const [eventId, statuses] of this.deliveryStatuses) {
      const event = this.events.get(eventId);
      if (event && statuses.some(status => status.recipientId === participantId)) {
        participantEvents.push(event);
      }
    }

    return participantEvents.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getUnreadEvents(participantId: string): Promise<RaceEvent[]> {
    const allEvents = await this.getParticipantEvents(participantId);
    return allEvents.filter(event => {
      const statuses = this.deliveryStatuses.get(event.id) || [];
      const participantStatus = statuses.find(status => status.recipientId === participantId);
      return participantStatus?.status !== 'read';
    });
  }

  async acknowledgeEvent(eventId: string, participantId: string, response?: string): Promise<EventAcknowledgment> {
    const acknowledgment: EventAcknowledgment = {
      eventId,
      participantId,
      acknowledged: true,
      response,
      timestamp: Date.now()
    };

    // Store acknowledgment
    if (!this.acknowledgments.has(eventId)) {
      this.acknowledgments.set(eventId, []);
    }
    this.acknowledgments.get(eventId)!.push(acknowledgment);

    // Update delivery status
    const statuses = this.deliveryStatuses.get(eventId);
    if (statuses) {
      const participantStatus = statuses.find(status => status.recipientId === participantId);
      if (participantStatus) {
        participantStatus.status = 'acknowledged';
        participantStatus.acknowledgedAt = Date.now();
      }
    }

    return acknowledgment;
  }

  async getEventAcknowledgments(eventId: string): Promise<EventAcknowledgment[]> {
    return this.acknowledgments.get(eventId) || [];
  }

  async requireAcknowledgment(eventId: string, deadline: number): Promise<boolean> {
    const event = this.events.get(eventId);
    if (!event) return false;

    await this.updateEvent(eventId, {
      requiresAck: true,
      ackDeadline: deadline
    });

    return true;
  }

  async scheduleEvent(event: Omit<RaceEvent, 'id' | 'timestamp'>, scheduledTime: number): Promise<RaceEvent> {
    const scheduledEvent: RaceEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: scheduledTime
    };

    this.scheduledEvents.set(scheduledEvent.id, scheduledEvent);
    return scheduledEvent;
  }

  async cancelScheduledEvent(eventId: string): Promise<boolean> {
    return this.scheduledEvents.delete(eventId);
  }

  async getScheduledEvents(raceId: string): Promise<RaceEvent[]> {
    return Array.from(this.scheduledEvents.values())
      .filter(event => event.raceId === raceId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async sendEmergencyAlert(message: string, priority: 'urgent' | 'critical'): Promise<EventDeliveryStatus[]> {
    const event: RaceEvent = {
      id: this.generateEventId(),
      type: 'emergency',
      target: 'all',
      senderId: 'system',
      senderName: 'Emergency System',
      raceId: 'all',
      timestamp: Date.now(),
      title: '🚨 EMERGENCY ALERT',
      message,
      priority,
      category: 'emergency',
      requiresAck: priority === 'critical',
      metadata: {
        source: 'emergency',
        tags: ['emergency', priority]
      }
    };

    return this.sendEvent(event);
  }

  async triggerSafetyCar(reason: string, deploymentLap?: number): Promise<EventDeliveryStatus[]> {
    const event: RaceEvent = {
      id: this.generateEventId(),
      type: 'safety_car',
      target: 'participants',
      senderId: 'race_control',
      senderName: 'Race Control',
      raceId: 'current',
      timestamp: Date.now(),
      title: '🟡 Safety Car Deployed',
      message: `Safety car has been deployed due to: ${reason}. Reduce speed immediately and follow the safety car. No overtaking allowed.`,
      priority: 'urgent',
      category: 'safety',
      requiresAck: true,
      data: { reason, deploymentLap },
      actions: [
        {
          id: 'acknowledge',
          label: 'I Understand',
          type: 'button',
          style: 'primary',
          action: 'acknowledge_safety_car',
          required: true
        }
      ]
    };

    return this.sendEvent(event);
  }

  async issuePenalty(participantId: string, penaltyType: string, reason: string): Promise<EventDeliveryStatus> {
    const event: RaceEvent = {
      id: this.generateEventId(),
      type: 'penalty',
      target: 'specific',
      senderId: 'race_control',
      senderName: 'Race Control',
      raceId: 'current',
      timestamp: Date.now(),
      title: `⚠️ Penalty: ${penaltyType}`,
      message: `You have been issued a ${penaltyType} penalty for: ${reason}. This will affect your race results. Please serve the penalty according to race regulations.`,
      priority: 'high',
      category: 'administrative',
      requiresAck: true,
      data: { participantId, penaltyType, reason },
      actions: [
        {
          id: 'acknowledge',
          label: 'Acknowledge Penalty',
          type: 'button',
          style: 'primary',
          action: 'acknowledge_penalty',
          required: true
        },
        {
          id: 'appeal',
          label: 'Appeal Penalty',
          type: 'button',
          style: 'secondary',
          action: 'appeal_penalty'
        }
      ]
    };

    return this.sendDirectMessage(participantId, event);
  }

  async disqualifyParticipant(participantId: string, reason: string): Promise<EventDeliveryStatus> {
    const event: RaceEvent = {
      id: this.generateEventId(),
      type: 'disqualification',
      target: 'specific',
      senderId: 'race_control',
      senderName: 'Race Control',
      raceId: 'current',
      timestamp: Date.now(),
      title: '🏴 Disqualified',
      message: `You have been disqualified from the race for: ${reason}. Please return to the pits immediately. This decision is final.`,
      priority: 'critical',
      category: 'administrative',
      requiresAck: true,
      data: { participantId, reason },
      actions: [
        {
          id: 'acknowledge',
          label: 'I Understand',
          type: 'button',
          style: 'primary',
          action: 'acknowledge_disqualification',
          required: true
        }
      ]
    };

    return this.sendDirectMessage(participantId, event);
  }

  async getEventAnalytics(raceId: string): Promise<EventAnalytics> {
    const events = await this.getEventHistory(raceId);
    const eventsByType: Record<EventType, number> = {} as any;
    const eventsByPriority: Record<Priority, number> = {} as any;

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByPriority[event.priority] = (eventsByPriority[event.priority] || 0) + 1;
    });

    const totalEvents = events.length;
    const deliveryStatuses = Array.from(this.deliveryStatuses.values()).flat();
    const successfulDeliveries = deliveryStatuses.filter(s => s.status === 'delivered').length;
    const readEvents = deliveryStatuses.filter(s => s.status === 'read').length;
    const acknowledgments = Array.from(this.acknowledgments.values()).flat();

    return {
      totalEvents,
      eventsByType,
      eventsByPriority,
      deliveryRate: totalEvents > 0 ? successfulDeliveries / totalEvents : 0,
      readRate: deliveryStatuses.length > 0 ? readEvents / deliveryStatuses.length : 0,
      acknowledgmentRate: acknowledgments.length > 0 ? acknowledgments.length / totalEvents : 0,
      averageResponseTime: this.calculateAverageResponseTime(acknowledgments),
      mostActiveHour: this.findMostActiveHour(events),
      peakEventTimes: this.findPeakEventTimes(events)
    };
  }

  async getDeliveryReport(eventId: string): Promise<DeliveryReport> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const statuses = this.deliveryStatuses.get(eventId) || [];
    const acknowledgments = this.acknowledgments.get(eventId) || [];

    const failureReasons: Record<string, number> = {};
    statuses.forEach(status => {
      if (status.status === 'failed' && status.failureReason) {
        failureReasons[status.failureReason] = (failureReasons[status.failureReason] || 0) + 1;
      }
    });

    return {
      eventId,
      totalRecipients: statuses.length,
      successfulDeliveries: statuses.filter(s => s.status === 'delivered').length,
      failedDeliveries: statuses.filter(s => s.status === 'failed').length,
      readCount: statuses.filter(s => s.status === 'read').length,
      acknowledgmentCount: acknowledgments.length,
      deliveryStatuses: statuses,
      failureReasons
    };
  }

  async getParticipantEngagement(participantId: string): Promise<EngagementMetrics> {
    const participantEvents = await this.getParticipantEvents(participantId);
    const acknowledgments = Array.from(this.acknowledgments.values())
      .flat()
      .filter(ack => ack.participantId === participantId);

    return {
      totalEventsReceived: participantEvents.length,
      eventsRead: participantEvents.length, // Simplified - would track actual read status
      eventsAcknowledged: acknowledgments.length,
      averageResponseTime: this.calculateAverageResponseTime(acknowledgments),
      lastActivity: participantEvents.length > 0 ? participantEvents[0].timestamp : 0,
      preferredCommunicationTime: this.findPreferredCommunicationTime(participantEvents),
      actionCompletionRate: this.calculateActionCompletionRate(acknowledgments)
    };
  }

  subscribeToEvents(raceId: string, callback: (event: RaceEvent) => void): () => void {
    if (!this.eventSubscriptions.has(raceId)) {
      this.eventSubscriptions.set(raceId, []);
    }
    this.eventSubscriptions.get(raceId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const subscriptions = this.eventSubscriptions.get(raceId);
      if (subscriptions) {
        const index = subscriptions.indexOf(callback);
        if (index > -1) {
          subscriptions.splice(index, 1);
        }
      }
    };
  }

  subscribeToParticipantEvents(participantId: string, callback: (event: RaceEvent) => void): () => void {
    if (!this.participantSubscriptions.has(participantId)) {
      this.participantSubscriptions.set(participantId, []);
    }
    this.participantSubscriptions.get(participantId)!.push(callback);

    return () => {
      const subscriptions = this.participantSubscriptions.get(participantId);
      if (subscriptions) {
        const index = subscriptions.indexOf(callback);
        if (index > -1) {
          subscriptions.splice(index, 1);
        }
      }
    };
  }

  unsubscribeAll(): void {
    this.eventSubscriptions.clear();
    this.participantSubscriptions.clear();
  }

  validateEvent(event: Omit<RaceEvent, 'id' | 'timestamp'>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!event.type) errors.push('Event type is required');
    if (!event.target) errors.push('Event target is required');
    if (!event.senderId) errors.push('Sender ID is required');
    if (!event.raceId) errors.push('Race ID is required');
    if (!event.title) errors.push('Title is required');
    if (!event.message) errors.push('Message is required');
    if (!event.priority) errors.push('Priority is required');
    if (!event.category) errors.push('Category is required');

    // Validation rules
    if (event.title.length > 200) errors.push('Title too long (max 200 characters)');
    if (event.message.length > 2000) errors.push('Message too long (max 2000 characters)');
    if (event.ackDeadline && event.ackDeadline <= Date.now()) {
      errors.push('Acknowledgment deadline must be in the future';
    }

    // Warnings
    if (event.priority === 'critical' && !event.requiresAck) {
      warnings.push('Critical events should require acknowledgment');
    }
    if (event.type === 'emergency' && event.target !== 'all') {
      warnings.push('Emergency events should target all participants');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async checkEventLimits(adminId: string): Promise<LimitCheck> {
    // Mock implementation - in real app, check against actual usage limits
    const mockUsage = 5;
    const mockLimit = 100;
    const resetTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

    return {
      withinLimits: mockUsage < mockLimit,
      currentUsage: mockUsage,
      limit: mockLimit,
      resetTime,
      remainingEvents: mockLimit - mockUsage
    };
  }

  async rateLimitCheck(adminId: string): Promise<boolean> {
    // Mock implementation - in real app, check against actual rate limits
    return true; // Allow all for demo
  }

  // Helper methods for analytics
  private calculateAverageResponseTime(acknowledgments: EventAcknowledgment[]): number {
    if (acknowledgments.length === 0) return 0;
    
    const totalTime = acknowledgments.reduce((sum, ack) => {
      const event = this.events.get(ack.eventId);
      return sum + (ack.timestamp - (event?.timestamp || 0));
    }, 0);

    return totalTime / acknowledgments.length;
  }

  private findMostActiveHour(events: RaceEvent[]): number {
    const hourCounts: Record<number, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let maxHour = 0;
    let maxCount = 0;
    
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxHour = parseInt(hour);
      }
    }

    return maxHour;
  }

  private findPeakEventTimes(events: RaceEvent[]): number[] {
    // Simple implementation - return top 3 hours with most events
    const hourCounts: Record<number, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private findPreferredCommunicationTime(events: RaceEvent[]): number {
    // Simplified - return the hour with most successful deliveries
    const hourCounts: Record<number, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let maxHour = 0;
    let maxCount = 0;
    
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxHour = parseInt(hour);
      }
    }

    return maxHour;
  }

  private calculateActionCompletionRate(acknowledgments: EventAcknowledgment[]): number {
    if (acknowledgments.length === 0) return 0;
    
    const completedActions = acknowledgments.filter(ack => 
      ack.actions && ack.actions.length > 0
    ).length;

    return completedActions / acknowledgments.length;
  }
}

// Singleton instance
let raceAdminEventsServiceInstance: RaceAdminEventsService | null = null;

export function getRaceAdminEventsService(): RaceAdminEventsService {
  if (!raceAdminEventsServiceInstance) {
    raceAdminEventsServiceInstance = new RaceAdminEventsServiceImpl();
  }
  return raceAdminEventsServiceInstance;
}

export { RaceAdminEventsServiceImpl };
