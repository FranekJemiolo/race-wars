/**
 * Race Service
 * Business logic for race management using database events
 */

import { logger } from '../utils/logger'
import { trackService } from './track.service'
import { participationService } from './participation.service'
import { EventRepository, Event } from '../database/repositories/event.repository'

export interface Race {
  id: string
  name: string
  type: 'circuit' | 'custom' | 'duel'
  status: 'waiting' | 'starting' | 'in-progress' | 'finished'
  trackName: string
  trackImage?: string
  participants: number
  maxParticipants: number
  duration?: number
  startTime?: Date
  description?: string
  rules?: string[]
  requirements?: string[]
  prizePool?: number
  entryFee?: number
  createdBy?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
  enforcementLevel?: 'none' | 'light' | 'medium' | 'hard'
  createdAt: Date
  updatedAt: Date
}

export interface CreateRaceRequest {
  name: string
  type: 'circuit' | 'custom' | 'duel'
  trackName: string
  maxParticipants: number
  duration: number
  startTime: Date
  description: string
  requirements: string[]
  entryFee: number
  prizePool: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  enforcementLevel: 'none' | 'light' | 'medium' | 'hard'
  isPublic: boolean
}

export class RaceService {
  private eventRepository: EventRepository

  constructor() {
    this.eventRepository = new EventRepository()
    this.initializeSampleEvents()
  }

  /**
   * Initialize sample events in database for development
   */
  private async initializeSampleEvents() {
    try {
      // Check if we already have events
      const existingEvents = await this.eventRepository.findPublic(5)
      if (existingEvents.length > 0) {
        logger.info(`Found ${existingEvents.length} existing events in database`)
        return
      }

      // Create sample events if database is empty
      const sampleEvents = [
        {
          name: 'Quick Sprint - Starting Soon',
          type: 'CUSTOM_RACE' as const,
          organizer_id: 'system',
          start_time: new Date(Date.now() + 2 * 60000), // 2 minutes from now
          end_time: new Date(Date.now() + 17 * 60000), // 17 minutes from now
          registration_close_time: new Date(Date.now() + 1 * 60000), // 1 minute from now
          max_participants: 8,
          rules: { 
            difficulty: 'easy',
            enforcementLevel: 'light',
            duration: 900
          },
          settings: {
            description: 'Quick sprint race for fast action',
            requirements: ['Valid driver license']
          },
          is_public: true
        },
        {
          name: 'Practice Session - Open Registration',
          type: 'CUSTOM_RACE' as const,
          organizer_id: 'system',
          start_time: new Date(Date.now() + 10 * 60000), // 10 minutes from now
          end_time: new Date(Date.now() + 40 * 60000), // 40 minutes from now
          registration_close_time: new Date(Date.now() + 8 * 60000), // 8 minutes from now
          max_participants: 16,
          rules: {
            difficulty: 'easy',
            enforcementLevel: 'light',
            duration: 1800
          },
          settings: {
            description: 'Open practice session for all skill levels',
            requirements: ['Valid driver license', 'Helmet required']
          },
          is_public: true
        },
        {
          name: 'Grand Prix - Advanced',
          type: 'CUSTOM_RACE' as const,
          organizer_id: 'system',
          start_time: new Date(Date.now() + 20 * 60000), // 20 minutes from now
          end_time: new Date(Date.now() + 56 * 60000), // 56 minutes from now
          registration_close_time: new Date(Date.now() + 18 * 60000), // 18 minutes from now
          max_participants: 20,
          rules: {
            difficulty: 'medium',
            enforcementLevel: 'medium',
            duration: 3600
          },
          settings: {
            description: 'Full Grand Prix experience with multiple laps',
            requirements: ['Valid driver license', 'Racing experience', 'Helmet required']
          },
          is_public: true
        }
      ]

      for (const eventData of sampleEvents) {
        await this.eventRepository.create(eventData)
      }

      logger.info(`Created ${sampleEvents.length} sample events in database`)
    } catch (error) {
      logger.error('Failed to initialize sample events:', error)
    }
  }

  /**
   * Get all races from database
   */
  async getRaces(): Promise<Race[]> {
    try {
      const events = await this.eventRepository.findPublic(50)
      return events.map(event => this.mapEventToRace(event))
    } catch (error) {
      logger.error('Failed to get races:', error)
      return []
    }
  }

  /**
   * Get race by ID
   */
  async getRaceById(raceId: string): Promise<Race | null> {
    try {
      const event = await this.eventRepository.findById(raceId)
      return event ? this.mapEventToRace(event) : null
    } catch (error) {
      logger.error('Failed to get race by ID:', error)
      return null
    }
  }

