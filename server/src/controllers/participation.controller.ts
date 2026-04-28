/**
 * Participation Controller
 * Handles race participation tracking and results
 */

import { Request, Response } from 'express'
import { participationService } from '../services/participation.service'
import { logger } from '../utils/logger'

export class ParticipationController {
  /**
   * Get participants for a race
   */
  async getRaceParticipants(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      
      if (!raceId) {
        return res.status(400).json({
          success: false,
          error: 'Race ID is required'
        })
      }

      const participants = await participationService.getRaceParticipants(raceId)
      
      res.json({
        success: true,
        data: { participants }
      })
    } catch (error) {
      logger.error('Failed to get race participants:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get participants'
      })
    }
  }

  /**
   * Get active participants for a race
   */
  async getActiveParticipants(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      
      if (!raceId) {
        return res.status(400).json({
          success: false,
          error: 'Race ID is required'
        })
      }

      const participants = await participationService.getActiveParticipants(raceId)
      
      res.json({
        success: true,
        data: { participants }
      })
    } catch (error) {
      logger.error('Failed to get active participants:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get active participants'
      })
    }
  }

  /**
   * Get race results
   */
  async getRaceResults(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      
      if (!raceId) {
        return res.status(400).json({
          success: false,
          error: 'Race ID is required'
        })
      }

      const results = await participationService.getRaceResults(raceId)
      
      res.json({
        success: true,
        data: { results }
      })
    } catch (error) {
      logger.error('Failed to get race results:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get results'
      })
    }
  }

  /**
   * Get race leaderboard
   */
  async getRaceLeaderboard(req: Request, res: Response) {
    try {
      const { raceId } = req.params
      
      if (!raceId) {
        return res.status(400).json({
          success: false,
          error: 'Race ID is required'
        })
      }

      const leaderboard = await participationService.getRaceLeaderboard(raceId)
      
      res.json({
        success: true,
        data: { leaderboard }
      })
    } catch (error) {
      logger.error('Failed to get race leaderboard:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get leaderboard'
      })
    }
  }

  /**
   * Get user participation history
   */
  async getUserParticipationHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const { limit } = req.query
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const history = await participationService.getUserParticipationHistory(
        user.id, 
        limit ? parseInt(limit as string) : 50
      )
      
      res.json({
        success: true,
        data: { history }
      })
    } catch (error) {
      logger.error('Failed to get user participation history:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get participation history'
      })
    }
  }

  /**
   * Get user race results
   */
  async getUserRaceResults(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const { limit } = req.query
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const results = await participationService.getUserRaceResults(
        user.id, 
        limit ? parseInt(limit as string) : 50
      )
      
      res.json({
        success: true,
        data: { results }
      })
    } catch (error) {
      logger.error('Failed to get user race results:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get race results'
      })
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req: Request, res: Response) {
    try {
      const user = (req as any).user
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const stats = await participationService.getUserStats(user.id)
      
      if (!stats) {
        return res.json({
          success: true,
          data: { 
            stats: {
              totalRaces: 0,
              racesFinished: 0,
              racesWon: 0,
              podiums: 0,
              totalRacingTime: 0,
              totalPoints: 0,
              totalPrizeMoney: 0,
              dnfCount: 0,
              dsqCount: 0
            }
          }
        })
      }
      
      res.json({
        success: true,
        data: { stats }
      })
    } catch (error) {
      logger.error('Failed to get user stats:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get user stats'
      })
    }
  }

  /**
   * Get overall leaderboard
   */
  async getOverallLeaderboard(req: Request, res: Response) {
    try {
      const { limit } = req.query
      
      const leaderboard = await participationService.getOverallLeaderboard(
        limit ? parseInt(limit as string) : 100
      )
      
      res.json({
        success: true,
        data: { leaderboard }
      })
    } catch (error) {
      logger.error('Failed to get overall leaderboard:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get leaderboard'
      })
    }
  }

  /**
   * Update checkpoint progress (for race tracking)
   */
  async updateCheckpointProgress(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const { participantId, checkpointNumber, lapTime } = req.body
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      if (!participantId || checkpointNumber === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Participant ID and checkpoint number are required'
        })
      }

      await participationService.updateCheckpointProgress(
        participantId, 
        checkpointNumber, 
        lapTime
      )
      
      res.json({
        success: true,
        message: 'Checkpoint progress updated'
      })
    } catch (error) {
      logger.error('Failed to update checkpoint progress:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update checkpoint progress'
      })
    }
  }

  /**
   * Finish race for participant (admin only)
   */
  async finishRaceParticipant(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const { participantId, position, totalTime, bestLapTime } = req.body
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        })
      }

      if (!participantId || position === undefined || totalTime === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Participant ID, position, and total time are required'
        })
      }

      await participationService.finishParticipant(
        participantId, 
        position, 
        totalTime, 
        bestLapTime
      )
      
      res.json({
        success: true,
        message: 'Race participant finished'
      })
    } catch (error) {
      logger.error('Failed to finish race participant:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to finish race participant'
      })
    }
  }

  /**
   * Mark participant as DNF (admin only)
   */
  async markDNF(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const { participantId, reason } = req.body
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        })
      }

      if (!participantId) {
        return res.status(400).json({
          success: false,
          error: 'Participant ID is required'
        })
      }

      await participationService.markDNF(participantId, reason)
      
      res.json({
        success: true,
        message: 'Participant marked as DNF'
      })
    } catch (error) {
      logger.error('Failed to mark participant as DNF:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to mark participant as DNF'
      })
    }
  }
}

export const participationController = new ParticipationController()
