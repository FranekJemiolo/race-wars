/**
 * Flag Repository
 * 
 * Handles all database operations for flag management including
 * flag states, flag history, and race control operations.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface Flag {
  id: string
  session_id: string
  flag_type: 'GREEN' | 'YELLOW' | 'YELLOW_SECTOR' | 'RED' | 'BLUE' | 'CHECKERED' | 'WHITE' | 'BLACK' | 'BLACK_WHITE' | 'SC_BOARD'
  flag_state: 'SHOWN' | 'REMOVED' | 'FLASHING'
  sector?: number
  location?: { lat: number; lng: number }
  location_description?: string
  flag_time: Date
  duration_seconds?: number
  reason?: string
  incident_id?: string
  user_id?: string
  session_participant_id?: string
  cleared_by?: string
  cleared_time?: Date
  safety_car_deployed?: boolean
  safety_car_driver_id?: string
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface CreateFlagInput {
  session_id: string
  flag_type: Flag['flag_type']
  flag_state?: Flag['flag_state']
  sector?: number
  location?: { lat: number; lng: number }
  location_description?: string
  reason?: string
  incident_id?: string
  user_id?: string
  session_participant_id?: string
  notes?: string
}

export interface UpdateFlagInput {
  flag_state?: Flag['flag_state']
  sector?: number
  location?: { lat: number; lng: number }
  location_description?: string
  reason?: string
  cleared_by?: string
  cleared_time?: Date
  safety_car_deployed?: boolean
  safety_car_driver_id?: string
  notes?: string
}

export class FlagRepository {
  /**
   * Create a new flag record
   */
  async create(input: CreateFlagInput): Promise<Flag> {
    logger.info('Creating flag record', { sessionId: input.session_id, flagType: input.flag_type })

    try {
      const sql = `
        INSERT INTO flags (
          session_id, flag_type, flag_state, sector, location, location_description,
          reason, incident_id, user_id, session_participant_id, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        )
        RETURNING *
      `

      const values = [
        input.session_id,
        input.flag_type,
        input.flag_state || 'SHOWN',
        input.sector || null,
        input.location ? `POINT(${input.location.lng} ${input.location.lat})` : null,
        input.location_description || null,
        input.reason || null,
        input.incident_id || null,
        input.user_id || null,
        input.session_participant_id || null,
        input.notes || null
      ]

      const result = await query(sql, values)
      const flag = result.rows[0]

      logger.info('Flag record created successfully', { flagId: flag.id })
      return this.mapRowToFlag(flag)
    } catch (error) {
      logger.error('Failed to create flag record', { input, error })
      throw error
    }
  }

  /**
   * Find flag by ID
   */
  async findById(id: string): Promise<Flag | null> {
    try {
      const sql = 'SELECT * FROM flags WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToFlag(result.rows[0])
    } catch (error) {
      logger.error('Failed to find flag by ID', { id, error })
      throw error
    }
  }

  /**
   * Update flag record
   */
  async update(id: string, input: UpdateFlagInput): Promise<Flag | null> {
    logger.info('Updating flag record', { flagId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'location') {
            updateFields.push(`location = $${paramIndex}`)
            values.push(`POINT(${value.lng} ${value.lat})`)
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
        UPDATE flags 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Flag record updated successfully', { flagId: id })
      return this.mapRowToFlag(result.rows[0])
    } catch (error) {
      logger.error('Failed to update flag record', { id, error })
      throw error
    }
  }

  /**
   * Get flags by session
   */
  async findBySession(sessionId: string): Promise<Flag[]> {
    try {
      const sql = `
        SELECT * FROM flags 
        WHERE session_id = $1 
        ORDER BY flag_time DESC
      `
      const result = await query(sql, [sessionId])
      return result.rows.map((row: any) => this.mapRowToFlag(row))
    } catch (error) {
      logger.error('Failed to find flags by session', { sessionId, error })
      throw error
    }
  }

  /**
   * Get active flags for a session
   */
  async findActiveBySession(sessionId: string): Promise<Flag[]> {
    try {
      const sql = `
        SELECT * FROM flags 
        WHERE session_id = $1 AND flag_state = 'SHOWN'
        ORDER BY flag_time DESC
      `
      const result = await query(sql, [sessionId])
      return result.rows.map((row: any) => this.mapRowToFlag(row))
    } catch (error) {
      logger.error('Failed to find active flags by session', { sessionId, error })
      throw error
    }
  }

  /**
   * Get flags by type for a session
   */
  async findByType(sessionId: string, flagType: string): Promise<Flag[]> {
    try {
      const sql = `
        SELECT * FROM flags 
        WHERE session_id = $1 AND flag_type = $2
        ORDER BY flag_time DESC
      `
      const result = await query(sql, [sessionId, flagType])
      return result.rows.map((row: any) => this.mapRowToFlag(row))
    } catch (error) {
      logger.error('Failed to find flags by type', { sessionId, flagType, error })
      throw error
    }
  }

  /**
   * Get flags by user
   */
  async findByUser(userId: string): Promise<Flag[]> {
    try {
      const sql = `
        SELECT f.*, s.name as session_name, e.name as event_name
        FROM flags f
        JOIN sessions s ON f.session_id = s.id
        JOIN events e ON s.event_id = e.id
        WHERE f.user_id = $1
        ORDER BY f.flag_time DESC
      `
      const result = await query(sql, [userId])
      return result.rows.map((row: any) => this.mapRowToFlag(row))
    } catch (error) {
      logger.error('Failed to find flags by user', { userId, error })
      throw error
    }
  }

  /**
   * Update flag state
   */
  async updateFlagState(flagType: string, flagState: string, sessionId: string, clearedBy?: string): Promise<void> {
    try {
      const sql = `
        UPDATE flags 
        SET flag_state = $1, cleared_by = $2, cleared_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $3 AND flag_type = $4 AND flag_state = 'SHOWN'
      `

      await query(sql, [flagState, clearedBy || null, sessionId, flagType])
    } catch (error) {
      logger.error('Failed to update flag state', { flagType, flagState, sessionId, error })
      throw error
    }
  }

  /**
   * Clear all flags for a session
   */
  async clearAllFlags(sessionId: string, clearedBy: string): Promise<void> {
    try {
      const sql = `
        UPDATE flags 
        SET flag_state = 'REMOVED', cleared_by = $1, cleared_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $2 AND flag_state = 'SHOWN'
      `

      await query(sql, [clearedBy, sessionId])
    } catch (error) {
      logger.error('Failed to clear all flags', { sessionId, error })
      throw error
    }
  }

  /**
   * Get flag statistics for a session
   */
  async getStats(sessionId: string): Promise<{
    totalFlags: number
    activeFlags: number
    flagCounts: Record<string, number>
    averageDuration: number
    lastFlagTime?: Date
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_flags,
          COUNT(CASE WHEN flag_state = 'SHOWN' THEN 1 END) as active_flags,
          COUNT(CASE WHEN flag_type = 'GREEN' THEN 1 END) as green_count,
          COUNT(CASE WHEN flag_type = 'YELLOW' THEN 1 END) as yellow_count,
          COUNT(CASE WHEN flag_type = 'YELLOW_SECTOR' THEN 1 END) as yellow_sector_count,
          COUNT(CASE WHEN flag_type = 'RED' THEN 1 END) as red_count,
          COUNT(CASE WHEN flag_type = 'BLUE' THEN 1 END) as blue_count,
          COUNT(CASE WHEN flag_type = 'CHECKERED' THEN 1 END) as checkered_count,
          COUNT(CASE WHEN flag_type = 'BLACK' THEN 1 END) as black_count,
          COUNT(CASE WHEN flag_type = 'WHITE' THEN 1 END) as white_count,
          AVG(duration_seconds) as average_duration,
          MAX(flag_time) as last_flag_time
        FROM flags 
        WHERE session_id = $1
      `

      const result = await query(sql, [sessionId])
      const row = result.rows[0]

      return {
        totalFlags: parseInt(row.total_flags),
        activeFlags: parseInt(row.active_flags),
        flagCounts: {
          GREEN: parseInt(row.green_count),
          YELLOW: parseInt(row.yellow_count),
          YELLOW_SECTOR: parseInt(row.yellow_sector_count),
          RED: parseInt(row.red_count),
          BLUE: parseInt(row.blue_count),
          CHECKERED: parseInt(row.checkered_count),
          BLACK: parseInt(row.black_count),
          WHITE: parseInt(row.white_count)
        },
        averageDuration: parseFloat(row.average_duration) || 0,
        lastFlagTime: row.last_flag_time
      }
    } catch (error) {
      logger.error('Failed to get flag statistics', { sessionId, error })
      throw error
    }
  }

  /**
   * Get flag history for a session
   */
  async getHistory(sessionId: string, limit: number = 100): Promise<Flag[]> {
    try {
      const sql = `
        SELECT * FROM flags 
        WHERE session_id = $1 
        ORDER BY flag_time DESC 
        LIMIT $2
      `
      const result = await query(sql, [sessionId, limit])
      return result.rows.map((row: any) => this.mapRowToFlag(row))
    } catch (error) {
      logger.error('Failed to get flag history', { sessionId, error })
      throw error
    }
  }

  /**
   * Find flags by incident
   */
  async findByIncident(incidentId: string): Promise<Flag[]> {
    try {
      const sql = `
        SELECT f.*, s.name as session_name, e.name as event_name
        FROM flags f
        JOIN sessions s ON f.session_id = s.id
        JOIN events e ON s.event_id = e.id
        WHERE f.incident_id = $1
        ORDER BY f.flag_time DESC
      `
      const result = await query(sql, [incidentId])
      return result.rows.map((row: any) => this.mapRowToFlag(row))
    } catch (error) {
      logger.error('Failed to find flags by incident', { incidentId, error })
      throw error
    }
  }

  /**
   * Get flags by time range
   */
  async findByTimeRange(sessionId: string, startTime: Date, endTime: Date): Promise<Flag[]> {
    try {
      const sql = `
        SELECT * FROM flags 
        WHERE session_id = $1 AND flag_time BETWEEN $2 AND $3
        ORDER BY flag_time ASC
      `
      const result = await query(sql, [sessionId, startTime, endTime])
      return result.rows.map((row: any) => this.mapRowToFlag(row))
    } catch (error) {
      logger.error('Failed to find flags by time range', { sessionId, startTime, endTime, error })
      throw error
    }
  }

  /**
   * Map database row to Flag object
   */
  private mapRowToFlag(row: any): Flag {
    return {
      id: row.id,
      session_id: row.session_id,
      flag_type: row.flag_type,
      flag_state: row.flag_state,
      sector: row.sector,
      location: row.location ? { lat: row.location_lat, lng: row.location_lng } : undefined,
      location_description: row.location_description,
      flag_time: row.flag_time,
      duration_seconds: row.duration_seconds,
      reason: row.reason,
      incident_id: row.incident_id,
      user_id: row.user_id,
      session_participant_id: row.session_participant_id,
      cleared_by: row.cleared_by,
      cleared_time: row.cleared_time,
      safety_car_deployed: row.safety_car_deployed,
      safety_car_driver_id: row.safety_car_driver_id,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const flagRepository = new FlagRepository()