  /**
   * Create a new race
   */
  async createRace(raceData: CreateRaceRequest): Promise<Race> {
    try {
      const eventData = {
        name: raceData.name,
        type: 'CUSTOM_RACE' as const,
        organizer_id: 'system', // TODO: Get from authenticated user
        start_time: raceData.startTime,
        end_time: new Date(raceData.startTime.getTime() + raceData.duration * 1000),
        registration_close_time: new Date(raceData.startTime.getTime() - 5 * 60000), // 5 minutes before start
        max_participants: raceData.maxParticipants,
        rules: {
          difficulty: raceData.difficulty,
          enforcementLevel: raceData.enforcementLevel,
          duration: raceData.duration,
          entryFee: raceData.entryFee,
          prizePool: raceData.prizePool
        },
        settings: {
          description: raceData.description,
          requirements: raceData.requirements,
          trackName: raceData.trackName
        }
      }

      const event = await this.eventRepository.create(eventData)
      logger.info(`Created race: ${event.name} (${event.id})`)
      
      return this.mapEventToRace(event)
    } catch (error) {
      logger.error('Failed to create race:', error)
      throw error
    }
  }

  /**
   * Join a race
   */
  async joinRace(raceId: string, userId: string, username: string, displayName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const event = await this.eventRepository.findById(raceId)
      
      if (!event) {
        return { success: false, error: 'Race not found' }
      }

      if (event.status !== 'REGISTRATION_OPEN' && event.status !== 'PUBLISHED') {
        return { success: false, error: 'Race is not accepting new participants' }
      }

      // Check if race is full
      if (event.current_participants >= event.max_participants) {
        return { success: false, error: 'Race is full' }
      }

      // Add participant through participation service
      await participationService.addParticipant(raceId, userId, username, displayName)
      
      // Update current participants count
      await this.eventRepository.update(raceId, {
        max_participants: event.max_participants
      })

      logger.info(`User ${username} joined race ${event.name}`)
      return { success: true }
    } catch (error) {
      logger.error('Failed to join race:', error)
      return { success: false, error: 'Failed to join race' }
    }
  }

  /**
   * Leave a race
   */
  async leaveRace(raceId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const event = await this.eventRepository.findById(raceId)
      
      if (!event) {
        return { success: false, error: 'Race not found' }
      }

      // Remove participant through participation service
      await participationService.removeParticipant(raceId, userId)
      
      // Note: participant count is managed by participation service

      logger.info(`User ${userId} left race ${event.name}`)
      return { success: true }
    } catch (error) {
      logger.error('Failed to leave race:', error)
      return { success: false, error: 'Failed to leave race' }
    }
  }

  /**
   * Spectate a race
   */
  async spectateRace(raceId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const event = await this.eventRepository.findById(raceId)
      
      if (!event) {
        return { success: false, error: 'Race not found' }
      }

      // Add spectator through participation service
      await participationService.addParticipant(raceId, userId, 'spectator', 'Spectator')
      
      logger.info(`User ${userId} is spectating race ${event.name}`)
      return { success: true }
    } catch (error) {
      logger.error('Failed to spectate race:', error)
      return { success: false, error: 'Failed to spectate race' }
    }
  }

  /**
   * Get available tracks
   */
  async getTracks(): Promise<string[]> {
    try {
      const tracks = await trackService.getAllTracks()
      return tracks.map(track => track.name)
    } catch (error) {
      logger.error('Failed to fetch tracks:', error)
      return ['Test Circuit', 'Grand Prix Circuit', 'Speedway Arena', 'Mountain Pass']
    }
  }

  /**
   * Map database Event to Race interface
   */
  private mapEventToRace(event: Event): Race {
    const rules = event.rules as any || {}
    const settings = event.settings as any || {}
    
    return {
      id: event.id,
      name: event.name,
      type: this.mapEventTypeToRaceType(event.type, event.max_participants, settings),
      status: this.mapEventStatusToRaceStatus(event.status),
      trackName: settings.trackName || 'Unknown Track',
      participants: event.current_participants,
      maxParticipants: event.max_participants,
      duration: rules.duration,
      startTime: event.start_time,
      description: event.description || settings.description,
      requirements: settings.requirements || [],
      prizePool: rules.prizePool,
      entryFee: rules.entryFee,
      createdBy: event.organizer_id,
      difficulty: rules.difficulty,
      enforcementLevel: rules.enforcementLevel,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }
  }

  /**
   * Map Event type to Race type
   */
  private mapEventTypeToRaceType(eventType: Event['type'], maxParticipants: number, settings: any): Race['type'] {
    // Check if it's a duel race (2 participants max or explicitly marked as duel)
    if (maxParticipants === 2 || settings.raceSubtype === 'duel') {
      return 'duel'
    }
    
    switch (eventType) {
      case 'CUSTOM_RACE':
        return 'custom'
      case 'TRACK_DAY':
        return 'circuit'
      default:
        return 'custom'
    }
  }

  /**
   * Map Event status to Race status
   */
  private mapEventStatusToRaceStatus(eventStatus: Event['status']): Race['status'] {
    switch (eventStatus) {
      case 'PUBLISHED':
      case 'REGISTRATION_OPEN':
        return 'waiting'
      case 'ONGOING':
        return 'in-progress'
      case 'COMPLETED':
        return 'finished'
      case 'STARTING':
        return 'starting'
      default:
        return 'waiting'
    }
  }
}

export const raceService = new RaceService()
