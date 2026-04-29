/**
 * User Repository Tests
 * 
 * Unit tests for the UserRepository class to ensure all database operations
 * work correctly and handle edge cases appropriately.
 */

import { UserRepository } from '../repositories/user.repository'
import { query, transaction } from '../index'
import { logger } from '../../utils/logger'

// Mock dependencies
jest.mock('../index')
jest.mock('../../utils/logger')

const mockQuery = query as jest.MockedFunction<typeof query>
const mockTransaction = transaction as jest.MockedFunction<typeof transaction>
const mockLogger = logger as jest.Mocked<typeof logger>

describe('UserRepository', () => {
  let userRepository: UserRepository

  beforeEach(() => {
    userRepository = new UserRepository()
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange
      const createUserInput = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe'
      }

      const mockUser = {
        id: 'user-id',
        email: createUserInput.email,
        password_hash: 'hashed-password',
        first_name: createUserInput.first_name,
        last_name: createUserInput.last_name,
        display_name: createUserInput.display_name,
        phone: undefined,
        date_of_birth: undefined,
        license_number: undefined,
        license_expiry: undefined,
        experience_level: 'beginner',
        profile_image_url: undefined,
        bio: undefined,
        preferences: {},
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }

      mockQuery.mockResolvedValue({ rows: [mockUser] })

      // Act
      const result = await userRepository.create(createUserInput)

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          createUserInput.email,
          expect.any(String), // hashed password
          createUserInput.first_name,
          createUserInput.last_name,
          createUserInput.display_name
        ])
      )
      expect(mockLogger.info).toHaveBeenCalledWith('Creating new user', { email: createUserInput.email })
      expect(mockLogger.info).toHaveBeenCalledWith('User created successfully', { userId: mockUser.id, email: mockUser.email })
    })

    it('should handle database errors during creation', async () => {
      // Arrange
      const createUserInput = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe'
      }

      const error = new Error('Database error')
      mockQuery.mockRejectedValue(error)

      // Act & Assert
      await expect(userRepository.create(createUserInput)).rejects.toThrow('Database error')
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create user', { email: createUserInput.email, error })
    })
  })

  describe('findById', () => {
    it('should find user by ID', async () => {
      // Arrange
      const userId = 'user-id'
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe',
        phone: undefined,
        date_of_birth: undefined,
        license_number: undefined,
        license_expiry: undefined,
        experience_level: 'beginner',
        profile_image_url: undefined,
        bio: undefined,
        preferences: {},
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }

      mockQuery.mockResolvedValue({ rows: [mockUser] })

      // Act
      const result = await userRepository.findById(userId)

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1 AND is_active = true', [userId])
    })

    it('should return null when user not found', async () => {
      // Arrange
      const userId = 'non-existent-id'
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      const result = await userRepository.findById(userId)

      // Assert
      expect(result).toBeNull()
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1 AND is_active = true', [userId])
    })
  })

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const email = 'test@example.com'
      const mockUser = {
        id: 'user-id',
        email: email,
        password_hash: 'hashed-password',
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe',
        phone: undefined,
        date_of_birth: undefined,
        license_number: undefined,
        license_expiry: undefined,
        experience_level: 'beginner',
        profile_image_url: undefined,
        bio: undefined,
        preferences: {},
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }

      mockQuery.mockResolvedValue({ rows: [mockUser] })

      // Act
      const result = await userRepository.findByEmail(email)

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1 AND is_active = true', [email])
    })

    it('should return null when email not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com'
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      const result = await userRepository.findByEmail(email)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update user profile', async () => {
      // Arrange
      const userId = 'user-id'
      const updateInput = {
        first_name: 'Jane',
        last_name: 'Smith',
        display_name: 'Jane Smith'
      }

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_name: 'Jane',
        last_name: 'Smith',
        display_name: 'Jane Smith',
        phone: undefined,
        date_of_birth: undefined,
        license_number: undefined,
        license_expiry: undefined,
        experience_level: 'beginner',
        profile_image_url: undefined,
        bio: undefined,
        preferences: {},
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }

      mockQuery.mockResolvedValue({ rows: [mockUser] })

      // Act
      const result = await userRepository.update(userId, updateInput)

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining([
          'Jane',
          'Smith',
          'Jane Smith',
          userId
        ])
      )
      expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully', { userId })
    })

    it('should return null when updating non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-id'
      const updateInput = { first_name: 'Jane' }
      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      const result = await userRepository.update(userId, updateInput)

      // Assert
      expect(result).toBeNull()
    })

    it('should throw error when no fields to update', async () => {
      // Arrange
      const userId = 'user-id'
      const updateInput = {}

      // Act & Assert
      await expect(userRepository.update(userId, updateInput)).rejects.toThrow('No fields to update')
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'password123'
      const mockUser = {
        id: 'user-id',
        email: email,
        password_hash: '$2b$10$hashedpassword', // Mock bcrypt hash
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe',
        phone: undefined,
        date_of_birth: undefined,
        license_number: undefined,
        license_expiry: undefined,
        experience_level: 'beginner',
        profile_image_url: undefined,
        bio: undefined,
        preferences: {},
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }

      // Mock findByEmail to return user
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser as any)
      
      // Mock bcrypt.compare to return true
      const bcrypt = require('bcrypt')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      // Act
      const result = await userRepository.verifyPassword(email, password)

      // Assert
      expect(result).toEqual(mockUser)
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password_hash)
      expect(mockLogger.info).toHaveBeenCalledWith('User authenticated successfully', { userId: mockUser.id, email })
    })

    it('should return null for incorrect password', async () => {
      // Arrange
      const email = 'test@example.com'
      const password = 'wrongpassword'
      const mockUser = {
        id: 'user-id',
        email: email,
        password_hash: '$2b$10$hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'John Doe',
        phone: undefined,
        date_of_birth: undefined,
        license_number: undefined,
        license_expiry: undefined,
        experience_level: 'beginner',
        profile_image_url: undefined,
        bio: undefined,
        preferences: {},
        is_active: true,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date()
      }

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser as any)
      
      const bcrypt = require('bcrypt')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      // Act
      const result = await userRepository.verifyPassword(email, password)

      // Assert
      expect(result).toBeNull()
      expect(mockLogger.warn).toHaveBeenCalledWith('Invalid password attempt', { email })
    })

    it('should return null for non-existent user', async () => {
      // Arrange
      const email = 'nonexistent@example.com'
      const password = 'password123'

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null)

      // Act
      const result = await userRepository.verifyPassword(email, password)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('search', () => {
    it('should search users by query', async () => {
      // Arrange
      const searchQuery = 'john'
      const mockUsers = [
        {
          id: 'user-1',
          email: 'john@example.com',
          display_name: 'John Doe',
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          id: 'user-2',
          email: 'jane@example.com',
          display_name: 'Jane Johnson',
          first_name: 'Jane',
          last_name: 'Johnson'
        }
      ]

      mockQuery.mockResolvedValue({ rows: mockUsers })

      // Act
      const result = await userRepository.search(searchQuery)

      // Assert
      expect(result).toHaveLength(2)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        ['%john%', 20, 0]
      )
    })

    it('should use custom limit and offset', async () => {
      // Arrange
      const searchQuery = 'john'
      const limit = 10
      const offset = 5

      mockQuery.mockResolvedValue({ rows: [] })

      // Act
      await userRepository.search(searchQuery, limit, offset)

      // Assert
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        ['%john%', limit, offset]
      )
    })
  })

  describe('getByExperienceLevel', () => {
    it('should get users by experience level', async () => {
      // Arrange
      const level = 'advanced'
      const mockUsers = [
        {
          id: 'user-1',
          email: 'advanced@example.com',
          display_name: 'Advanced User',
          experience_level: 'advanced'
        }
      ]

      mockQuery.mockResolvedValue({ rows: mockUsers })

      // Act
      const result = await userRepository.getByExperienceLevel(level)

      // Assert
      expect(result).toHaveLength(1)
      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE experience_level = $1 AND is_active = true ORDER BY display_name',
        [level]
      )
    })
  })

  describe('deactivate', () => {
    it('should deactivate user', async () => {
      // Arrange
      const userId = 'user-id'
      mockQuery.mockResolvedValue({ rowCount: 1 })

      // Act
      const result = await userRepository.deactivate(userId)

      // Assert
      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [userId]
      )
      expect(mockLogger.info).toHaveBeenCalledWith('User deactivated successfully', { userId })
    })

    it('should return false when deactivating non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-id'
      mockQuery.mockResolvedValue({ rowCount: 0 })

      // Act
      const result = await userRepository.deactivate(userId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('updatePassword', () => {
    it('should update user password', async () => {
      // Arrange
      const userId = 'user-id'
      const newPassword = 'newpassword123'
      mockQuery.mockResolvedValue({ rowCount: 1 })

      // Act
      const result = await userRepository.updatePassword(userId, newPassword)

      // Assert
      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        [expect.any(String), userId]
      )
      expect(mockLogger.info).toHaveBeenCalledWith('Password updated successfully', { userId })
    })

    it('should return false when updating non-existent user', async () => {
      // Arrange
      const userId = 'non-existent-id'
      const newPassword = 'newpassword123'
      mockQuery.mockResolvedValue({ rowCount: 0 })

      // Act
      const result = await userRepository.updatePassword(userId, newPassword)

      // Assert
      expect(result).toBe(false)
    })
  })
})
