/**
 * Track Service
 * 
 * Handles track management including spatial operations, validation,
 * and track geometry processing using Turf.js for geospatial calculations.
 */

import { trackRepository } from '../database/repositories'
import { logger } from '../utils/logger'
import * as turf from '@turf/turf'
import { point, lineString, polygon } from '@turf/helpers'
import { Feature, LineString, Point, Polygon, Position } from 'geojson'

export interface CreateTrackInput {
  name: string
  shortName?: string
  description?: string
  locationName?: string
  locationCountry?: string
  locationLat?: number
  locationLng?: number
  lengthMeters?: number
  trackType?: 'circuit' | 'street_circuit' | 'oval' | 'road_course' | 'rally'
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  centerline?: Feature<LineString>
  boundaries?: Feature<Polygon>
  startFinishLine?: Feature<LineString>
  pitLane?: Feature<LineString>
  marshalZones?: Feature<Polygon>[]
  numCorners?: number
  maxSpeedKmh?: number
  typicalLapTimeSeconds?: number
  sectorSplits?: number[]
  imageUrl?: string
  elevationProfileUrl?: string
  tags?: string[]
  createdBy?: string
}

export interface UpdateTrackInput {
  name?: string
  shortName?: string
  description?: string
  locationName?: string
  locationCountry?: string
  locationLat?: number
  locationLng?: number
  lengthMeters?: number
  trackType?: CreateTrackInput['trackType']
  difficultyLevel?: CreateTrackInput['difficultyLevel']
  centerline?: Feature<LineString>
  boundaries?: Feature<Polygon>
  startFinishLine?: Feature<LineString>
  pitLane?: Feature<LineString>
  marshalZones?: Feature<Polygon>[]
  numCorners?: number
  maxSpeedKmh?: number
  typicalLapTimeSeconds?: number
  sectorSplits?: number[]
  imageUrl?: string
  elevationProfileUrl?: string
  isActive?: boolean
  isFeatured?: boolean
  tags?: string[]
}

export interface TrackValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metrics?: {
    totalLength: number
    minRadius?: number
    maxRadius?: number
    avgRadius?: number
    cornerCount: number
    straightCount: number
  }
}

export interface ProjectionResult {
  projectedPoint: Point
  progress: number // 0-1 along the track
  distanceFromStart: number
  nearestIndex: number
  heading?: number
  isOnTrack: boolean
  deviationMeters?: number
}

export class TrackService {
  /**
   * Create a new track with validation
   */
  async createTrack(input: CreateTrackInput, userId: string): Promise<any> {
    logger.info('Creating track', { name: input.name, createdBy: userId })

    try {
      // Validate track geometry
      const validation = await this.validateTrackGeometry(input)
      if (!validation.isValid) {
        throw new Error(`Track validation failed: ${validation.errors.join(', ')}`)
      }

      // Convert GeoJSON to strings for storage
      const trackData = {
        ...input,
        centerline: input.centerline ? JSON.stringify(input.centerline) : undefined,
        boundaries: input.boundaries ? JSON.stringify(input.boundaries) : undefined,
        startFinishLine: input.startFinishLine ? JSON.stringify(input.startFinishLine) : undefined,
        pitLane: input.pitLane ? JSON.stringify(input.pitLane) : undefined,
        marshalZones: input.marshalZones ? JSON.stringify(input.marshalZones) : undefined,
        createdBy: userId,
        lengthMeters: input.lengthMeters || validation.metrics?.totalLength,
        numCorners: input.numCorners || validation.metrics?.cornerCount
      }

      const track = await trackRepository.create(trackData)

      logger.info('Track created successfully', { 
        trackId: track.id, 
        name: track.name,
        length: track.length_meters,
        corners: track.num_corners
      })

      return track
    } catch (error) {
      logger.error('Failed to create track', { name: input.name, error })
      throw error
    }
  }

