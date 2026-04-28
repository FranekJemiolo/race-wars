/**
 * Session Repository
 * 
 * Handles all database operations for session management including
 * practice, qualifying, race, and other session types.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface Session {
  id: string
  event_id: string
  name: string
  session_type: 'PRACTICE' | 'QUALIFYING' | 'RACE' | 'HOT_LAPS' | 'TIMED_RUNS' | 'TEST'
  start_time: Date
  end_time: Date
  duration_minutes: number
  status: 'SCHEDULED' | 'OPEN_PIT' | 'LIVE' | 'CHECKERED' | 'FINISHED' | 'CANCELLED' | 'POSTPONED'
  max_participants: number
  current_participants: number
  race_state: 'CREATED' | 'COUNTDOWN' | 'LIVE' | 'PAUSED' | 'FINISHED' | 'ABORTED'
  flag_state: 'NONE' | 'GREEN' | 'YELLOW_SECTOR' | 'YELLOW_FULL' | 'RED' | 'CHECKERED' | 'BLUE'
  lap_count_target?: number
  time_limit_seconds?: number
  rules: Record<string, any>
  settings: Record<string, any>
  total_laps: number
  fastest_lap_seconds?: number
  fastest_lap_driver_id?: string
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateSessionInput {
  event_id: string
  name: string
  session_type: Session['session_type']
  start_time: Date
  end_time: Date
  duration_minutes?: number
  max_participants?: number
  lap_count_target?: number
  time_limit_seconds?: number
  rules?: Record<string, any>
  settings?: Record<string, any>
  description?: string
}

export interface UpdateSessionInput {
  name?: string
  start_time?: Date
  end_time?: Date
  duration_minutes?: number
  status?: Session['status']
  max_participants?: number
  race_state?: Session['race_state']
  flag_state?: Session['flag_state']
  lap_count_target?: number
  time_limit_seconds?: number
  rules?: Record<string, any>
  settings?: Record<string, any>
  description?: string
  is_active?: boolean
}

export class SessionRepository {
  /**
   * Create a new session
   */
  async create(input: CreateSessionInput): Promise<Session> {
    logger.info('Creating new session', { name: input.name, type: input.session_type, eventId: input.event_id })

    try {
      const sql = `
        INSERT INTO sessions (
          event_id, name, session_type, start_time, end_time, duration_minutes,
          max_participants, lap_count_target, time_limit_seconds, rules, settings, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING *
      `

      const values = [
        input.event_id,
        input.name,
        input.session_type,
        input.start_time,
        input.end_time,
        input.duration_minutes || Math.floor((input.end_time.getTime() - input.start_time.getTime()) / 60000),
        input.max_participants || 100,
        input.lap_count_target || null,
        input.time_limit_seconds || null,
        JSON.stringify(input.rules || {}),
        JSON.stringify(input.settings || {}),
        input.description || null
      ]

      const result = await query(sql, values)
      const session = result.rows[0]

      logger.info('Session created successfully', { sessionId: session.id, name: session.name })
      return this.mapRowToSession(session)
    } catch (error) {
      logger.error('Failed to create session', { name: input.name, error })
      throw error
    }
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<Session | null> {
    try {
      const sql = 'SELECT * FROM sessions WHERE id = $1 AND is_active = true'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToSession(result.rows[0])
    } catch (error) {
      logger.error('Failed to find session by ID', { id, error })
      throw error
    }
  }

  /**
   * Update session
   */
  async update(id: string, input: UpdateSessionInput): Promise<Session | null> {
    logger.info('Updating session', { sessionId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'rules' || key === 'settings') {
            updateFields.push(`${key} = $${paramIndex}`)
            values.push(JSON.stringify(value))
          } else {
            updateFields.push(`${key} = $${paramIndex}`)
            values.push(value)
          }
          paramIndex++
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update')
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE sessions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Session updated successfully', { sessionId: id })
      return this.mapRowToSession(result.rows[0])
    } catch (error) {
      logger.error('Failed to update session', { id, error })
      throw error
    }
  }

  /**
   * Delete session
   */
  async delete(id: string): Promise<boolean> {
    logger.info('Deleting session', { sessionId: id })

    try {
      const sql = 'DELETE FROM sessions WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Session deleted successfully', { sessionId: id })
      return true
    } catch (error) {
      logger.error('Failed to delete session', { id, error })
      throw error
    }
  }

  /**
   * Get sessions by event
   */
  async findByEvent(eventId: string, includeInactive: boolean = false): Promise<Session[]> {
    try {
      const sql = includeInactive
        ? 'SELECT * FROM sessions WHERE event_id = $1 ORDER BY start_time ASC'
        : 'SELECT * FROM sessions WHERE event_id = $1 AND is_active = true ORDER BY start_time ASC'

      const result = await query(sql, [eventId])
      return result.rows.map((row: any) => this.mapRowToSession(row))
    } catch (error) {
      logger.error('Failed to find sessions by event', { eventId, error })
      throw error
    }
  }

  /**
   * Get sessions by status
   */
  async findByStatus(status: Session['status'], limit: number = 20, offset: number = 0): Promise<Session[]> {
    try {
      const sql = `
        SELECT s.* FROM sessions s
        JOIN events e ON e.id = s.event_id
        WHERE s.status = $1 
        AND s.is_active = true
        AND e.is_public = true
        ORDER BY s.start_time ASC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [status, limit, offset])
      return result.rows.map((row: any) => this.mapRowToSession(row))
    } catch (error) {
      logger.error('Failed to find sessions by status', { status, error })
      throw error
    }
  }

  /**
   * Get live sessions
   */
  async findLive(): Promise<Session[]> {
    try {
      const sql = `
        SELECT s.* FROM sessions s
        JOIN events e ON e.id = s.event_id
        WHERE s.status = 'LIVE' 
        AND s.is_active = true
        AND e.is_public = true
        ORDER BY s.start_time ASC
      `

      const result = await query(sql)
      return result.rows.map((row: any) => this.mapRowToSession(row))
    } catch (error) {
      logger.error('Failed to find live sessions', { error })
      throw error
    }
  }

  /**
   * Get upcoming sessions
   */
  async findUpcoming(limit: number = 20, offset: number = 0): Promise<Session[]> {
    try {
      const sql = `
        SELECT s.* FROM sessions s
        JOIN events e ON e.id = s.event_id
        WHERE s.start_time > CURRENT_TIMESTAMP 
        AND s.status IN ('SCHEDULED', 'OPEN_PIT')
        AND s.is_active = true
        AND e.is_public = true
        ORDER BY s.start_time ASC
        LIMIT $1 OFFSET $2
      `

      const result = await query(sql, [limit, offset])
      return result.rows.map((row: any) => this.mapRowToSession(row))
    } catch (error) {
      logger.error('Failed to find upcoming sessions', { error })
      throw error
    }
  }

  /**
   * Get sessions by type
   */
  async findByType(type: Session['session_type'], limit: number = 20, offset: number = 0): Promise<Session[]> {
    try {
      const sql = `
        SELECT s.* FROM sessions s
        JOIN events e ON e.id = s.event_id
        WHERE s.session_type = $1 
        AND s.is_active = true
        AND e.is_public = true
        ORDER BY s.start_time DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [type, limit, offset])
      return result.rows.map((row: any) => this.mapRowToSession(row))
    } catch (error) {
      logger.error('Failed to find sessions by type', { type, error })
      throw error
    }
  }

  /**
   * Update session status
   */
  async updateStatus(id: string, status: Session['status']): Promise<boolean> {
    logger.info('Updating session status', { sessionId: id, status })

    try {
      const sql = `
        UPDATE sessions 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
      `

      const result = await query(sql, [status, id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Session status updated successfully', { sessionId: id, status })
      return true
    } catch (error) {
      logger.error('Failed to update session status', { id, status, error })
      throw error
    }
  }

  /**
   * Update race state
   */
  async updateRaceState(id: string, raceState: Session['race_state']): Promise<boolean> {
    logger.info('Updating session race state', { sessionId: id, raceState })

    try {
      const sql = `
        UPDATE sessions 
        SET race_state = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
      `

      const result = await query(sql, [raceState, id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Session race state updated successfully', { sessionId: id, raceState })
      return true
    } catch (error) {
      logger.error('Failed to update session race state', { id, raceState, error })
      throw error
    }
  }

  /**
   * Update flag state
   */
  async updateFlagState(id: string, flagState: Session['flag_state']): Promise<boolean> {
    logger.info('Updating session flag state', { sessionId: id, flagState })

    try {
      const sql = `
        UPDATE sessions 
        SET flag_state = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
      `

      const result = await query(sql, [flagState, id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Session flag state updated successfully', { sessionId: id, flagState })
      return true
    } catch (error) {
      logger.error('Failed to update session flag state', { id, flagState, error })
      throw error
    }
  }

  /**
   * Update participant count
   */
  async updateParticipantCount(sessionId: string): Promise<void> {
    try {
      const sql = `
        UPDATE sessions 
        SET current_participants = (
          SELECT COUNT(*) 
          FROM session_participants 
          WHERE session_id = $1 
          AND status IN ('IN_PIT', 'ON_TRACK', 'FINISHED')
        )
        WHERE id = $1
      `

      await query(sql, [sessionId])
    } catch (error) {
      logger.error('Failed to update session participant count', { sessionId, error })
      throw error
    }
  }

  /**
   * Update fastest lap
   */
  async updateFastestLap(sessionId: string, lapTimeSeconds: number, driverId: string): Promise<void> {
    try {
      const sql = `
        UPDATE sessions 
        SET 
          fastest_lap_seconds = LEAST($1, COALESCE(fastest_lap_seconds, $1)),
          fastest_lap_driver_id = CASE 
            WHEN $1 < COALESCE(fastest_lap_seconds, $1) THEN $2
            ELSE fastest_lap_driver_id
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      await query(sql, [sessionId, lapTimeSeconds, driverId])
    } catch (error) {
      logger.error('Failed to update fastest lap', { sessionId, lapTimeSeconds, driverId, error })
      throw error
    }
  }

  /**
   * Get sessions that need to start (auto-start functionality)
   */
  async findScheduledToStart(withinMinutes: number = 5): Promise<Session[]> {
    try {
      const sql = `
        SELECT s.* FROM sessions s
        JOIN events e ON e.id = s.event_id
        WHERE s.status = 'SCHEDULED'
        AND s.start_time <= CURRENT_TIMESTAMP + INTERVAL '${withinMinutes} minutes'
        AND s.start_time > CURRENT_TIMESTAMP
        AND s.is_active = true
        AND e.is_public = true
        ORDER BY s.start_time ASC
      `

      const result = await query(sql)
      return result.rows.map((row: any) => this.mapRowToSession(row))
    } catch (error) {
      logger.error('Failed to find sessions scheduled to start', { withinMinutes, error })
      throw error
    }
  }

  /**
   * Map database row to Session object
   */
  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      event_id: row.event_id,
      name: row.name,
      session_type: row.session_type,
      start_time: row.start_time,
      end_time: row.end_time,
      duration_minutes: row.duration_minutes,
      status: row.status,
      max_participants: row.max_participants,
      current_participants: row.current_participants,
      race_state: row.race_state,
      flag_state: row.flag_state,
      lap_count_target: row.lap_count_target,
      time_limit_seconds: row.time_limit_seconds,
      rules: row.rules || {},
      settings: row.settings || {},
      total_laps: row.total_laps,
      fastest_lap_seconds: row.fastest_lap_seconds,
      fastest_lap_driver_id: row.fastest_lap_driver_id,
      description: row.description,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const sessionRepository = new SessionRepository()
