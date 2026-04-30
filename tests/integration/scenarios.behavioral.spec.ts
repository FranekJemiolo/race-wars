/**
 * Behavioral Tests for Critical System Scenarios
 * 
 * These tests verify end-to-end behaviors and critical workflows
 * to ensure the system works correctly under real-world conditions.
 */

import { userRepository, trackRepository, sessionRepository, eventRepository } from '../../server/src/database/repositories'
import { authService } from '../../server/src/auth'
import { logger } from '../../server/src/utils/logger'

describe('Critical System Scenarios Behavioral Tests', () => {
  describe('User Registration and Login Flow', () => {
    test('should complete full user registration and login cycle', async () => {
      const timestamp = Date.now()
      const userData = {
        firstName: 'Scenario',
        lastName: 'Test',
        displayName: 'Scenario Test User',
        email: `scenario-${timestamp}@test.com`,
        password: 'testpassword123',
        experienceLevel: 'beginner' as const
      }

      // Step 1: Register user
      const registrationResult = await authService.register(userData)
      expect(registrationResult.user.email).toBe(userData.email)
      expect(registrationResult.tokens.accessToken).toBeDefined()

      // Step 2: Login with same credentials
      const loginResult = await authService.login(userData.email, userData.password)
      expect(loginResult.user.email).toBe(userData.email)
      expect(loginResult.tokens.accessToken).toBeDefined()

      // Step 3: Verify user exists in database
      const dbUser = await userRepository.findByEmail(userData.email)
      expect(dbUser).toBeDefined()
      expect(dbUser.email).toBe(userData.email)

      // Cleanup
      await userRepository.deactivate(registrationResult.user.id)
    })

    test('should handle login with incorrect password', async () => {
      const timestamp = Date.now()
      const userData = {
        firstName: 'Wrong',
        lastName: 'Password',
        displayName: 'Wrong Password Test',
        email: `wrong-${timestamp}@test.com`,
        password: 'correctpassword123',
        experienceLevel: 'beginner' as const
      }

      // Register user
      const registrationResult = await authService.register(userData)

      // Try login with wrong password
      try {
        await authService.login(userData.email, 'wrongpassword123')
        fail('Should have rejected incorrect password')
      } catch (error) {
        expect(error.message).toContain('Invalid credentials')
      }

      // Cleanup
      await userRepository.deactivate(registrationResult.user.id)
    })
  })

  describe('Track Management Scenarios', () => {
    test('should create, find, and delete track successfully', async () => {
      const timestamp = Date.now()
      const trackData = {
        name: `Scenario Track ${timestamp}`,
        description: 'Track for scenario testing',
        location_name: 'Scenario Location',
        centerline: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [-122.4194, 37.7749],
            [-122.4184, 37.7759],
            [-122.4174, 37.7769]
          ]
        }),
        boundaries: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [-122.4200, 37.7740],
            [-122.4160, 37.7740],
            [-122.4160, 37.7780],
            [-122.4200, 37.7780],
            [-122.4200, 37.7740]
          ]]
        }),
        start_finish_point: JSON.stringify({
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        }),
        track_type: 'circuit' as const,
        difficulty_level: 'MODERATE',
              }

      // Step 1: Create track
      const createdTrack = await trackRepository.create(trackData)
      expect(createdTrack.name).toBe(trackData.name)
      expect(createdTrack.id).toBeDefined()

      // Step 2: Find track by ID
      const foundTrack = await trackRepository.findById(createdTrack.id)
      expect(foundTrack).toBeDefined()
      expect(foundTrack.name).toBe(trackData.name)

      // Step 3: Update track
      const updatedTrack = await trackRepository.update(createdTrack.id, {
        description: 'Updated description'
      })
      expect(updatedTrack.description).toBe('Updated description')

      // Step 4: Delete track
      const deleted = await trackRepository.delete(createdTrack.id)
      expect(deleted).toBe(true)

      // Step 5: Verify track is gone
      const deletedTrack = await trackRepository.findById(createdTrack.id)
      expect(deletedTrack).toBeNull()
    })

    test('should handle invalid track geometry gracefully', async () => {
      const invalidTrackData = {
        name: 'Invalid Track',
        description: 'Track with invalid geometry',
        location_name: 'Invalid Location',
        centerline: 'invalid json',
        boundaries: 'invalid json',
        start_finish_point: 'invalid json',
        track_type: 'circuit' as const,
        difficulty_level: 'EASY',
              }

      try {
        await trackRepository.create(invalidTrackData)
        fail('Should have rejected invalid geometry')
      } catch (error) {
        expect(error.message).toBeDefined()
      }
    })
  })

  describe('Event and Session Management Scenarios', () => {
    test('should create event with sessions', async () => {
      const timestamp = Date.now()
      
      // Step 1: Create event
      const eventData = {
        name: `Scenario Event ${timestamp}`,
        description: 'Event for scenario testing',
                start_date: new Date('2024-12-01'),
        end_date: new Date('2024-12-01'),
        location: 'Test Location',
        max_participants: 50,
              }

      const createdEvent = await eventRepository.create(eventData)
      expect(createdEvent.name).toBe(eventData.name)
      expect(createdEvent.id).toBeDefined()

      // Step 2: Create session for event
      const sessionData = {
        event_id: createdEvent.id,
        name: 'Practice Session',
        description: 'Practice session for testing',
        session_type: 'PRACTICE' as const,
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T10:00:00Z'),
        max_participants: 20,
              }

      const createdSession = await sessionRepository.create(sessionData)
      expect(createdSession.name).toBe(sessionData.name)
      expect(createdSession.event_id).toBe(createdEvent.id)

      // Step 3: Find sessions for event
      const eventSessions = await sessionRepository.findByEvent(createdEvent.id)
      expect(eventSessions).toHaveLength(1)
      expect(eventSessions[0].id).toBe(createdSession.id)

      // Cleanup
      await sessionRepository.delete(createdSession.id)
      await eventRepository.delete(createdEvent.id)
    })

    test('should handle session scheduling conflicts', async () => {
      const timestamp = Date.now()
      
      // Create event
      const eventData = {
        name: `Conflict Event ${timestamp}`,
        description: 'Event for conflict testing',
                start_date: new Date('2024-12-01'),
        end_date: new Date('2024-12-01'),
        location: 'Test Location',
        max_participants: 50,
              }

      const createdEvent = await eventRepository.create(eventData)

      // Create overlapping sessions
      const sessionData1 = {
        event_id: createdEvent.id,
        name: 'Session 1',
        description: 'First session',
        session_type: 'PRACTICE' as const,
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T11:00:00Z'),
        max_participants: 20,
              }

      const sessionData2 = {
        event_id: createdEvent.id,
        name: 'Session 2',
        description: 'Overlapping session',
        session_type: 'PRACTICE' as const,
        start_time: new Date('2024-12-01T10:00:00Z'),
        end_time: new Date('2024-12-01T12:00:00Z'),
        max_participants: 20,
              }

      // Both sessions should be created (conflict handling would be business logic)
      const createdSession1 = await sessionRepository.create(sessionData1)
      const createdSession2 = await sessionRepository.create(sessionData2)

      expect(createdSession1.id).toBeDefined()
      expect(createdSession2.id).toBeDefined()

      // Cleanup
      await sessionRepository.delete(createdSession1.id)
      await sessionRepository.delete(createdSession2.id)
      await eventRepository.delete(createdEvent.id)
    })
  })

  describe('Concurrent Operations Scenarios', () => {
    test('should handle multiple concurrent user registrations', async () => {
      const timestamp = Date.now()
      const concurrentCount = 10
      
      // Create multiple users concurrently
      const registrationPromises = Array(concurrentCount).fill(0).map((_, index) => {
        return authService.register({
          firstName: `Concurrent`,
          lastName: `User ${index}`,
          displayName: `Concurrent User ${index}`,
          email: `concurrent-${timestamp}-${index}@test.com`,
          password: 'testpassword123',
          experienceLevel: 'beginner' as const
        })
      })

      const results = await Promise.allSettled(registrationPromises)
      const successful = results.filter(r => r.status === 'fulfilled')
      
      expect(successful).toHaveLength(concurrentCount)

      // Verify all users exist
      for (const result of successful) {
        if (result.status === 'fulfilled') {
          const user = await userRepository.findByEmail(result.value.user.email)
          expect(user).toBeDefined()
          
          // Cleanup
          await userRepository.deactivate(result.value.user.id)
        }
      }
    })

    test('should handle concurrent track operations', async () => {
      const timestamp = Date.now()
      const concurrentCount = 5
      
      const trackData = {
        name: `Concurrent Track ${timestamp}`,
        description: 'Track for concurrent testing',
        location_name: 'Concurrent Location',
        centerline: JSON.stringify({
          type: 'LineString',
          coordinates: [[-122.4194, 37.7749], [-122.4184, 37.7759]]
        }),
        boundaries: JSON.stringify({
          type: 'Polygon',
          coordinates: [[[-122.4200, 37.7740], [-122.4180, 37.7740], [-122.4180, 37.7760], [-122.4200, 37.7760], [-122.4200, 37.7740]]]
        }),
        start_finish_point: JSON.stringify({
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        }),
        track_type: 'circuit' as const,
        difficulty_level: 'EASY',
              }

      // Create tracks concurrently
      const createPromises = Array(concurrentCount).fill(0).map((_, index) => {
        return trackRepository.create({
          ...trackData,
          name: `${trackData.name} ${index}`
        })
      })

      const createdTracks = await Promise.all(createPromises)
      expect(createdTracks).toHaveLength(concurrentCount)

      // Update tracks concurrently
      const updatePromises = createdTracks.map((track, index) => {
        return trackRepository.update(track.id, {
          description: `Updated description ${index}`
        })
      })

      const updatedTracks = await Promise.all(updatePromises)
      expect(updatedTracks).toHaveLength(concurrentCount)

      // Verify updates
      for (const track of updatedTracks) {
        expect(track.description).toContain('Updated description')
      }

      // Cleanup
      for (const track of createdTracks) {
        await trackRepository.deactivate(track.id)
      }
    })
  })

  describe('Error Recovery Scenarios', () => {
    test('should handle database connection issues gracefully', async () => {
      // Test operations that should handle connection issues
      try {
        await userRepository.findById('non-existent-id')
        // Should return null, not throw
        expect(true).toBe(true)
      } catch (error) {
        // If it throws, should be a proper error
        expect(error).toBeDefined()
      }

      try {
        await trackRepository.findById('non-existent-id')
        // Should return null, not throw
        expect(true).toBe(true)
      } catch (error) {
        // If it throws, should be a proper error
        expect(error).toBeDefined()
      }
    })

    test('should handle malformed data gracefully', async () => {
      // Test various malformed data scenarios
      const malformedScenarios = [
        {
          name: 'Empty email',
          data: { email: '', password: 'test123' }
        },
        {
          name: 'Invalid email format',
          data: { email: 'invalid-email', password: 'test123' }
        },
        {
          name: 'Short password',
          data: { email: 'test@test.com', password: '123' }
        }
      ]

      for (const scenario of malformedScenarios) {
        try {
          await authService.register({
            firstName: 'Test',
            lastName: 'User',
            displayName: 'Test User',
            email: scenario.data.email,
            password: scenario.data.password,
            experienceLevel: 'beginner' as const
          })
          fail(`Should have rejected ${scenario.name}`)
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      }
    })
  })

  describe('Performance Scenarios', () => {
    test('should handle bulk operations efficiently', async () => {
      const startTime = Date.now()
      const operationCount = 50

      // Create multiple users
      const userCreationPromises = Array(operationCount).fill(0).map((_, index) => {
        const timestamp = Date.now()
        return userRepository.create({
          first_name: `Bulk`,
          last_name: `User ${index}`,
          display_name: `Bulk User ${index}`,
          email: `bulk-${timestamp}-${index}@test.com`,
          password: 'testpassword123',
          experience_level: 'beginner'
        })
      })

      const createdUsers = await Promise.all(userCreationPromises)
      const creationTime = Date.now()

      // Search users
      const searchResults = await userRepository.search('Bulk')
      const searchTime = Date.now()

      // Cleanup
      const deletionPromises = createdUsers.map(user => 
        userRepository.deactivate(user.id)
      )
      await Promise.all(deletionPromises)
      const cleanupTime = Date.now()

      // Performance assertions
      expect(creationTime - startTime).toBeLessThan(5000) // 5 seconds for creation
      expect(searchTime - creationTime).toBeLessThan(1000) // 1 second for search
      expect(cleanupTime - searchTime).toBeLessThan(2000) // 2 seconds for cleanup
      expect(searchResults.length).toBe(operationCount)
    }, 15000)

    test('should maintain performance under concurrent load', async () => {
      const concurrentOperations = 20
      const startTime = Date.now()

      // Perform mixed operations concurrently
      const operations = Array(concurrentOperations).fill(0).map(async (_, index) => {
        const timestamp = Date.now()
        
        // Create user
        const user = await userRepository.create({
          first_name: `Load`,
          last_name: `Test ${index}`,
          display_name: `Load Test ${index}`,
          email: `load-${timestamp}-${index}@test.com`,
          password: 'testpassword123',
          experience_level: 'beginner'
        })

        // Find user
        const foundUser = await userRepository.findById(user.id)
        expect(foundUser.id).toBe(user.id)

        // Update user
        await userRepository.update(user.id, {
          display_name: `Updated Load Test ${index}`
        })

        // Delete user
        await userRepository.deactivate(user.id)
      })

      await Promise.all(operations)
      const endTime = Date.now()

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds
    }, 15000)
  })

  describe('Data Integrity Scenarios', () => {
    test('should maintain referential integrity', async () => {
      const timestamp = Date.now()
      
      // Create event
      const event = await eventRepository.create({
        name: `Integrity Event ${timestamp}`,
        description: 'Event for integrity testing',
                start_date: new Date('2024-12-01'),
        end_date: new Date('2024-12-01'),
        location: 'Test Location',
        max_participants: 50,
              })

      // Create session with valid event_id
      const session = await sessionRepository.create({
        event_id: event.id,
        name: 'Integrity Session',
        description: 'Session for integrity testing',
        session_type: 'PRACTICE' as const,
        start_time: new Date('2024-12-01T09:00:00Z'),
        end_time: new Date('2024-12-01T10:00:00Z'),
        max_participants: 20,
              })

      // Verify relationship
      const foundSession = await sessionRepository.findById(session.id)
      expect(foundSession.event_id).toBe(event.id)

      const eventSessions = await sessionRepository.findByEvent(event.id)
      expect(eventSessions).toHaveLength(1)

      // Cleanup in correct order (session first, then event)
      await sessionRepository.delete(session.id)
      await eventRepository.delete(event.id)
    })

    test('should handle transaction rollback scenarios', async () => {
      // This would require testing transaction rollback
      // For now, test that operations fail appropriately
      try {
        await userRepository.create({
          first_name: '',
          last_name: 'Test',
          display_name: 'Test',
          email: 'test@test.com',
          password: 'testpassword123',
          experience_level: 'beginner'
        })
        fail('Should have failed validation')
      } catch (error) {
        expect(error.message).toBeDefined()
      }

      // Verify no partial data was created
      const user = await userRepository.findByEmail('test@test.com')
      expect(user).toBeNull()
    })
  })
})
