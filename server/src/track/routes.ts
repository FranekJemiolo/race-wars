/**
 * Track Routes
 * 
 * Express router configuration for track management endpoints.
 * Combines controllers with appropriate middleware for track operations.
 */

import { Router } from 'express'
import { trackController } from './track.controller'
import { requireAuth, requireAdmin, optionalAuth } from '../auth'

const router = Router()

/**
 * POST /tracks
 * Create a new track (requires authentication)
 */
router.post('/', requireAuth, trackController.create)

/**
 * GET /tracks
 * Get all tracks with optional filtering (public access)
 */
router.get('/', optionalAuth, trackController.getAll)

/**
 * GET /tracks/featured
 * Get featured tracks (public access)
 */
router.get('/featured', trackController.getFeatured)

/**
 * GET /tracks/nearby
 * Find tracks near a location (public access)
 */
router.get('/nearby', trackController.findNearby)

/**
 * GET /tracks/type/:type
 * Get tracks by type (public access)
 */
router.get('/type/:type', trackController.getByType)

/**
 * GET /tracks/difficulty/:level
 * Get tracks by difficulty level (public access)
 */
router.get('/difficulty/:level', trackController.getByDifficulty)

/**
 * POST /tracks/validate
 * Validate track geometry (requires authentication)
 */
router.post('/validate', requireAuth, trackController.validate)

/**
 * GET /tracks/:id
 * Get track by ID (public access)
 */
router.get('/:id', trackController.getById)

/**
 * PUT /tracks/:id
 * Update track (requires ownership)
 */
router.put('/:id', trackController.update)

/**
 * DELETE /tracks/:id
 * Delete track (requires ownership)
 */
router.delete('/:id', trackController.delete)

/**
 * GET /tracks/:id/bounds
 * Get track bounds for map display (public access)
 */
router.get('/:id/bounds', trackController.getBounds)

/**
 * POST /tracks/:id/project
 * Project GPS point to track (requires authentication)
 */
router.post('/:id/project', requireAuth, trackController.projectPoint)

export default router
