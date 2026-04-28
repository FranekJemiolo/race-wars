/**
 * Authentication Middleware
 * Protects routes and validates JWT tokens
 */

import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'
import { logger } from '../utils/logger'

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

/**
 * Authentication middleware - validates JWT token
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      })
    }

    const user = await authService.verifyToken(token)
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
    }

    req.user = user
    next()
  } catch (error) {
    logger.error('Authentication middleware error:', error)
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export async function optionalAuthentication(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const user = await authService.verifyToken(token)
      if (user) {
        req.user = user
      }
    }
    
    next()
  } catch (error) {
    logger.error('Optional authentication middleware error:', error)
    next() // Continue without authentication
  }
}

/**
 * Admin role middleware - checks if user is admin
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      })
    }

    next()
  } catch (error) {
    logger.error('Admin middleware error:', error)
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    })
  }
}

/**
 * Verified user middleware - checks if user is verified
 */
export async function requireVerifiedUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required'
      })
    }

    next()
  } catch (error) {
    logger.error('Verified user middleware error:', error)
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    })
  }
}

/**
 * Spectator access middleware - allows anyone (authenticated or not)
 */
export async function allowSpectators(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to authenticate, but continue even if it fails
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const user = await authService.verifyToken(token)
      if (user) {
        req.user = user
      }
    }
    
    // Always continue - spectators are always allowed
    next()
  } catch (error) {
    logger.error('Spectator middleware error:', error)
    next() // Continue even on error - spectators can still access
  }
}
