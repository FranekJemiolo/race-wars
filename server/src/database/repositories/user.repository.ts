/**
 * User Repository
 * 
 * Handles all database operations for user management including
 * authentication, profile management, and user queries.
 */

import { query, transaction } from '../index'
import { logger } from '../../utils/logger'
import bcrypt from 'bcrypt'

export interface User {
  id: string
  email: string
  password_hash: string
  first_name: string
  last_name: string
  display_name: string
  phone?: string
  date_of_birth?: Date
  license_number?: string
  license_expiry?: Date
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  profile_image_url?: string
  bio?: string
  preferences: Record<string, any>
  is_active: boolean
  email_verified: boolean
  created_at: Date
  updated_at: Date
}

export interface CreateUserInput {
  email: string
  password: string
  first_name: string
  last_name: string
  display_name: string
  phone?: string
  date_of_birth?: Date
  license_number?: string
  license_expiry?: Date
  experience_level?: User['experience_level']
  profile_image_url?: string
  bio?: string
  preferences?: Record<string, any>
}

export interface UpdateUserInput {
  first_name?: string
  last_name?: string
  display_name?: string
  phone?: string
  date_of_birth?: Date
  license_number?: string
  license_expiry?: Date
  experience_level?: User['experience_level']
  profile_image_url?: string
  bio?: string
  preferences?: Record<string, any>
  is_active?: boolean
}

export class UserRepository {
  /**
   * Create a new user with password hashing
   */
  async create(input: CreateUserInput): Promise<User> {
    logger.info('Creating new user', { email: input.email })

    try {
      // Hash the password
      const saltRounds = 10
      const password_hash = await bcrypt.hash(input.password, saltRounds)

      const sql = `
        INSERT INTO users (
          email, password_hash, first_name, last_name, display_name,
          phone, date_of_birth, license_number, license_expiry,
          experience_level, profile_image_url, bio, preferences
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING *
      `

      const values = [
        input.email,
        password_hash,
        input.first_name,
        input.last_name,
        input.display_name,
        input.phone || null,
        input.date_of_birth || null,
        input.license_number || null,
        input.license_expiry || null,
        input.experience_level || 'beginner',
        input.profile_image_url || null,
        input.bio || null,
        JSON.stringify(input.preferences || {})
      ]

      const result = await query(sql, values)
      const user = result.rows[0]

      logger.info('User created successfully', { userId: user.id, email: user.email })
      return this.mapRowToUser(user)
    } catch (error) {
      logger.error('Failed to create user', { email: input.email, error })
      throw error
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const sql = 'SELECT * FROM users WHERE id = $1 AND is_active = true'
      const result = await query(sql, [id])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToUser(result.rows[0])
    } catch (error) {
      logger.error('Failed to find user by ID', { id, error })
      throw error
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const sql = 'SELECT * FROM users WHERE email = $1 AND is_active = true'
      const result = await query(sql, [email])
      
      if (result.rows.length === 0) {
        return null
      }

      return this.mapRowToUser(result.rows[0])
    } catch (error) {
      logger.error('Failed to find user by email', { email, error })
      throw error
    }
  }

  /**
   * Update user profile
   */
  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    logger.info('Updating user', { userId: id })

    try {
      // Build dynamic update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`)
          values.push(key === 'preferences' ? JSON.stringify(value) : value)
          paramIndex++
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update')
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

      const sql = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `

      values.push(id)

      const result = await query(sql, values)
      
      if (result.rows.length === 0) {
        return null
      }

      logger.info('User updated successfully', { userId: id })
      return this.mapRowToUser(result.rows[0])
    } catch (error) {
      logger.error('Failed to update user', { id, error })
      throw error
    }
  }

  /**
   * Verify password for authentication
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email)
      
      if (!user) {
        return null
      }

      const isValid = await bcrypt.compare(password, user.password_hash)
      
      if (!isValid) {
        logger.warn('Invalid password attempt', { email })
        return null
      }

      logger.info('User authenticated successfully', { userId: user.id, email })
      return user
    } catch (error) {
      logger.error('Failed to verify password', { email, error })
      throw error
    }
  }

  /**
   * Update password
   */
  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    logger.info('Updating user password', { userId: id })

    try {
      const saltRounds = 10
      const password_hash = await bcrypt.hash(newPassword, saltRounds)

      const sql = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
      `

      const result = await query(sql, [password_hash, id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('Password updated successfully', { userId: id })
      return true
    } catch (error) {
      logger.error('Failed to update password', { id, error })
      throw error
    }
  }

  /**
   * Soft delete user (deactivate)
   */
  async deactivate(id: string): Promise<boolean> {
    logger.info('Deactivating user', { userId: id })

    try {
      const sql = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `

      const result = await query(sql, [id])
      
      if (result.rowCount === 0) {
        return false
      }

      logger.info('User deactivated successfully', { userId: id })
      return true
    } catch (error) {
      logger.error('Failed to deactivate user', { id, error })
      throw error
    }
  }

  /**
   * Search users by name or email
   */
  async search(query: string, limit: number = 20, offset: number = 0): Promise<User[]> {
    try {
      const sql = `
        SELECT * FROM users 
        WHERE is_active = true 
        AND (
          email ILIKE $1 OR 
          display_name ILIKE $1 OR 
          first_name ILIKE $1 OR 
          last_name ILIKE $1
        )
        ORDER BY display_name
        LIMIT $2 OFFSET $3
      `

      const result = await query(sql, [`%${query}%`, limit, offset])
      return result.rows.map((row: any) => this.mapRowToUser(row))
    } catch (error) {
      logger.error('Failed to search users', { query, error })
      throw error
    }
  }

  /**
   * Get users by experience level
   */
  async getByExperienceLevel(level: User['experience_level']): Promise<User[]> {
    try {
      const sql = 'SELECT * FROM users WHERE experience_level = $1 AND is_active = true ORDER BY display_name'
      const result = await query(sql, [level])
      return result.rows.map((row: any) => this.mapRowToUser(row))
    } catch (error) {
      logger.error('Failed to get users by experience level', { level, error })
      throw error
    }
  }

  /**
   * Map database row to User object
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      first_name: row.first_name,
      last_name: row.last_name,
      display_name: row.display_name,
      phone: row.phone,
      date_of_birth: row.date_of_birth,
      license_number: row.license_number,
      license_expiry: row.license_expiry,
      experience_level: row.experience_level,
      profile_image_url: row.profile_image_url,
      bio: row.bio,
      preferences: row.preferences || {},
      is_active: row.is_active,
      email_verified: row.email_verified,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository()
