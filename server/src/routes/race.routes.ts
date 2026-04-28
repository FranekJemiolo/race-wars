/**
 * Race Routes
 * API endpoints for race management
 */

import { Router } from 'express'
import { raceController } from '../controllers/race.controller'

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
router.post('/', raceController.createRace.bind(raceController))

/**
 * @route   POST /api/races/:raceId/join
 * @desc    Join a race
 * @access  Private (requires authentication)
 */
router.post('/:raceId/join', raceController.joinRace.bind(raceController))

/**
 * @route   POST /api/races/:raceId/leave
 * @desc    Leave a race
 * @access  Private (requires authentication)
 */
router.post('/:raceId/leave', raceController.leaveRace.bind(raceController))

/**
 * @route   POST /api/races/:raceId/spectate
 * @desc    Spectate a race
 * @access  Private (requires authentication)
 */
router.post('/:raceId/spectate', raceController.spectateRace.bind(raceController))


/**
 * @route   PATCH /api/races/:raceId/status
 * @desc    Update race status
 * @access  Private (requires admin privileges)
 */
router.patch('/:raceId/status', raceController.updateRaceStatus.bind(raceController))

export default router
