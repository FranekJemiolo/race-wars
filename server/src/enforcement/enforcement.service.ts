/**
 * Enforcement Service
 * 
 * Handles the game mechanics enforcement layer including speed zone detection,
 * penalty calculation, patrol AI behavior, and violation tracking.
 * Implements the "Need for Speed mode" enforcement mechanics.
 */

import { enforcementZoneRepository, sessionParticipantRepository, lapRecordRepository } from '../database/repositories'
import { logger } from '../utils/logger'
import { EventEmitter } from 'events'
import * as turf from '@turf/turf'
import { point, distance } from '@turf/helpers'

export interface SpeedViolation {
  id: string
  sessionId: string
  userId: string
  sessionParticipantId: string
  enforcementZoneId: string
  violationType: 'SPEEDING' | 'RADAR_DETECTION' | 'HEAT_ZONE' | 'PATROL_INTERCEPT'
  speedKmh: number
  speedLimitKmh: number
  excessSpeedKmh: number
  location: { lat: number; lng: number }
  timestamp: Date
  penaltyType: 'TIME' | 'POINTS' | 'WARNING'
  penaltyAmount: number
  detectedBy: 'ZONE' | 'PATROL' | 'RADAR'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  processed: boolean
}

export interface PatrolUnit {
  id: string
  routeId: string
  sessionId: string
  currentPosition: { lat: number; lng: number }
  currentHeading: number
  currentSpeedKmh: number
  targetSpeedKmh: number
  patrolRoute: any // GeoJSON LineString
  routeProgress: number // 0-1 along patrol route
  state: 'PATROLLING' | 'PURSUING' | 'INTERCEPTING' | 'RETURNING_TO_ROUTE'
  targetUserId?: string
  lastDetection?: Date
  detectionRadius: number
  interceptSpeed: number
  createdAt: Date
  updatedAt: Date
}

export interface HeatMapData {
  sessionId: string
  routeId: string
  gridSize: number
  cells: HeatMapCell[]
  lastUpdated: Date
}

export interface HeatMapCell {
  lat: number
  lng: number
  intensity: number
  violationCount: number
  lastActivity: Date
}

export class EnforcementService extends EventEmitter {
  private activePatrols: Map<string, PatrolUnit> = new Map()
  private heatMaps: Map<string, HeatMapData> = new Map()
  private violationHistory: Map<string, SpeedViolation[]> = new Map()
  private patrolIntervals: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Check speed violations for a GPS position
   */
  async checkSpeedViolations(
    sessionId: string,
    userId: string,
    sessionParticipantId: string,
    lat: number,
    lng: number,
    speedKmh: number
  ): Promise<SpeedViolation[]> {
    try {
      const violations: SpeedViolation[] = []
      const currentPoint = point([lng, lat])

      // Get all enforcement zones for the session's route
      const zones = await this.getEnforcementZonesForSession(sessionId)
      
      for (const zone of zones) {
        const violation = await this.checkZoneViolation(
          zone,
          sessionId,
          userId,
          sessionParticipantId,
          currentPoint,
          speedKmh
        )
        
        if (violation) {
          violations.push(violation)
        }
      }

      // Check patrol unit interceptions
      const patrolViolation = await this.checkPatrolInterception(
        sessionId,
        userId,
        sessionParticipantId,
        currentPoint,
        speedKmh
      )
      
      if (patrolViolation) {
        violations.push(patrolViolation)
      }

      // Update heat map
      if (violations.length > 0) {
        await this.updateHeatMap(sessionId, lat, lng, violations)
      }

      // Store violations in history
      if (!this.violationHistory.has(sessionId)) {
        this.violationHistory.set(sessionId, [])
      }
      this.violationHistory.get(sessionId)!.push(...violations)

      // Emit violations event
      this.emit('violationsDetected', { sessionId, userId, violations })

      return violations
    } catch (error) {
      logger.error('Failed to check speed violations', { sessionId, userId, error })
      return []
    }
  }

