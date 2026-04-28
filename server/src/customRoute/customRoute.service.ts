/**
 * Custom Route Service
 * 
 * Handles custom race route management including route creation,
 * validation, checkpoint management, and route geometry processing.
 * Supports the "Need for Speed mode" custom race functionality.
 */

import { customRouteRepository, checkpointRepository, enforcementZoneRepository } from '../database/repositories'
import { logger } from '../utils/logger'
import * as turf from '@turf/turf'
import { point, lineString, polygon } from '@turf/helpers'
import { Feature, LineString, Point, Polygon, Position } from 'geojson'

export interface CreateCustomRouteInput {
  name: string
  description?: string
  routeType: 'CIRCUIT' | 'POINT_TO_POINT' | 'LOOP' | 'SCATTERED'
  centerline: Feature<LineString>
  boundaries?: Feature<Polygon>
  startFinishPoint?: Feature<Point>
  checkpoints?: CreateCheckpointInput[]
  enforcementZones?: CreateEnforcementZoneInput[]
  lengthMeters?: number
  estimatedTimeMinutes?: number
  speedLimitKmh?: number
  gpsToleranceMeters?: number
  tags?: string[]
  createdBy: string
}

export interface CreateCheckpointInput {
  name: string
  description?: string
  position: Feature<Point>
  orderIndex: number
  radiusMeters?: number
  checkpointType?: 'STANDARD' | 'START' | 'FINISH' | 'TIMING' | 'OPTIONAL'
  isMandatory?: boolean
  minSpeedKmh?: number
  maxSpeedKmh?: number
  timeLimitSeconds?: number
  points?: number
  triggerDirection?: number
  triggerWidthMeters?: number
  iconUrl?: string
  notes?: string
}

export interface CreateEnforcementZoneInput {
  name: string
  description?: string
  geometry: Feature<Point | Polygon | LineString>
  zoneType: 'SPEED_ZONE' | 'SPEED_TRAP' | 'RADAR_ZONE' | 'PATROL_ROUTE' | 'CAMERA_ZONE' | 'HEAT_ZONE'
  speedLimitKmh?: number
  detectionRadiusMeters?: number
  triggerDirection?: number
  patrolSpeedKmh?: number
  patrolRoute?: Feature<LineString>
  penaltyType?: 'TIME' | 'POINTS' | 'WARNING' | 'NONE'
  penaltyAmount?: number
  warningThresholdKmh?: number
  detectionSensitivity?: 'LOW' | 'MEDIUM' | 'HIGH'
  gpsToleranceMeters?: number
  activeHoursStart?: string
  activeHoursEnd?: string
  color?: string
  iconUrl?: string
  isVisible?: boolean
  notes?: string
}

export interface RouteValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metrics?: {
    totalLength: number
    estimatedTime: number
    checkpointCount: number
    mandatoryCheckpoints: number
    enforcementZones: number
    difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME'
  }
}

export interface RouteProjectionResult {
  projectedPoint: Point
  progress: number // 0-1 along the route
  distanceFromStart: number
  nearestCheckpoint?: string
  nearestEnforcementZone?: string
  isOnRoute: boolean
  deviationMeters?: number
  heading?: number
}

