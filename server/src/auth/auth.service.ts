/**
 * Authentication Service
 * 
 * Handles user authentication, login, logout, and session management.
 * Integrates with JWT service for token generation and verification.
 */

import { userRepository } from '../database/repositories'
import { jwtService, JwtPayload, TokenPair } from './jwt.service'
import { logger } from '../utils/logger'
import bcrypt from 'bcryptjs'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  displayName: string
  phone?: string
  dateOfBirth?: Date
  licenseNumber?: string
  licenseExpiry?: Date
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional'
}

export interface AuthResult {
  user: any
  tokens: TokenPair
}

export interface RefreshTokenInput {
  refreshToken: string
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    logger.info('User registration attempt', { email: input.email })

    try {
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(input.email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Validate password strength
      this.validatePassword(input.password)

      // Create user
      const user = await userRepository.create({
        email: input.email,
        password: input.password,
        first_name: input.firstName,
        last_name: input.lastName,
        display_name: input.displayName,
        phone: input.phone,
        date_of_birth: input.dateOfBirth,
        license_number: input.licenseNumber,
        license_expiry: input.licenseExpiry,
        experience_level: input.experienceLevel || 'beginner'
      })

      // Generate tokens
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: 'user'
      })

      logger.info('User registered successfully', { userId: user.id, email: user.email })

      return {
        user: this.sanitizeUser(user),
        tokens
      }
    } catch (error) {
      logger.error('User registration failed', { email: input.email, error })
      throw error
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(input: LoginInput): Promise<AuthResult> {
    logger.info('User login attempt', { email: input.email })

    try {
      // Verify credentials
      const user = await userRepository.verifyPassword(input.email, input.password)
      if (!user) {
        throw new Error('Invalid email or password')
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated')
      }

      // Determine user role (simplified - in real app would check permissions)
      const role = this.determineUserRole(user)

      // Generate tokens
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role
      })

      logger.info('User logged in successfully', { userId: user.id, email: user.email })

      return {
        user: this.sanitizeUser(user),
        tokens
      }
    } catch (error) {
      logger.error('User login failed', { email: input.email, error })
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(input: RefreshTokenInput): Promise<TokenPair> {
    logger.info('Token refresh attempt')

    try {
      // Verify refresh token
      const payload = jwtService.verifyRefreshToken(input.refreshToken)

      // Get user to ensure they still exist and are active
      const user = await userRepository.findById(payload.userId)
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive')
      }

      // Generate new tokens
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: payload.role
      })

      logger.info('Token refreshed successfully', { userId: user.id })

      return tokens
    } catch (error) {
      logger.error('Token refresh failed', { error })
      throw error
    }
  }

  /**
   * Validate access token and return user info
   */
  async validateToken(token: string): Promise<JwtPayload & { user: any }> {
    try {
      // Verify token
      const payload = jwtService.verifyAccessToken(token)

      // Get user
      const user = await userRepository.findById(payload.userId)
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive')
      }

      return {
        ...payload,
        user: this.sanitizeUser(user)
      }
    } catch (error) {
      logger.error('Token validation failed', { error })
      throw error
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    logger.info('Password change attempt', { userId })

    try {
      // Get user
      const user = await userRepository.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValidPassword) {
        throw new Error('Current password is incorrect')
      }

      // Validate new password
      this.validatePassword(newPassword)

      // Update password
      await userRepository.updatePassword(userId, newPassword)

      logger.info('Password changed successfully', { userId })
    } catch (error) {
      logger.error('Password change failed', { userId, error })
      throw error
    }
  }

  /**
   * Reset password (would typically involve email verification)
   */
  async resetPassword(email: string, newPassword: string): Promise<void> {
    logger.info('Password reset attempt', { email })

    try {
      // Get user
      const user = await userRepository.findByEmail(email)
      if (!user) {
        // Don't reveal if user exists or not
        return
      }

      // Validate new password
      this.validatePassword(newPassword)

      // Update password
      await userRepository.updatePassword(user.id, newPassword)

      logger.info('Password reset successful', { userId: user.id, email })
    } catch (error) {
      logger.error('Password reset failed', { email, error })
      throw error
    }
  }

  /**
   * Logout user (in a real app, would invalidate tokens in a blacklist)
   */
  async logout(userId: string): Promise<void> {
    logger.info('User logout', { userId })
    // In a real implementation, you might:
    // - Add token to blacklist
    // - Remove from active sessions
    // - Update last logout time
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number')
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character')
    }
  }

  /**
   * Determine user role based on user data
   */
  private determineUserRole(user: any): 'user' | 'admin' | 'organizer' {
    // This is simplified - in a real app, you'd check permissions
    // For now, all users are 'user'
    return 'user'
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any): any {
    const { password_hash, ...sanitized } = user
    return sanitized
  }
}

// Export singleton instance
export const authService = new AuthService()