  /**
   * Check if a position violates a specific enforcement zone
   */
  private async checkZoneViolation(
    zone: any,
    sessionId: string,
    userId: string,
    sessionParticipantId: string,
    position: any,
    speedKmh: number
  ): Promise<SpeedViolation | null> {
    try {
      // Check if point is within zone detection radius
      const zoneGeometry = JSON.parse(zone.geometry)
      const distance = turf.distance(position, zoneGeometry, { units: 'meters' })

      if (distance > zone.detection_radius_meters) {
        return null
      }

      // Check if zone has speed limit and if speed exceeds it
      if (zone.speed_limit_kmh && speedKmh > zone.speed_limit_kmh) {
        const excessSpeed = speedKmh - zone.speed_limit_kmh
        const severity = this.calculateViolationSeverity(excessSpeed, zone.speed_limit_kmh)
        
        // Check warning threshold
        if (zone.warning_threshold_kmh && excessSpeed < zone.warning_threshold_kmh) {
          return null
        }

        return {
          id: this.generateId(),
          sessionId,
          userId,
          sessionParticipantId,
          enforcementZoneId: zone.id,
          violationType: this.getViolationType(zone.zone_type),
          speedKmh,
          speedLimitKmh: zone.speed_limit_kmh,
          excessSpeedKmh: excessSpeed,
          location: { lat: position.geometry.coordinates[1], lng: position.geometry.coordinates[0] },
          timestamp: new Date(),
          penaltyType: zone.penalty_type,
          penaltyAmount: this.calculatePenalty(zone, excessSpeed, severity),
          detectedBy: 'ZONE',
          severity,
          processed: false
        }
      }

      return null
    } catch (error) {
      logger.error('Failed to check zone violation', { zoneId: zone.id, error })
      return null
    }
  }

  /**
   * Check for patrol unit interceptions
   */
  private async checkPatrolInterception(
    sessionId: string,
    userId: string,
    sessionParticipantId: string,
    position: any,
    speedKmh: number
  ): Promise<SpeedViolation | null> {
    try {
      const patrols = Array.from(this.activePatrols.values())
        .filter(patrol => patrol.sessionId === sessionId)

      for (const patrol of patrols) {
        const patrolPoint = point([patrol.currentPosition.lng, patrol.currentPosition.lat])
        const distance = turf.distance(position, patrolPoint, { units: 'meters' })

        if (distance <= patrol.detectionRadius) {
          // Check if user is speeding relative to patrol context
          const speedLimit = patrol.targetSpeedKmh || 80
          if (speedKmh > speedLimit) {
            const excessSpeed = speedKmh - speedLimit
            const severity = this.calculateViolationSeverity(excessSpeed, speedLimit)

            return {
              id: this.generateId(),
              sessionId,
              userId,
              sessionParticipantId,
              enforcementZoneId: patrol.id,
              violationType: 'PATROL_INTERCEPT',
              speedKmh,
              speedLimitKmh: speedLimit,
              excessSpeedKmh: excessSpeed,
              location: { lat: position.geometry.coordinates[1], lng: position.geometry.coordinates[0] },
              timestamp: new Date(),
              penaltyType: 'TIME',
              penaltyAmount: this.calculatePatrolPenalty(excessSpeed, severity),
              detectedBy: 'PATROL',
              severity,
              processed: false
            }
          }
        }
      }

      return null
    } catch (error) {
      logger.error('Failed to check patrol interception', { sessionId, error })
      return null
    }
  }

