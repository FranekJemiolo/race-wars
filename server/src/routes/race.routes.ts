/**
 * Race Routes
 * API endpoints for race management
 */

import { Router } from 'express'
import { raceController } from '../controllers/race.controller'
import { authenticateToken, requireVerifiedUser, allowSpectators, requireAdmin } from '../middleware/auth.middleware'

const router = Router()

/**
 * @route   GET /api/races
 * @desc    Get all available races
 * @access  Public
 */
router.get('/', raceController.getRaces.bind(raceController))

/**
 * @route   GET /api/races/:raceId
 * @desc    Get a specific race by ID
 * @access  Public
 */
router.get('/:raceId', raceController.getRace.bind(raceController))

/**
 * @route   POST /api/races
 * @desc    Create a new race
 * @access  Private (requires authentication)
 */
router.post('/', authenticateToken, requireVerifiedUser, raceController.createRace.bind(raceController))

/**
 * @route   POST /api/races/:raceId/join
 * @desc    Join a race
 * @access  Private (requires authentication)
 */
router.post('/:raceId/join', authenticateToken, requireVerifiedUser, raceController.joinRace.bind(raceController))

/**
 * @route   POST /api/races/:raceId/leave
 * @desc    Leave a race
 * @access  Private (requires authentication)
 */
router.post('/:raceId/leave', authenticateToken, raceController.leaveRace.bind(raceController))

/**
 * @route   POST /api/races/:raceId/spectate
 * @desc    Spectate a race
 * @access  Public (spectators allowed)
 */
router.post('/:raceId/spectate', allowSpectators, raceController.spectateRace.bind(raceController))

/**
 * @route   GET /api/tracks
 * @desc    Get available tracks
 * @access  Public
 */
router.get('/tracks', raceController.getTracks.bind(raceController))

/**
 * @route   GET /api/tracks/details
 * @desc    Get track details with checkpoints
 * @access  Public
 */
router.get('/tracks/details', raceController.getTrackDetails.bind(raceController))

/**
 * @route   PATCH /api/races/:raceId/status
 * @desc    Update race status
 * @access  Private (requires admin privileges)
 */
router.patch('/:raceId/status', authenticateToken, requireAdmin, raceController.updateRaceStatus.bind(raceController))

export default router
