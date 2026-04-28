/**
 * Authentication Routes
 * 
 * Express router configuration for authentication endpoints.
 * Combines controllers with appropriate middleware.
 */

import { Router } from 'express'
import { authController } from './auth.controller'
import { requireAuth, validateTokenFormat } from './auth.middleware'

const router = Router()

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', authController.register)

/**
 * POST /auth/login
 * Authenticate user
 */
router.post('/login', authController.login)

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', authController.refreshToken)

/**
 * GET /auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', requireAuth, authController.getCurrentUser)

/**
 * PUT /auth/password
 * Change password (requires authentication)
 */
router.put('/password', requireAuth, authController.changePassword)

/**
 * POST /auth/reset-password
 * Reset password (requires email verification in production)
 */
router.post('/reset-password', authController.resetPassword)

/**
 * POST /auth/logout
 * Logout user (requires authentication)
 */
router.post('/logout', requireAuth, authController.logout)

/**
 * GET /auth/validate
 * Validate token (for debugging/testing)
 */
router.get('/validate', validateTokenFormat, authController.validateToken)

export default router