  /**
   * Initialize patrol units for a session
   */
  async initializePatrols(sessionId: string, routeId: string): Promise<void> {
    logger.info('Initializing patrol units', { sessionId, routeId })

    try {
      // Get patrol route zones
      const patrolZones = await enforcementZoneRepository.findByType(routeId, 'PATROL_ROUTE')
      
      for (const zone of patrolZones) {
        const patrolRoute = JSON.parse(zone.patrol_route || '{}')
        
        if (patrolRoute.geometry && patrolRoute.geometry.coordinates) {
          const patrol: PatrolUnit = {
            id: this.generateId(),
            routeId,
            sessionId,
            currentPosition: {
              lat: patrolRoute.geometry.coordinates[0][1],
              lng: patrolRoute.geometry.coordinates[0][0]
            },
            currentHeading: 0,
            currentSpeedKmh: 0,
            targetSpeedKmh: zone.patrol_speed_kmh || 60,
            patrolRoute,
            routeProgress: 0,
            state: 'PATROLLING',
            detectionRadius: zone.detection_radius_meters || 100,
            interceptSpeed: zone.patrol_speed_kmh ? zone.patrol_speed_kmh * 1.5 : 90,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          this.activePatrols.set(patrol.id, patrol)
          
          // Start patrol movement
          this.startPatrolMovement(patrol.id)
        }
      }

      logger.info('Patrol units initialized', { sessionId, patrolCount: patrolZones.length })
    } catch (error) {
      logger.error('Failed to initialize patrol units', { sessionId, error })
    }
  }

  /**
   * Start patrol unit movement along route
   */
  private startPatrolMovement(patrolId: string): void {
    const interval = setInterval(() => {
      this.updatePatrolPosition(patrolId)
    }, 1000) // Update every second

    this.patrolIntervals.set(patrolId, interval)
  }

  /**
   * Update patrol unit position
   */
  private async updatePatrolPosition(patrolId: string): Promise<void> {
    try {
      const patrol = this.activePatrols.get(patrolId)
      if (!patrol) return

      const coordinates = patrol.patrolRoute.geometry.coordinates
      const totalPoints = coordinates.length

      // Calculate next position
      let nextIndex = Math.floor(patrol.routeProgress * (totalPoints - 1))
      let nextProgress = patrol.routeProgress

      if (patrol.state === 'PATROLLING') {
        // Move along patrol route
        nextProgress += 0.01 // 1% progress per second
        if (nextProgress >= 1) {
          nextProgress = 0 // Loop back to start
        }

        nextIndex = Math.floor(nextProgress * (totalPoints - 1))
        const nextCoord = coordinates[nextIndex]
        
        patrol.currentPosition = {
          lat: nextCoord[1],
          lng: nextCoord[0]
        }

        // Calculate heading
        if (nextIndex < totalPoints - 1) {
          const currentPoint = point(coordinates[nextIndex])
          const nextPoint = point(coordinates[nextIndex + 1])
          patrol.currentHeading = turf.bearing(currentPoint, nextPoint)
        }

        patrol.currentSpeedKmh = patrol.targetSpeedKmh
      } else if (patrol.state === 'PURSUING' && patrol.targetUserId) {
        // Move toward target (simplified pursuit logic)
        // In a real implementation, this would be more sophisticated
        patrol.currentSpeedKmh = patrol.interceptSpeed
      }

      patrol.routeProgress = nextProgress
      patrol.updatedAt = new Date()

      // Emit patrol update
      this.emit('patrolUpdate', { patrolId, patrol })
    } catch (error) {
      logger.error('Failed to update patrol position', { patrolId, error })
    }
  }

  /**
   * Update heat map with violation data
   */
  private async updateHeatMap(sessionId: string, lat: number, lng: number, violations: SpeedViolation[]): Promise<void> {
    try {
      if (!this.heatMaps.has(sessionId)) {
        this.heatMaps.set(sessionId, {
          sessionId,
          routeId: '', // Would need to get from session
          gridSize: 100, // 100m grid cells
          cells: [],
          lastUpdated: new Date()
        })
      }

      const heatMap = this.heatMaps.get(sessionId)!
      
      // Find or create cell for this location
      const cellLat = Math.floor(lat / (heatMap.gridSize / 111000)) * (heatMap.gridSize / 111000)
      const cellLng = Math.floor(lng / (heatMap.gridSize / (111000 * Math.cos(lat * Math.PI / 180)))) * 
                       (heatMap.gridSize / (111000 * Math.cos(lat * Math.PI / 180)))

      let cell = heatMap.cells.find(c => 
        Math.abs(c.lat - cellLat) < 0.001 && Math.abs(c.lng - cellLng) < 0.001
      )

      if (!cell) {
        cell = {
          lat: cellLat,
          lng: cellLng,
          intensity: 0,
          violationCount: 0,
          lastActivity: new Date()
        }
        heatMap.cells.push(cell)
      }

      // Update cell intensity based on violations
      for (const violation of violations) {
        const severityMultiplier = {
          'LOW': 1,
          'MEDIUM': 2,
          'HIGH': 3,
          'CRITICAL': 4
        }[violation.severity]

        cell.intensity += severityMultiplier
        cell.violationCount++
        cell.lastActivity = new Date()
      }

      heatMap.lastUpdated = new Date()
    } catch (error) {
      logger.error('Failed to update heat map', { sessionId, error })
    }
  }

  /**
   * Get heat map data for a session
   */
  getHeatMap(sessionId: string): HeatMapData | null {
    return this.heatMaps.get(sessionId) || null
  }

  /**
   * Get violation statistics for a session
   */
  getViolationStats(sessionId: string): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    averageExcessSpeed: number
    totalPenalties: number
  } {
    const violations = this.violationHistory.get(sessionId) || []
    
    const stats = {
      total: violations.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      averageExcessSpeed: 0,
      totalPenalties: 0
    }

    for (const violation of violations) {
      stats.byType[violation.violationType] = (stats.byType[violation.violationType] || 0) + 1
      stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1
      stats.averageExcessSpeed += violation.excessSpeedKmh
      stats.totalPenalties += violation.penaltyAmount
    }

    if (violations.length > 0) {
      stats.averageExcessSpeed /= violations.length
    }

    return stats
  }

