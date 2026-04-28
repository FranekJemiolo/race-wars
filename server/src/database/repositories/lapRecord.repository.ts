/**
 * Lap Record Repository
 * 
 * Handles all database operations for lap records including
 * lap timing, GPS tracking, and performance metrics.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface LapRecord {
  id: string
  session_participant_id: string
  lap_number: number
  start_time: Date
  end_time?: Date
  lap_time_seconds?: number
  sector_times: Record<string, number>
  max_speed_kmh?: number
  average_speed_kmh?: number
  distance_meters?: number
  gps_track?: string // GeoJSON LineString
  checkpoints_passed: string[]
  violations_count: number
  penalties_seconds: number
  points_earned: number
  is_valid: boolean
  is_best_lap: boolean
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface CreateLapRecordInput {
  session_participant_id: string
  lap_number: number
  start_time: Date
  sector_times?: Record<string, number>
  max_speed_kmh?: number
  average_speed_kmh?: number
  distance_meters?: number
  gps_track?: string // GeoJSON LineString
  checkpoints_passed?: string[]
  violations_count?: number
  penalties_seconds?: number
  points_earned?: number
  notes?: string
}

export interface UpdateLapRecordInput {
  end_time?: Date
  lap_time_seconds?: number
  sector_times?: Record<string, number>
  max_speed_kmh?: number
  average_speed_kmh?: number
  distance_meters?: number
  gps_track?: string // GeoJSON LineString
  checkpoints_passed?: string[]
  violations_count?: number
  penalties_seconds?: number
  points_earned?: number
  is_valid?: boolean
  is_best_lap?: boolean
  notes?: string
}

export class LapRecordRepository {
  /**
   * Create a new lap record
   */
  async create(input: CreateLapRecordInput): Promise<LapRecord> {
    logger.info('Creating lap record', { sessionParticipantId: input.session_participant_id, lapNumber: input.lap_number })

    try {
      const sql = `
        INSERT INTO lap_records (
          session_participant_id, lap_number, start_time, sector_times, max_speed_kmh,
          average_speed_kmh, distance_meters, gps_track, checkpoints_passed, violations_count,
          penalties_seconds, points_earned, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING *
      `

      const values = [
        input.session_participant_id,
        input.lap_number,
        input.start_time,
        JSON.stringify(input.sector_times || {}),
        input.max_speed_kmh || null,
        input.average_speed_kmh || null,
        input.distance_meters || null,
        input.gps_track || null,
        JSON.stringify(input.checkpoints_passed || []),
        input.violations_count || 0,
        input.penalties_seconds || 0,
        input.points_earned || 0,
        input.notes || null
      ]

      const result = await query(sql, values)
      const lapRecord = result.rows[0]

      logger.info('Lap record created successfully', { lapRecordId: lapRecord.id })
      return this.mapRowToLapRecord(lapRecord)
    } catch (error) {
      logger.error('Failed to create lap record', { input, error })
      throw error
    }
  }

  /**
   * Find lap record by ID
   */
  async findById(id: string): Promise<LapRecord | null> {
    try {
      const sql = 'SELECT * FROM lap_records WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToLapRecord(result.rows[0])
    } catch (error) {
      logger.error('Failed to find lap record by ID', { id, error })
      throw error
    }
  }

  /**
   * Update lap record
   */
  async update(id: string, input: UpdateLapRecordInput): Promise<LapRecord | null> {
    logger.info('Updating lap record', { lapRecordId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'sector_times' || key === 'checkpoints_passed') {
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
        UPDATE lap_records 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Lap record updated successfully', { lapRecordId: id })
      return this.mapRowToLapRecord(result.rows[0])
    } catch (error) {
      logger.error('Failed to update lap record', { id, error })
      throw error
    }
  }

  /**
   * Get lap records by session participant
   */
  async findBySessionParticipant(sessionParticipantId: string): Promise<LapRecord[]> {
    try {
      const sql = `
        SELECT * FROM lap_records 
        WHERE session_participant_id = $1 
        ORDER BY lap_number ASC
      `
      const result = await query(sql, [sessionParticipantId])
      return result.rows.map((row: any) => this.mapRowToLapRecord(row))
    } catch (error) {
      logger.error('Failed to find lap records by session participant', { sessionParticipantId, error })
      throw error
    }
  }

  /**
   * Get lap records by session
   */
  async findBySession(sessionId: string): Promise<LapRecord[]> {
    try {
      const sql = `
        SELECT lr.*, sp.user_id, sp.display_name
        FROM lap_records lr
        JOIN session_participants sp ON lr.session_participant_id = sp.id
        WHERE sp.session_id = $1 
        ORDER BY lr.lap_number ASC, lr.lap_time_seconds ASC
      `
      const result = await query(sql, [sessionId])
      return result.rows.map((row: any) => this.mapRowToLapRecord(row))
    } catch (error) {
      logger.error('Failed to find lap records by session', { sessionId, error })
      throw error
    }
  }

  /**
   * Get best lap for a session participant
   */
  async getBestLap(sessionParticipantId: string): Promise<LapRecord | null> {
    try {
      const sql = `
        SELECT * FROM lap_records 
        WHERE session_participant_id = $1 AND is_valid = true AND lap_time_seconds IS NOT NULL
        ORDER BY lap_time_seconds ASC 
        LIMIT 1
      `
      const result = await query(sql, [sessionParticipantId])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToLapRecord(result.rows[0])
    } catch (error) {
      logger.error('Failed to get best lap', { sessionParticipantId, error })
      throw error
    }
  }

  /**
   * Get best lap for a session
   */
  async getBestLapForSession(sessionId: string): Promise<LapRecord | null> {
    try {
      const sql = `
        SELECT lr.*, sp.user_id, sp.display_name
        FROM lap_records lr
        JOIN session_participants sp ON lr.session_participant_id = sp.id
        WHERE sp.session_id = $1 AND lr.is_valid = true AND lr.lap_time_seconds IS NOT NULL
        ORDER BY lr.lap_time_seconds ASC 
        LIMIT 1
      `
      const result = await query(sql, [sessionId])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToLapRecord(result.rows[0])
    } catch (error) {
      logger.error('Failed to get best lap for session', { sessionId, error })
      throw error
    }
  }

  /**
   * Get lap statistics for a session participant
   */
  async getStats(sessionParticipantId: string): Promise<{
    totalLaps: number
    validLaps: number
    bestLapTime?: number
    averageLapTime?: number
    totalDistance: number
    maxSpeed: number
    averageSpeed: number
    totalViolations: number
    totalPenalties: number
    totalPoints: number
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_laps,
          COUNT(CASE WHEN is_valid = true THEN 1 END) as valid_laps,
          MIN(lap_time_seconds) as best_lap_time,
          AVG(lap_time_seconds) as average_lap_time,
          SUM(distance_meters) as total_distance,
          MAX(max_speed_kmh) as max_speed,
          AVG(average_speed_kmh) as average_speed,
          SUM(violations_count) as total_violations,
          SUM(penalties_seconds) as total_penalties,
          SUM(points_earned) as total_points
        FROM lap_records 
        WHERE session_participant_id = $1
      `

      const result = await query(sql, [sessionParticipantId])
      const row = result.rows[0]

      return {
        totalLaps: parseInt(row.total_laps),
        validLaps: parseInt(row.valid_laps),
        bestLapTime: row.best_lap_time ? parseFloat(row.best_lap_time) : undefined,
        averageLapTime: row.average_lap_time ? parseFloat(row.average_lap_time) : undefined,
        totalDistance: parseFloat(row.total_distance) || 0,
        maxSpeed: parseFloat(row.max_speed) || 0,
        averageSpeed: parseFloat(row.average_speed) || 0,
        totalViolations: parseInt(row.total_violations),
        totalPenalties: parseInt(row.total_penalties),
        totalPoints: parseInt(row.total_points)
      }
    } catch (error) {
      logger.error('Failed to get lap statistics', { sessionParticipantId, error })
      throw error
    }
  }

  /**
   * Get lap leaderboard for a session
   */
  async getLeaderboard(sessionId: string, limit: number = 10): Promise<{
    user_id: string
    display_name: string
    best_lap_time: number
    lap_number: number
    total_laps: number
  }[]> {
    try {
      const sql = `
        SELECT 
          sp.user_id,
          sp.display_name,
          MIN(lr.lap_time_seconds) as best_lap_time,
          lr.lap_number,
          COUNT(lr.id) as total_laps
        FROM lap_records lr
        JOIN session_participants sp ON lr.session_participant_id = sp.id
        WHERE sp.session_id = $1 AND lr.is_valid = true AND lr.lap_time_seconds IS NOT NULL
        GROUP BY sp.user_id, sp.display_name, lr.lap_time_seconds, lr.lap_number
        ORDER BY best_lap_time ASC
        LIMIT $2
      `
      const result = await query(sql, [sessionId, limit])
      return result.rows
    } catch (error) {
      logger.error('Failed to get lap leaderboard', { sessionId, error })
      throw error
    }
  }

  /**
   * Update lap GPS track
   */
  async updateGpsTrack(id: string, gpsTrack: string): Promise<void> {
    try {
      const sql = `
        UPDATE lap_records 
        SET gps_track = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `
      await query(sql, [gpsTrack, id])
    } catch (error) {
      logger.error('Failed to update GPS track', { lapRecordId: id, error })
      throw error
    }
  }

  /**
   * Add checkpoint to lap
   */
  async addCheckpoint(id: string, checkpointId: string): Promise<void> {
    try {
      const sql = `
        UPDATE lap_records 
        SET checkpoints_passed = array_append(checkpoints_passed, $1), updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND NOT ($1 = ANY(checkpoints_passed))
      `
      await query(sql, [checkpointId, id])
    } catch (error) {
      logger.error('Failed to add checkpoint to lap', { lapRecordId: id, checkpointId, error })
      throw error
    }
  }

  /**
   * Increment violations count
   */
  async incrementViolations(id: string): Promise<void> {
    try {
      const sql = `
        UPDATE lap_records 
        SET violations_count = violations_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `
      await query(sql, [id])
    } catch (error) {
      logger.error('Failed to increment violations', { lapRecordId: id, error })
      throw error
    }
  }

  /**
   * Add penalty seconds
   */
  async addPenalty(id: string, penaltySeconds: number): Promise<void> {
    try {
      const sql = `
        UPDATE lap_records 
        SET penalties_seconds = penalties_seconds + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `
      await query(sql, [penaltySeconds, id])
    } catch (error) {
      logger.error('Failed to add penalty', { lapRecordId: id, penaltySeconds, error })
      throw error
    }
  }

  /**
   * Update sector times
   */
  async updateSectorTimes(id: string, sectorTimes: Record<string, number>): Promise<void> {
    try {
      const sql = `
        UPDATE lap_records 
        SET sector_times = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `
      await query(sql, [JSON.stringify(sectorTimes), id])
    } catch (error) {
      logger.error('Failed to update sector times', { lapRecordId: id, error })
      throw error
    }
  }

  /**
   * Mark lap as best lap
   */
  async markAsBestLap(id: string): Promise<void> {
    try {
      // First, unmark all other best laps for the same session participant
      const getLapRecord = await query('SELECT session_participant_id FROM lap_records WHERE id = $1', [id])
      const sessionParticipantId = getLapRecord.rows[0]?.session_participant_id
      
      if (sessionParticipantId) {
        await query(
          'UPDATE lap_records SET is_best_lap = false WHERE session_participant_id = $1',
          [sessionParticipantId]
        )
      }

      // Then mark this lap as best
      await query(
        'UPDATE lap_records SET is_best_lap = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      )
    } catch (error) {
      logger.error('Failed to mark lap as best lap', { lapRecordId: id, error })
      throw error
    }
  }

  /**
   * Get lap records by time range
   */
  async findByTimeRange(sessionId: string, startTime: Date, endTime: Date): Promise<LapRecord[]> {
    try {
      const sql = `
        SELECT lr.*, sp.user_id, sp.display_name
        FROM lap_records lr
        JOIN session_participants sp ON lr.session_participant_id = sp.id
        WHERE sp.session_id = $1 AND lr.start_time BETWEEN $2 AND $3
        ORDER BY lr.start_time ASC
      `
      const result = await query(sql, [sessionId, startTime, endTime])
      return result.rows.map((row: any) => this.mapRowToLapRecord(row))
    } catch (error) {
      logger.error('Failed to find lap records by time range', { sessionId, startTime, endTime, error })
      throw error
    }
  }

  /**
   * Map database row to LapRecord object
   */
  private mapRowToLapRecord(row: any): LapRecord {
    return {
      id: row.id,
      session_participant_id: row.session_participant_id,
      lap_number: row.lap_number,
      start_time: row.start_time,
      end_time: row.end_time,
      lap_time_seconds: row.lap_time_seconds,
      sector_times: row.sector_times || {},
      max_speed_kmh: row.max_speed_kmh,
      average_speed_kmh: row.average_speed_kmh,
      distance_meters: row.distance_meters,
      gps_track: row.gps_track,
      checkpoints_passed: row.checkpoints_passed || [],
      violations_count: row.violations_count,
      penalties_seconds: row.penalties_seconds,
      points_earned: row.points_earned,
      is_valid: row.is_valid,
      is_best_lap: row.is_best_lap,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const lapRecordRepository = new LapRecordRepository()
