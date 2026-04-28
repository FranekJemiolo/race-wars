/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { authenticateToken, requireAdmin, optionalAuthentication } from '../middleware/auth.middleware'

const router = Router()

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register.bind(authController))

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login.bind(authController))

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public (client-side token removal)
 */
router.post('/logout', authController.logout.bind(authController))

/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token
 * @access  Public
 */
router.post('/verify', authController.verifyToken.bind(authController))

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile.bind(authController))

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers.bind(authController))

/**
 * @route   PATCH /api/auth/users/role
 * @desc    Update user role (admin only)
 * @access  Private (Admin)
 */
router.patch('/users/role', authenticateToken, requireAdmin, authController.updateUserRole.bind(authController))

export default router
