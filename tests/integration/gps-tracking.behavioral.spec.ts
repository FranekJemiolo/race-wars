/**
 * Behavioral Tests for GPS Tracking and Live Telemetry
 * 
 * These tests verify the end-to-end functionality of:
 * 1. GPS telemetry ingestion, spatial calculations (distance, bearing, speed).
 * 2. Turf.js track projection, distance-to-centerline, and on/off-track boundary detection.
 * 3. Anti-cheat GPS validation, spoofing/teleportation detection, and risk scoring.
 * 4. Multi-user live race tracking, state transitions, and real-time leaderboard ranking.
 */

import * as turf from '@turf/turf'
import { point } from '@turf/helpers'
import { trackService } from '../../server/src/track'
import { trackRepository } from '../../server/src/database/repositories'
import { AntiCheatService, GPSDataPoint } from '../../server/src/services/antiCheat.service'
import { createPlayer, createPlayerManager } from '../../server/src/state/playerState'
import { computeLeaderboard, createLeaderboardState, updateLeaderboardState } from '../../server/src/state/leaderboard'
import { LatLng, Player } from '@race-wars/shared'

describe('GPS Tracking & Live Telemetry Behavioral Tests', () => {
  let testTrack: any
  let antiCheat: AntiCheatService

  // Reference coordinates for a test circuit (rectangular race loop)
  const p1: [number, number] = [-122.4200, 37.7740] // Start/Finish (lng, lat)
  const p2: [number, number] = [-122.4100, 37.7740] // Turn 1
  const p3: [number, number] = [-122.4100, 37.7800] // Turn 2
  const p4: [number, number] = [-122.4200, 37.7800] // Turn 3
  const pClose: [number, number] = [-122.4200, 37.7740] // Loop back

  beforeAll(async () => {
    antiCheat = new AntiCheatService({
      maxSpeed: 320, // 320 km/h threshold
      maxAcceleration: 40,
      maxDistancePerUpdate: 200, // max 200m per update
      minTimeBetweenUpdates: 500
    })

    const timestamp = Date.now()
    testTrack = await trackRepository.create({
      name: `GPS Tracking Test Track ${timestamp}`,
      description: 'Dedicated track for GPS telemetry behavioral validation',
      location_name: 'San Francisco Bay Circuit',
      centerline: JSON.stringify({
        type: 'LineString',
        coordinates: [p1, p2, p3, p4, pClose]
      }),
      boundaries: JSON.stringify({
        type: 'Polygon',
        coordinates: [[
          [-122.4220, 37.7720],
          [-122.4080, 37.7720],
          [-122.4080, 37.7820],
          [-122.4220, 37.7820],
          [-122.4220, 37.7720]
        ]]
      }),
      start_finish_line: JSON.stringify({
        type: 'Point',
        coordinates: p1
      }),
      track_type: 'circuit' as const,
      difficulty_level: 'intermediate' as const,
      length_meters: 3000,
      estimatedLapTimeSeconds: 90,
      maxSpeedKmh: 280,
      corners: 4,
      elevationGain: 20,
      created_by: 'gps-test-suite'
    })
  })

  afterAll(async () => {
    if (testTrack?.id) {
      await trackRepository.deactivate(testTrack.id)
    }
  })

  describe('1. Spatial Telemetry & GPS Ingestion', () => {
    test('accurately calculates distance and bearings between GPS updates', () => {
      const ptA = point(p1)
      const ptB = point(p2)

      const distanceKm = turf.distance(ptA, ptB, { units: 'kilometers' })
      const distanceMeters = distanceKm * 1000
      expect(distanceMeters).toBeGreaterThan(800)
      expect(distanceMeters).toBeLessThan(1000)

      const bearing = turf.bearing(ptA, ptB)
      // Eastward heading should be approx 90 degrees
      expect(bearing).toBeCloseTo(90, 0)
    })

    test('derives realistic speed (km/h) from delta position and timestamp', () => {
      const startCoord = { lat: 37.7740, lon: -122.4200, time: 10000 }
      const nextCoord = { lat: 37.7740, lon: -122.4195, time: 11000 } // 1 second later

      const fromPt = point([startCoord.lon, startCoord.lat])
      const toPt = point([nextCoord.lon, nextCoord.lat])
      const deltaMeters = turf.distance(fromPt, toPt, { units: 'meters' })
      const deltaTimeSeconds = (nextCoord.time - startCoord.time) / 1000

      const speedMetersPerSecond = deltaMeters / deltaTimeSeconds
      const speedKmh = speedMetersPerSecond * 3.6

      expect(speedKmh).toBeGreaterThan(100)
      expect(speedKmh).toBeLessThan(200)
    })
  })

  describe('2. Turf.js Track Projection & Boundary Compliance', () => {
    test('projects user GPS position onto track centerline with accurate progress', async () => {
      // Driver at mid-point along first straight (between p1 and p2)
      const midStraightLng = (p1[0] + p2[0]) / 2
      const midStraightLat = p1[1]

      const projection = await trackService.projectToTrack(testTrack.id, midStraightLat, midStraightLng)

      expect(projection).not.toBeNull()
      expect(projection?.isOnTrack).toBe(true)
      expect(projection?.progress).toBeGreaterThan(0.05)
      expect(projection?.progress).toBeLessThan(0.35)
      expect(projection?.projectedPoint).toBeDefined()
    })

    test('correctly identifies when GPS deviates outside track boundaries (off-track)', async () => {
      // Location far outside the boundary polygon
      const offTrackLat = 37.8000 // way north of 37.7820 boundary
      const offTrackLng = -122.4200

      const projection = await trackService.projectToTrack(testTrack.id, offTrackLat, offTrackLng)

      expect(projection).not.toBeNull()
      expect(projection?.isOnTrack).toBe(false)
      expect(projection?.deviationMeters).toBeGreaterThan(0)
    })

    test('validates driver progression as they travel around the circuit', async () => {
      const waypoints = [
        { lat: p1[1], lng: p1[0] }, // ~0%
        { lat: p2[1], lng: p2[0] }, // ~25%
        { lat: p3[1], lng: p3[0] }, // ~50%
        { lat: p4[1], lng: p4[0] }, // ~75%
      ]

      let lastProgress = -1
      for (const wp of waypoints) {
        const proj = await trackService.projectToTrack(testTrack.id, wp.lat, wp.lng)
        expect(proj).toBeDefined()
        expect(proj!.progress).toBeGreaterThan(lastProgress)
        lastProgress = proj!.progress
      }
    })
  })

  describe('3. Anti-Cheat GPS Telemetry Validation', () => {
    test('passes normal racing telemetry without flagging cheating', async () => {
      const sessionId = 'race-session-alpha'
      const participantId = 'racer-clean-1'
      const now = Date.now()

      const p1Data: GPSDataPoint = {
        sessionId,
        participantId,
        timestamp: now,
        lat: 37.7740,
        lng: -122.4200,
        speed: 120,
        heading: 90,
        accuracy: 4,
        source: 'gps',
        quality: 'high',
        satelliteCount: 12,
        hdop: 0.8
      }

      const p2Data: GPSDataPoint = {
        sessionId,
        participantId,
        timestamp: now + 1000,
        lat: 37.7740,
        lng: -122.4196,
        speed: 125,
        heading: 90,
        accuracy: 3,
        source: 'gps',
        quality: 'high',
        satelliteCount: 12,
        hdop: 0.7
      }

      await antiCheat.analyzeGPSData(p1Data)
      const result = await antiCheat.analyzeGPSData(p2Data)

      expect(result.isCheating).toBe(false)
      expect(result.riskScore).toBeLessThan(30)
      expect(result.anomalies.length).toBe(0)
    })

    test('detects impossible speed spikes', async () => {
      const sessionId = 'race-session-alpha'
      const participantId = 'racer-speeding'
      const now = Date.now()

      const impossibleData: GPSDataPoint = {
        sessionId,
        participantId,
        timestamp: now,
        lat: 37.7740,
        lng: -122.4200,
        speed: 480, // 480 km/h - exceeds maxSpeed (320 km/h)
        heading: 90,
        accuracy: 3,
        source: 'gps',
        quality: 'high',
        satelliteCount: 10
      }

      const result = await antiCheat.analyzeGPSData(impossibleData)
      expect(result.riskScore).toBeGreaterThan(0)

      const speedAnomaly = result.anomalies.find(a => a.type === 'speed_spike')
      expect(speedAnomaly).toBeDefined()
      expect(speedAnomaly?.severity).toBe('high')
    })

    test('detects GPS spoofing and teleportation jump', async () => {
      const sessionId = 'race-session-alpha'
      const participantId = 'racer-teleporter'
      const now = Date.now()

      // Initial fix
      await antiCheat.analyzeGPSData({
        sessionId,
        participantId,
        timestamp: now,
        lat: 37.7740,
        lng: -122.4200,
        speed: 100,
        heading: 90,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      })

      // Jump 10 km away in just 200ms (< minTimeBetweenUpdates 500ms)
      const teleportResult = await antiCheat.analyzeGPSData({
        sessionId,
        participantId,
        timestamp: now + 200,
        lat: 37.8500, // huge leap north
        lng: -122.4200,
        speed: 100,
        heading: 90,
        accuracy: 5,
        source: 'gps',
        quality: 'high'
      })

      const teleportAnomaly = teleportResult.anomalies.find(
        a => a.type === 'teleportation'
      )
      expect(teleportAnomaly).toBeDefined()
      expect(teleportAnomaly?.severity).toBe('critical')
    })
  })

  describe('4. Multi-User Live Tracking & Leaderboard Progression', () => {
    test('updates player positions and dynamic leaderboard rankings', () => {
      const p1Initial: LatLng = { lat: 37.7740, lon: -122.4200 }
      const player1: Player = createPlayer('user-racer-1', 'Lightning McQueen', p1Initial)
      const player2: Player = createPlayer('user-racer-2', 'Jackson Storm', p1Initial)

      const pm1 = createPlayerManager(player1)
      const pm2 = createPlayerManager(player2)

      // Both players arm and start racing
      pm1.transitionState('READY')
      pm1.transitionState('ARMED')
      pm1.transitionState('RACING')

      pm2.transitionState('READY')
      pm2.transitionState('ARMED')
      pm2.transitionState('RACING')

      expect(player1.state).toBe('RACING')
      expect(player2.state).toBe('RACING')

      // Driver 1 advances further along the track (progress 2250m vs 1200m)
      pm1.updatePosition({ lat: 37.7800, lon: -122.4200 }, { lat: 37.7800, lon: -122.4200 })
      pm1.updateProgress(2250, 3)
      pm1.updateSpeed(145)

      pm2.updatePosition({ lat: 37.7740, lon: -122.4100 }, { lat: 37.7740, lon: -122.4100 })
      pm2.updateProgress(1200, 1)
      pm2.updateSpeed(130)

      // Compute leaderboard for track length 3000m
      const trackLength = 3000
      const entries = computeLeaderboard([player1, player2], trackLength, true)

      expect(entries).toHaveLength(2)
      // McQueen should be in 1st place due to higher progress
      expect(entries[0].playerId).toBe('user-racer-1')
      expect(entries[0].rank).toBe(1)
      expect(entries[0].progress).toBe(2250)

      // Jackson Storm in 2nd place
      expect(entries[1].playerId).toBe('user-racer-2')
      expect(entries[1].rank).toBe(2)
      expect(entries[1].progress).toBe(1200)

      // Leaderboard state version tracking
      let lbState = createLeaderboardState()
      lbState = updateLeaderboardState(lbState, entries)
      expect(lbState.version).toBe(1)
      expect(lbState.entries[0].playerId).toBe('user-racer-1')

      // When Jackson Storm overtakes (progress 2700m), computeLeaderboard swaps them
      pm2.updateProgress(2700, 4)
      const updatedEntries = computeLeaderboard([player1, player2], trackLength, true)
      expect(updatedEntries[0].playerId).toBe('user-racer-2')
      expect(updatedEntries[0].rank).toBe(1)
      expect(updatedEntries[1].playerId).toBe('user-racer-1')
      expect(updatedEntries[1].rank).toBe(2)
    })
  })
})
