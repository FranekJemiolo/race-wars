/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'
import { query } from '../database/connection.simple'

export interface User {
  id: string
  username: string
  email: string
  password: string // hashed
  displayName: string
  avatar?: string
  role: 'user' | 'admin'
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  stats: {
    racesParticipated: number
    racesWon: number
    totalTimeRaced: number // seconds
    bestLapTime?: number // seconds
  }
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  displayName: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: Omit<User, 'password'>
  token: string
  expiresIn: number
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'race-wars-secret-key'
  private readonly JWT_EXPIRES_IN = '24h'
  private readonly SALT_ROUNDS = 12

  constructor() {
    this.initializeDefaultUsers()
  }

  /**
   * Initialize default users for development
   */
  private async initializeDefaultUsers(): Promise<void> {
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@racewars.local',
        password: 'admin123',
        displayName: 'Race Admin',
        role: 'admin',
        isVerified: true
      },
      {
        username: 'testdriver',
        email: 'driver@racewars.local',
        password: 'driver123',
        displayName: 'Test Driver',
        role: 'user',
        isVerified: true
      }
    ]

    for (const userData of defaultUsers) {
      try {
        // Check if user already exists
        const existingUser = await query(
          'SELECT id FROM users WHERE username = $1',
          [userData.username]
        )
        
        const rows = Array.isArray(existingUser.rows) ? existingUser.rows : []
        if (rows.length === 0) {
          const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS)
          await query(
            `INSERT INTO users (id, username, email, password_hash, display_name, experience_level, is_active, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              `user-${userData.username}`,
              userData.username,
              userData.email,
              hashedPassword,
              userData.displayName,
              'advanced',
              true,
              new Date(),
              new Date()
            ]
          )
          logger.info(`Created default user: ${userData.username}`)
        }
      } catch (error) {
        logger.warn(`Failed to create default user ${userData.username}:`, error)
      }
    }

    logger.info('Default users initialization complete')
  }

  /**
   * Register a new user
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    const { username, email, password, displayName } = registerData

    // Validate input
    if (!username || !email || !password || !displayName) {
      throw new Error('All fields are required')
    }

    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be between 3 and 20 characters')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    // Check if user already exists
    const existingUserByUsername = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )
    const usernameRows = Array.isArray(existingUserByUsername.rows) ? existingUserByUsername.rows : []
    if (usernameRows.length > 0) {
      throw new Error('Username already taken')
    }

    const existingUserByEmail = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    const emailRows = Array.isArray(existingUserByEmail.rows) ? existingUserByEmail.rows : []
    if (emailRows.length > 0) {
      throw new Error('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS)

    // Create user
    const userId = `user-${Date.now()}`
    await query(
      `INSERT INTO users (id, username, email, password_hash, display_name, experience_level, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, username, email, hashedPassword, displayName, 'beginner', true, new Date(), new Date()]
    )

    logger.info(`User registered: ${username}`)

    // Generate token
    const user = await this.getUserById(userId)
    const token = this.generateToken(user!)
    
    return {
      user: user!,
      token,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { username, password } = loginData

    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    // Find user in database
    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    )

    const rows = Array.isArray(result.rows) ? result.rows : []
    if (rows.length === 0) {
      throw new Error('Invalid credentials')
    }

    const dbUser = rows[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Update last login
    await query(
      'UPDATE users SET updated_at = $1 WHERE id = $2',
      [new Date(), dbUser.id]
    )

    // Generate token
    const user = this.mapDbUserToUser(dbUser)
    const token = this.generateToken(user)
    
    logger.info(`User logged in: ${username}`)
    
    return {
      user: this.sanitizeUser(user),
      token,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<Omit<User, 'password'> | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string }
      const result = await query('SELECT * FROM users WHERE id = $1', [decoded.userId])
      
      const rows = Array.isArray(result.rows) ? result.rows : []
      if (rows.length === 0) {
        return null
      }

      const user = this.mapDbUserToUser(rows[0])
      return this.sanitizeUser(user)
    } catch (error) {
      logger.warn('Invalid token verification attempt:', error)
      return null
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [userId])
    const rows = Array.isArray(result.rows) ? result.rows : []
    if (rows.length === 0) {
      return null
    }
    const user = this.mapDbUserToUser(rows[0])
    return this.sanitizeUser(user)
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<Omit<User, 'password'> | null> {
    const result = await query('SELECT * FROM users WHERE username = $1', [username])
    const rows = Array.isArray(result.rows) ? result.rows : []
    if (rows.length === 0) {
      return null
    }
    const user = this.mapDbUserToUser(rows[0])
    return this.sanitizeUser(user)
  }

  /**
   * Map database user row to User interface
   */
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password_hash,
      displayName: dbUser.display_name,
      role: dbUser.role || 'user',
      isVerified: dbUser.is_active || false,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      stats: {
        racesParticipated: 0,
        racesWon: 0,
        totalTimeRaced: 0
      }
    }
  }

  /**
   * Update user stats
   */
  async updateUserStats(userId: string, stats: Partial<User['stats']>): Promise<void> {
    // For now, stats are stored in memory or could be added to a separate table
    // This is a placeholder for future implementation
    logger.info(`User stats update requested for ${userId}:`, stats)
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: Omit<User, 'password'>): string {
    return jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    )
  }

  /**
   * Remove password from user object
   */
  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user
    return sanitizedUser
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const result = await query('SELECT * FROM users WHERE is_active = true')
    const users = Array.isArray(result.rows) ? result.rows : []
    return users.map((dbUser: any) => {
      const user = this.mapDbUserToUser(dbUser)
      return this.sanitizeUser(user)
    })
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: User['role']): Promise<void> {
    await query(
      'UPDATE users SET role = $1, updated_at = $2 WHERE id = $3',
      [role, new Date(), userId]
    )
    logger.info(`User role updated: ${userId} -> ${role}`)
  }
}

export const authService = new AuthService()
