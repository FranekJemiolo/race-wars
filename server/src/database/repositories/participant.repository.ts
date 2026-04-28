/**
 * Participant Repository
 * 
 * Handles all database operations for event participants including
 * registration, approval, and participation management.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface Participant {
  id: string
  event_id: string
  user_id: string
  car_profile_id?: string
  registration_status: 'REGISTERED' | 'APPROVED' | 'REJECTED' | 'WAITLIST' | 'CANCELLED' | 'NO_SHOW'
  registration_date: Date
  approval_date?: Date
  rejection_reason?: string
  waiver_signed: boolean
  waiver_signed_at?: Date
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
  payment_amount: number
  payment_date?: Date
  car_number?: number
  transponder_number?: string
  additional_info: Record<string, any>
  emergency_contact_name?: string
  emergency_contact_phone?: string
  sessions_participated: number
  total_laps_completed: number
  best_lap_time_seconds?: number
  notes?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateParticipantInput {
  event_id: string
  user_id: string
  car_profile_id?: string
  car_number?: number
  transponder_number?: string
  additional_info?: Record<string, any>
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export interface UpdateParticipantInput {
  car_profile_id?: string
  car_number?: number
  transponder_number?: string
  additional_info?: Record<string, any>
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  is_active?: boolean
}

export class ParticipantRepository {
  /**
   * Create a new participant
   */
  async create(input: CreateParticipantInput): Promise<Participant> {
    logger.info('Creating participant', { eventId: input.event_id, userId: input.user_id })

    try {
      const sql = `
        INSERT INTO participants (
          event_id, user_id, car_profile_id, car_number, transponder_number,
          additional_info, emergency_contact_name, emergency_contact_phone
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        RETURNING *
      `

      const values = [
        input.event_id,
        input.user_id,
        input.car_profile_id || null,
        input.car_number || null,
        input.transponder_number || null,
        JSON.stringify(input.additional_info || {}),
        input.emergency_contact_name || null,
        input.emergency_contact_phone || null
      ]

      const result = await query(sql, values)
      const participant = result.rows[0]

      logger.info('Participant created successfully', { participantId: participant.id })
      return this.mapRowToParticipant(participant)
    } catch (error) {
      logger.error('Failed to create participant', { input, error })
      throw error
    }
  }

  /**
   * Find participant by ID
   */
  async findById(id: string): Promise<Participant | null> {
    try {
      const sql = 'SELECT * FROM participants WHERE id = $1 AND is_active = true'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToParticipant(result.rows[0])
    } catch (error) {
      logger.error('Failed to find participant by ID', { id, error })
      throw error
    }
  }

  /**
   * Update participant
   */
  async update(id: string, input: UpdateParticipantInput): Promise<Participant | null> {
    logger.info('Updating participant', { participantId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'additional_info') {
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
        UPDATE participants 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Participant updated successfully', { participantId: id })
      return this.mapRowToParticipant(result.rows[0])
    } catch (error) {
      logger.error('Failed to update participant', { id, error })
      throw error
    }
  }

  /**
   * Get participants by event
   */
  async findByEvent(eventId: string): Promise<Participant[]> {
    try {
      const sql = 'SELECT * FROM participants WHERE event_id = $1 AND is_active = true ORDER BY registration_date ASC'
      const result = await query(sql, [eventId])
      return result.rows.map((row: any) => this.mapRowToParticipant(row))
    } catch (error) {
      logger.error('Failed to find participants by event', { eventId, error })
      throw error
    }
  }

  /**
   * Get participants by user
   */
  async findByUser(userId: string): Promise<Participant[]> {
    try {
      const sql = 'SELECT * FROM participants WHERE user_id = $1 AND is_active = true ORDER BY registration_date DESC'
      const result = await query(sql, [userId])
      return result.rows.map((row: any) => this.mapRowToParticipant(row))
    } catch (error) {
      logger.error('Failed to find participants by user', { userId, error })
      throw error
    }
  }

  /**
   * Get participant by event and user
   */
  async findByEventAndUser(eventId: string, userId: string): Promise<Participant | null> {
    try {
      const sql = 'SELECT * FROM participants WHERE event_id = $1 AND user_id = $2 AND is_active = true'
      const result = await query(sql, [eventId, userId])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToParticipant(result.rows[0])
    } catch (error) {
      logger.error('Failed to find participant by event and user', { eventId, userId, error })
      throw error
    }
  }

  /**
   * Approve participant registration
   */
  async approve(id: string): Promise<boolean> {
    logger.info('Approving participant', { participantId: id })

    try {
      const sql = `
        UPDATE participants 
        SET registration_status = 'APPROVED', approval_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Participant approved successfully', { participantId: id })
      return true
    } catch (error) {
      logger.error('Failed to approve participant', { id, error })
      throw error
    }
  }

  /**
   * Reject participant registration
   */
  async reject(id: string, reason: string): Promise<boolean> {
    logger.info('Rejecting participant', { participantId: id, reason })

    try {
      const sql = `
        UPDATE participants 
        SET registration_status = 'REJECTED', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id, reason])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Participant rejected successfully', { participantId: id })
      return true
    } catch (error) {
      logger.error('Failed to reject participant', { id, error })
      throw error
    }
  }

  /**
   * Sign waiver for participant
   */
  async signWaiver(id: string): Promise<boolean> {
    logger.info('Signing waiver for participant', { participantId: id })

    try {
      const sql = `
        UPDATE participants 
        SET waiver_signed = true, waiver_signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Waiver signed successfully', { participantId: id })
      return true
    } catch (error) {
      logger.error('Failed to sign waiver', { id, error })
      throw error
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, status: Participant['payment_status'], amount?: number): Promise<boolean> {
    logger.info('Updating payment status', { participantId: id, status })

    try {
      const sql = `
        UPDATE participants 
        SET 
          payment_status = $2, 
          payment_amount = COALESCE($3, payment_amount),
          payment_date = CASE WHEN $2 = 'PAID' THEN CURRENT_TIMESTAMP ELSE payment_date END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
      `

      const result = await query(sql, [id, status, amount || null])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Payment status updated successfully', { participantId: id, status })
      return true
    } catch (error) {
      logger.error('Failed to update payment status', { id, status, error })
      throw error
    }
  }

  /**
   * Update participation statistics
   */
  async updateStats(id: string, sessionsParticipated?: number, totalLapsCompleted?: number, bestLapTime?: number): Promise<boolean> {
    try {
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      if (sessionsParticipated !== undefined) {
        updateFields.push(`sessions_participated = $${paramIndex}`)
        values.push(sessionsParticipated)
        paramIndex++
      }

      if (totalLapsCompleted !== undefined) {
        updateFields.push(`total_laps_completed = $${paramIndex}`)
        values.push(totalLapsCompleted)
        paramIndex++
      }

      if (bestLapTime !== undefined) {
        updateFields.push(`best_lap_time_seconds = $${paramIndex}`)
        values.push(bestLapTime)
        paramIndex++
      }

      if (updateFields.length === 0) {
        return true
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE participants 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
      `

      values.push(id)

      const result = await query(sql, values)
      return result.rowCount > 0
    } catch (error) {
      logger.error('Failed to update participant stats', { id, error })
      throw error
    }
  }

  /**
   * Get participant statistics
   */
  async getStats(eventId: string): Promise<{
    total: number
    approved: number
    pending: number
    rejected: number
    waitlist: number
    paid: number
    waiverSigned: number
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN registration_status = 'APPROVED' THEN 1 END) as approved,
          COUNT(CASE WHEN registration_status = 'REGISTERED' THEN 1 END) as pending,
          COUNT(CASE WHEN registration_status = 'REJECTED' THEN 1 END) as rejected,
          COUNT(CASE WHEN registration_status = 'WAITLIST' THEN 1 END) as waitlist,
          COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid,
          COUNT(CASE WHEN waiver_signed = true THEN 1 END) as waiver_signed
        FROM participants 
        WHERE event_id = $1 AND is_active = true
      `

      const result = await query(sql, [eventId])
      return result.rows[0]
    } catch (error) {
      logger.error('Failed to get participant stats', { eventId, error })
      throw error
    }
  }

  /**
   * Map database row to Participant object
   */
  private mapRowToParticipant(row: any): Participant {
    return {
      id: row.id,
      event_id: row.event_id,
      user_id: row.user_id,
      car_profile_id: row.car_profile_id,
      registration_status: row.registration_status,
      registration_date: row.registration_date,
      approval_date: row.approval_date,
      rejection_reason: row.rejection_reason,
      waiver_signed: row.waiver_signed,
      waiver_signed_at: row.waiver_signed_at,
      payment_status: row.payment_status,
      payment_amount: row.payment_amount,
      payment_date: row.payment_date,
      car_number: row.car_number,
      transponder_number: row.transponder_number,
      additional_info: row.additional_info || {},
      emergency_contact_name: row.emergency_contact_name,
      emergency_contact_phone: row.emergency_contact_phone,
      sessions_participated: row.sessions_participated,
      total_laps_completed: row.total_laps_completed,
      best_lap_time_seconds: row.best_lap_time_seconds,
      notes: row.notes,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const participantRepository = new ParticipantRepository()
