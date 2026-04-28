/**
 * Enforcement Zone Repository
 * 
 * Handles all database operations for enforcement zone management including
 * speed zones, speed traps, patrol routes, and other enforcement mechanisms
 * for custom races.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface EnforcementZone {
  id: string
  route_id: string
  name: string
  description?: string
  geometry: string // GeoJSON
  zone_type: 'SPEED_ZONE' | 'SPEED_TRAP' | 'RADAR_ZONE' | 'PATROL_ROUTE' | 'CAMERA_ZONE' | 'HEAT_ZONE'
  speed_limit_kmh?: number
  detection_radius_meters: number
  trigger_direction?: number
  patrol_speed_kmh?: number
  patrol_route?: string // GeoJSON
  penalty_type: 'TIME' | 'POINTS' | 'WARNING' | 'NONE'
  penalty_amount: number
  warning_threshold_kmh?: number
  detection_sensitivity: 'LOW' | 'MEDIUM' | 'HIGH'
  gps_tolerance_meters: number
  active_hours_start?: string
  active_hours_end?: string
  color: string
  icon_url?: string
  is_visible: boolean
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface CreateEnforcementZoneInput {
  route_id: string
  name: string
  description?: string
  geometry: string // GeoJSON
  zone_type: EnforcementZone['zone_type']
  speed_limit_kmh?: number
  detection_radius_meters?: number
  trigger_direction?: number
  patrol_speed_kmh?: number
  patrol_route?: string // GeoJSON
  penalty_type?: EnforcementZone['penalty_type']
  penalty_amount?: number
  warning_threshold_kmh?: number
  detection_sensitivity?: EnforcementZone['detection_sensitivity']
  gps_tolerance_meters?: number
  active_hours_start?: string
  active_hours_end?: string
  color?: string
  icon_url?: string
  is_visible?: boolean
  notes?: string
}

export interface UpdateEnforcementZoneInput {
  name?: string
  description?: string
  geometry?: string // GeoJSON
  zone_type?: EnforcementZone['zone_type']
  speed_limit_kmh?: number
  detection_radius_meters?: number
  trigger_direction?: number
  patrol_speed_kmh?: number
  patrol_route?: string // GeoJSON
  penalty_type?: EnforcementZone['penalty_type']
  penalty_amount?: number
  warning_threshold_kmh?: number
  detection_sensitivity?: EnforcementZone['detection_sensitivity']
  gps_tolerance_meters?: number
  active_hours_start?: string
  active_hours_end?: string
  color?: string
  icon_url?: string
  is_visible?: boolean
  notes?: string
}

export class EnforcementZoneRepository {
  /**
   * Create a new enforcement zone
   */
  async create(input: CreateEnforcementZoneInput): Promise<EnforcementZone> {
    logger.info('Creating enforcement zone', { routeId: input.route_id, name: input.name, type: input.zone_type })

    try {
      const sql = `
        INSERT INTO enforcement_zones (
          route_id, name, description, geometry, zone_type, speed_limit_kmh,
          detection_radius_meters, trigger_direction, patrol_speed_kmh, patrol_route,
          penalty_type, penalty_amount, warning_threshold_kmh, detection_sensitivity,
          gps_tolerance_meters, active_hours_start, active_hours_end, color, icon_url, is_visible, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING *
      `

      const values = [
        input.route_id,
        input.name,
        input.description || null,
        input.geometry,
        input.zone_type,
        input.speed_limit_kmh || null,
        input.detection_radius_meters || 50,
        input.trigger_direction || null,
        input.patrol_speed_kmh || null,
        input.patrol_route || null,
        input.penalty_type || 'TIME',
        input.penalty_amount || 0,
        input.warning_threshold_kmh || null,
        input.detection_sensitivity || 'MEDIUM',
        input.gps_tolerance_meters || 15,
        input.active_hours_start || null,
        input.active_hours_end || null,
        input.color || '#FF0000',
        input.icon_url || null,
        input.is_visible !== false,
        input.notes || null
      ]

      const result = await query(sql, values)
      const zone = result.rows[0]

      logger.info('Enforcement zone created successfully', { zoneId: zone.id })
      return this.mapRowToEnforcementZone(zone)
    } catch (error) {
      logger.error('Failed to create enforcement zone', { input, error })
      throw error
    }
  }

  /**
   * Find enforcement zone by ID
   */
  async findById(id: string): Promise<EnforcementZone | null> {
    try {
      const sql = 'SELECT * FROM enforcement_zones WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToEnforcementZone(result.rows[0])
    } catch (error) {
      logger.error('Failed to find enforcement zone by ID', { id, error })
      throw error
    }
  }

  /**
   * Update enforcement zone
   */
  async update(id: string, input: UpdateEnforcementZoneInput): Promise<EnforcementZone | null> {
    logger.info('Updating enforcement zone', { zoneId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`)
          values.push(value)
          paramIndex++
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update')
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE enforcement_zones 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Enforcement zone updated successfully', { zoneId: id })
      return this.mapRowToEnforcementZone(result.rows[0])
    } catch (error) {
      logger.error('Failed to update enforcement zone', { id, error })
      throw error
    }
  }

  /**
   * Delete enforcement zone
   */
  async delete(id: string): Promise<boolean> {
    logger.info('Deleting enforcement zone', { zoneId: id })

    try {
      const sql = 'DELETE FROM enforcement_zones WHERE id = $1'
      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Enforcement zone deleted successfully', { zoneId: id })
      return true
    } catch (error) {
      logger.error('Failed to delete enforcement zone', { id, error })
      throw error
    }
  }

  /**
   * Get enforcement zones by route
   */
  async findByRoute(routeId: string): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 
        ORDER BY created_at ASC
      `
      const result = await query(sql, [routeId])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find enforcement zones by route', { routeId, error })
      throw error
    }
  }

  /**
   * Get visible enforcement zones by route
   */
  async findVisibleByRoute(routeId: string): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 AND is_visible = true 
        ORDER BY created_at ASC
      `
      const result = await query(sql, [routeId])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find visible enforcement zones by route', { routeId, error })
      throw error
    }
  }

  /**
   * Get enforcement zones by type
   */
  async findByType(routeId: string, zoneType: EnforcementZone['zone_type']): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 AND zone_type = $2 
        ORDER BY created_at ASC
      `
      const result = await query(sql, [routeId, zoneType])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find enforcement zones by type', { routeId, zoneType, error })
      throw error
    }
  }

  /**
   * Get enforcement zones by type for all routes
   */
  async findByTypeGlobal(zoneType: EnforcementZone['zone_type']): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT ez.*, cr.name as route_name, cr.created_by as route_creator
        FROM enforcement_zones ez
        JOIN custom_routes cr ON ez.route_id = cr.id
        WHERE ez.zone_type = $1 AND cr.is_public = true
        ORDER BY ez.created_at DESC
      `
      const result = await query(sql, [zoneType])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find enforcement zones by type globally', { zoneType, error })
      throw error
    }
  }

  /**
   * Get enforcement zones with speed limits
   */
  async findWithSpeedLimits(routeId: string): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 AND speed_limit_kmh IS NOT NULL 
        ORDER BY speed_limit_kmh ASC
      `
      const result = await query(sql, [routeId])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find enforcement zones with speed limits', { routeId, error })
      throw error
    }
  }

  /**
   * Get enforcement zones by penalty type
   */
  async findByPenaltyType(routeId: string, penaltyType: EnforcementZone['penalty_type']): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 AND penalty_type = $2 
        ORDER BY created_at ASC
      `
      const result = await query(sql, [routeId, penaltyType])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find enforcement zones by penalty type', { routeId, penaltyType, error })
      throw error
    }
  }

  /**
   * Get enforcement zone statistics for a route
   */
  async getStats(routeId: string): Promise<{
    total: number
    visible: number
    byType: Record<string, number>
    byPenaltyType: Record<string, number>
    withSpeedLimits: number
    averageDetectionRadius: number
    averagePenaltyAmount: number
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_visible = true THEN 1 END) as visible,
          COUNT(CASE WHEN zone_type = 'SPEED_ZONE' THEN 1 END) as speed_zone_count,
          COUNT(CASE WHEN zone_type = 'SPEED_TRAP' THEN 1 END) as speed_trap_count,
          COUNT(CASE WHEN zone_type = 'RADAR_ZONE' THEN 1 END) as radar_zone_count,
          COUNT(CASE WHEN zone_type = 'PATROL_ROUTE' THEN 1 END) as patrol_route_count,
          COUNT(CASE WHEN zone_type = 'CAMERA_ZONE' THEN 1 END) as camera_zone_count,
          COUNT(CASE WHEN zone_type = 'HEAT_ZONE' THEN 1 END) as heat_zone_count,
          COUNT(CASE WHEN penalty_type = 'TIME' THEN 1 END) as time_penalty_count,
          COUNT(CASE WHEN penalty_type = 'POINTS' THEN 1 END) as points_penalty_count,
          COUNT(CASE WHEN penalty_type = 'WARNING' THEN 1 END) as warning_penalty_count,
          COUNT(CASE WHEN penalty_type = 'NONE' THEN 1 END) as none_penalty_count,
          COUNT(CASE WHEN speed_limit_kmh IS NOT NULL THEN 1 END) as with_speed_limits,
          AVG(detection_radius_meters) as average_detection_radius,
          AVG(penalty_amount) as average_penalty_amount
        FROM enforcement_zones 
        WHERE route_id = $1
      `

      const result = await query(sql, [routeId])
      const row = result.rows[0]

      return {
        total: parseInt(row.total),
        visible: parseInt(row.visible),
        byType: {
          SPEED_ZONE: parseInt(row.speed_zone_count),
          SPEED_TRAP: parseInt(row.speed_trap_count),
          RADAR_ZONE: parseInt(row.radar_zone_count),
          PATROL_ROUTE: parseInt(row.patrol_route_count),
          CAMERA_ZONE: parseInt(row.camera_zone_count),
          HEAT_ZONE: parseInt(row.heat_zone_count)
        },
        byPenaltyType: {
          TIME: parseInt(row.time_penalty_count),
          POINTS: parseInt(row.points_penalty_count),
          WARNING: parseInt(row.warning_penalty_count),
          NONE: parseInt(row.none_penalty_count)
        },
        withSpeedLimits: parseInt(row.with_speed_limits),
        averageDetectionRadius: parseFloat(row.average_detection_radius) || 0,
        averagePenaltyAmount: parseFloat(row.average_penalty_amount) || 0
      }
    } catch (error) {
      logger.error('Failed to get enforcement zone statistics', { routeId, error })
      throw error
    }
  }

  /**
   * Check if point is within enforcement zone
   */
  async isPointInZone(zoneId: string, lat: number, lng: number): Promise<boolean> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE id = $1
      `
      const result = await query(sql, [zoneId])
      
      if (result.rows.length === 0) {
        return false
      }

      const zone = result.rows[0]
      const distance = query(`
        SELECT ST_Distance(
          ST_Point($1, $2)::geography,
          geometry::geography
        ) as distance_meters
        FROM enforcement_zones 
        WHERE id = $3
      `, [lng, lat, zoneId])

      const distanceResult = await distance
      const distanceMeters = parseFloat(distanceResult.rows[0].distance_meters)

      return distanceMeters <= zone.detection_radius_meters
    } catch (error) {
      logger.error('Failed to check point in enforcement zone', { zoneId, lat, lng, error })
      return false
    }
  }

  /**
   * Find zones that intersect with a point
   */
  async findIntersectingZones(routeId: string, lat: number, lng: number): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 
        AND ST_DWithin(
          ST_Point($2, $3)::geography,
          geometry::geography,
          detection_radius_meters
        )
        ORDER BY created_at ASC
      `
      const result = await query(sql, [routeId, lng, lat])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find intersecting zones', { routeId, lat, lng, error })
      throw error
    }
  }

  /**
   * Get zones active at current time
   */
  async findActiveZones(routeId: string): Promise<EnforcementZone[]> {
    try {
      const currentTime = new Date().toTimeString().slice(0, 5) // HH:MM format
      
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 
        AND (
          active_hours_start IS NULL 
          OR active_hours_end IS NULL 
          OR (
            active_hours_start <= $2 
            AND active_hours_end >= $2
          )
        )
        ORDER BY created_at ASC
      `
      const result = await query(sql, [routeId, currentTime])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find active zones', { routeId, error })
      throw error
    }
  }

  /**
   * Get patrol routes
   */
  async findPatrolRoutes(routeId: string): Promise<EnforcementZone[]> {
    try {
      const sql = `
        SELECT * FROM enforcement_zones 
        WHERE route_id = $1 AND zone_type = 'PATROL_ROUTE' 
        ORDER BY created_at ASC
      `
      const result = await query(sql, [routeId])
      return result.rows.map((row: any) => this.mapRowToEnforcementZone(row))
    } catch (error) {
      logger.error('Failed to find patrol routes', { routeId, error })
      throw error
    }
  }

  /**
   * Map database row to EnforcementZone object
   */
  private mapRowToEnforcementZone(row: any): EnforcementZone {
    return {
      id: row.id,
      route_id: row.route_id,
      name: row.name,
      description: row.description,
      geometry: row.geometry,
      zone_type: row.zone_type,
      speed_limit_kmh: row.speed_limit_kmh,
      detection_radius_meters: row.detection_radius_meters,
      trigger_direction: row.trigger_direction,
      patrol_speed_kmh: row.patrol_speed_kmh,
      patrol_route: row.patrol_route,
      penalty_type: row.penalty_type,
      penalty_amount: row.penalty_amount,
      warning_threshold_kmh: row.warning_threshold_kmh,
      detection_sensitivity: row.detection_sensitivity,
      gps_tolerance_meters: row.gps_tolerance_meters,
      active_hours_start: row.active_hours_start,
      active_hours_end: row.active_hours_end,
      color: row.color,
      icon_url: row.icon_url,
      is_visible: row.is_visible,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const enforcementZoneRepository = new EnforcementZoneRepository()