  /**
   * Update track with validation
   */
  async updateTrack(trackId: string, input: UpdateTrackInput, userId: string): Promise<any> {
    logger.info('Updating track', { trackId, userId })

    try {
      // Get existing track
      const existingTrack = await trackRepository.findById(trackId)
      if (!existingTrack) {
        throw new Error('Track not found')
      }

      // Check track type validation
      if ((input as any).track_type && !['circuit', 'street_circuit', 'oval', 'road_course', 'rally'].includes((input as any).track_type)) {
        throw new Error('Invalid track type')
      }

      // Check permissions
      if (userId && existingTrack.created_by && existingTrack.created_by !== userId) {
        throw new Error('Only track creator can update track')
      }

      // Validate updated geometry if provided
      if (input.centerline || input.boundaries) {
        const centerlineGeo = input.centerline || (existingTrack.centerline ? JSON.parse(existingTrack.centerline) : undefined)
        const boundariesGeo = input.boundaries || (existingTrack.boundaries ? JSON.parse(existingTrack.boundaries) : undefined)
        const validation = await this.validateTrackGeometry({
          ...existingTrack,
          ...input,
          centerline: centerlineGeo,
          boundaries: boundariesGeo
        } as CreateTrackInput)
        if (!validation.isValid) {
          throw new Error(`Track validation failed: ${validation.errors.join(', ')}`)
        }
      }

      // Convert GeoJSON to strings for storage
      const trackData = {
        ...input,
        centerline: input.centerline ? JSON.stringify(input.centerline) : undefined,
        boundaries: input.boundaries ? JSON.stringify(input.boundaries) : undefined,
        startFinishLine: input.startFinishLine ? JSON.stringify(input.startFinishLine) : undefined,
        pitLane: input.pitLane ? JSON.stringify(input.pitLane) : undefined,
        marshalZones: input.marshalZones ? JSON.stringify(input.marshalZones) : undefined
      }

      const updatedTrack = await trackRepository.update(trackId, trackData)

      logger.info('Track updated successfully', { trackId })
      return updatedTrack
    } catch (error) {
      logger.error('Failed to update track', { trackId, error })
      throw error
    }
  }

  /**
   * Validate track geometry and calculate metrics
   */
  async validateTrackGeometry(input: CreateTrackInput): Promise<TrackValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validate centerline
      if (!input.centerline) {
        errors.push('Invalid geometry: Centerline is required')
        return { isValid: false, errors, warnings }
      }

      let parsedCenterline: any = input.centerline
      if (typeof parsedCenterline === 'string') {
        try { parsedCenterline = JSON.parse(parsedCenterline) } catch (e) {}
      }
      const coordinates = parsedCenterline?.geometry?.coordinates || parsedCenterline?.coordinates

      if (!coordinates || !Array.isArray(coordinates)) {
        errors.push('Invalid geometry: Centerline coordinates required')
        return { isValid: false, errors, warnings }
      }

      // Validate coordinate format
      if (coordinates.length < 2) {
        errors.push('Invalid geometry: Centerline must have at least 2 points')
      }

