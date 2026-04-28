/**
 * Track Controller
 * 
 * HTTP endpoints for track management including CRUD operations,
 * validation, spatial queries, and track geometry processing.
 */

import { Request, Response } from 'express'
import { trackService } from './track.service'
import { requireAuth, requireOwnership } from '../auth'
import { logger } from '../utils/logger'

export class TrackController {
  /**
   * Create a new track
   * POST /tracks
   */
  create = requireAuth(async (req: Request, res: Response) => {
    try {
      const {
        name,
        shortName,
        description,
        locationName,
        locationCountry,
        locationLat,
        locationLng,
        lengthMeters,
        trackType,
        difficultyLevel,
        centerline,
        boundaries,
        startFinishLine,
        pitLane,
        marshalZones,
        numCorners,
        maxSpeedKmh,
        typicalLapTimeSeconds,
        sectorSplits,
        imageUrl,
        elevationProfileUrl,
        tags
      } = req.body

      // Validate required fields
      if (!name || !centerline) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Name and centerline are required'
        })
      }

      // Validate centerline format
      if (typeof centerline === 'string') {
        try {
          JSON.parse(centerline)
        } catch (parseError) {
          return res.status(400).json({
            error: 'Invalid centerline format',
            message: 'Centerline must be valid GeoJSON'
          })
        }
      }

      const track = await trackService.createTrack({
        name,
        shortName,
        description,
        locationName,
        locationCountry,
        locationLat,
        locationLng,
        lengthMeters,
        trackType,
        difficultyLevel,
        centerline: typeof centerline === 'string' ? JSON.parse(centerline) : centerline,
        boundaries: boundaries ? (typeof boundaries === 'string' ? JSON.parse(boundaries) : boundaries) : undefined,
        startFinishLine: startFinishLine ? (typeof startFinishLine === 'string' ? JSON.parse(startFinishLine) : startFinishLine) : undefined,
        pitLane: pitLane ? (typeof pitLane === 'string' ? JSON.parse(pitLane) : pitLane) : undefined,
        marshalZones: marshalZones ? (typeof marshalZones === 'string' ? JSON.parse(marshalZones) : marshalZones) : undefined,
        numCorners,
        maxSpeedKmh,
        typicalLapTimeSeconds,
        sectorSplits,
        imageUrl,
        elevationProfileUrl,
        tags,
        createdBy: req.userId
      })

