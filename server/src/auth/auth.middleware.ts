/**
 * Authentication Middleware
 * 
 * Express middleware for protecting routes with JWT authentication.
 * Provides role-based access control and user context injection.
 */

import { Request, Response, NextFunction } from 'express'
import { jwtService } from './jwt.service'
import { authService } from './auth.service'
import { logger } from '../utils/logger'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any
      userId?: string
      userRole?: string
    }
  }
}

export interface AuthOptions {
  required?: boolean
  roles?: ('user' | 'admin' | 'organizer')[]
  allowInactive?: boolean
}

/**
 * Authentication middleware factory
 */
export function auth(options: AuthOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    required = true,
    roles = [],
    allowInactive = false
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from header
      const authHeader = req.headers.authorization
      const token = jwtService.extractTokenFromHeader(authHeader)

      // If no token and authentication is required
      if (!token) {
        if (required) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'No token provided'
          })
        }
        return next()
      }

      // Validate token
      const authData = await authService.validateToken(token)

      // Check if user is active
      if (!allowInactive && !authData.user.is_active) {
        return res.status(401).json({
          error: 'Account deactivated',
          message: 'Your account has been deactivated'
        })
      }

      // Check role requirements
      if (roles.length > 0 && !roles.includes(authData.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: 'Required role not found',
          required: roles
        })
      }

      // Add user data to request
      req.user = authData.user
      req.userId = authData.userId
      req.userRole = authData.role

      next()
    } catch (error) {
      logger.error('Authentication middleware error', { error })

      if (required) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid or expired token'
        })
      }

      next()
    }
  }
}

/**
 * Middleware for requiring authentication
 */
export const requireAuth = auth({ required: true })

/**
 * Middleware for optional authentication
 */
export const optionalAuth = auth({ required: false })

/**
 * Middleware for admin-only routes
 */
export const requireAdmin = auth({ required: true, roles: ['admin'] })

/**
 * Middleware for organizer-only routes
 */
export const requireOrganizer = auth({ required: true, roles: ['organizer', 'admin'] })

/**
 * Middleware for user or higher roles
 */
export const requireUser = auth({ required: true, roles: ['user', 'organizer', 'admin'] })

/**
 * Middleware to check if user owns the resource
 */
export function requireOwnership(getResourceOwnerId: (req: Request) => string | Promise<string>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First ensure user is authenticated
      await new Promise<void>((resolve, reject) => {
        requireAuth(req, res, (error?: any) => {
          if (error) reject(error)
          else resolve()
        })
      })

      // Get resource owner ID
      const resourceOwnerId = await getResourceOwnerId(req)
      
      // Check ownership
      if (req.userId !== resourceOwnerId && req.userRole !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not own this resource'
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Middleware to check if user is the organizer of an event
 */
export function requireEventOrganizer(eventIdParam: string = 'eventId') {
  return requireOwnership(async (req) => {
    const eventId = req.params[eventIdParam]
    if (!eventId) {
      throw new Error('Event ID not provided')
    }

    // Get event and check organizer
    const { eventRepository } = await import('../database/repositories')
    const event = await eventRepository.findById(eventId as string)
    
    if (!event) {
      throw new Error('Event not found')
    }

    return event.organizer_id
  })
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>()

  return (handler: (req: Request, res: Response) => Promise<void> | void) => {
    return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()
    const record = attempts.get(clientIp)

    if (!record || now > record.resetTime) {
      // Reset or create record
      attempts.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      })
      return handler(req, res)
    }

    if (record.count >= maxAttempts) {
      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Please try again later',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      })
    }

    // Increment counter
    record.count++
    return handler(req, res)
  }
  }
}

/**
 * Middleware to validate JWT token format (without full verification)
 */
export function validateTokenFormat(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = jwtService.extractTokenFromHeader(authHeader)

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization header required'
      })
    }

    // Basic token format validation
    const parts = token.split('.')
    if (parts.length !== 3) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Token must have 3 parts'
      })
    }

    // Try to decode header and payload (without verification)
    try {
      JSON.parse(Buffer.from(parts[0], 'base64url').toString())
      JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    } catch (decodeError) {
      return res.status(401).json({
        error: 'Invalid token encoding',
        message: 'Token could not be decoded'
      })
    }

    next()
  } catch (error) {
    return res.status(400).json({
      error: 'Token validation failed',
      message: 'Invalid token format'
    })
  }
}