  /**
   * Apply penalties to participant
   */
  async applyPenalties(sessionParticipantId: string, violations: SpeedViolation[]): Promise<void> {
    try {
      let totalTimePenalty = 0
      let totalPointsPenalty = 0

      for (const violation of violations) {
        if (violation.penaltyType === 'TIME') {
          totalTimePenalty += violation.penaltyAmount
        } else if (violation.penaltyType === 'POINTS') {
          totalPointsPenalty += violation.penaltyAmount
        }

        // Mark violation as processed
        violation.processed = true
      }

      // Update participant with penalties
      if (totalTimePenalty > 0) {
        await sessionParticipantRepository.addTimePenalty(sessionParticipantId, totalTimePenalty)
      }

      if (totalPointsPenalty > 0) {
        // Points penalty would need to be implemented in participant model
        logger.info('Points penalty applied', { sessionParticipantId, points: totalPointsPenalty })
      }

      logger.info('Penalties applied', { 
        sessionParticipantId, 
        violations: violations.length,
        timePenalty: totalTimePenalty,
        pointsPenalty: totalPointsPenalty
      })
    } catch (error) {
      logger.error('Failed to apply penalties', { sessionParticipantId, error })
    }
  }

  /**
   * Cleanup enforcement data for a session
   */
  cleanupSession(sessionId: string): void {
    logger.info('Cleaning up enforcement data', { sessionId })

    // Clear patrol intervals
    const patrols = Array.from(this.activePatrols.values())
      .filter(patrol => patrol.sessionId === sessionId)

    for (const patrol of patrols) {
      const interval = this.patrolIntervals.get(patrol.id)
      if (interval) {
        clearInterval(interval)
        this.patrolIntervals.delete(patrol.id)
      }
      this.activePatrols.delete(patrol.id)
    }

    // Clear heat map
    this.heatMaps.delete(sessionId)

    // Clear violation history
    this.violationHistory.delete(sessionId)

    logger.info('Enforcement data cleaned up', { sessionId })
  }

  /**
   * Helper methods
   */
  private getViolationType(zoneType: string): SpeedViolation['violationType'] {
    switch (zoneType) {
      case 'SPEED_ZONE': return 'SPEEDING'
      case 'SPEED_TRAP': return 'SPEEDING'
      case 'RADAR_ZONE': return 'RADAR_DETECTION'
      case 'HEAT_ZONE': return 'HEAT_ZONE'
      default: return 'SPEEDING'
    }
  }

  private calculateViolationSeverity(excessSpeed: number, speedLimit: number): SpeedViolation['severity'] {
    const percentage = (excessSpeed / speedLimit) * 100
    
    if (percentage >= 50) return 'CRITICAL'
    if (percentage >= 30) return 'HIGH'
    if (percentage >= 15) return 'MEDIUM'
    return 'LOW'
  }

  private calculatePenalty(zone: any, excessSpeed: number, severity: SpeedViolation['severity']): number {
    const basePenalty = {
      'LOW': 5,
      'MEDIUM': 10,
      'HIGH': 20,
      'CRITICAL': 30
    }[severity]

    // Adjust for zone type
    const multiplier = {
      'SPEED_ZONE': 1,
      'SPEED_TRAP': 1.5,
      'RADAR_ZONE': 2,
      'HEAT_ZONE': 1.2
    }[zone.zone_type] || 1

    return Math.round(basePenalty * multiplier)
  }

  private calculatePatrolPenalty(excessSpeed: number, severity: SpeedViolation['severity']): number {
    const basePenalty = {
      'LOW': 10,
      'MEDIUM': 20,
      'HIGH': 40,
      'CRITICAL': 60
    }[severity]

    return basePenalty
  }

  private async getEnforcementZonesForSession(sessionId: string): Promise<any[]> {
    // This would need to get the route ID from the session and then get zones
    // For now, return empty array as placeholder
    return []
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

// Export singleton instance
export const enforcementService = new EnforcementService()
