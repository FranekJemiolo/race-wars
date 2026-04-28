/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'

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
  private users: Map<string, User> = new Map()
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'race-wars-secret-key'
  private readonly JWT_EXPIRES_IN = '24h'
  private readonly SALT_ROUNDS = 12

  constructor() {
    this.initializeDefaultUsers()
  }

  /**
   * Initialize default users for development
   */
  private initializeDefaultUsers(): void {
    const defaultUsers: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        username: 'admin',
        email: 'admin@racewars.com',
        password: 'admin123', // will be hashed
        displayName: 'Race Admin',
        role: 'admin',
        isVerified: true,
        stats: {
          racesParticipated: 0,
          racesWon: 0,
          totalTimeRaced: 0
        }
      },
      {
        username: 'testdriver',
        email: 'driver@racewars.com',
        password: 'driver123', // will be hashed
        displayName: 'Test Driver',
        role: 'user',
        isVerified: true,
        stats: {
          racesParticipated: 5,
          racesWon: 2,
          totalTimeRaced: 3600
        }
      }
    ]

    defaultUsers.forEach(userData => {
      const hashedPassword = bcrypt.hashSync(userData.password, this.SALT_ROUNDS)
      const user: User = {
        ...userData,
        password: hashedPassword,
        id: `user-${this.users.size + 1}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      this.users.set(user.username, user)
    })

    logger.info(`Initialized ${defaultUsers.length} default users`)
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
    const existingUserByUsername = Array.from(this.users.values()).find(u => u.username === username)
    if (existingUserByUsername) {
      throw new Error('Username already taken')
    }

    const existingUserByEmail = Array.from(this.users.values()).find(u => u.email === email)
    if (existingUserByEmail) {
      throw new Error('Email already registered')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS)

    // Create user
    const user: User = {
      id: `user-${Date.now()}`,
      username,
      email,
      password: hashedPassword,
      displayName,
      role: 'user',
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        racesParticipated: 0,
        racesWon: 0,
        totalTimeRaced: 0
      }
    }

    this.users.set(username, user)
    logger.info(`User registered: ${username}`)

    // Generate token
    const token = this.generateToken(user)
    
    return {
      user: this.sanitizeUser(user),
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

    // Find user
    const user = this.users.get(username)
    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Update last login
    user.lastLoginAt = new Date()
    user.updatedAt = new Date()

    // Generate token
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
      const user = Array.from(this.users.values()).find(u => u.id === decoded.userId)
      
      if (!user) {
        return null
      }

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
    const user = Array.from(this.users.values()).find(u => u.id === userId)
    return user ? this.sanitizeUser(user) : null
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<Omit<User, 'password'> | null> {
    const user = this.users.get(username)
    return user ? this.sanitizeUser(user) : null
  }

  /**
   * Update user stats
   */
  async updateUserStats(userId: string, stats: Partial<User['stats']>): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId)
    if (user) {
      user.stats = { ...user.stats, ...stats }
      user.updatedAt = new Date()
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
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
    return Array.from(this.users.values()).map(user => this.sanitizeUser(user))
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: User['role']): Promise<void> {
    const user = Array.from(this.users.values()).find(u => u.id === userId)
    if (user) {
      user.role = role
      user.updatedAt = new Date()
      logger.info(`User role updated: ${user.username} -> ${role}`)
    }
  }
}

export const authService = new AuthService()
