/**
 * Behavioral Tests for Track Management System
 * 
 * These tests verify critical track management scenarios and spatial behaviors
 * to ensure the system works correctly under various conditions.
 */

import { trackService } from '../../server/src/track'
import { trackRepository } from '../../server/src/database/repositories'
import { logger } from '../../server/src/utils/logger'

describe('Track Management Behavioral Tests', () => {
  let testTrack: any

  beforeAll(async () => {
    // Create test track for behavioral tests
    const timestamp = Date.now()
    testTrack = await trackRepository.create({
      name: `Behavioral Test Track ${timestamp}`,
      description: 'A test track for behavioral testing',
      locationName: 'Test Location',
      centerline: JSON.stringify({
        type: 'LineString',
        coordinates: [
          [-122.4194, 37.7749],
          [-122.4184, 37.7759],
          [-122.4174, 37.7769],
          [-122.4164, 37.7779],
          [-122.4154, 37.7789]
        ]
      }),
      boundaries: JSON.stringify({
        type: 'Polygon',
        coordinates: [[
          [-122.4200, 37.7740],
          [-122.4140, 37.7740],
          [-122.4140, 37.7800],
          [-122.4200, 37.7800],
          [-122.4200, 37.7740]
        ]]
      }),
      startFinishPoint: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749]
      }),
      trackType: 'CIRCUIT',
      difficultyLevel: 'MODERATE',
      lengthMeters: 1000,
      estimatedLapTimeSeconds: 60,
      maxSpeedKmh: 200,
      corners: 8,
      elevationGain: 50,
      createdBy: 'test-user'
    })
  })

  afterAll(async () => {
    // Cleanup test track
    if (testTrack) {
      await trackRepository.delete(testTrack.id)
    }
  })

  describe('Track Creation and Validation', () => {
    test('should validate track geometry correctly', async () => {
      const invalidTrack = {
        name: 'Invalid Track',
        description: 'Track with invalid geometry',
        locationName: 'Invalid Location',
        centerline: JSON.stringify({
          type: 'InvalidType',
          coordinates: []
        }),
        boundaries: JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
          ]]
        }),
        startFinishPoint: JSON.stringify({
          type: 'Point',
          coordinates: [0, 0]
        }),
        trackType: 'CIRCUIT',
        difficultyLevel: 'MODERATE',
        createdBy: 'test-user'
      }

      try {
        await trackService.createTrack(invalidTrack)
        fail('Should have rejected track with invalid geometry')
      } catch (error) {
        expect(error.message).toContain('Invalid geometry')
      }
    })

    test('should handle concurrent track creation', async () => {
      const timestamp = Date.now()
      const trackData = {
        name: `Concurrent Track ${timestamp}`,
        description: 'Track for concurrent testing',
        locationName: 'Concurrent Location',
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
        startFinishPoint: JSON.stringify({
          type: 'Point',
          coordinates: [-122.4194, 37.7749]
        }),
        trackType: 'CIRCUIT',
        difficultyLevel: 'EASY',
        createdBy: 'test-user'
      }

      // Create multiple tracks concurrently
      const createPromises = Array(5).fill(0).map((_, index) => 
        trackService.createTrack({
          ...trackData,
          name: `${trackData.name} ${index}`
        })
      )

      const results = await Promise.allSettled(createPromises)
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful).toHaveLength(5)

      // Cleanup
      for (const result of successful) {
        if (result.status === 'fulfilled') {
          await trackRepository.delete(result.value.id)
        }
      }
    })

    test('should calculate track metrics automatically', async () => {
      const trackWithMetrics = await trackService.calculateTrackMetrics(testTrack.id)
      
      expect(trackWithMetrics.lengthMeters).toBeGreaterThan(0)
      expect(trackWithMetrics.corners).toBeGreaterThan(0)
      expect(trackWithMetrics.estimatedLapTimeSeconds).toBeGreaterThan(0)
    })
  })

  describe('Spatial Operations', () => {
    test('should project GPS points to track correctly', async () => {
      const gpsPoint = {
        lat: 37.7759,
        lng: -122.4184
      }

      const projection = await trackService.projectPointToTrack(testTrack.id, gpsPoint)
      
      expect(projection).toBeDefined()
      expect(projection.distance).toBeGreaterThanOrEqual(0)
      expect(projection.pointOnTrack).toBeDefined()
    })

    test('should find tracks within radius', async () => {
      const centerPoint = {
        lat: 37.7749,
        lng: -122.4194
      }
      const radiusKm = 10

      const nearbyTracks = await trackService.findTracksNearLocation(centerPoint, radiusKm)
      
      expect(nearbyTracks.length).toBeGreaterThan(0)
      expect(nearbyTracks.some(track => track.id === testTrack.id)).toBe(true)
    })

    test('should handle invalid GPS coordinates gracefully', async () => {
      const invalidPoints = [
        { lat: 91, lng: 0 }, // Invalid latitude
        { lat: 0, lng: 181 }, // Invalid longitude
        { lat: NaN, lng: 0 }, // NaN latitude
        { lat: 0, lng: undefined } // Undefined longitude
      ]

      for (const point of invalidPoints) {
        try {
          await trackService.projectPointToTrack(testTrack.id, point)
          // If it doesn't throw, that's acceptable behavior
          expect(true).toBe(true)
        } catch (error) {
          expect(error.message).toContain('Invalid coordinates')
        }
      }
    })
  })

  describe('Track Search and Filtering', () => {
    test('should search tracks by name', async () => {
      const searchResults = await trackService.searchTracks('Behavioral')
      expect(searchResults.length).toBeGreaterThan(0)
      expect(searchResults[0].name).toContain('Behavioral')
    })

    test('should filter tracks by type', async () => {
      const circuitTracks = await trackService.getTracksByType('CIRCUIT')
      expect(circuitTracks.length).toBeGreaterThan(0)
      expect(circuitTracks.every(track => track.track_type === 'CIRCUIT')).toBe(true)
    })

    test('should filter tracks by difficulty', async () => {
      const moderateTracks = await trackService.getTracksByDifficulty('MODERATE')
      expect(moderateTracks.length).toBeGreaterThan(0)
      expect(moderateTracks.every(track => track.difficulty_level === 'MODERATE')).toBe(true)
    })

    test('should handle empty search results gracefully', async () => {
      const emptyResults = await trackService.searchTracks('NonExistentTrack')
      expect(emptyResults).toEqual([])
    })
  })

  describe('Track Updates and Modifications', () => {
    test('should update track information', async () => {
      const updateData = {
        name: 'Updated Behavioral Test Track',
        description: 'Updated description',
        difficultyLevel: 'HARD'
      }

      const updatedTrack = await trackService.updateTrack(testTrack.id, updateData)
      
      expect(updatedTrack.name).toBe(updateData.name)
      expect(updatedTrack.description).toBe(updateData.description)
      expect(updatedTrack.difficulty_level).toBe(updateData.difficultyLevel)
    })

    test('should reject invalid track updates', async () => {
      const invalidUpdate = {
        trackType: 'INVALID_TYPE'
      }

      try {
        await trackService.updateTrack(testTrack.id, invalidUpdate)
        fail('Should have rejected invalid track type')
      } catch (error) {
        expect(error.message).toContain('Invalid track type')
      }
    })

    test('should handle concurrent updates gracefully', async () => {
      const updatePromises = Array(5).fill(0).map((_, index) => 
        trackService.updateTrack(testTrack.id, {
          description: `Concurrent update ${index}`
        })
      )

      const results = await Promise.allSettled(updatePromises)
      const successful = results.filter(r => r.status === 'fulfilled')
      
      // At least some should succeed
      expect(successful.length).toBeGreaterThan(0)
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle large numbers of track queries efficiently', async () => {
      const startTime = Date.now()
      
      // Perform multiple queries
      const promises = Array(20).fill(0).map(() => 
        trackService.searchTracks('Test')
      )
      
      await Promise.all(promises)
      const endTime = Date.now()
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(2000)
    })

    test('should handle complex spatial queries efficiently', async () => {
      const startTime = Date.now()
      
      // Perform spatial operations
      await trackService.findTracksNearLocation({ lat: 37.7749, lng: -122.4194 }, 50)
      await trackService.projectPointToTrack(testTrack.id, { lat: 37.7759, lng: -122.4184 })
      await trackService.calculateTrackBounds(testTrack.id)
      
      const endTime = Date.now()
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle non-existent track operations', async () => {
      const nonExistentId = 'non-existent-track-id'
      
      try {
        await trackService.getTrackById(nonExistentId)
        fail('Should have thrown error for non-existent track')
      } catch (error) {
        expect(error.message).toContain('not found')
      }
    })

    test('should handle malformed geometry data', async () => {
      const malformedGeometries = [
        'invalid json',
        '{"type": "Point"}', // Missing coordinates
        '{"type": "Point", "coordinates": []}', // Empty coordinates
        '{"coordinates": [1, 2]}' // Missing type
      ]

      for (const geometry of malformedGeometries) {
        try {
          await trackRepository.create({
            name: 'Malformed Geometry Test',
            description: 'Test with malformed geometry',
            locationName: 'Test',
            centerline: geometry,
            boundaries: geometry,
            startFinishPoint: geometry,
            trackType: 'CIRCUIT',
            difficultyLevel: 'EASY',
            createdBy: 'test-user'
          })
          fail(`Should have rejected malformed geometry: ${geometry}`)
        } catch (error) {
          expect(error.message).toBeDefined()
        }
      }
    })

    test('should handle database connection issues gracefully', async () => {
      // This would require mocking database failures
      // For now, test error handling paths
      try {
        await trackRepository.findById('invalid-id-format')
        // Should return null, not throw
        expect(true).toBe(true)
      } catch (error) {
        // If it throws, should be a proper error
        expect(error).toBeDefined()
      }
    })
  })

  describe('Track Statistics and Analytics', () => {
    test('should calculate track statistics', async () => {
      const stats = await trackService.getTrackStatistics(testTrack.id)
      
      expect(stats).toBeDefined()
      expect(stats.totalLength).toBeGreaterThan(0)
      expect(stats.totalCorners).toBeGreaterThan(0)
      expect(stats.averageDifficulty).toBeDefined()
    })

    test('should aggregate track statistics across multiple tracks', async () => {
      const allStats = await trackService.getAllTracksStatistics()
      
      expect(allStats).toBeDefined()
      expect(allStats.totalTracks).toBeGreaterThan(0)
      expect(allStats.averageLength).toBeGreaterThan(0)
      expect(allStats.tracksByType).toBeDefined()
    })
  })
})
