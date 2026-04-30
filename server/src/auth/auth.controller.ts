/**
 * Authentication Controller
 * 
 * HTTP endpoints for user authentication, registration, and token management.
 * Handles login, logout, registration, password changes, and token refresh.
 */

import { Request, Response, NextFunction } from 'express'
import { authService } from './auth.service'
import { authRateLimit } from './auth.middleware'
import { logger } from '../utils/logger'

export class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  register = authRateLimit(3, 15 * 60 * 1000)(async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        displayName,
        phone,
        dateOfBirth,
        licenseNumber,
        licenseExpiry,
        experienceLevel
      } = req.body

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !displayName) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Email, password, first name, last name, and display name are required'
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email',
          message: 'Please provide a valid email address'
        })
      }

      const result = await authService.register({
        email: email.toLowerCase().trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        phone: phone?.trim() || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        licenseNumber: licenseNumber?.trim() || undefined,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
        experienceLevel
      })

      res.status(201).json({
        message: 'User registered successfully',
        data: result
      })
    } catch (error: any) {
      logger.error('Registration endpoint error', { error })

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        })
      }

      if (error.message.includes('Password must')) {
        return res.status(400).json({
          error: 'Invalid password',
          message: error.message
        })
      }

      res.status(500).json({
        error: 'Registration failed',
        message: 'Failed to register user'
      })
    }
  })

  /**
   * Authenticate user
   * POST /auth/login
   */
  login = authRateLimit(5, 15 * 60 * 1000)(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          error: 'Missing credentials',
          message: 'Email and password are required'
        })
      }

      const result = await authService.login({
        email: email.toLowerCase().trim(),
        password
      })

      res.json({
        message: 'Login successful',
        data: result
      })
    } catch (error: any) {
      logger.error('Login endpoint error', { error })

      if (error.message.includes('Invalid email or password') || 
          error.message.includes('Account is deactivated')) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: error.message
        })
      }

      res.status(500).json({
        error: 'Login failed',
        message: 'Failed to authenticate user'
      })
    }
  })

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Missing refresh token',
          message: 'Refresh token is required'
        })
      }

      const tokens = await authService.refreshToken({ refreshToken })

      res.json({
        message: 'Token refreshed successfully',
        data: tokens
      })
    } catch (error: any) {
      logger.error('Token refresh endpoint error', { error })

      if (error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(401).json({
          error: 'Token refresh failed',
          message: 'Invalid or expired refresh token'
        })
      }

      res.status(500).json({
        error: 'Token refresh failed',
        message: 'Failed to refresh token'
      })
    }
  })

  /**
   * Get current user info
   * GET /auth/me
   */
  getCurrentUser = async (req: Request, res: Response) => {
    try {
      // User should be attached by auth middleware
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'Please login to access this resource'
        })
      }

      res.json({
        message: 'User retrieved successfully',
        data: {
          user: req.user,
          userId: req.userId,
          userRole: req.userRole
        }
      })
    } catch (error: any) {
      logger.error('Get current user endpoint error', { error })

      res.status(500).json({
        error: 'Failed to get user',
        message: 'Failed to retrieve user information'
      })
    }
  }

  /**
   * Change password
   * PUT /auth/password
   */
  changePassword = authRateLimit(3, 15 * 60 * 1000)(async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Missing passwords',
          message: 'Current password and new password are required'
        })
      }

      if (!req.userId) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'Please login to change password'
        })
      }

      await authService.changePassword(req.userId, currentPassword, newPassword)

      res.json({
        message: 'Password changed successfully'
      })
    } catch (error: any) {
      logger.error('Change password endpoint error', { error })

      if (error.message.includes('incorrect') || error.message.includes('Password must')) {
        return res.status(400).json({
          error: 'Password change failed',
          message: error.message
        })
      }

      res.status(500).json({
        error: 'Password change failed',
        message: 'Failed to change password'
      })
    }
  })

  /**
   * Reset password (would typically require email verification)
   * POST /auth/reset-password
   */
  resetPassword = authRateLimit(3, 60 * 60 * 1000)(async (req: Request, res: Response) => {
    try {
      const { email, newPassword, resetToken } = req.body

      // In a real implementation, you would verify the resetToken
      // For now, we'll just require email and new password
      if (!email || !newPassword) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Email and new password are required'
        })
      }

      await authService.resetPassword(email.toLowerCase().trim(), newPassword)

      res.json({
        message: 'Password reset successfully'
      })
    } catch (error: any) {
      logger.error('Reset password endpoint error', { error })

      if (error.message.includes('Password must')) {
        return res.status(400).json({
          error: 'Invalid password',
          message: error.message
        })
      }

      res.status(500).json({
        error: 'Password reset failed',
        message: 'Failed to reset password'
      })
    }
  })

  /**
   * Logout user
   * POST /auth/logout
   */
  logout = async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'Please login to logout'
        })
      }

      await authService.logout(req.userId)

      res.json({
        message: 'Logout successful'
      })
    } catch (error: any) {
      logger.error('Logout endpoint error', { error })

      res.status(500).json({
        error: 'Logout failed',
        message: 'Failed to logout user'
      })
    }
  }

  /**
   * Validate token (for debugging/testing)
   * GET /auth/validate
   */
  validateToken = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(400).json({
          error: 'No token provided',
          message: 'Authorization header required'
        })
      }

      const { jwtService } = await import('./jwt.service')
      const token = jwtService.extractTokenFromHeader(authHeader)
      
      if (!token) {
        return res.status(400).json({
          error: 'Invalid token format',
          message: 'Token must be in format: Bearer <token>'
        })
      }

      const authData = await authService.validateToken(token)

      res.json({
        message: 'Token is valid',
        data: {
          userId: authData.userId,
          email: authData.email,
          role: authData.role,
          user: authData.user,
          expiration: jwtService.getTokenExpiration(token),
          remainingTime: jwtService.getTokenRemainingTime(token)
        }
      })
    } catch (error: any) {
      logger.error('Token validation endpoint error', { error })

      res.status(401).json({
        error: 'Token validation failed',
        message: 'Invalid or expired token'
      })
    }
  }
}

// Export singleton instance
export const authController = new AuthController()
