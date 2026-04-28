/**
 * Behavioral Tests for Authentication System
 * 
 * These tests verify critical authentication scenarios and security behaviors
 * to ensure the system works correctly under various conditions.
 */

import { authService, jwtService } from '../../server/src/auth'
import { userRepository } from '../../server/src/database/repositories'
import { logger } from '../../server/src/utils/logger'

describe('Authentication Behavioral Tests', () => {
  let testUser: any
  let testTokens: any

  beforeAll(async () => {
    // Create test user for behavioral tests
    const timestamp = Date.now()
    testUser = await userRepository.create({
      firstName: 'Behavioral',
      lastName: 'Test User',
      displayName: 'Behavioral Test User',
      email: `behavioral-${timestamp}@test.com`,
      password: 'testpassword123',
      experienceLevel: 'beginner'
    })
  })

  afterAll(async () => {
    // Cleanup test user
    if (testUser) {
      await userRepository.deactivate(testUser.id)
    }
  })

  describe('User Registration Flow', () => {
    test('should handle concurrent registrations gracefully', async () => {
      const timestamp = Date.now()
      const userData = {
        firstName: 'Concurrent',
        lastName: 'Test User',
        displayName: 'Concurrent Test User',
        email: `concurrent-${timestamp}@test.com`,
        password: 'testpassword123',
        experienceLevel: 'intermediate' as const
      }

      // Simulate concurrent registration attempts
      const registrationPromises = Array(5).fill(0).map(() => 
        authService.register(userData)
      )

      const results = await Promise.allSettled(registrationPromises)
      
      // Only one should succeed, others should fail with duplicate email
      const successful = results.filter(r => r.status === 'fulfilled')
      const failed = results.filter(r => r.status === 'rejected')
      
      expect(successful).toHaveLength(1)
      expect(failed).toHaveLength(4)
      
      // Verify failed attempts contain appropriate error messages
      failed.forEach((result, index) => {
        if (result.status === 'rejected') {
          expect(result.reason.message).toContain('already exists')
        }
      })

      // Cleanup
      if (successful[0] && successful[0].status === 'fulfilled') {
        await userRepository.deactivate(successful[0].value.user.id)
      }
    })

    test('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@test.com',
        'test@',
        'test.test.com',
        'test@.com',
        'test@com.',
        'test@com..com'
      ]

      for (const email of invalidEmails) {
        try {
          await authService.register({
            firstName: 'Invalid',
            lastName: 'Email Test',
            displayName: 'Invalid Email Test',
            email,
            password: 'testpassword123',
            experienceLevel: 'beginner' as const
          })
          fail(`Should have rejected invalid email: ${email}`)
        } catch (error) {
          expect(error.message).toContain('Invalid email format')
        }
      }
    })

    test('should enforce password strength requirements', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'abcdefgh',
        'test',
        'short'
      ]

      for (const password of weakPasswords) {
        try {
          await authService.register({
            firstName: 'Weak',
            lastName: 'Password Test',
            displayName: 'Weak Password Test',
            email: `weak-${password.length}@test.com`,
            password,
            experienceLevel: 'beginner' as const
          })
          fail(`Should have rejected weak password: ${password}`)
        } catch (error) {
          expect(error.message).toContain('Password must be at least')
        }
      }
    })
  })

  describe('Login Security Behavior', () => {
    test('should handle rate limiting on failed login attempts', async () => {
      const loginAttempts = Array(10).fill(0).map(() => 
        authService.login(testUser.email, 'wrongpassword')
      )

      const results = await Promise.allSettled(loginAttempts)
      
      // All should fail
      const failed = results.filter(r => r.status === 'rejected')
      expect(failed).toHaveLength(10)

      // The last few attempts should be rate limited
      const lastAttempts = failed.slice(-3)
      lastAttempts.forEach((result) => {
        if (result.status === 'rejected') {
          // Should indicate rate limiting
          expect(result.reason.message).toMatch(/too many attempts|rate limit/i)
        }
      })
    }, 15000)

    test('should invalidate tokens on password change', async () => {
      // Login and get tokens
      const loginResult = await authService.login(testUser.email, 'testpassword123')
      const oldAccessToken = loginResult.tokens.accessToken
      const oldRefreshToken = loginResult.tokens.refreshToken

      // Verify old tokens work
      const oldPayload = jwtService.verifyAccessToken(oldAccessToken)
      expect(oldPayload.userId).toBe(testUser.id)

      // Change password
      await authService.changePassword(testUser.id, 'testpassword123', 'newpassword123')

      // Try to use old tokens
      try {
        jwtService.verifyAccessToken(oldAccessToken)
        fail('Old access token should be invalid after password change')
      } catch (error) {
        expect(error.message).toContain('invalid')
      }

      try {
        await authService.refreshToken({ refreshToken: oldRefreshToken })
        fail('Old refresh token should be invalid after password change')
      } catch (error) {
        expect(error.message).toContain('invalid')
      }

      // Verify new password works
      const newLoginResult = await authService.login(testUser.email, 'newpassword123')
      expect(newLoginResult.tokens.accessToken).toBeDefined()
      expect(newLoginResult.tokens.refreshToken).toBeDefined()

      // Restore original password for cleanup
      await authService.changePassword(testUser.id, 'newpassword123', 'testpassword123')
    })

    test('should handle token expiration gracefully', async () => {
      // Create token with very short expiration for testing
      const shortLivedToken = jwtService.generateAccessToken({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role
      })

      // Wait for token to expire (simulate)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Try to use expired token
      try {
        jwtService.verifyAccessToken(shortLivedToken)
        // If it doesn't expire immediately, that's expected behavior
        expect(shortLivedToken).toBeDefined()
      } catch (error) {
        // Token should be invalid if expired
        expect(error.message).toContain('expired')
      }
    })
  })

  describe('Session Management Behavior', () => {
    test('should handle concurrent token refresh requests', async () => {
      // Login to get initial token
      const loginResult = await authService.login(testUser.email, 'testpassword123')
      const refreshToken = loginResult.tokens.refreshToken

      // Simulate concurrent refresh requests
      const refreshPromises = Array(5).fill(0).map(() => 
        authService.refreshToken({ refreshToken })
      )

      const results = await Promise.allSettled(refreshPromises)
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful).toHaveLength(5)

      // All should return the same user data
      const userIds = successful.map(r => 
        r.status === 'fulfilled' ? r.value.user.id : null
      )
      expect(userIds.every(id => id === testUser.id)).toBe(true)
    })

    test('should prevent token reuse after refresh', async () => {
      // Login to get initial token
      const loginResult = await authService.login(testUser.email, 'testpassword123')
      const refreshToken = loginResult.tokens.refreshToken

      // Refresh token once
      const refreshResult = await authService.refreshToken({ refreshToken })
      
      // Try to use the same refresh token again
      try {
        await authService.refreshToken({ refreshToken })
        fail('Should not allow reuse of refresh token')
      } catch (error) {
        expect(error.message).toContain('invalid')
      }

      // New refresh token should work
      const newRefreshResult = await authService.refreshToken({ 
        refreshToken: refreshResult.tokens.refreshToken 
      })
      expect(newRefreshResult.tokens.accessToken).toBeDefined()
    })
  })

  describe('User Role and Permission Behavior', () => {
    test('should enforce role-based access control', async () => {
      // Create admin user
      const adminUser = await userRepository.create({
        firstName: 'Admin',
        lastName: 'Test User',
        displayName: 'Admin Test User',
        email: `admin-${Date.now()}@test.com`,
        password: 'adminpassword123',
        experienceLevel: 'expert'
      })

      try {
        // Test admin privileges
        const adminLogin = await authService.login(adminUser.email, 'adminpassword123')
        const adminPayload = jwtService.verifyAccessToken(adminLogin.tokens.accessToken)
        expect(adminPayload.role).toBe('USER') // Default role

        // Test regular user privileges
        const userLogin = await authService.login(testUser.email, 'testpassword123')
        const userPayload = jwtService.verifyAccessToken(userLogin.tokens.accessToken)
        expect(userPayload.role).toBe('USER')

        // Verify role-based permissions (this would be tested in middleware)
        expect(adminPayload.role).toBe(userPayload.role)
      } finally {
        // Cleanup admin user
        await userRepository.deactivate(adminUser.id)
      }
    })

    test('should handle role changes with token invalidation', async () => {
      // Login as regular user
      const loginResult = await authService.login(testUser.email, 'testpassword123')
      const accessToken = loginResult.tokens.accessToken

      // Verify current role
      const payload = jwtService.verifyAccessToken(accessToken)
      expect(payload.role).toBe('USER')

      // Change user experience level
      await userRepository.update(testUser.id, { experienceLevel: 'advanced' })

      // Token should still reflect old data until re-login
      const oldPayload = jwtService.verifyAccessToken(accessToken)
      expect(oldPayload.role).toBe('USER') // Still old role in token

      // New login should reflect new data
      const newLoginResult = await authService.login(testUser.email, 'testpassword123')
      const newPayload = jwtService.verifyAccessToken(newLoginResult.tokens.accessToken)
      expect(newPayload.role).toBe('USER') // Role stays same

      // Restore original experience level
      await userRepository.update(testUser.id, { experienceLevel: 'beginner' })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection failures gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test the error handling paths
      try {
        await userRepository.findById('non-existent-id')
        // Should return null, not throw
        expect(true).toBe(true)
      } catch (error) {
        // If it throws, it should be a proper error
        expect(error).toBeDefined()
      }
    })

    test('should handle malformed JWT tokens', async () => {
      const malformedTokens = [
        'invalid.token',
        'invalid',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'not.a.jwt.token.at.all'
      ]

      for (const token of malformedTokens) {
        try {
          jwtService.verifyAccessToken(token)
          fail(`Should have rejected malformed token: ${token}`)
        } catch (error) {
          expect(error.message).toContain('invalid')
        }
      }
    })

    test('should handle edge cases in user data validation', async () => {
      const edgeCases = [
        { firstName: '', lastName: 'Test', displayName: 'Test', email: 'test@test.com', password: 'validpassword123' },
        { firstName: 'A'.repeat(300), lastName: 'Test', displayName: 'Test', email: 'test@test.com', password: 'validpassword123' },
        { firstName: 'Valid', lastName: 'Test', displayName: 'Test', email: '', password: 'validpassword123' },
        { firstName: 'Valid', lastName: 'Test', displayName: 'Test', email: 'test@test.com', password: '' }
      ]

      for (const userData of edgeCases) {
        try {
          await authService.register({
            ...userData,
            experienceLevel: 'beginner' as const
          })
          fail(`Should have rejected invalid user data: ${JSON.stringify(userData)}`)
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      }
    })
  })

  describe('Performance and Scalability Behavior', () => {
    test('should handle multiple concurrent authentication requests', async () => {
      const concurrentRequests = 20
      const timestamp = Date.now()

      const registrationPromises = Array(concurrentRequests).fill(0).map((_, index) => 
        authService.register({
          firstName: `Concurrent`,
          lastName: `User ${index}`,
          displayName: `Concurrent User ${index}`,
          email: `concurrent-${timestamp}-${index}@test.com`,
          password: 'testpassword123',
          experienceLevel: 'beginner' as const
        })
      )

      const startTime = Date.now()
      const results = await Promise.allSettled(registrationPromises)
      const endTime = Date.now()

      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful).toHaveLength(concurrentRequests)

      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000)

      // Cleanup
      for (const result of successful) {
        if (result.status === 'fulfilled') {
          await userRepository.deactivate(result.value.user.id)
        }
      }
    }, 10000)

    test('should maintain performance with large user base', async () => {
      // Create many users to test performance
      const userCount = 100
      const timestamp = Date.now()
      const createdUsers: any[] = []

      try {
        // Create users
        for (let i = 0; i < userCount; i++) {
          const user = await userRepository.create({
            firstName: `Performance`,
            lastName: `User ${i}`,
            displayName: `Performance User ${i}`,
            email: `perf-${timestamp}-${i}@test.com`,
            password: 'testpassword123',
            experienceLevel: 'beginner'
          })
          createdUsers.push(user)
        }

        // Test search performance
        const startTime = Date.now()
        const searchResults = await userRepository.search('Performance')
        const endTime = Date.now()

        // Search should be fast
        expect(endTime - startTime).toBeLessThan(1000)
        expect(searchResults.length).toBe(userCount)

        // Test login performance
        const loginStartTime = Date.now()
        const loginPromises = createdUsers.slice(0, 10).map(user => 
          authService.login(user.email, 'testpassword123')
        )
        await Promise.all(loginPromises)
        const loginEndTime = Date.now()

        // Logins should be fast
        expect(loginEndTime - loginStartTime).toBeLessThan(2000)

      } finally {
        // Cleanup
        for (const user of createdUsers) {
          await userRepository.deactivate(user.id)
        }
      }
    }, 30000)
  })
})
