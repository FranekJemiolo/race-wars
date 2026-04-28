/**
 * Route Routes
 * Handles custom route creation and management
 */

import { Router } from 'express'
import { routeController } from '../controllers/route.controller'
import { authenticateToken, optionalAuthentication } from '../middleware/auth.middleware'

const router = Router()

/**
 * @route   POST /api/routes
 * @desc    Create a new route
 * @access  Private
 */
router.post('/', authenticateToken, routeController.createRoute.bind(routeController))

/**
 * @route   GET /api/routes
 * @desc    Get all routes (with optional filters)
 * @access  Public
 */
router.get('/', optionalAuthentication, routeController.getAllRoutes.bind(routeController))

/**
 * @route   GET /api/routes/user
 * @desc    Get routes created by current user
 * @access  Private
 */
router.get('/user', authenticateToken, routeController.getUserRoutes.bind(routeController))

/**
 * @route   GET /api/routes/search
 * @desc    Search routes by tags
 * @access  Public
 */
router.get('/search', optionalAuthentication, routeController.searchRoutes.bind(routeController))

/**
 * @route   GET /api/routes/type/:type
 * @desc    Get routes by type
 * @access  Public
 */
router.get('/type/:type', optionalAuthentication, routeController.getRoutesByType.bind(routeController))

/**
 * @route   GET /api/routes/difficulty/:difficulty
 * @desc    Get routes by difficulty
 * @access  Public
 */
router.get('/difficulty/:difficulty', optionalAuthentication, routeController.getRoutesByDifficulty.bind(routeController))

/**
 * @route   GET /api/routes/:routeId
 * @desc    Get route by ID
 * @access  Public
 */
router.get('/:routeId', optionalAuthentication, routeController.getRouteById.bind(routeController))

/**
 * @route   PUT /api/routes/:routeId
 * @desc    Update a route
 * @access  Private (creator only)
 */
router.put('/:routeId', authenticateToken, routeController.updateRoute.bind(routeController))

/**
 * @route   DELETE /api/routes/:routeId
 * @desc    Delete a route
 * @access  Private (creator only)
 */
router.delete('/:routeId', authenticateToken, routeController.deleteRoute.bind(routeController))

/**
 * @route   GET /api/routes/:routeId/convert
 * @desc    Convert route to track format
 * @access  Public
 */
router.get('/:routeId/convert', optionalAuthentication, routeController.convertRouteToTrack.bind(routeController))

export default router
