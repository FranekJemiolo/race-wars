/**
 * Checkpoint Repository
 * 
 * Handles all database operations for checkpoint management including
 * checkpoint creation, validation, and checkpoint tracking for custom routes.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

export interface Checkpoint {
  id: string
  route_id: string
  name: string
  description?: string
  position: { lat: number; lng: number }
  order_index: number
  radius_meters: number
  checkpoint_type: 'STANDARD' | 'START' | 'FINISH' | 'TIMING' | 'OPTIONAL'
  is_mandatory: boolean
  min_speed_kmh?: number
  max_speed_kmh?: number
  time_limit_seconds?: number
  points: number
  trigger_direction?: number
  trigger_width_meters: number
  icon_url?: string
  notes?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateCheckpointInput {
  route_id: string
  name: string
  description?: string
  position: { lat: number; lng: number }
  order_index: number
  radius_meters?: number
  checkpoint_type?: Checkpoint['checkpoint_type']
  is_mandatory?: boolean
  min_speed_kmh?: number
  max_speed_kmh?: number
  time_limit_seconds?: number
  points?: number
  trigger_direction?: number
  trigger_width_meters?: number
  icon_url?: string
  notes?: string
}

export interface UpdateCheckpointInput {
  name?: string
  description?: string
  position?: { lat: number; lng: number }
  order_index?: number
  radius_meters?: number
  checkpoint_type?: Checkpoint['checkpoint_type']
  is_mandatory?: boolean
  min_speed_kmh?: number
  max_speed_kmh?: number
  time_limit_seconds?: number
  points?: number
  trigger_direction?: number
  trigger_width_meters?: number
  icon_url?: string
  notes?: string
  is_active?: boolean
}

export class CheckpointRepository {
  /**
   * Create a new checkpoint
   */
  async create(input: CreateCheckpointInput): Promise<Checkpoint> {
    logger.info('Creating checkpoint', { routeId: input.route_id, name: input.name })

    try {
      const sql = `
        INSERT INTO checkpoints (
          route_id, name, description, position, order_index, radius_meters,
          checkpoint_type, is_mandatory, min_speed_kmh, max_speed_kmh, time_limit_seconds,
          points, trigger_direction, trigger_width_meters, icon_url, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        RETURNING *
      `

      const values = [
        input.route_id,
        input.name,
        input.description || null,
        `POINT(${input.position.lng} ${input.position.lat})`,
        input.order_index,
        input.radius_meters || 20,
        input.checkpoint_type || 'STANDARD',
        input.is_mandatory !== false,
        input.min_speed_kmh || null,
        input.max_speed_kmh || null,
        input.time_limit_seconds || null,
        input.points || 0,
        input.trigger_direction || null,
        input.trigger_width_meters || 20,
        input.icon_url || null,
        input.notes || null
      ]

      const result = await query(sql, values)
      const checkpoint = result.rows[0]

      logger.info('Checkpoint created successfully', { checkpointId: checkpoint.id })
      return this.mapRowToCheckpoint(checkpoint)
    } catch (error) {
      logger.error('Failed to create checkpoint', { input, error })
      throw error
    }
  }

  /**
   * Find checkpoint by ID
   */
  async findById(id: string): Promise<Checkpoint | null> {
    try {
      const sql = 'SELECT * FROM checkpoints WHERE id = $1 AND is_active = true'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCheckpoint(result.rows[0])
    } catch (error) {
      logger.error('Failed to find checkpoint by ID', { id, error })
      throw error
    }
  }

  /**
   * Update checkpoint
   */
  async update(id: string, input: UpdateCheckpointInput): Promise<Checkpoint | null> {
    logger.info('Updating checkpoint', { checkpointId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          if (key === 'position') {
            updateFields.push(`position = $${paramIndex}`)
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
        UPDATE checkpoints 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('Checkpoint updated successfully', { checkpointId: id })
      return this.mapRowToCheckpoint(result.rows[0])
    } catch (error) {
      logger.error('Failed to update checkpoint', { id, error })
      throw error
    }
  }

  /**
   * Delete checkpoint (deactivate)
   */
  async delete(id: string): Promise<boolean> {
    logger.info('Deleting checkpoint', { checkpointId: id })

    try {
      const sql = `
        UPDATE checkpoints 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `

      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Checkpoint deleted successfully', { checkpointId: id })
      return true
    } catch (error) {
      logger.error('Failed to delete checkpoint', { id, error })
      throw error
    }
  }

  /**
   * Get checkpoints by route
   */
  async findByRoute(routeId: string): Promise<Checkpoint[]> {
    try {
      const sql = `
        SELECT * FROM checkpoints 
        WHERE route_id = $1 AND is_active = true 
        ORDER BY order_index ASC
      `
      const result = await query(sql, [routeId])
      return result.rows.map((row: any) => this.mapRowToCheckpoint(row))
    } catch (error) {
      logger.error('Failed to find checkpoints by route', { routeId, error })
      throw error
    }
  }

  /**
   * Get checkpoints by type
   */
  async findByType(routeId: string, checkpointType: Checkpoint['checkpoint_type']): Promise<Checkpoint[]> {
    try {
      const sql = `
        SELECT * FROM checkpoints 
        WHERE route_id = $1 AND checkpoint_type = $2 AND is_active = true 
        ORDER BY order_index ASC
      `
      const result = await query(sql, [routeId, checkpointType])
      return result.rows.map((row: any) => this.mapRowToCheckpoint(row))
    } catch (error) {
      logger.error('Failed to find checkpoints by type', { routeId, checkpointType, error })
      throw error
    }
  }

  /**
   * Get mandatory checkpoints
   */
  async findMandatory(routeId: string): Promise<Checkpoint[]> {
    try {
      const sql = `
        SELECT * FROM checkpoints 
        WHERE route_id = $1 AND is_mandatory = true AND is_active = true 
        ORDER BY order_index ASC
      `
      const result = await query(sql, [routeId])
      return result.rows.map((row: any) => this.mapRowToCheckpoint(row))
    } catch (error) {
      logger.error('Failed to find mandatory checkpoints', { routeId, error })
      throw error
    }
  }

  /**
   * Get checkpoint by order index
   */
  async findByOrderIndex(routeId: string, orderIndex: number): Promise<Checkpoint | null> {
    try {
      const sql = `
        SELECT * FROM checkpoints 
        WHERE route_id = $1 AND order_index = $2 AND is_active = true
      `
      const result = await query(sql, [routeId, orderIndex])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCheckpoint(result.rows[0])
    } catch (error) {
      logger.error('Failed to find checkpoint by order index', { routeId, orderIndex, error })
      throw error
    }
  }

  /**
   * Get checkpoint statistics for a route
   */
  async getStats(routeId: string): Promise<{
    total: number
    mandatory: number
    optional: number
    byType: Record<string, number>
    averageRadius: number
    totalPoints: number
  }> {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_mandatory = true THEN 1 END) as mandatory,
          COUNT(CASE WHEN is_mandatory = false THEN 1 END) as optional,
          COUNT(CASE WHEN checkpoint_type = 'START' THEN 1 END) as start_count,
          COUNT(CASE WHEN checkpoint_type = 'FINISH' THEN 1 END) as finish_count,
          COUNT(CASE WHEN checkpoint_type = 'STANDARD' THEN 1 END) as standard_count,
          COUNT(CASE WHEN checkpoint_type = 'TIMING' THEN 1 END) as timing_count,
          COUNT(CASE WHEN checkpoint_type = 'OPTIONAL' THEN 1 END) as optional_count,
          AVG(radius_meters) as average_radius,
          SUM(points) as total_points
        FROM checkpoints 
        WHERE route_id = $1 AND is_active = true
      `

      const result = await query(sql, [routeId])
      const row = result.rows[0]

      return {
        total: parseInt(row.total),
        mandatory: parseInt(row.mandatory),
        optional: parseInt(row.optional),
        byType: {
          START: parseInt(row.start_count),
          FINISH: parseInt(row.finish_count),
          STANDARD: parseInt(row.standard_count),
          TIMING: parseInt(row.timing_count),
          OPTIONAL: parseInt(row.optional_count)
        },
        averageRadius: parseFloat(row.average_radius) || 0,
        totalPoints: parseInt(row.total_points) || 0
      }
    } catch (error) {
      logger.error('Failed to get checkpoint statistics', { routeId, error })
      throw error
    }
  }

  /**
   * Check if point is within checkpoint radius
   */
  async isPointInCheckpoint(checkpointId: string, lat: number, lng: number): Promise<boolean> {
    try {
      const sql = `
        SELECT * FROM checkpoints 
        WHERE id = $1 AND is_active = true
      `
      const result = await query(sql, [checkpointId])
      
      if (result.rows.length === 0) {
        return false
      }

      const checkpoint = result.rows[0]
      const distance = query(`
        SELECT ST_Distance(
          ST_Point($1, $2)::geography,
          position::geography
        ) as distance_meters
        FROM checkpoints 
        WHERE id = $3
      `, [lng, lat, checkpointId])

      const distanceResult = await distance
      const distanceMeters = parseFloat(distanceResult.rows[0].distance_meters)

      return distanceMeters <= checkpoint.radius_meters
    } catch (error) {
      logger.error('Failed to check point in checkpoint', { checkpointId, lat, lng, error })
      return false
    }
  }

  /**
   * Get next checkpoint in sequence
   */
  async getNextCheckpoint(routeId: string, currentOrderIndex: number): Promise<Checkpoint | null> {
    try {
      const sql = `
        SELECT * FROM checkpoints 
        WHERE route_id = $1 AND order_index > $2 AND is_active = true 
        ORDER BY order_index ASC 
        LIMIT 1
      `
      const result = await query(sql, [routeId, currentOrderIndex])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCheckpoint(result.rows[0])
    } catch (error) {
      logger.error('Failed to get next checkpoint', { routeId, currentOrderIndex, error })
      throw error
    }
  }

  /**
   * Get previous checkpoint in sequence
   */
  async getPreviousCheckpoint(routeId: string, currentOrderIndex: number): Promise<Checkpoint | null> {
    try {
      const sql = `
        SELECT * FROM checkpoints 
        WHERE route_id = $1 AND order_index < $2 AND is_active = true 
        ORDER BY order_index DESC 
        LIMIT 1
      `
      const result = await query(sql, [routeId, currentOrderIndex])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToCheckpoint(result.rows[0])
    } catch (error) {
      logger.error('Failed to get previous checkpoint', { routeId, currentOrderIndex, error })
      throw error
    }
  }

  /**
   * Reorder checkpoints for a route
   */
  async reorderCheckpoints(routeId: string, newOrder: { checkpointId: string; orderIndex: number }[]): Promise<void> {
    logger.info('Reordering checkpoints', { routeId, checkpointCount: newOrder.length })

    try {
      await transaction(async (client) => {
        for (const { checkpointId, orderIndex } of newOrder) {
          await client.query(
            'UPDATE checkpoints SET order_index = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [orderIndex, checkpointId]
          )
        }
      })

      logger.info('Checkpoints reordered successfully', { routeId })
    } catch (error) {
      logger.error('Failed to reorder checkpoints', { routeId, error })
      throw error
    }
  }

  /**
   * Map database row to Checkpoint object
   */
  private mapRowToCheckpoint(row: any): Checkpoint {
    return {
      id: row.id,
      route_id: row.route_id,
      name: row.name,
      description: row.description,
      position: { lat: row.position_lat, lng: row.position_lng },
      order_index: row.order_index,
      radius_meters: row.radius_meters,
      checkpoint_type: row.checkpoint_type,
      is_mandatory: row.is_mandatory,
      min_speed_kmh: row.min_speed_kmh,
      max_speed_kmh: row.max_speed_kmh,
      time_limit_seconds: row.time_limit_seconds,
      points: row.points,
      trigger_direction: row.trigger_direction,
      trigger_width_meters: row.trigger_width_meters,
      icon_url: row.icon_url,
      notes: row.notes,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const checkpointRepository = new CheckpointRepository()
