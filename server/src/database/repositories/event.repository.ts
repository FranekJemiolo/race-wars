/**
 * Event Repository
 * 
 * Handles all database operations for event management including
 * track day events and custom race events.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface Event {
  id: string
  name: string
  description?: string
  type: 'TRACK_DAY' | 'CUSTOM_RACE'
  organizer_id: string
  track_id?: string
  custom_route_id?: string
  start_time: Date
  end_time: Date
  registration_open_time: Date
  registration_close_time?: Date
  max_participants: number
  current_participants: number
  status: 'DRAFT' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  rules: Record<string, any>
  settings: Record<string, any>
  location_name?: string
  location_address?: string
  location_lat?: number
  location_lng?: number
  waiver_required: boolean
  waiver_text?: string
  is_public: boolean
  featured_image_url?: string
  tags: string[]
  created_at: Date
  updated_at: Date
}

export interface CreateEventInput {
  name: string
  description?: string
  type: Event['type']
  organizer_id: string
  track_id?: string
  custom_route_id?: string
  start_time: Date
  end_time: Date
  registration_close_time?: Date
  max_participants?: number
  rules?: Record<string, any>
  settings?: Record<string, any>
  location_name?: string
  location_address?: string
  location_lat?: number
  location_lng?: number
  waiver_required?: boolean
  waiver_text?: string
  is_public?: boolean
  featured_image_url?: string
  tags?: string[]
}

export interface UpdateEventInput {
  name?: string
  description?: string
  start_time?: Date
  end_time?: Date
  registration_close_time?: Date
  max_participants?: number
  status?: Event['status']
  rules?: Record<string, any>
  settings?: Record<string, any>
  location_name?: string
  location_address?: string
  location_lat?: number
  location_lng?: number
  waiver_required?: boolean
  waiver_text?: string
  is_public?: boolean
  featured_image_url?: string
  tags?: string[]
}

export class EventRepository {
  /**
   * Create a new event
   */
  async create(input: CreateEventInput): Promise<Event> {
    logger.info('Creating new event', { name: input.name, type: input.type, organizerId: input.organizer_id })

    try {
      const sql = `
        INSERT INTO events (
          name, description, type, organizer_id, track_id, custom_route_id,
          start_time, end_time, registration_close_time, max_participants,
          rules, settings, location_name, location_address, location_lat, location_lng,
          waiver_required, waiver_text, is_public, featured_image_url, tags
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `

      const values = [
        input.name,
        input.description || null,
        input.type,
        input.organizer_id,
        input.track_id || null,
        input.custom_route_id || null,
        input.start_time,
        input.end_time,
        input.registration_close_time || null,
        input.max_participants || 100,
        JSON.stringify(input.rules || {}),
        JSON.stringify(input.settings || {}),
        input.location_name || null,
        input.location_address || null,
        input.location_lat || null,
        input.location_lng || null,
        input.waiver_required ?? true,
        input.waiver_text || null,
        input.is_public ?? true,
        input.featured_image_url || null,
        input.tags || []
      ]

      const result = await query(sql, values)
      const event = result.rows[0]

      logger.info('Event created successfully', { eventId: event.id, name: event.name })
      return this.mapRowToEvent(event)
    } catch (error) {
      logger.error('Failed to create event', { name: input.name, error })
      throw error
    }
  }

  /**
   * Find event by ID
   */
  async findById(id: string): Promise<Event | null> {
    try {
      const sql = 'SELECT * FROM events WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToEvent(result.rows[0])
    } catch (error) {
      logger.error('Failed to find event by ID', { id, error })
      throw error
    }
  }

  /**
   * Update event
   */
  async update(id: string, input: UpdateEventInput): Promise<Event | null> {
    logger.info('Updating event', { eventId: id })

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
        UPDATE events 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Event updated successfully', { eventId: id })
      return this.mapRowToEvent(result.rows[0])
    } catch (error) {
      logger.error('Failed to update event', { id, error })
      throw error
    }
  }

  /**
   * Delete event
   */
  async delete(id: string): Promise<boolean> {
    logger.info('Deleting event', { eventId: id })

    try {
      const sql = 'DELETE FROM events WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Event deleted successfully', { eventId: id })
      return true
    } catch (error) {
      logger.error('Failed to delete event', { id, error })
      throw error
    }
  }

  /**
   * Get events by organizer
   */
  async findByOrganizer(organizerId: string, limit: number = 20, offset: number = 0): Promise<Event[]> {
    try {
      const sql = `
        SELECT * FROM events 
        WHERE organizer_id = $1 
        ORDER BY start_time DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [organizerId, limit, offset])
      return result.rows.map((row: any) => this.mapRowToEvent(row))
    } catch (error) {
      logger.error('Failed to find events by organizer', { organizerId, error })
      throw error
    }
  }

  /**
   * Get public events
   */
  async findPublic(limit: number = 20, offset: number = 0): Promise<Event[]> {
    try {
      const sql = `
        SELECT * FROM events 
        WHERE is_public = true 
        AND status IN ('PUBLISHED', 'REGISTRATION_OPEN', 'ONGOING')
        ORDER BY start_time ASC
        LIMIT $1 OFFSET $2
      `

      const result = await query(sql, [limit, offset])
      return result.rows.map((row: any) => this.mapRowToEvent(row))
    } catch (error) {
      logger.error('Failed to find public events', { error })
      throw error
    }
  }

  /**
   * Get events by type
   */
  async findByType(type: Event['type'], limit: number = 20, offset: number = 0): Promise<Event[]> {
    try {
      const sql = `
        SELECT * FROM events 
        WHERE type = $1 
        AND is_public = true
        ORDER BY start_time DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [type, limit, offset])
      return result.rows.map((row: any) => this.mapRowToEvent(row))
    } catch (error) {
      logger.error('Failed to find events by type', { type, error })
      throw error
    }
  }

  /**
   * Search events
   */
  async search(searchTerm: string, limit: number = 20, offset: number = 0): Promise<Event[]> {
    try {
      const sql = `
        SELECT * FROM events 
        WHERE is_public = true 
        AND (
          name ILIKE $1 OR 
          description ILIKE $1 OR 
          location_name ILIKE $1
        )
        ORDER BY start_time ASC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [`%${searchTerm}%`, limit, offset])
      return result.rows.map((row: any) => this.mapRowToEvent(row))
    } catch (error) {
      logger.error('Failed to search events', { searchTerm, error })
      throw error
    }
  }

  /**
   * Get events by date range
   */
  async findByDateRange(startDate: Date, endDate: Date, limit: number = 20, offset: number = 0): Promise<Event[]> {
    try {
      const sql = `
        SELECT * FROM events 
        WHERE is_public = true 
        AND start_time >= $1 
        AND start_time <= $2
        ORDER BY start_time ASC
        LIMIT $3 OFFSET $4
      `

      const result = await query(sql, [startDate, endDate, limit, offset])
      return result.rows.map((row: any) => this.mapRowToEvent(row))
    } catch (error) {
      logger.error('Failed to find events by date range', { startDate, endDate, error })
      throw error
    }
  }

  /**
   * Update participant count
   */
  async updateParticipantCount(eventId: string): Promise<void> {
    try {
      const sql = `
        UPDATE events 
        SET current_participants = (
          SELECT COUNT(*) 
          FROM participants 
          WHERE event_id = $1 
          AND registration_status = 'APPROVED'
        )
        WHERE id = $1
      `

      await query(sql, [eventId])
    } catch (error) {
      logger.error('Failed to update participant count', { eventId, error })
      throw error
    }
  }

  /**
   * Check if user can register for event
   */
  async canRegister(eventId: string, userId: string): Promise<boolean> {
    try {
      const sql = `
        SELECT 
          e.current_participants < e.max_participants as has_capacity,
          e.status = 'REGISTRATION_OPEN' as registration_open,
          p.id is null as not_yet_registered
        FROM events e
        LEFT JOIN participants p ON e.id = p.event_id AND p.user_id = $2
        WHERE e.id = $1
      `

      const result = await query(sql, [eventId, userId])
      
      if (result.rows.length === 0) {
        return false
      }

      const { has_capacity, registration_open, not_yet_registered } = result.rows[0]
      return has_capacity && registration_open && not_yet_registered
    } catch (error) {
      logger.error('Failed to check registration eligibility', { eventId, userId, error })
      throw error
    }
  }

  /**
   * Get upcoming events for user
   */
  async findUpcomingForUser(userId: string, limit: number = 10): Promise<Event[]> {
    try {
      const sql = `
        SELECT DISTINCT e.* 
        FROM events e
        LEFT JOIN participants p ON e.id = p.event_id AND p.user_id = $1
        WHERE (
          (e.is_public = true) OR 
          (p.id IS NOT NULL)
        )
        AND e.start_time > CURRENT_TIMESTAMP
        AND e.status IN ('PUBLISHED', 'REGISTRATION_OPEN', 'ONGOING')
        ORDER BY e.start_time ASC
        LIMIT $2
      `

      const result = await query(sql, [userId, limit])
      return result.rows.map((row: any) => this.mapRowToEvent(row))
    } catch (error) {
      logger.error('Failed to find upcoming events for user', { userId, error })
      throw error
    }
  }

  /**
   * Map database row to Event object
   */
  private mapRowToEvent(row: any): Event {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      organizer_id: row.organizer_id,
      track_id: row.track_id,
      custom_route_id: row.custom_route_id,
      start_time: row.start_time,
      end_time: row.end_time,
      registration_open_time: row.registration_open_time,
      registration_close_time: row.registration_close_time,
      max_participants: row.max_participants,
      current_participants: row.current_participants,
      status: row.status,
      rules: row.rules || {},
      settings: row.settings || {},
      location_name: row.location_name,
      location_address: row.location_address,
      location_lat: row.location_lat,
      location_lng: row.location_lng,
      waiver_required: row.waiver_required,
      waiver_text: row.waiver_text,
      is_public: row.is_public,
      featured_image_url: row.featured_image_url,
      tags: row.tags || [],
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const eventRepository = new EventRepository()
