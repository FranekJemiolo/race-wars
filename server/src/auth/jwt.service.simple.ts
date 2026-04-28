/**
 * Simplified JWT Service
 * 
 * Handles JSON Web Token generation, verification, and management
 * for user authentication and authorization.
 */

import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'

export interface JwtPayload {
  userId: string
  email: string
  role: 'user' | 'admin' | 'organizer'
  iat?: number
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export class JwtService {
  private readonly accessTokenSecret: string
  private readonly refreshTokenSecret: string
  private readonly accessTokenExpiry: string
  private readonly refreshTokenExpiry: string

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret-key'
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key'
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d'

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets must be configured')
    }
  }

  /**
   * Generate a new access token
   */
  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry
      })
    } catch (error) {
      logger.error('Failed to generate access token', { payload, error })
      throw new Error('Token generation failed')
    }
  }

  /**
   * Generate a new refresh token
   */
  generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry
      })
    } catch (error) {
      logger.error('Failed to generate refresh token', { payload, error })
      throw new Error('Token generation failed')
    }
  }

  /**
   * Generate a token pair
   */
  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    }
  }

  /**
   * Verify an access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as JwtPayload
      return decoded
    } catch (error) {
      logger.error('Failed to verify access token', { token, error })
      throw new Error('Invalid token')
    }
  }

  /**
   * Verify a refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as JwtPayload
      return decoded
    } catch (error) {
      logger.error('Failed to verify refresh token', { token, error })
      throw new Error('Invalid token')
    }
  }

  /**
   * Decode a token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload
      return decoded
    } catch (error) {
      logger.error('Failed to decode token', { token, error })
      return null
    }
  }

  /**
   * Check if a token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.exp) {
        return true
      }
      return Date.now() >= decoded.exp * 1000
    } catch (error) {
      return true
    }
  }
}

// Export singleton instance
export const jwtService = new JwtService()