export class CustomRouteService {
  /**
   * Create a new custom route with validation
   */
  async createRoute(input: CreateCustomRouteInput): Promise<any> {
    logger.info('Creating custom route', { name: input.name, createdBy: input.createdBy })

    try {
      // Validate route geometry
      const validation = await this.validateRoute(input)
      if (!validation.isValid) {
        throw new Error(`Route validation failed: ${validation.errors.join(', ')}`)
      }

      // Create route
      const routeData = {
        name: input.name,
        description: input.description,
        route_type: input.routeType,
        centerline: JSON.stringify(input.centerline),
        boundaries: input.boundaries ? JSON.stringify(input.boundaries) : null,
        start_finish_point: input.startFinishPoint ? JSON.stringify(input.startFinishPoint) : null,
        length_meters: input.lengthMeters || validation.metrics?.totalLength,
        estimated_time_minutes: input.estimatedTimeMinutes || validation.metrics?.estimatedTime,
        speed_limit_kmh: input.speedLimitKmh,
        gps_tolerance_meters: input.gpsToleranceMeters || 15,
        tags: input.tags || [],
        created_by: input.createdBy
      }

      const route = await customRouteRepository.create(routeData)

      // Create checkpoints if provided
      if (input.checkpoints && input.checkpoints.length > 0) {
        for (const checkpoint of input.checkpoints) {
          await this.createCheckpoint(route.id, checkpoint)
        }
      } else {
        // Create default start/finish checkpoints
        await this.createDefaultCheckpoints(route.id, input.centerline)
      }

      // Create enforcement zones if provided
      if (input.enforcementZones) {
        for (const zone of input.enforcementZones) {
          await this.createEnforcementZone(route.id, zone)
        }
      }

      logger.info('Custom route created successfully', { 
        routeId: route.id, 
        name: route.name,
        length: route.length_meters,
        checkpoints: input.checkpoints?.length || 2
      })

      return route
    } catch (error) {
      logger.error('Failed to create custom route', { name: input.name, error })
      throw error
    }
  }

  /**
   * Validate custom route geometry and configuration
   */
  async validateRoute(input: CreateCustomRouteInput): Promise<RouteValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validate centerline
      if (!input.centerline) {
        errors.push('Centerline is required')
        return { isValid: false, errors, warnings }
      }

      const centerline = input.centerline
      const coordinates = centerline.geometry.coordinates

      // Validate coordinate format
      if (coordinates.length < 2) {
        errors.push('Centerline must have at least 2 points')
      }

