/**
 * Session Service
 * 
 * Handles session management for events including participant registration,
 * session state management, and session lifecycle operations.
 */

import { sessionRepository, eventRepository, participantRepository } from '../database/repositories'
import { logger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'

export interface CreateSessionInput {
  eventId: string
  name: string
  sessionType: 'PRACTICE' | 'QUALIFYING' | 'RACE' | 'HOT_LAPS' | 'TIMED_RUNS' | 'TEST'
  startTime: Date
  endTime: Date
  durationMinutes?: number
  lapCountTarget?: number
  timeLimitSeconds?: number
  rules?: Record<string, any>
  settings?: Record<string, any>
  description?: string
}

export interface UpdateSessionInput {
  name?: string
  startTime?: Date
  endTime?: Date
  durationMinutes?: number
  status?: 'SCHEDULED' | 'OPEN_PIT' | 'LIVE' | 'CHECKERED' | 'FINISHED' | 'CANCELLED' | 'POSTPONED'
  raceState?: 'CREATED' | 'COUNTDOWN' | 'LIVE' | 'PAUSED' | 'FINISHED' | 'ABORTED'
  flagState?: 'NONE' | 'GREEN' | 'YELLOW_SECTOR' | 'YELLOW_FULL' | 'RED' | 'CHECKERED' | 'BLUE'
  lapCountTarget?: number
  timeLimitSeconds?: number
  rules?: Record<string, any>
  settings?: Record<string, any>
  description?: string
}

export interface SessionParticipantInput {
  sessionId: string
  userId: string
  carNumber?: number
  transponderNumber?: string
}

export class SessionService {
  /**
   * Create a new session for an event
   */
  async createSession(input: CreateSessionInput, organizerId: string): Promise<any> {
    logger.info('Creating session', { eventId: input.eventId, name: input.name })

    try {
      // Verify event exists and user is organizer
      const event = await eventRepository.findById(input.eventId)
      if (!event) {
        throw new Error('Event not found')
      }

      if (event.organizer_id !== organizerId) {
        throw new Error('Only event organizers can create sessions')
      }

      // Create session
      const session = await sessionRepository.create(input)

      logger.info('Session created successfully', { sessionId: session.id, eventId: input.eventId })
      return session
    } catch (error) {
      logger.error('Failed to create session', { input, error })
      throw error
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, input: UpdateSessionInput, organizerId: string): Promise<any> {
    logger.info('Updating session', { sessionId })

    try {
      // Get session and verify permissions
      const session = await sessionRepository.findById(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }

      const event = await eventRepository.findById(session.event_id)
      if (!event || event.organizer_id !== organizerId) {
        throw new Error('Only event organizers can update sessions')
      }

      // Update session
      const updatedSession = await sessionRepository.update(sessionId, input)
      
      if (!updatedSession) {
        throw new Error('Failed to update session')
      }

      logger.info('Session updated successfully', { sessionId })
      return updatedSession
    } catch (error) {
      logger.error('Failed to update session', { sessionId, error })
      throw error
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string, organizerId: string): Promise<boolean> {
    logger.info('Deleting session', { sessionId })

    try {
      // Get session and verify permissions
      const session = await sessionRepository.findById(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }

      const event = await eventRepository.findById(session.event_id)
      if (!event || event.organizer_id !== organizerId) {
        throw new Error('Only event organizers can delete sessions')
      }

      // Check if session has participants
      if (session.current_participants > 0) {
        throw new Error('Cannot delete session with active participants')
      }

      // Delete session
      const deleted = await sessionRepository.delete(sessionId)
      
      logger.info('Session deleted successfully', { sessionId, deleted })
      return deleted
    } catch (error) {
      logger.error('Failed to delete session', { sessionId, error })
      throw error
    }
  }

  /**
   * Get sessions for an event
   */
  async getEventSessions(eventId: string, includeInactive: boolean = false): Promise<any[]> {
    try {
      const sessions = await sessionRepository.findByEvent(eventId, includeInactive)
      return sessions
    } catch (error) {
      logger.error('Failed to get event sessions', { eventId, error })
      throw error
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<any> {
    try {
      const session = await sessionRepository.findById(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }
      return session
    } catch (error) {
      logger.error('Failed to get session', { sessionId, error })
      throw error
    }
  }

  /**
   * Start session (transition to LIVE)
   */
  async startSession(sessionId: string, organizerId: string): Promise<void> {
    logger.info('Starting session', { sessionId })

    try {
      const session = await this.getSession(sessionId)
      
      // Verify permissions
      const event = await eventRepository.findById(session.event_id)
      if (!event || event.organizer_id !== organizerId) {
        throw new Error('Only event organizers can start sessions')
      }

      // Update session status
      await sessionRepository.updateStatus(sessionId, 'LIVE')
      await sessionRepository.updateRaceState(sessionId, 'LIVE')
      await sessionRepository.updateFlagState(sessionId, 'GREEN')

      logger.info('Session started successfully', { sessionId })
    } catch (error) {
      logger.error('Failed to start session', { sessionId, error })
      throw error
    }
  }

  /**
   * End session (transition to FINISHED)
   */
  async endSession(sessionId: string, organizerId: string): Promise<void> {
    logger.info('Ending session', { sessionId })

    try {
      const session = await this.getSession(sessionId)
      
      // Verify permissions
      const event = await eventRepository.findById(session.event_id)
      if (!event || event.organizer_id !== organizerId) {
        throw new Error('Only event organizers can end sessions')
      }

      // Update session status
      await sessionRepository.updateStatus(sessionId, 'FINISHED')
      await sessionRepository.updateRaceState(sessionId, 'FINISHED')
      await sessionRepository.updateFlagState(sessionId, 'CHECKERED')

      logger.info('Session ended successfully', { sessionId })
    } catch (error) {
      logger.error('Failed to end session', { sessionId, error })
      throw error
    }
  }

  /**
   * Update session flags
   */
  async updateSessionFlags(sessionId: string, flagState: string, organizerId: string): Promise<void> {
    logger.info('Updating session flags', { sessionId, flagState })

    try {
      const session = await this.getSession(sessionId)
      
      // Verify permissions
      const event = await eventRepository.findById(session.event_id)
      if (!event || event.organizer_id !== organizerId) {
        throw new Error('Only event organizers can update session flags')
      }

      // Update flag state
      await sessionRepository.updateFlagState(sessionId, flagState as any)

      logger.info('Session flags updated successfully', { sessionId, flagState })
    } catch (error) {
      logger.error('Failed to update session flags', { sessionId, flagState, error })
      throw error
    }
  }

  /**
   * Register participant for session
   */
  async registerParticipant(input: SessionParticipantInput, userId: string): Promise<void> {
    logger.info('Registering participant for session', { sessionId: input.sessionId, userId })

    try {
      const session = await this.getSession(input.sessionId)
      
      // Check if user is approved participant for the event
      const { participantRepository } = await import('../database/repositories')
      const participants = await participantRepository.findByEvent(session.event_id)
      const userParticipant = participants.find(p => p.user_id === userId)
      
      if (!userParticipant || userParticipant.registration_status !== 'APPROVED') {
        throw new Error('You are not an approved participant for this event')
      }

      // Check if already registered
      const { sessionParticipantRepository } = await import('../database/repositories')
      const existingRegistration = await sessionParticipantRepository.findBySessionAndUser(input.sessionId, userId)
      
      if (existingRegistration) {
        throw new Error('Already registered for this session')
      }

      // Create session participant
      await sessionParticipantRepository.create({
        session_id: input.sessionId,
        participant_id: userParticipant.id,
        user_id: userId,
        car_number: input.carNumber,
        transponder_number: input.transponderNumber
      })

      // Update session participant count
      await sessionRepository.updateParticipantCount(input.sessionId)

      logger.info('Participant registered successfully', { sessionId: input.sessionId, userId })
    } catch (error) {
      logger.error('Failed to register participant', { input, userId, error })
      throw error
    }
  }

  /**
   * Get participants for a session
   */
  async getSessionParticipants(sessionId: string): Promise<any[]> {
    try {
      const { sessionParticipantRepository } = await import('../database/repositories')
      const participants = await sessionParticipantRepository.findBySession(sessionId)
      return participants
    } catch (error) {
      logger.error('Failed to get session participants', { sessionId, error })
      throw error
    }
  }

  /**
   * Get live sessions
   */
  async getLiveSessions(): Promise<any[]> {
    try {
      const sessions = await sessionRepository.findLive()
      return sessions
    } catch (error) {
      logger.error('Failed to get live sessions', { error })
      throw error
    }
  }

  /**
   * Get upcoming sessions
   */
  async getUpcomingSessions(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const sessions = await sessionRepository.findUpcoming(limit, offset)
      return sessions
    } catch (error) {
      logger.error('Failed to get upcoming sessions', { error })
      throw error
    }
  }

  /**
   * Auto-start sessions that are scheduled to start
   */
  async autoStartScheduledSessions(): Promise<void> {
    try {
      const sessions = await sessionRepository.findScheduledToStart(5) // Within 5 minutes
      
      for (const session of sessions) {
        logger.info('Auto-starting session', { sessionId: session.id, name: session.name })
        
        // Update session to OPEN_PIT first, then to LIVE after a delay
        await sessionRepository.updateStatus(session.id, 'OPEN_PIT')
        
        // In a real implementation, you might send notifications to participants
        // and then transition to LIVE after a countdown
        
        logger.info('Session auto-started', { sessionId: session.id })
      }
    } catch (error) {
      logger.error('Failed to auto-start scheduled sessions', { error })
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService()
