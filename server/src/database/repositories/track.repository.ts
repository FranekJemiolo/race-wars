/**
 * Track Repository
 * 
 * Handles all database operations for track management including
 * predefined circuits with spatial data.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface Track {
  id: string
  name: string
  short_name?: string
  description?: string
  location_name?: string
  location_country?: string
  location_lat?: number
  location_lng?: number
  length_meters?: number
  track_type: 'circuit' | 'street_circuit' | 'oval' | 'road_course' | 'rally'
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  centerline?: string // GeoJSON
  boundaries?: string // GeoJSON
  start_finish_line?: string // GeoJSON
  pit_lane?: string // GeoJSON
  marshal_zones?: string // GeoJSON
  num_corners?: number
  max_speed_kmh?: number
  typical_lap_time_seconds?: number
  sector_splits: any[]
  image_url?: string
  elevation_profile_url?: string
  is_active: boolean
  is_featured: boolean
  tags: string[]
  created_by?: string
  created_at: Date
  updated_at: Date
}

export interface CreateTrackInput {
  name: string
  short_name?: string
  description?: string
  location_name?: string
  location_country?: string
  location_lat?: number
  location_lng?: number
  length_meters?: number
  track_type?: Track['track_type']
  difficulty_level?: Track['difficulty_level']
  centerline?: string // GeoJSON
  boundaries?: string // GeoJSON
  start_finish_line?: string // GeoJSON
  pit_lane?: string // GeoJSON
  marshal_zones?: string // GeoJSON
  num_corners?: number
  max_speed_kmh?: number
  typical_lap_time_seconds?: number
  sector_splits?: any[]
  image_url?: string
  elevation_profile_url?: string
  tags?: string[]
  created_by?: string
}

export interface UpdateTrackInput {
  name?: string
  short_name?: string
  description?: string
  location_name?: string
  location_country?: string
  location_lat?: number
  location_lng?: number
  length_meters?: number
  track_type?: Track['track_type']
  difficulty_level?: Track['difficulty_level']
  centerline?: string // GeoJSON
  boundaries?: string // GeoJSON
  start_finish_line?: string // GeoJSON
  pit_lane?: string // GeoJSON
  marshal_zones?: string // GeoJSON
  num_corners?: number
  max_speed_kmh?: number
  typical_lap_time_seconds?: number
  sector_splits?: any[]
  image_url?: string
  elevation_profile_url?: string
  is_active?: boolean
  is_featured?: boolean
  tags?: string[]
}

export class TrackRepository {
  /**
   * Create a new track
   */
  async create(input: CreateTrackInput): Promise<Track> {
    logger.info('Creating new track', { name: input.name, createdBy: input.created_by })

    try {
      const sql = `
        INSERT INTO tracks (
          name, short_name, description, location_name, location_country,
          location_lat, location_lng, length_meters, track_type, difficulty_level,
          centerline, boundaries, start_finish_line, pit_lane, marshal_zones,
          num_corners, max_speed_kmh, typical_lap_time_seconds, sector_splits,
          image_url, elevation_profile_url, tags, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
        RETURNING *
      `

      const values = [
        input.name,
        input.short_name || null,
        input.description || null,
        input.location_name || null,
        input.location_country || null,
        input.location_lat || null,
        input.location_lng || null,
        input.length_meters || null,
        input.track_type || 'circuit',
        input.difficulty_level || 'intermediate',
        input.centerline || null,
        input.boundaries || null,
        input.start_finish_line || null,
        input.pit_lane || null,
        input.marshal_zones || null,
        input.num_corners || null,
        input.max_speed_kmh || null,
        input.typical_lap_time_seconds || null,
        JSON.stringify(input.sector_splits || []),
        input.image_url || null,
        input.elevation_profile_url || null,
        input.tags || [],
        input.created_by || null
      ]

      const result = await query(sql, values)
      const track = result.rows[0]

      logger.info('Track created successfully', { trackId: track.id, name: track.name })
      return this.mapRowToTrack(track)
    } catch (error) {
      logger.error('Failed to create track', { name: input.name, error })
      throw error
    }
  }

  /**
   * Find track by ID
   */
  async findById(id: string): Promise<Track | null> {
    try {
      const sql = 'SELECT * FROM tracks WHERE id = $1 AND is_active = true'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToTrack(result.rows[0])
    } catch (error) {
      logger.error('Failed to find track by ID', { id, error })
      throw error
    }
  }

  /**
   * Update track
   */
  async update(id: string, input: UpdateTrackInput): Promise<Track | null> {
    logger.info('Updating track', { trackId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'sector_splits') {
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
        UPDATE tracks 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Track updated successfully', { trackId: id })
      return this.mapRowToTrack(result.rows[0])
    } catch (error) {
      logger.error('Failed to update track', { id, error })
      throw error
    }
  }

  /**
   * Soft delete track (deactivate)
   */
  async deactivate(id: string): Promise<boolean> {
    logger.info('Deactivating track', { trackId: id })

    try {
      const sql = `
        UPDATE tracks 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `

      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Track deactivated successfully', { trackId: id })
      return true
    } catch (error) {
      logger.error('Failed to deactivate track', { id, error })
      throw error
    }
  }

  /**
   * Get all active tracks
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<Track[]> {
    try {
      const sql = `
        SELECT * FROM tracks 
        WHERE is_active = true 
        ORDER BY name ASC
        LIMIT $1 OFFSET $2
      `

      const result = await query(sql, [limit, offset])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to find all tracks', { error })
      throw error
    }
  }

  /**
   * Get featured tracks
   */
  async findFeatured(limit: number = 10): Promise<Track[]> {
    try {
      const sql = `
        SELECT * FROM tracks 
        WHERE is_active = true AND is_featured = true 
        ORDER BY name ASC
        LIMIT $1
      `

      const result = await query(sql, [limit])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to find featured tracks', { error })
      throw error
    }
  }

  /**
   * Search tracks
   */
  async search(searchTerm: string, limit: number = 20, offset: number = 0): Promise<Track[]> {
    try {
      const sql = `
        SELECT * FROM tracks 
        WHERE is_active = true 
        AND (
          name ILIKE $1 OR 
          description ILIKE $1 OR 
          location_name ILIKE $1 OR 
          location_country ILIKE $1
        )
        ORDER BY name ASC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [`%${searchTerm}%`, limit, offset])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to search tracks', { searchTerm, error })
      throw error
    }
  }

  /**
   * Get tracks by type
   */
  async findByType(type: Track['track_type'], limit: number = 20, offset: number = 0): Promise<Track[]> {
    try {
      const sql = `
        SELECT * FROM tracks 
        WHERE is_active = true AND track_type = $1 
        ORDER BY name ASC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [type, limit, offset])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to find tracks by type', { type, error })
      throw error
    }
  }

  /**
   * Get tracks by difficulty level
   */
  async findByDifficulty(level: Track['difficulty_level'], limit: number = 20, offset: number = 0): Promise<Track[]> {
    try {
      const sql = `
        SELECT * FROM tracks 
        WHERE is_active = true AND difficulty_level = $1 
        ORDER BY name ASC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [level, limit, offset])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to find tracks by difficulty', { level, error })
      throw error
    }
  }

  /**
   * Get tracks by country
   */
  async findByCountry(country: string, limit: number = 20, offset: number = 0): Promise<Track[]> {
    try {
      const sql = `
        SELECT * FROM tracks 
        WHERE is_active = true AND location_country = $1 
        ORDER BY name ASC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [country, limit, offset])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to find tracks by country', { country, error })
      throw error
    }
  }

  /**
   * Find tracks near a location
   */
  async findNearLocation(lat: number, lng: number, radiusKm: number = 100, limit: number = 20): Promise<Track[]> {
    try {
      const sql = `
        SELECT *, 
          ST_Distance(ST_Point($1, $2)::geography, ST_Point(location_lng, location_lat)::geography) as distance_meters
        FROM tracks 
        WHERE is_active = true 
        AND location_lat IS NOT NULL 
        AND location_lng IS NOT NULL
        AND ST_DWithin(
          ST_Point($1, $2)::geography, 
          ST_Point(location_lng, location_lat)::geography, 
          $3
        )
        ORDER BY distance_meters ASC
        LIMIT $4
      `

      const result = await query(sql, [lng, lat, radiusKm * 1000, limit])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to find tracks near location', { lat, lng, radiusKm, error })
      throw error
    }
  }

  /**
   * Get tracks created by user
   */
  async findByCreator(creatorId: string, limit: number = 20, offset: number = 0): Promise<Track[]> {
    try {
      const sql = `
        SELECT * FROM tracks 
        WHERE created_by = $1 
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [creatorId, limit, offset])
      return result.rows.map((row: any) => this.mapRowToTrack(row))
    } catch (error) {
      logger.error('Failed to find tracks by creator', { creatorId, error })
      throw error
    }
  }

  /**
   * Map database row to Track object
   */
  private mapRowToTrack(row: any): Track {
    return {
      id: row.id,
      name: row.name,
      short_name: row.short_name,
      description: row.description,
      location_name: row.location_name,
      location_country: row.location_country,
      location_lat: row.location_lat,
      location_lng: row.location_lng,
      length_meters: row.length_meters,
      track_type: row.track_type,
      difficulty_level: row.difficulty_level,
      centerline: row.centerline,
      boundaries: row.boundaries,
      start_finish_line: row.start_finish_line,
      pit_lane: row.pit_lane,
      marshal_zones: row.marshal_zones,
      num_corners: row.num_corners,
      max_speed_kmh: row.max_speed_kmh,
      typical_lap_time_seconds: row.typical_lap_time_seconds,
      sector_splits: row.sector_splits || [],
      image_url: row.image_url,
      elevation_profile_url: row.elevation_profile_url,
      is_active: row.is_active,
      is_featured: row.is_featured,
      tags: row.tags || [],
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const trackRepository = new TrackRepository()
