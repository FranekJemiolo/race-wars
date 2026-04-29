/**
 * Leaderboard API Routes
 * 
 * Provides REST endpoints for race leaderboard operations
 */

import { Router } from 'express';
import LeaderboardService, { PositionUpdate } from '../services/leaderboard.service';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const leaderboardService = new LeaderboardService();

/**
 * GET /api/leaderboard/:raceId
 * Get current leaderboard for a race
 */
router.get('/:raceId', authenticateToken, async (req, res) => {
  try {
    const { raceId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    logger.info(`Getting leaderboard for race: ${raceId}`);

    const leaderboard = await leaderboardService.getLeaderboard(raceId);

    // Apply pagination if needed
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedEntries = leaderboard.entries.slice(startIndex, endIndex);
    
    const response = {
      ...leaderboard,
      entries: paginatedEntries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: leaderboard.entries.length,
        pages: Math.ceil(leaderboard.entries.length / limitNum)
      }
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Failed to get leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leaderboard/:raceId/participant/:participantId
 * Get detailed participant information
 */
router.get('/:raceId/participant/:participantId', authenticateToken, async (req, res) => {
  try {
    const { raceId, participantId } = req.params;

    logger.info(`Getting participant position for race: ${raceId}, participant: ${participantId}`);

    const participant = await leaderboardService.getParticipantPosition(raceId, participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found',
        message: `Participant ${participantId} not found in race ${raceId}`
      });
    }

    res.json({
      success: true,
      data: participant
    });
  } catch (error) {
    logger.error('Failed to get participant position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get participant position',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/leaderboard/:raceId/position
 * Update participant position
 */
router.post('/:raceId/position', authenticateToken, async (req, res) => {
  try {
    const { raceId } = req.params;
    const positionData: PositionUpdate = req.body;

    // Validate position data
    if (!positionData.position || !positionData.lap || !positionData.checkpointIndex) {
      return res.status(400).json({
        success: false,
        error: 'Invalid position data',
        message: 'Position, lap, and checkpointIndex are required'
      });
    }

    if (!positionData.coordinates || !positionData.coordinates.lat || !positionData.coordinates.lng) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
        message: 'Coordinates with lat and lng are required'
      });
    }

    logger.info(`Updating position for race: ${raceId}`);

    await leaderboardService.updatePosition(raceId, req.body.participantId, positionData);

    res.json({
      success: true,
      message: 'Position update queued successfully'
    });
  } catch (error) {
    logger.error('Failed to update position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update position',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/leaderboard/:raceId/initialize
 * Initialize leaderboard for a race
 */
router.post('/:raceId/initialize', authenticateToken, async (req, res) => {
  try {
    const { raceId } = req.params;
    const { raceName } = req.body;

    if (!raceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing race name',
        message: 'Race name is required'
      });
    }

    logger.info(`Initializing leaderboard for race: ${raceId}`);

    await leaderboardService.initializeRaceLeaderboard(raceId, raceName);

    res.json({
      success: true,
      message: 'Leaderboard initialized successfully'
    });
  } catch (error) {
    logger.error('Failed to initialize leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/leaderboard/:raceId/finish/:participantId
 * Mark participant as finished
 */
router.post('/:raceId/finish/:participantId', authenticateToken, async (req, res) => {
  try {
    const { raceId, participantId } = req.params;
    const { totalTime } = req.body;

    if (!totalTime || totalTime <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid total time',
        message: 'Total time must be a positive number'
      });
    }

    logger.info(`Finishing participant: ${participantId} in race: ${raceId}`);

    await leaderboardService.finishParticipant(raceId, participantId, totalTime);

    res.json({
      success: true,
      message: 'Participant finished successfully'
    });
  } catch (error) {
    logger.error('Failed to finish participant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finish participant',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/leaderboard/:raceId/finish
 * Finish the entire race
 */
router.post('/:raceId/finish', authenticateToken, async (req, res) => {
  try {
    const { raceId } = req.params;

    logger.info(`Finishing race: ${raceId}`);

    await leaderboardService.finishRace(raceId);

    res.json({
      success: true,
      message: 'Race finished successfully'
    });
  } catch (error) {
    logger.error('Failed to finish race:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finish race',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leaderboard/:raceId/statistics
 * Get race statistics
 */
router.get('/:raceId/statistics', authenticateToken, async (req, res) => {
  try {
    const { raceId } = req.params;

    logger.info(`Getting statistics for race: ${raceId}`);

    const stats = await leaderboardService.getRaceStatistics(raceId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get race statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get race statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/leaderboard/:raceId/cache
 * Clear cache for a race (admin only)
 */
router.delete('/:raceId/cache', authenticateToken, async (req, res) => {
  try {
    const { raceId } = req.params;

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    logger.info(`Clearing cache for race: ${raceId}`);

    leaderboardService.clearCache(raceId);

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/leaderboard/active
 * Get all active leaderboards
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    logger.info('Getting all active leaderboards');

    // This would require a new method in LeaderboardService
    // For now, return empty array as placeholder
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Failed to get active leaderboards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active leaderboards',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