      // Validate coordinate ranges
      for (const coord of coordinates) {
        if (!coord || coord.length !== 2) {
          errors.push('Invalid geometry: All coordinates must have exactly 2 values (longitude, latitude)')
          continue
        }
        const [lng, lat] = coord
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          errors.push('Invalid geometry: Coordinates out of valid range')
        }
      }

      // Check for self-intersections
      const line = lineString(coordinates)
      const intersects = turf.lineIntersect(line, line)
      const selfIntersects = intersects && intersects.features.length > coordinates.length
      if (selfIntersects) {
        warnings.push('Centerline may self-intersect')
      }

      // Calculate metrics
      const totalLength = turf.length(line, { units: 'meters' })
      const cornerCount = this.countCorners(coordinates)
      const straightCount = coordinates.length - cornerCount - 1

      // Calculate corner radii
      const radii = this.calculateCornerRadii(coordinates)
      const minRadius = Math.min(...radii)
      const maxRadius = Math.max(...radii)
      const avgRadius = radii.reduce((sum, r) => sum + r, 0) / radii.length

      // Validate against provided metrics
      if (input.lengthMeters && Math.abs(input.lengthMeters - totalLength) > 100) {
        warnings.push(`Provided length (${input.lengthMeters}m) differs from calculated (${totalLength.toFixed(1)}m)`)
      }

      if (input.numCorners && input.numCorners !== cornerCount) {
        warnings.push(`Provided corner count (${input.numCorners}) differs from calculated (${cornerCount})`)
      }

      // Validate start/finish line
      const rawStartFinish = input.startFinishLine || (input as any).start_finish_line
      if (rawStartFinish) {
        let parsedStartFinish: any = rawStartFinish
        if (typeof parsedStartFinish === 'string') {
          try { parsedStartFinish = JSON.parse(parsedStartFinish) } catch (e) {}
        }
        const startFinishCoords = parsedStartFinish?.geometry?.coordinates || parsedStartFinish?.coordinates
        if (startFinishCoords && Array.isArray(startFinishCoords)) {
          try {
            if (!this.isPerpendicularToTrack(startFinishCoords, coordinates)) {
              warnings.push('Start/finish line should be perpendicular to track direction')
            }
          } catch (e) {}
        }
      }

      // Validate boundaries
      const rawBoundaries = input.boundaries
      if (rawBoundaries) {
        let parsedBoundaries: any = rawBoundaries
        if (typeof parsedBoundaries === 'string') {
          try { parsedBoundaries = JSON.parse(parsedBoundaries) } catch (e) {}
        }
        try {
          const boundaryPoly = parsedBoundaries?.geometry ? parsedBoundaries : polygon(parsedBoundaries?.coordinates || parsedBoundaries)
          const allPointsInside = coordinates.every(coord => 
            turf.booleanPointInPolygon(point(coord), boundaryPoly as any)
          )
          if (!allPointsInside) {
            errors.push('Invalid geometry: Centerline points must be within track boundaries')
          }
        } catch (e) {}
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        metrics: {
          totalLength,
          minRadius: radii.length > 0 ? minRadius : undefined,
          maxRadius: radii.length > 0 ? maxRadius : undefined,
          avgRadius: radii.length > 0 ? avgRadius : undefined,
          cornerCount,
          straightCount
        }
      }
    } catch (error) {
      logger.error('Track validation error', { error })
      return {
        isValid: false,
        errors: ['Validation failed due to error'],
        warnings
      }
    }
  }

  /**
   * Project a GPS point onto the track centerline
   */
  async projectToTrack(trackId: string, lat: number, lng: number): Promise<ProjectionResult | null> {
    try {
      const track = await trackRepository.findById(trackId)
      if (!track || !track.centerline) {
        return null
      }

      const centerline = JSON.parse(track.centerline) as Feature<LineString>
      const trackPoint = point([lng, lat])

      // Find nearest point on centerline
      const nearest = turf.nearestPointOnLine(centerline, trackPoint)
      
      if (!nearest) {
        return null
      }

      // Calculate progress along track (0-1)
      const totalLength = turf.length(centerline, { units: 'meters' })
      const distanceFromStart = nearest.properties!.distance || 0
      const progress = distanceFromStart / totalLength

      // Calculate heading at nearest point
      const heading = this.calculateHeadingAtPoint(centerline, nearest.properties!.index!)

      // Check if point is within track boundaries
      let isOnTrack = true
      let deviationMeters = 0

      if (track.boundaries) {
        const boundaries = JSON.parse(track.boundaries) as Feature<Polygon>
        isOnTrack = turf.booleanPointInPolygon(trackPoint, boundaries)
        
        if (!isOnTrack) {
          // Calculate distance to nearest boundary
          deviationMeters = this.calculateDistanceToBoundaries(trackPoint.geometry as Point, boundaries)
        }
      }

      return {
        projectedPoint: nearest.geometry as Point,
        progress,
        distanceFromStart,
        nearestIndex: nearest.properties!.index!,
        heading,
        isOnTrack,
        deviationMeters: deviationMeters > 0 ? deviationMeters : undefined
      }
    } catch (error) {
      logger.error('Failed to project point to track', { trackId, lat, lng, error })
      return null
    }
  }

  /**
   * Get track bounds for map display
   */
  async getTrackBounds(trackId: string): Promise<[number, number, number, number] | null> {
    try {
      const track = await trackRepository.findById(trackId)
      if (!track || !track.centerline) {
        return null
      }

      const centerline = JSON.parse(track.centerline) as Feature<LineString>
      const bounds = turf.bbox(centerline) as [number, number, number, number]

      return bounds
    } catch (error) {
      logger.error('Failed to get track bounds', { trackId, error })
      return null
    }
  }

  /**
   * Find tracks near a location
   */
  async findTracksNearLocation(lat: number, lng: number, radiusKm: number = 100): Promise<any[]> {
    try {
      const tracks = await trackRepository.findNearLocation(lat, lng, radiusKm)
      return tracks
    } catch (error) {
      logger.error('Failed to find tracks near location', { lat, lng, radiusKm, error })
      throw error
    }
  }

  /**
   * Search tracks by query
   */
  async searchTracks(query: string, filters?: {
    type?: string
    difficulty?: string
    country?: string
    minLength?: number
    maxLength?: number
  }): Promise<any[]> {
    try {
      let tracks = await trackRepository.search(query)

      // Apply filters
      if (filters) {
        tracks = tracks.filter(track => {
          if (filters.type && track.track_type !== filters.type) return false
          if (filters.difficulty && track.difficulty_level !== filters.difficulty) return false
          if (filters.country && track.location_country !== filters.country) return false
          if (filters.minLength && (!track.length_meters || track.length_meters < filters.minLength)) return false
          if (filters.maxLength && (!track.length_meters || track.length_meters > filters.maxLength)) return false
          return true
        })
      }

      return tracks
    } catch (error) {
      logger.error('Failed to search tracks', { query, filters, error })
      throw error
    }
  }

  /**
   * Count corners in track coordinates
   */
  private countCorners(coordinates: Position[]): number {
    let cornerCount = 0
    const angleThreshold = 15 // degrees

    for (let i = 1; i < coordinates.length - 1; i++) {
      const angle = this.calculateAngle(
        coordinates[i - 1],
        coordinates[i],
        coordinates[i + 1]
      )
      
      if (Math.abs(angle) > angleThreshold) {
        cornerCount++
      }
    }

    return cornerCount
  }

  /**
   * Calculate corner radii
   */
  private calculateCornerRadii(coordinates: Position[]): number[] {
    const radii: number[] = []
    const angleThreshold = 15 // degrees

    for (let i = 1; i < coordinates.length - 1; i++) {
      const angle = this.calculateAngle(
        coordinates[i - 1],
        coordinates[i],
        coordinates[i + 1]
      )
      
      if (Math.abs(angle) > angleThreshold) {
        // Estimate radius from angle and segment length
        const segmentLength = turf.distance(
          point(coordinates[i - 1]),
          point(coordinates[i + 1]),
          { units: 'meters' }
        )
        
        const radius = segmentLength / (2 * Math.sin(Math.abs(angle) * Math.PI / 180))
        radii.push(radius)
      }
    }

    return radii
  }

  /**
   * Calculate angle between three points
   */
  private calculateAngle(p1: Position, p2: Position, p3: Position): number {
    const bearing1 = turf.bearing(point(p1), point(p2))
    const bearing2 = turf.bearing(point(p2), point(p3))
    
    let angle = bearing2 - bearing1
    if (angle > 180) angle -= 360
    if (angle < -180) angle += 360
    
    return angle
  }

  /**
   * Check if line is perpendicular to track direction
   */
  private isPerpendicularToTrack(lineCoords: Position[], trackCoords: Position[]): boolean {
    if (lineCoords.length < 2 || trackCoords.length < 2) return false

    const lineBearing = turf.bearing(point(lineCoords[0]), point(lineCoords[1]))
    
    // Find track segment closest to line
    let minDistance = Infinity
    let trackBearing = 0
    
    for (let i = 0; i < trackCoords.length - 1; i++) {
      const distance = turf.pointToLineDistance(
        point(lineCoords[0]),
        lineString([trackCoords[i], trackCoords[i + 1]]),
        { units: 'meters' }
      )
      
      if (distance < minDistance) {
        minDistance = distance
        trackBearing = turf.bearing(point(trackCoords[i]), point(trackCoords[i + 1]))
      }
    }

    const angleDiff = Math.abs(lineBearing - trackBearing)
    return angleDiff > 80 && angleDiff < 100 // Approximately perpendicular
  }

  /**
   * Calculate heading at a specific point on the track
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
   * Calculate distance from point to track boundaries
   */
  private calculateDistanceToBoundaries(pt: Point, boundaries: Feature<Polygon>): number {
    try {
      const line = turf.polygonToLine(boundaries) as any
      const distance = turf.pointToLineDistance(point(pt.coordinates), line, { units: 'meters' })
      return distance
    } catch (error) {
      return 0
    }
  }

  /**
   * Find track by ID
   */
  async findById(id: string): Promise<any> {
    return trackRepository.findById(id)
  }

  /**
   * Get track by ID (throws if not found)
   */
  async getTrackById(id: string): Promise<any> {
    const track = await trackRepository.findById(id)
    if (!track) {
      throw new Error(`Track with id ${id} not found`)
    }
    return track
  }

  async getTrack(id: string): Promise<any> {
    return this.getTrackById(id)
  }

  /**
   * Find all tracks
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<any[]> {
    return trackRepository.findAll(limit, offset)
  }

  /**
   * Find featured tracks
   */
  async findFeatured(limit: number = 10): Promise<any[]> {
    return trackRepository.findFeatured(limit)
  }

  /**
   * Find tracks by type
   */
  async findByType(type: any, limit: number = 20, offset: number = 0): Promise<any[]> {
    return trackRepository.findByType(type, limit, offset)
  }

  /**
   * Find tracks by difficulty
   */
  async findByDifficulty(difficulty: any, limit: number = 20, offset: number = 0): Promise<any[]> {
    return trackRepository.findByDifficulty(difficulty, limit, offset)
  }

  /**
   * Deactivate a track
   */
  async deactivate(id: string, userId?: string): Promise<boolean> {
    return trackRepository.deactivate(id)
  }
}

// Export singleton instance
export const trackService = new TrackService()
