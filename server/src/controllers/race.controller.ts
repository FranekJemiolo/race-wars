/**
 * Race Controller
 * Handles all race-related API endpoints
 */

import { Request, Response } from 'express'
import { raceService } from '../services/race.service'
import { logger } from '../utils/logger'

export class RaceController {
  /**
   * Get all available races
   */
  async getRaces(req: Request, res: Response) {
    try {
      const races = await raceService.getAllRaces()
      res.json(races)
    } catch (error) {
      logger.error('Failed to get races:', error)
      res.status(500).json({ error: 'Failed to fetch races' })
    }
  }

  /**
   * Get a specific race by ID
   */
  async getRace(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      const race = await raceService.getRaceById(raceId)
      
      if (!race) {
        return res.status(404).json({ error: 'Race not found' })
      }
      
      res.json(race)
    } catch (error) {
      logger.error('Failed to get race:', error)
      res.status(500).json({ error: 'Failed to fetch race' })
    }
  }

  /**
   * Create a new race
   */
  async createRace(req: Request, res: Response) {
    try {
      const raceData = req.body
      
      // Validate required fields
      if (!raceData.name || !raceData.trackName || !raceData.type) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, trackName, type' 
        })
      }

      // Validate race type
      const validTypes = ['circuit', 'custom', 'duel']
      if (!validTypes.includes(raceData.type)) {
        return res.status(400).json({ 
          error: 'Invalid race type. Must be: circuit, custom, or duel' 
        })
      }

      // Validate start time (must be at least 5 minutes in the future)
      const minStartTime = new Date(Date.now() + 5 * 60000)
      const startTime = new Date(raceData.startTime)
      if (startTime < minStartTime) {
        return res.status(400).json({ 
          error: 'Start time must be at least 5 minutes in the future' 
        })
      }

      // Validate participant limits
      if (raceData.maxParticipants < 2 || raceData.maxParticipants > 50) {
        return res.status(400).json({ 
          error: 'Max participants must be between 2 and 50' 
        })
      }

      // Validate duration (5 minutes to 2 hours)
      if (raceData.duration < 300 || raceData.duration > 7200) {
        return res.status(400).json({ 
          error: 'Duration must be between 5 minutes and 2 hours' 
        })
      }

      const race = await raceService.createRace(raceData)
      res.status(201).json(race)
    } catch (error) {
      logger.error('Failed to create race:', error)
      res.status(500).json({ error: 'Failed to create race' })
    }
  }

  /**
   * Join a race
   */
  async joinRace(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      const userId = req.user?.id // Assuming auth middleware adds user info
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const result = await raceService.joinRace(raceId, userId)
      
      if (!result.success) {
        return res.status(400).json({ error: result.error })
      }
      
      res.json({ message: 'Successfully joined race' })
    } catch (error) {
      logger.error('Failed to join race:', error)
      res.status(500).json({ error: 'Failed to join race' })
    }
  }

  /**
   * Leave a race
   */
  async leaveRace(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      const userId = req.user?.id
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const result = await raceService.leaveRace(raceId, userId)
      
      if (!result.success) {
        return res.status(400).json({ error: result.error })
      }
      
      res.json({ message: 'Successfully left race' })
    } catch (error) {
      logger.error('Failed to leave race:', error)
      res.status(500).json({ error: 'Failed to leave race' })
    }
  }

  /**
   * Spectate a race
   */
  async spectateRace(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      const userId = req.user?.id
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const result = await raceService.spectateRace(raceId, userId)
      
      if (!result.success) {
        return res.status(400).json({ error: result.error })
      }
      
      res.json({ message: 'Successfully joined as spectator' })
    } catch (error) {
      logger.error('Failed to spectate race:', error)
      res.status(500).json({ error: 'Failed to spectate race' })
    }
  }

  /**
   * Get available tracks
   */
  async getTracks(req: Request, res: Response) {
    try {
      const tracks = await raceService.getAvailableTracks()
      res.json(tracks)
    } catch (error) {
      logger.error('Failed to get tracks:', error)
      res.status(500).json({ error: 'Failed to fetch tracks' })
    }
  }

  /**
   * Get track details with checkpoints
   */
  async getTrackDetails(req: Request, res: Response) {
    try {
      const { trackName } = req.query
      
      if (!trackName) {
        return res.status(400).json({ error: 'Track name is required' })
      }

      const trackDetails = await raceService.getTrackDetails(trackName as string)
      
      if (!trackDetails) {
        return res.status(404).json({ error: 'Track not found' })
      }
      
      res.json(trackDetails)
    } catch (error) {
      logger.error('Failed to get track details:', error)
      res.status(500).json({ error: 'Failed to fetch track details' })
    }
  }

  /**
   * Update race status (for race management)
   */
  async updateRaceStatus(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      const { status } = req.body
      
      const validStatuses = ['waiting', 'starting', 'in-progress', 'finished']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status. Must be: waiting, starting, in-progress, or finished' 
        })
      }

      const race = await raceService.updateRaceStatus(raceId, status)
      
      if (!race) {
        return res.status(404).json({ error: 'Race not found' })
      }
      
      res.json(race)
    } catch (error) {
      logger.error('Failed to update race status:', error)
      res.status(500).json({ error: 'Failed to update race status' })
    }
  }
}

export const raceController = new RaceController()
