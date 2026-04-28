/**
 * Authentication Controller
 * Handles user registration, login, and authentication endpoints
 */

import { Request, Response } from 'express'
import { authService, RegisterRequest, LoginRequest } from '../services/auth.service'
import { logger } from '../utils/logger'

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    try {
      const registerData: RegisterRequest = req.body
      
      const result = await authService.register(registerData)
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      })
    } catch (error) {
      logger.error('Registration failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      const statusCode = errorMessage.includes('already') ? 409 : 400
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      })
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response) {
    try {
      const loginData: LoginRequest = req.body
      
      const result = await authService.login(loginData)
      
      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      })
    } catch (error) {
      logger.error('Login failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      const statusCode = errorMessage.includes('Invalid credentials') ? 401 : 400
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      })
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        })
      }

      res.json({
        success: true,
        data: { user }
      })
    } catch (error) {
      logger.error('Get profile failed:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      })
    }
  }

  /**
   * Verify token
   */
  async verifyToken(req: Request, res: Response) {
    try {
      const { token } = req.body
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required'
        })
      }

      const user = await authService.verifyToken(token)
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        })
      }

      res.json({
        success: true,
        data: { user },
        message: 'Token is valid'
      })
    } catch (error) {
      logger.error('Token verification failed:', error)
      res.status(500).json({
        success: false,
        error: 'Token verification failed'
      })
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  async logout(req: Request, res: Response) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // But we could implement token blacklisting if needed
      res.json({
        success: true,
        message: 'Logout successful'
      })
    } catch (error) {
      logger.error('Logout failed:', error)
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      })
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const user = (req as any).user
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        })
      }

      const users = await authService.getAllUsers()
      
      res.json({
        success: true,
        data: { users }
      })
    } catch (error) {
      logger.error('Get all users failed:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get users'
      })
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(req: Request, res: Response) {
    try {
      const adminUser = (req as any).user
      
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        })
      }

      const { userId, role } = req.body
      
      if (!userId || !role) {
        return res.status(400).json({
          success: false,
          error: 'User ID and role are required'
        })
      }

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role'
        })
      }

      await authService.updateUserRole(userId, role)
      
      res.json({
        success: true,
        message: 'User role updated successfully'
      })
    } catch (error) {
      logger.error('Update user role failed:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update user role'
      })
    }
  }
}

export const authController = new AuthController()
