/**
 * Participation Routes
 * Handles race participation tracking and results
 */

import { Router } from 'express'
import { participationController } from '../controllers/participation.controller'
import { authenticateToken, requireAdmin, optionalAuthentication } from '../middleware/auth.middleware'

const router = Router()

/**
 * @route   GET /api/participation/races/:raceId/participants
 * @desc    Get participants for a race
 * @access  Public
 */
router.get('/races/:raceId/participants', optionalAuthentication, participationController.getRaceParticipants.bind(participationController))

/**
 * @route   GET /api/participation/races/:raceId/active
 * @desc    Get active participants for a race
 * @access  Public
 */
router.get('/races/:raceId/active', optionalAuthentication, participationController.getActiveParticipants.bind(participationController))

/**
 * @route   GET /api/participation/races/:raceId/results
 * @desc    Get race results
 * @access  Public
 */
router.get('/races/:raceId/results', optionalAuthentication, participationController.getRaceResults.bind(participationController))

/**
 * @route   GET /api/participation/races/:raceId/leaderboard
 * @desc    Get race leaderboard
 * @access  Public
 */
router.get('/races/:raceId/leaderboard', optionalAuthentication, participationController.getRaceLeaderboard.bind(participationController))

/**
 * @route   GET /api/participation/user/history
 * @desc    Get user participation history
 * @access  Private
 */
router.get('/user/history', authenticateToken, participationController.getUserParticipationHistory.bind(participationController))

/**
 * @route   GET /api/participation/user/results
 * @desc    Get user race results
 * @access  Private
 */
router.get('/user/results', authenticateToken, participationController.getUserRaceResults.bind(participationController))

/**
 * @route   GET /api/participation/user/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/user/stats', authenticateToken, participationController.getUserStats.bind(participationController))

/**
 * @route   GET /api/participation/leaderboard
 * @desc    Get overall leaderboard
 * @access  Public
 */
router.get('/leaderboard', optionalAuthentication, participationController.getOverallLeaderboard.bind(participationController))

/**
 * @route   POST /api/participation/checkpoint
 * @desc    Update checkpoint progress
 * @access  Private
 */
router.post('/checkpoint', authenticateToken, participationController.updateCheckpointProgress.bind(participationController))

/**
 * @route   POST /api/participation/finish
 * @desc    Finish race for participant (admin only)
 * @access  Private (Admin)
 */
router.post('/finish', authenticateToken, requireAdmin, participationController.finishRaceParticipant.bind(participationController))

/**
 * @route   POST /api/participation/dnf
 * @desc    Mark participant as DNF (admin only)
 * @access  Private (Admin)
 */
router.post('/dnf', authenticateToken, requireAdmin, participationController.markDNF.bind(participationController))

export default router
