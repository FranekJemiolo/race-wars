/**
 * JWT Service
 * 
 * Handles JSON Web Token generation, verification, and management
 * for user authentication and authorization.
 */

import * as jwt from 'jsonwebtoken'
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
        expiresIn: this.accessTokenExpiry,
        issuer: 'race-wars',
        audience: 'race-wars-users'
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
        expiresIn: this.refreshTokenExpiry,
        issuer: 'race-wars',
        audience: 'race-wars-users'
      })
    } catch (error) {
      logger.error('Failed to generate refresh token', { payload, error })
      throw new Error('Token generation failed')
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    }
  }

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'race-wars',
        audience: 'race-wars-users'
      }) as JwtPayload

      return decoded
    } catch (error) {
      logger.error('Failed to verify access token', { error })
      throw new Error('Invalid access token')
    }
  }

  /**
   * Verify and decode a refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'race-wars',
        audience: 'race-wars-users'
      }) as JwtPayload

      return decoded
    } catch (error) {
      logger.error('Failed to verify refresh token', { error })
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1]
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any
      if (!decoded || !decoded.exp) {
        return null
      }
      return new Date(decoded.exp * 1000)
    } catch (error) {
      logger.error('Failed to decode token for expiration', { error })
      return null
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token)
    if (!expiration) {
      return true
    }
    return expiration < new Date()
  }

  /**
   * Get remaining time until token expires (in seconds)
   */
  getTokenRemainingTime(token: string): number {
    const expiration = this.getTokenExpiration(token)
    if (!expiration) {
      return 0
    }
    const now = new Date()
    if (expiration <= now) {
      return 0
    }
    return Math.floor((expiration.getTime() - now.getTime()) / 1000)
  }
}

// Export singleton instance
export const jwtService = new JwtService()
