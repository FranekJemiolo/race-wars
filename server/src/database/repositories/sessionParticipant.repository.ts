/**
 * Session Participant Repository
 * 
 * Handles all database operations for session participants including
 * registration, status management, and session-specific data.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface SessionParticipant {
  id: string
  session_id: string
  participant_id: string
  user_id: string
  status: 'REGISTERED' | 'IN_PIT' | 'ON_TRACK' | 'FINISHED' | 'DNF' | 'DSQ' | 'WITHDRAWN'
  position?: number
  current_lap: number
  current_sector: number
  progress_percentage: number
  session_start_time?: Date
  last_lap_start_time?: Date
  session_time_seconds: number
  total_laps: number
  best_lap_time_seconds?: number
  last_lap_time_seconds?: number
  best_sector_times: Record<string, number>
  current_lat?: number
  current_lng?: number
  current_speed_kmh?: number
  current_heading?: number
  last_position_update?: Date
  time_penalties_seconds: number
  point_penalties: number
  blue_flags: number
  yellow_flags_shown: number
  notes?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateSessionParticipantInput {
  session_id: string
  participant_id: string
  user_id: string
  car_number?: number
  transponder_number?: string
}

export interface UpdateSessionParticipantInput {
  status?: SessionParticipant['status']
  position?: number
  current_lap?: number
  current_sector?: number
  progress_percentage?: number
  session_start_time?: Date
  last_lap_start_time?: Date
  session_time_seconds?: number
  total_laps?: number
  best_lap_time_seconds?: number
  last_lap_time_seconds?: number
  best_sector_times?: Record<string, number>
  current_lat?: number
  current_lng?: number
  current_speed_kmh?: number
  current_heading?: number
  last_position_update?: Date
  time_penalties_seconds?: number
  point_penalties?: number
  blue_flags?: number
  yellow_flags_shown?: number
  notes?: string
  is_active?: boolean
}

export class SessionParticipantRepository {
  /**
   * Create a new session participant
   */
  async create(input: CreateSessionParticipantInput): Promise<SessionParticipant> {
    logger.info('Creating session participant', { sessionId: input.session_id, userId: input.user_id })

    try {
      const sql = `
        INSERT INTO session_participants (
          session_id, participant_id, user_id
        ) VALUES (
          $1, $2, $3
        )
        RETURNING *
      `

      const values = [
        input.session_id,
        input.participant_id,
        input.user_id
      ]

      const result = await query(sql, values)
      const sessionParticipant = result.rows[0]

      logger.info('Session participant created successfully', { 
        sessionParticipantId: sessionParticipant.id, 
        sessionId: input.session_id 
      })
      return this.mapRowToSessionParticipant(sessionParticipant)
    } catch (error) {
      logger.error('Failed to create session participant', { input, error })
      throw error
    }
  }

  /**
   * Find session participant by ID
   */
  async findById(id: string): Promise<SessionParticipant | null> {
    try {
      const sql = 'SELECT * FROM session_participants WHERE id = $1 AND is_active = true'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToSessionParticipant(result.rows[0])
    } catch (error) {
      logger.error('Failed to find session participant by ID', { id, error })
      throw error
    }
  }

  /**
   * Update session participant
   */
  async update(id: string, input: UpdateSessionParticipantInput): Promise<SessionParticipant | null> {
    logger.info('Updating session participant', { sessionParticipantId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'best_sector_times') {
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
        UPDATE session_participants 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Session participant updated successfully', { sessionParticipantId: id })
      return this.mapRowToSessionParticipant(result.rows[0])
    } catch (error) {
      logger.error('Failed to update session participant', { id, error })
      throw error
    }
  }

  /**
   * Get participants by session
   */
  async findBySession(sessionId: string): Promise<SessionParticipant[]> {
    try {
      const sql = `
        SELECT sp.*, u.display_name, u.email 
        FROM session_participants sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.session_id = $1 AND sp.is_active = true 
        ORDER BY sp.position ASC NULLS LAST, sp.created_at ASC
      `
      const result = await query(sql, [sessionId])
      return result.rows.map((row: any) => this.mapRowToSessionParticipant(row))
    } catch (error) {
      logger.error('Failed to find session participants by session', { sessionId, error })
      throw error
    }
  }

  /**
   * Get session participant by session and user
   */
  async findBySessionAndUser(sessionId: string, userId: string): Promise<SessionParticipant | null> {
    try {
      const sql = 'SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2 AND is_active = true'
      const result = await query(sql, [sessionId, userId])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToSessionParticipant(result.rows[0])
    } catch (error) {
      logger.error('Failed to find session participant by session and user', { sessionId, userId, error })
      throw error
    }
  }

  /**
   * Update participant status
   */
  async updateStatus(id: string, status: SessionParticipant['status']): Promise<boolean> {
    logger.info('Updating session participant status', { sessionParticipantId: id, status })

    try {
      const sql = `
        UPDATE session_participants 
        SET status = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id, status])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Session participant status updated successfully', { sessionParticipantId: id, status })
      return true
    } catch (error) {
      logger.error('Failed to update session participant status', { id, status, error })
      throw error
    }
  }

  /**
   * Update participant race position
   */
  async updateRacePosition(id: string, position: number): Promise<boolean> {
    try {
      const sql = `
        UPDATE session_participants 
        SET position = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id, position])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to update session participant position', { id, position, error })
      throw error
    }
  }

  /**
   * Update participant lap data
   */
  async updateLapData(id: string, currentLap: number, lapTime?: number, totalLaps?: number): Promise<boolean> {
    try {
      const updateFields: string[] = ['current_lap = $2']
      const values: any[] = [id, currentLap]
      let paramIndex = 3

      if (lapTime !== undefined) {
        updateFields.push(`last_lap_time_seconds = $${paramIndex}`)
        values.push(lapTime)
        paramIndex++
      }

      if (totalLaps !== undefined) {
        updateFields.push(`total_laps = $${paramIndex}`)
        values.push(totalLaps)
        paramIndex++
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE session_participants 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, values)
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to update session participant lap data', { id, currentLap, error })
      throw error
    }
  }

  /**
   * Update participant GPS position
   */
  async updatePosition(id: string, lat: number, lng: number, speed?: number, heading?: number): Promise<boolean> {
    try {
      const updateFields: string[] = ['current_lat = $2', 'current_lng = $3', 'last_position_update = CURRENT_TIMESTAMP']
      const values: any[] = [id, lat, lng]
      let paramIndex = 4

      if (speed !== undefined) {
        updateFields.push(`current_speed_kmh = $${paramIndex}`)
        values.push(speed)
        paramIndex++
      }

      if (heading !== undefined) {
        updateFields.push(`current_heading = $${paramIndex}`)
        values.push(heading)
        paramIndex++
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE session_participants 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, values)
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to update session participant GPS position', { id, error })
      throw error
    }
  }

  /**
   * Update best lap time
   */
  async updateBestLapTime(id: string, lapTime: number): Promise<boolean> {
    try {
      const sql = `
        UPDATE session_participants 
        SET best_lap_time_seconds = LEAST($2, COALESCE(best_lap_time_seconds, $2)), updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id, lapTime])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to update best lap time', { id, lapTime, error })
      throw error
    }
  }

  /**
   * Add time penalty
   */
  async addTimePenalty(id: string, penaltySeconds: number): Promise<boolean> {
    try {
      const sql = `
        UPDATE session_participants 
        SET time_penalties_seconds = time_penalties_seconds + $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id, penaltySeconds])
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to add time penalty', { id, penaltySeconds, error })
      throw error
    }
  }

  /**
   * Get session leaderboard
   */
  async getLeaderboard(sessionId: string): Promise<SessionParticipant[]> {
    try {
      const sql = `
        SELECT sp.*, u.display_name, u.email 
        FROM session_participants sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.session_id = $1 AND sp.is_active = true 
        AND sp.status IN ('IN_PIT', 'ON_TRACK', 'FINISHED')
        ORDER BY sp.position ASC NULLS LAST, sp.total_laps DESC, sp.best_lap_time_seconds ASC NULLS LAST
      `
      const result = await query(sql, [sessionId])
      return result.rows.map((row: any) => this.mapRowToSessionParticipant(row))
    } catch (error) {
      logger.error('Failed to get session leaderboard', { sessionId, error })
      throw error
    }
  }

  /**
   * Get session statistics
   */
  async getStats(sessionId: string): Promise<{
    total: number
    inPit: number
    onTrack: number
    finished: number
    dnf: number
    dsq: number
    averageLaps: number
    fastestLap?: number
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'IN_PIT' THEN 1 END) as in_pit,
          COUNT(CASE WHEN status = 'ON_TRACK' THEN 1 END) as on_track,
          COUNT(CASE WHEN status = 'FINISHED' THEN 1 END) as finished,
          COUNT(CASE WHEN status = 'DNF' THEN 1 END) as dnf,
          COUNT(CASE WHEN status = 'DSQ' THEN 1 END) as dsq,
          AVG(total_laps) as average_laps,
          MIN(best_lap_time_seconds) as fastest_lap
        FROM session_participants 
        WHERE session_id = $1 AND is_active = true
      `

      const result = await query(sql, [sessionId])
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to get session participant stats', { sessionId, error })
      throw error
    }
  }

  /**
   * Map database row to SessionParticipant object
   */
  private mapRowToSessionParticipant(row: any): SessionParticipant {
    return {
      id: row.id,
      session_id: row.session_id,
      participant_id: row.participant_id,
      user_id: row.user_id,
      status: row.status,
      position: row.position,
      current_lap: row.current_lap,
      current_sector: row.current_sector,
      progress_percentage: row.progress_percentage,
      session_start_time: row.session_start_time,
      last_lap_start_time: row.last_lap_start_time,
      session_time_seconds: row.session_time_seconds,
      total_laps: row.total_laps,
      best_lap_time_seconds: row.best_lap_time_seconds,
      last_lap_time_seconds: row.last_lap_time_seconds,
      best_sector_times: row.best_sector_times || {},
      current_lat: row.current_lat,
      current_lng: row.current_lng,
      current_speed_kmh: row.current_speed_kmh,
      current_heading: row.current_heading,
      last_position_update: row.last_position_update,
      time_penalties_seconds: row.time_penalties_seconds,
      point_penalties: row.point_penalties,
      blue_flags: row.blue_flags,
      yellow_flags_shown: row.yellow_flags_shown,
      notes: row.notes,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const sessionParticipantRepository = new SessionParticipantRepository()