      // Validate coordinate ranges
      for (const coord of coordinates) {
        if (coord.length !== 2) {
          errors.push('All coordinates must have exactly 2 values (longitude, latitude)')
        }
        const [lng, lat] = coord
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          errors.push('Coordinates out of valid range')
        }
      }

      // Calculate metrics
      const totalLength = turf.length(centerline, { units: 'meters' })
      const estimatedTime = this.estimateRouteTime(totalLength, input.speedLimitKmh)
      const checkpointCount = input.checkpoints?.length || 2
      const mandatoryCheckpoints = input.checkpoints?.filter(cp => cp.isMandatory !== false).length || 2
      const enforcementZones = input.enforcementZones?.length || 0

      // Validate route type
      if (input.routeType === 'LOOP') {
        // Check if route forms a loop
        const startPoint = point(coordinates[0])
        const endPoint = point(coordinates[coordinates.length - 1])
        const distance = turf.distance(startPoint, endPoint, { units: 'meters' })
        
        if (distance > 100) {
          warnings.push('Route type is LOOP but start and end points are far apart')
        }
      }

      // Validate checkpoints
      if (input.checkpoints) {
        const checkpointOrders = input.checkpoints.map(cp => cp.orderIndex).sort((a, b) => a - b)
        for (let i = 0; i < checkpointOrders.length; i++) {
          if (checkpointOrders[i] !== i + 1) {
            errors.push(`Checkpoint order indices must be sequential starting from 1`)
            break
          }
        }

        // Check if checkpoints are on the route
        for (const checkpoint of input.checkpoints) {
          const checkpointPoint = point(checkpoint.position.geometry.coordinates)
          const nearest = turf.nearestPointOnLine(centerline, checkpointPoint)
          const distance = nearest.properties!.distance || 0
          
          if (distance > (checkpoint.radiusMeters || 20)) {
            warnings.push(`Checkpoint "${checkpoint.name}" is far from the route centerline`)
          }
        }
      }

      // Validate boundaries
      if (input.boundaries) {
        const boundaries = input.boundaries
        const allPointsInside = coordinates.every(coord => 
          turf.booleanPointInPolygon(point(coord), boundaries)
        )
        
        if (!allPointsInside) {
          errors.push('Centerline points must be within route boundaries')
        }
      }

      // Calculate difficulty
      const difficulty = this.calculateRouteDifficulty(totalLength, checkpointCount, enforcementZones)

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metrics: {
          totalLength,
          estimatedTime,
          checkpointCount,
          mandatoryCheckpoints,
          enforcementZones,
          difficulty
        }
      }
    } catch (error) {
      logger.error('Route validation error', { error })
      return {
        isValid: false,
        errors: ['Validation failed due to error'],
        warnings
      }
    }
  }

  /**
   * Project GPS point onto custom route
   */
  async projectToRoute(routeId: string, lat: number, lng: number): Promise<RouteProjectionResult | null> {
    try {
      const route = await customRouteRepository.findById(routeId)
      if (!route || !route.centerline) {
        return null
      }

      const centerline = JSON.parse(route.centerline) as Feature<LineString>
      const trackPoint = point([lng, lat])

      // Find nearest point on centerline
      const nearest = turf.nearestPointOnLine(centerline, trackPoint)
      
      if (!nearest) {
        return null
      }

      // Calculate progress along route (0-1)
      const totalLength = turf.length(centerline, { units: 'meters' })
      const distanceFromStart = nearest.properties!.distance || 0
      const progress = distanceFromStart / totalLength

      // Calculate heading at nearest point
      const heading = this.calculateHeadingAtPoint(centerline, nearest.properties!.index!)

      // Check if point is within route boundaries
      let isOnRoute = true
      let deviationMeters = 0

      if (route.boundaries) {
        const boundaries = JSON.parse(route.boundaries) as Feature<Polygon>
        isOnRoute = turf.booleanPointInPolygon(trackPoint, boundaries)
        
        if (!isOnRoute) {
          // Calculate distance to nearest boundary
          deviationMeters = this.calculateDistanceToBoundaries(trackPoint, boundaries)
        }
      }

      // Find nearest checkpoint
      const nearestCheckpoint = await this.findNearestCheckpoint(routeId, lat, lng)
      
      // Find nearest enforcement zone
      const nearestEnforcementZone = await this.findNearestEnforcementZone(routeId, lat, lng)

      return {
        projectedPoint: nearest.geometry as Point,
        progress,
        distanceFromStart,
        nearestCheckpoint,
        nearestEnforcementZone,
        heading,
        isOnRoute,
        deviationMeters: deviationMeters > 0 ? deviationMeters : undefined
      }
    } catch (error) {
      logger.error('Failed to project point to route', { routeId, lat, lng, error })
      return null
    }
  }

  /**
   * Create checkpoint for a route
   */
  async createCheckpoint(routeId: string, input: CreateCheckpointInput): Promise<any> {
    try {
      const checkpointData = {
        route_id: routeId,
        name: input.name,
        description: input.description,
        position: JSON.stringify(input.position),
        order_index: input.orderIndex,
        radius_meters: input.radiusMeters || 20,
        checkpoint_type: input.checkpointType || 'STANDARD',
        is_mandatory: input.isMandatory !== false,
        min_speed_kmh: input.minSpeedKmh,
        max_speed_kmh: input.maxSpeedKmh,
        time_limit_seconds: input.timeLimitSeconds,
        points: input.points || 0,
        trigger_direction: input.triggerDirection,
        trigger_width_meters: input.triggerWidthMeters || 20,
        icon_url: input.iconUrl,
        notes: input.notes
      }

      return await checkpointRepository.create(checkpointData)
    } catch (error) {
      logger.error('Failed to create checkpoint', { routeId, input, error })
      throw error
    }
  }

  /**
   * Create enforcement zone for a route
   */
  async createEnforcementZone(routeId: string, input: CreateEnforcementZoneInput): Promise<any> {
    try {
      const zoneData = {
        route_id: routeId,
        name: input.name,
        description: input.description,
        geometry: JSON.stringify(input.geometry),
        zone_type: input.zoneType,
        speed_limit_kmh: input.speedLimitKmh,
        detection_radius_meters: input.detectionRadiusMeters || 50,
        trigger_direction: input.triggerDirection,
        patrol_speed_kmh: input.patrolSpeedKmh,
        patrol_route: input.patrolRoute ? JSON.stringify(input.patrolRoute) : null,
        penalty_type: input.penaltyType || 'TIME',
        penalty_amount: input.penaltyAmount || 0,
        warning_threshold_kmh: input.warningThresholdKmh,
        detection_sensitivity: input.detectionSensitivity || 'MEDIUM',
        gps_tolerance_meters: input.gpsToleranceMeters || 15,
        active_hours_start: input.activeHoursStart,
        active_hours_end: input.activeHoursEnd,
        color: input.color || '#FF0000',
        icon_url: input.iconUrl,
        is_visible: input.isVisible !== false,
        notes: input.notes
      }

      return await enforcementZoneRepository.create(zoneData)
    } catch (error) {
      logger.error('Failed to create enforcement zone', { routeId, input, error })
      throw error
    }
  }

  /**
   * Get route with checkpoints and enforcement zones
   */
  async getRouteWithDetails(routeId: string): Promise<any> {
    try {
      const route = await customRouteRepository.findById(routeId)
      if (!route) {
        return null
      }

      // Get checkpoints
      const checkpoints = await checkpointRepository.findByRoute(routeId)
      
      // Get enforcement zones
      const enforcementZones = await enforcementZoneRepository.findByRoute(routeId)

      return {
        ...route,
        checkpoints,
        enforcementZones
      }
    } catch (error) {
      logger.error('Failed to get route with details', { routeId, error })
      throw error
    }
  }

  /**
   * Search custom routes
   */
  async searchRoutes(query: string, filters?: {
    routeType?: string
    createdBy?: string
    minLength?: number
    maxLength?: number
    tags?: string[]
  }): Promise<any[]> {
    try {
      let routes = await customRouteRepository.search(query)

      // Apply filters
      if (filters) {
        routes = routes.filter(route => {
          if (filters.routeType && route.route_type !== filters.routeType) return false
          if (filters.createdBy && route.created_by !== filters.createdBy) return false
          if (filters.minLength && (!route.length_meters || route.length_meters < filters.minLength)) return false
          if (filters.maxLength && (!route.length_meters || route.length_meters > filters.maxLength)) return false
          if (filters.tags && filters.tags.length > 0) {
            const routeTags = route.tags || []
            if (!filters.tags.every(tag => routeTags.includes(tag))) return false
          }
          return true
        })
      }

      return routes
    } catch (error) {
      logger.error('Failed to search routes', { query, filters, error })
      throw error
    }
  }

  /**
   * Get routes by creator
   */
  async getRoutesByCreator(createdBy: string): Promise<any[]> {
    try {
      return await customRouteRepository.findByCreator(createdBy)
    } catch (error) {
      logger.error('Failed to get routes by creator', { createdBy, error })
      throw error
    }
  }

  /**
   * Estimate route time based on length and speed
   */
  private estimateRouteTime(lengthMeters: number, speedLimitKmh?: number): number {
    const avgSpeed = speedLimitKmh || 80 // Default average speed
    const avgSpeedMs = avgSpeed * 1000 / 3600 // Convert to m/s
    return Math.round(lengthMeters / avgSpeedMs / 60) // Convert to minutes
  }

  /**
   * Calculate route difficulty
   */
  private calculateRouteDifficulty(lengthMeters: number, checkpointCount: number, enforcementZones: number): 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME' {
    let difficultyScore = 0

    // Length contributes to difficulty
    if (lengthMeters > 10000) difficultyScore += 3
    else if (lengthMeters > 5000) difficultyScore += 2
    else if (lengthMeters > 2000) difficultyScore += 1

    // Checkpoints contribute to difficulty
    if (checkpointCount > 10) difficultyScore += 2
    else if (checkpointCount > 5) difficultyScore += 1

    // Enforcement zones contribute to difficulty
    if (enforcementZones > 5) difficultyScore += 2
    else if (enforcementZones > 2) difficultyScore += 1

    if (difficultyScore >= 6) return 'EXTREME'
    if (difficultyScore >= 4) return 'HARD'
    if (difficultyScore >= 2) return 'MODERATE'
    return 'EASY'
  }

  /**
   * Create default start/finish checkpoints
   */
  private async createDefaultCheckpoints(routeId: string, centerline: Feature<LineString>): Promise<void> {
    const coordinates = centerline.geometry.coordinates

    // Start checkpoint
    await this.createCheckpoint(routeId, {
      name: 'Start',
      description: 'Race start point',
      position: point(coordinates[0]),
      orderIndex: 1,
      checkpointType: 'START',
      isMandatory: true
    })

    // Finish checkpoint
    await this.createCheckpoint(routeId, {
      name: 'Finish',
      description: 'Race finish point',
      position: point(coordinates[coordinates.length - 1]),
      orderIndex: 2,
      checkpointType: 'FINISH',
      isMandatory: true
    })
  }

  /**
   * Calculate heading at a specific point on the route
   */
  private calculateHeadingAtPoint(centerline: Feature<LineString>, pointIndex: number): number {
    const coords = centerline.geometry.coordinates
    
    if (pointIndex >= coords.length - 1) {
      // Last point - use previous segment
      return turf.bearing(point(coords[coords.length - 2]), point(coords[coords.length - 1]))
    }
    
    return turf.bearing(point(coords[pointIndex]), point(coords[pointIndex + 1]))
  }

  /**
   * Calculate distance from point to route boundaries
   */
  private calculateDistanceToBoundaries(point: Point, boundaries: Feature<Polygon>): number {
    try {
      const distance = turf.pointToLineDistance(point, boundaries, { units: 'meters' })
      return distance
    } catch (error) {
      return 0
    }
  }

  /**
   * Find nearest checkpoint to a point
   */
  private async findNearestCheckpoint(routeId: string, lat: number, lng: number): Promise<string | null> {
    try {
      const checkpoints = await checkpointRepository.findByRoute(routeId)
      let nearestCheckpoint: string | null = null
      let minDistance = Infinity

      for (const checkpoint of checkpoints) {
        const checkpointPos = JSON.parse(checkpoint.position) as Feature<Point>
        const distance = turf.distance(
          point([lng, lat]),
          checkpointPos,
          { units: 'meters' }
        )

        if (distance < minDistance) {
          minDistance = distance
          nearestCheckpoint = checkpoint.id
        }
      }

      return nearestCheckpoint
    } catch (error) {
      return null
    }
  }

  /**
   * Find nearest enforcement zone to a point
   */
  private async findNearestEnforcementZone(routeId: string, lat: number, lng: number): Promise<string | null> {
    try {
      const zones = await enforcementZoneRepository.findByRoute(routeId)
      let nearestZone: string | null = null
      let minDistance = Infinity

      for (const zone of zones) {
        const geometry = JSON.parse(zone.geometry) as Feature<Point | Polygon | LineString>
        
        let distance: number
        if (geometry.geometry.type === 'Point') {
          distance = turf.distance(
            point([lng, lat]),
            geometry,
            { units: 'meters' }
          )
        } else {
          // For LineString and Polygon, use pointToLineDistance
          distance = turf.pointToLineDistance(
            point([lng, lat]),
            geometry,
            { units: 'meters' }
          )
        }

        if (distance < minDistance) {
          minDistance = distance
          nearestZone = zone.id
        }
      }

      return nearestZone
    } catch (error) {
      return null
    }
  }
}

// Export singleton instance
export const customRouteService = new CustomRouteService()