      res.status(201).json({
        message: 'Track created successfully',
        data: track
      })
    } catch (error: any) {
      logger.error('Create track endpoint error', { error })

      if (error.message.includes('validation failed')) {
        return res.status(400).json({
          error: 'Track validation failed',
          message: error.message
        })
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Track already exists',
          message: 'A track with this name already exists'
        })
      }

      res.status(500).json({
        error: 'Failed to create track',
        message: 'Track creation failed'
      })
    }
  })

  /**
   * Get all tracks with optional filtering
   * GET /tracks
   */
  getAll = async (req: Request, res: Response) => {
    try {
      const {
        search,
        type,
        difficulty,
        country,
        minLength,
        maxLength,
        limit = 50,
        offset = 0
      } = req.query

      let tracks

      if (search) {
        tracks = await trackService.searchTracks(search as string, {
          type: type as string,
          difficulty: difficulty as string,
          country: country as string,
          minLength: minLength ? parseInt(minLength as string) : undefined,
          maxLength: maxLength ? parseInt(maxLength as string) : undefined
        })
      } else {
        tracks = await trackService.findAll(parseInt(limit as string), parseInt(offset as string))
      }

      res.json({
        message: 'Tracks retrieved successfully',
        data: tracks,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: tracks.length
        }
      })
    } catch (error: any) {
      logger.error('Get tracks endpoint error', { error })
      res.status(500).json({
        error: 'Failed to retrieve tracks',
        message: 'Track retrieval failed'
      })
    }
  })

  /**
   * Get track by ID
   * GET /tracks/:id
   */
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const track = await trackService.findById(id)

      if (!track) {
        return res.status(404).json({
          error: 'Track not found',
          message: 'Track with specified ID does not exist'
        })
      }

      res.json({
        message: 'Track retrieved successfully',
        data: track
      })
    } catch (error: any) {
      logger.error('Get track endpoint error', { error })
      res.status(500).json({
        error: 'Failed to retrieve track',
        message: 'Track retrieval failed'
      })
    }
  }

  /**
   * Update track
   * PUT /tracks/:id
   */
  update = requireOwnership(async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const {
        name,
        shortName,
        description,
        locationName,
        locationCountry,
        locationLat,
        locationLng,
        lengthMeters,
        trackType,
        difficultyLevel,
        centerline,
        boundaries,
        startFinishLine,
        pitLane,
        marshalZones,
        numCorners,
        maxSpeedKmh,
        typicalLapTimeSeconds,
        sectorSplits,
        imageUrl,
        elevationProfileUrl,
        isActive,
        isFeatured,
        tags
      } = req.body

      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (shortName !== undefined) updateData.shortName = shortName
      if (description !== undefined) updateData.description = description
      if (locationName !== undefined) updateData.locationName = locationName
      if (locationCountry !== undefined) updateData.locationCountry = locationCountry
      if (locationLat !== undefined) updateData.locationLat = locationLat
      if (locationLng !== undefined) updateData.locationLng = locationLng
      if (lengthMeters !== undefined) updateData.lengthMeters = lengthMeters
      if (trackType !== undefined) updateData.trackType = trackType
      if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel
      if (centerline !== undefined) {
        updateData.centerline = typeof centerline === 'string' ? JSON.parse(centerline) : centerline
      }
      if (boundaries !== undefined) {
        updateData.boundaries = typeof boundaries === 'string' ? JSON.parse(boundaries) : boundaries
      }
      if (startFinishLine !== undefined) {
        updateData.startFinishLine = typeof startFinishLine === 'string' ? JSON.parse(startFinishLine) : startFinishLine
      }
      if (pitLane !== undefined) {
        updateData.pitLane = typeof pitLane === 'string' ? JSON.parse(pitLane) : pitLane
      }
      if (marshalZones !== undefined) {
        updateData.marshalZones = typeof marshalZones === 'string' ? JSON.parse(marshalZones) : marshalZones
      }
      if (numCorners !== undefined) updateData.numCorners = numCorners
      if (maxSpeedKmh !== undefined) updateData.maxSpeedKmh = maxSpeedKmh
      if (typicalLapTimeSeconds !== undefined) updateData.typicalLapTimeSeconds = typicalLapTimeSeconds
      if (sectorSplits !== undefined) updateData.sectorSplits = sectorSplits
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl
      if (elevationProfileUrl !== undefined) updateData.elevationProfileUrl = elevationProfileUrl
      if (isActive !== undefined) updateData.isActive = isActive
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured
      if (tags !== undefined) updateData.tags = tags

      const track = await trackService.updateTrack(id, updateData, req.userId!)

      if (!track) {
        return res.status(404).json({
          error: 'Track not found',
          message: 'Track with specified ID does not exist'
        })
      }

      res.json({
        message: 'Track updated successfully',
        data: track
      })
    } catch (error: any) {
      logger.error('Update track endpoint error', { error })

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Track not found',
          message: error.message
        })
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          error: 'Permission denied',
          message: error.message
        })
      }

      if (error.message.includes('validation failed')) {
        return res.status(400).json({
          error: 'Track validation failed',
          message: error.message
        })
      }

      res.status(500).json({
        error: 'Failed to update track',
        message: 'Track update failed'
      })
    }
  })

  /**
   * Delete track
   * DELETE /tracks/:id
   */
  delete = requireOwnership(async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      // Check if track is used by any events
      const { eventRepository } = await import('../database/repositories')
      const events = await eventRepository.findByType('TRACK_DAY')
      const trackInUse = events.some(event => event.track_id === id)

      if (trackInUse) {
        return res.status(400).json({
          error: 'Track in use',
          message: 'Cannot delete track that is used by events'
        })
      }

      const deleted = await trackService.deactivate(id, req.userId!)

      if (!deleted) {
        return res.status(404).json({
          error: 'Track not found',
          message: 'Track with specified ID does not exist'
        })
      }

      res.json({
        message: 'Track deleted successfully'
      })
    } catch (error: any) {
      logger.error('Delete track endpoint error', { error })

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Track not found',
          message: error.message
        })
      }

      if (error.message.includes('permission')) {
        return res.status(403).json({
          error: 'Permission denied',
          message: error.message
        })
      }

      res.status(500).json({
        error: 'Failed to delete track',
        message: 'Track deletion failed'
      })
    }
  })

  /**
   * Get tracks by type
   * GET /tracks/type/:type
   */
  getByType = async (req: Request, res: Response) => {
    try {
      const { type } = req.params
      const { limit = 20, offset = 0 } = req.query

      const tracks = await trackService.findByType(type as any, parseInt(limit as string), parseInt(offset as string))

      res.json({
        message: 'Tracks retrieved successfully',
        data: tracks,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: tracks.length
        }
      })
    } catch (error: any) {
      logger.error('Get tracks by type endpoint error', { error })
      res.status(500).json({
        error: 'Failed to retrieve tracks',
        message: 'Track retrieval failed'
      })
    }
  }

  /**
   * Get tracks by difficulty level
   * GET /tracks/difficulty/:level
   */
  getByDifficulty = async (req: Request, res: Response) => {
    try {
      const { level } = req.params
      const { limit = 20, offset = 0 } = req.query

      const tracks = await trackService.findByDifficulty(level as any, parseInt(limit as string), parseInt(offset as string))

      res.json({
        message: 'Tracks retrieved successfully',
        data: tracks,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: tracks.length
        }
      })
    } catch (error: any) {
      logger.error('Get tracks by difficulty endpoint error', { error })
      res.status(500).json({
        error: 'Failed to retrieve tracks',
        message: 'Track retrieval failed'
      })
    }
  }

  /**
   * Get featured tracks
   * GET /tracks/featured
   */
  getFeatured = async (req: Request, res: Response) => {
    try {
      const { limit = 10 } = req.query

      const tracks = await trackService.findFeatured(parseInt(limit as string))

      res.json({
        message: 'Featured tracks retrieved successfully',
        data: tracks
      })
    } catch (error: any) {
      logger.error('Get featured tracks endpoint error', { error })
      res.status(500).json({
        error: 'Failed to retrieve tracks',
        message: 'Track retrieval failed'
      })
    }
  }

  /**
   * Find tracks near location
   * GET /tracks/nearby
   */
  findNearby = async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius = 100 } = req.query

      if (!lat || !lng) {
        return res.status(400).json({
          error: 'Missing coordinates',
          message: 'Latitude and longitude are required'
        })
      }

      const tracks = await trackService.findTracksNearLocation(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string)
      )

      res.json({
        message: 'Nearby tracks retrieved successfully',
        data: tracks,
        search: {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string),
          radius: parseFloat(radius as string)
        }
      })
    } catch (error: any) {
      logger.error('Find nearby tracks endpoint error', { error })
      res.status(500).json({
        error: 'Failed to find nearby tracks',
        message: 'Track search failed'
      })
    }
  }

  /**
   * Project GPS point to track
   * POST /tracks/:id/project
   */
  projectPoint = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { lat, lng } = req.body

      if (!lat || !lng) {
        return res.status(400).json({
          error: 'Missing coordinates',
          message: 'Latitude and longitude are required'
        })
      }

      const projection = await trackService.projectToTrack(id, parseFloat(lat), parseFloat(lng))

      if (!projection) {
        return res.status(404).json({
          error: 'Track not found',
          message: 'Track with specified ID does not exist or has no centerline'
        })
      }

      res.json({
        message: 'Point projected successfully',
        data: projection
      })
    } catch (error: any) {
      logger.error('Project point endpoint error', { error })
      res.status(500).json({
        error: 'Failed to project point',
        message: 'Point projection failed'
      })
    }
  }

  /**
   * Get track bounds for map display
   * GET /tracks/:id/bounds
   */
  getBounds = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const bounds = await trackService.getTrackBounds(id)

      if (!bounds) {
        return res.status(404).json({
          error: 'Track not found',
          message: 'Track with specified ID does not exist or has no centerline'
        })
      }

      res.json({
        message: 'Track bounds retrieved successfully',
        data: {
          bounds,
          southwest: [bounds[1], bounds[0]],
          northeast: [bounds[3], bounds[2]]
        }
      })
    } catch (error: any) {
      logger.error('Get track bounds endpoint error', { error })
      res.status(500).json({
        error: 'Failed to get track bounds',
        message: 'Track bounds retrieval failed'
      })
    }
  }

  /**
   * Validate track geometry
   * POST /tracks/validate
   */
  validate = async (req: Request, res: Response) => {
    try {
      const {
        name,
        centerline,
        boundaries,
        startFinishLine,
        lengthMeters,
        numCorners
      } = req.body

      if (!centerline) {
        return res.status(400).json({
          error: 'Missing centerline',
          message: 'Centerline is required for validation'
        })
      }

      const validation = await trackService.validateTrackGeometry({
        name: name || 'Test Track',
        centerline: typeof centerline === 'string' ? JSON.parse(centerline) : centerline,
        boundaries: boundaries ? (typeof boundaries === 'string' ? JSON.parse(boundaries) : boundaries) : undefined,
        startFinishLine: startFinishLine ? (typeof startFinishLine === 'string' ? JSON.parse(startFinishLine) : startFinishLine) : undefined,
        lengthMeters,
        numCorners
      })

      res.json({
        message: 'Track validation completed',
        data: validation
      })
    } catch (error: any) {
      logger.error('Validate track endpoint error', { error })
      res.status(500).json({
        error: 'Failed to validate track',
        message: 'Track validation failed'
      })
    }
  }
}

// Export singleton instance
export const trackController = new TrackController()
