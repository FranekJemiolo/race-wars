/**
 * Session Service
 * Manages race sessions, scheduling, and lifecycle
 */

import { logger } from '../utils/logger';
import { sessionRepository } from '../database/repositories';
import type { Session, SessionStatus } from '../types';

export interface CreateSessionRequest {
  trackId: string;
  name: string;
  description: string;
  sessionType: 'practice' | 'qualifying' | 'race' | 'track_day';
  scheduledStart: Date;
  scheduledEnd: Date;
  maxParticipants: number;
  createdBy: string;
}

export interface RescheduleSessionRequest {
  sessionId: string;
  newStart: Date;
  newEnd: Date;
}

export class SessionService {
  async createSession(request: CreateSessionRequest): Promise<Session> {
    try {
      const session = await sessionRepository.create({
        trackId: request.trackId,
        name: request.name,
        description: request.description,
        sessionType: request.sessionType,
        scheduledStart: request.scheduledStart,
        scheduledEnd: request.scheduledEnd,
        maxParticipants: request.maxParticipants,
        participants: 0,
        status: 'scheduled',
        createdBy: request.createdBy
      });

      logger.info('Session created', { sessionId: session.id, name: session.name });
      return session;
    } catch (error) {
      logger.error('Failed to create session', { error, request });
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<Session> {
    try {
      const session = await sessionRepository.findById(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      return session;
    } catch (error) {
      logger.error('Failed to get session', { sessionId, error });
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    try {
      const session = await this.getSession(sessionId);
      
      return {
        sessionId: session.id,
        status: session.status,
        activeParticipants: session.participants,
        startTime: session.actualStart,
        endTime: session.actualEnd
      };
    } catch (error) {
      logger.error('Failed to get session status', { sessionId, error });
      throw error;
    }
  }

  async startSession(sessionId: string): Promise<Session> {
    try {
      const session = await sessionRepository.updateStatus(sessionId, 'in_progress', {
        actualStart: new Date()
      });

      logger.info('Session started', { sessionId });
      return session;
    } catch (error) {
      logger.error('Failed to start session', { sessionId, error });
      throw error;
    }
  }

  async completeSession(sessionId: string): Promise<Session> {
    try {
      const session = await sessionRepository.updateStatus(sessionId, 'completed', {
        actualEnd: new Date()
      });

      logger.info('Session completed', { sessionId });
      return session;
    } catch (error) {
      logger.error('Failed to complete session', { sessionId, error });
      throw error;
    }
  }

  async cancelSession(sessionId: string, reason?: string): Promise<Session> {
    try {
      const session = await sessionRepository.updateStatus(sessionId, 'cancelled', {
        actualEnd: new Date(),
        cancellationReason: reason
      });

      logger.info('Session cancelled', { sessionId, reason });
      return session;
    } catch (error) {
      logger.error('Failed to cancel session', { sessionId, error });
      throw error;
    }
  }

  async rescheduleSession(sessionId: string, newStart: Date, newEnd: Date): Promise<Session> {
    try {
      const session = await sessionRepository.update(sessionId, {
        scheduledStart: newStart,
        scheduledEnd: newEnd
      });

      logger.info('Session rescheduled', { sessionId, newStart, newEnd });
      return session;
    } catch (error) {
      logger.error('Failed to reschedule session', { sessionId, error });
      throw error;
    }
  }

  async handleSessionTimeout(sessionId: string): Promise<Session> {
    try {
      const session = await this.getSession(sessionId);
      
      if (session.status === 'in_progress') {
        return await this.completeSession(sessionId);
      }
      
      return session;
    } catch (error) {
      logger.error('Failed to handle session timeout', { sessionId, error });
      throw error;
    }
  }

  async getLiveData(sessionId: string): Promise<{
    activeParticipants: number;
    positions: any[];
    sessionTime: number;
  }> {
    try {
      const session = await this.getSession(sessionId);
      
      // This would typically integrate with real-time position tracking
      // For now, return basic session info
      const sessionTime = session.actualStart 
        ? Date.now() - session.actualStart.getTime()
        : 0;

      return {
        activeParticipants: session.participants,
        positions: [], // Would be populated from real-time tracking
        sessionTime
      };
    } catch (error) {
      logger.error('Failed to get live data', { sessionId, error });
      throw error;
    }
  }

  async listSessions(filters?: {
    trackId?: string;
    status?: string;
    sessionType?: string;
    createdBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<Session[]> {
    try {
      return await sessionRepository.list(filters);
    } catch (error) {
      logger.error('Failed to list sessions', { error, filters });
      throw error;
    }
  }

  async updateParticipantCount(sessionId: string, count: number): Promise<void> {
    try {
      await sessionRepository.update(sessionId, { participants: count });
    } catch (error) {
      logger.error('Failed to update participant count', { sessionId, count, error });
      throw error;
    }
  }
}

export const sessionService = new SessionService();
