/**
 * Custom Route Repository
 * 
 * Handles all database operations for custom race routes including
 * route creation, validation, and route management for the "Need for Speed mode".
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface CustomRoute {
  id: string
  name: string
  description?: string
  route_type: 'CIRCUIT' | 'POINT_TO_POINT' | 'LOOP' | 'SCATTERED'
  centerline: string // GeoJSON
  boundaries?: string // GeoJSON
  start_finish_point?: string // GeoJSON
  length_meters?: number
  estimated_time_minutes?: number
  speed_limit_kmh?: number
  gps_tolerance_meters: number
  configuration: Record<string, any>
  image_url?: string
  elevation_profile_url?: string
  is_public: boolean
  is_featured: boolean
  tags: string[]
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface CreateCustomRouteInput {
  name: string
  description?: string
  route_type: CustomRoute['route_type']
  centerline: string // GeoJSON
  boundaries?: string // GeoJSON
  start_finish_point?: string // GeoJSON
  length_meters?: number
  estimated_time_minutes?: number
  speed_limit_kmh?: number
  gps_tolerance_meters?: number
  configuration?: Record<string, any>
  image_url?: string
  elevation_profile_url?: string
  tags?: string[]
  created_by: string
}

export interface UpdateCustomRouteInput {
  name?: string
  description?: string
  route_type?: CustomRoute['route_type']
  centerline?: string // GeoJSON
  boundaries?: string // GeoJSON
  start_finish_point?: string // GeoJSON
  length_meters?: number
  estimated_time_minutes?: number
  speed_limit_kmh?: number
  gps_tolerance_meters?: number
  configuration?: Record<string, any>
  image_url?: string
  elevation_profile_url?: string
  is_public?: boolean
  is_featured?: boolean
  tags?: string[]
}

export class CustomRouteRepository {
  /**
   * Create a new custom route
   */
  async create(input: CreateCustomRouteInput): Promise<CustomRoute> {
    logger.info('Creating custom route', { name: input.name, createdBy: input.created_by })

    try {
      const sql = `
        INSERT INTO custom_routes (
          name, description, route_type, centerline, boundaries, start_finish_point,
          length_meters, estimated_time_minutes, speed_limit_kmh, gps_tolerance_meters,
          configuration, image_url, elevation_profile_url, tags, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING *
      `

      const values = [
        input.name,
        input.description || null,
        input.route_type,
        input.centerline,
        input.boundaries || null,
        input.start_finish_point || null,
        input.length_meters || null,
        input.estimated_time_minutes || null,
        input.speed_limit_kmh || null,
        input.gps_tolerance_meters || 15,
        JSON.stringify(input.configuration || {}),
        input.image_url || null,
        input.elevation_profile_url || null,
        input.tags || [],
        input.created_by
      ]

      const result = await query(sql, values)
      const route = result.rows[0]

      logger.info('Custom route created successfully', { routeId: route.id, name: route.name })
      return this.mapRowToCustomRoute(route)
    } catch (error) {
      logger.error('Failed to create custom route', { input, error })
      throw error
    }
  }

  /**
   * Find custom route by ID
   */
  async findById(id: string): Promise<CustomRoute | null> {
    try {
      const sql = 'SELECT * FROM custom_routes WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCustomRoute(result.rows[0])
    } catch (error) {
      logger.error('Failed to find custom route by ID', { id, error })
      throw error
    }
  }

  /**
   * Update custom route
   */
  async update(id: string, input: UpdateCustomRouteInput): Promise<CustomRoute | null> {
    logger.info('Updating custom route', { routeId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'configuration' || key === 'tags') {
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
        UPDATE custom_routes 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Custom route updated successfully', { routeId: id })
      return this.mapRowToCustomRoute(result.rows[0])
    } catch (error) {
      logger.error('Failed to update custom route', { id, error })
      throw error
    }
  }

  /**
   * Delete custom route
   */
  async delete(id: string): Promise<boolean> {
    logger.info('Deleting custom route', { routeId: id })

    try {
      const sql = 'DELETE FROM custom_routes WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Custom route deleted successfully', { routeId: id })
      return true
    } catch (error) {
      logger.error('Failed to delete custom route', { id, error })
      throw error
    }
  }

  /**
   * Get all custom routes
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `

      const result = await query(sql, [limit, offset])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find all custom routes', { error })
      throw error
    }
  }

  /**
   * Get public custom routes
   */
  async findPublic(limit: number = 50, offset: number = 0): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        WHERE is_public = true 
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `

      const result = await query(sql, [limit, offset])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find public custom routes', { error })
      throw error
    }
  }

  /**
   * Get featured custom routes
   */
  async findFeatured(limit: number = 10): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        WHERE is_public = true AND is_featured = true 
        ORDER BY created_at DESC
        LIMIT $1
      `

      const result = await query(sql, [limit])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find featured custom routes', { error })
      throw error
    }
  }

  /**
   * Search custom routes
   */
  async search(query: string, limit: number = 20, offset: number = 0): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        WHERE is_public = true 
        AND (
          name ILIKE $1 OR 
          description ILIKE $1
        )
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [`%${query}%`, limit, offset])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to search custom routes', { query, error })
      throw error
    }
  }

  /**
   * Get custom routes by type
   */
  async findByType(type: CustomRoute['route_type'], limit: number = 20, offset: number = 0): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        WHERE route_type = $1 AND is_public = true 
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [type, limit, offset])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find custom routes by type', { type, error })
      throw error
    }
  }

  /**
   * Get custom routes by creator
   */
  async findByCreator(createdBy: string, limit: number = 20, offset: number = 0): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        WHERE created_by = $1 
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [createdBy, limit, offset])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find custom routes by creator', { createdBy, error })
      throw error
    }
  }

  /**
   * Get custom routes by tags
   */
  async findByTags(tags: string[], limit: number = 20, offset: number = 0): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        WHERE is_public = true 
        AND tags && $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [tags, limit, offset])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find custom routes by tags', { tags, error })
      throw error
    }
  }

  /**
   * Get custom routes by length range
   */
  async findByLengthRange(minLength: number, maxLength: number, limit: number = 20, offset: number = 0): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT * FROM custom_routes 
        WHERE is_public = true 
        AND length_meters >= $1 
        AND length_meters <= $2
        ORDER BY length_meters ASC
        LIMIT $3 OFFSET $4
      `

      const result = await query(sql, [minLength, maxLength, limit, offset])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find custom routes by length range', { minLength, maxLength, error })
      throw error
    }
  }

  /**
   * Get custom routes near a location
   */
  async findNearLocation(lat: number, lng: number, radiusKm: number = 100, limit: number = 20): Promise<CustomRoute[]> {
    try {
      const sql = `
        SELECT *, 
          ST_Distance(ST_Point($1, $2)::geography, ST_Point(start_finish_lng, start_finish_lat)::geography) as distance_meters
        FROM custom_routes 
        WHERE is_public = true 
        AND start_finish_lat IS NOT NULL 
        AND start_finish_lng IS NOT NULL
        AND ST_DWithin(
          ST_Point($1, $2)::geography, 
          ST_Point(start_finish_lng, start_finish_lat)::geography, 
          $3
        )
        ORDER BY distance_meters ASC
        LIMIT $4
      `

      const result = await query(sql, [lng, lat, radiusKm * 1000, limit])
      return result.rows.map((row: any) => this.mapRowToCustomRoute(row))
    } catch (error) {
      logger.error('Failed to find custom routes near location', { lat, lng, radiusKm, error })
      throw error
    }
  }

  /**
   * Get custom route statistics
   */
  async getStats(createdBy?: string): Promise<{
    total: number
    public: number
    featured: number
    byType: Record<string, number>
    averageLength: number
    averageTime: number
  }> {
    try {
      let sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_public = true THEN 1 END) as public,
          COUNT(CASE WHEN is_featured = true THEN 1 END) as featured,
          COUNT(CASE WHEN route_type = 'CIRCUIT' THEN 1 END) as circuit_count,
          COUNT(CASE WHEN route_type = 'POINT_TO_POINT' THEN 1 END) as point_to_point_count,
          COUNT(CASE WHEN route_type = 'LOOP' THEN 1 END) as loop_count,
          COUNT(CASE WHEN route_type = 'SCATTERED' THEN 1 END) as scattered_count,
          AVG(length_meters) as average_length,
          AVG(estimated_time_minutes) as average_time
        FROM custom_routes
      `

      let params: any[] = []

      if (createdBy) {
        sql += ' WHERE created_by = $1'
        params.push(createdBy)
      }

      const result = await query(sql, params)
      const row = result.rows[0]

      return {
        total: parseInt(row.total),
        public: parseInt(row.public),
        featured: parseInt(row.featured),
        byType: {
          CIRCUIT: parseInt(row.circuit_count),
          POINT_TO_POINT: parseInt(row.point_to_point_count),
          LOOP: parseInt(row.loop_count),
          SCATTERED: parseInt(row.scattered_count)
        },
        averageLength: parseFloat(row.average_length) || 0,
        averageTime: parseFloat(row.average_time) || 0
      }
    } catch (error) {
      logger.error('Failed to get custom route statistics', { createdBy, error })
      throw error
    }
  }

  /**
   * Check if route name is available
   */
  async isNameAvailable(name: string, excludeId?: string): Promise<boolean> {
    try {
      let sql = 'SELECT COUNT(*) as count FROM custom_routes WHERE name = $1'
      let params = [name]

      if (excludeId) {
        sql += ' AND id != $2'
        params.push(excludeId)
      }

      const result = await query(sql, params)
      return parseInt(result.rows[0].count) === 0
    } catch (error) {
      logger.error('Failed to check name availability', { name, excludeId, error })
      throw error
    }
  }

  /**
   * Map database row to CustomRoute object
   */
  private mapRowToCustomRoute(row: any): CustomRoute {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      route_type: row.route_type,
      centerline: row.centerline,
      boundaries: row.boundaries,
      start_finish_point: row.start_finish_point,
      length_meters: row.length_meters,
      estimated_time_minutes: row.estimated_time_minutes,
      speed_limit_kmh: row.speed_limit_kmh,
      gps_tolerance_meters: row.gps_tolerance_meters,
      configuration: row.configuration || {},
      image_url: row.image_url,
      elevation_profile_url: row.elevation_profile_url,
      is_public: row.is_public,
      is_featured: row.is_featured,
      tags: row.tags || [],
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const customRouteRepository = new CustomRouteRepository()
