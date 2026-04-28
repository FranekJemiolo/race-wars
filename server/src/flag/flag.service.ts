/**
 * Flag Service
 * 
 * Handles race flag management including flag states, transitions,
 * flag history, and race control operations. Manages the flag system
 * for race sessions including green, yellow, red, blue, and checkered flags.
 */

import { sessionRepository, flagRepository } from '../database/repositories'
import { logger } from '../utils/logger'
import { EventEmitter } from 'events'

export interface FlagState {
  sessionId: string
  flagType: 'GREEN' | 'YELLOW' | 'YELLOW_SECTOR' | 'RED' | 'BLUE' | 'CHECKERED' | 'WHITE' | 'BLACK' | 'BLACK_WHITE' | 'SC_BOARD'
  flagState: 'SHOWN' | 'REMOVED' | 'FLASHING'
  sector?: number // For sector-specific yellow flags
  location?: { lat: number; lng: number }
  locationDescription?: string
  reason?: string
  incidentId?: string
  userId?: string // For blue/black flags
  sessionParticipantId?: string
  clearedBy?: string
  clearedTime?: Date
  notes?: string
}

export interface FlagTransition {
  from: string
  to: string
  timestamp: Date
  reason?: string
  initiatedBy: string
}

export interface RaceControlCommand {
  type: 'FLAG_CHANGE' | 'SESSION_CONTROL' | 'SAFETY_CAR' | 'PIT_LANE' | 'INCIDENT_RESPONSE'
  command: string
  parameters?: Record<string, any>
  timestamp: Date
  initiatedBy: string
  sessionId: string
}

export interface SafetyCarDeployment {
  sessionId: string
  deployed: boolean
  driverId?: string
  deploymentTime?: Date
  recallTime?: Date
  reason?: string
  currentLap?: number
  leaderGapSeconds?: number
}

export class FlagService extends EventEmitter {
  private activeFlags: Map<string, Map<string, FlagState>> = new Map() // sessionId -> flagType -> FlagState
  private flagHistory: Map<string, FlagTransition[]> = new Map() // sessionId -> transitions
  private safetyCarDeployments: Map<string, SafetyCarDeployment> = new Map() // sessionId -> deployment

  /**
   * Show a flag for a session
   */
  async showFlag(sessionId: string, flagData: FlagState, initiatedBy: string): Promise<void> {
    logger.info('Showing flag', { sessionId, flagType: flagData.flagType, initiatedBy })

    try {
      // Validate session exists
      const session = await sessionRepository.findById(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }

      // Check if session is live
      if (session.status !== 'LIVE') {
        throw new Error('Can only show flags for live sessions')
      }

      // Store flag in active flags
      if (!this.activeFlags.has(sessionId)) {
        this.activeFlags.set(sessionId, new Map())
      }

      const sessionFlags = this.activeFlags.get(sessionId)!
      const existingFlag = sessionFlags.get(flagData.flagType)

      // Create flag record
      const flagRecord = await flagRepository.create({
        session_id: sessionId,
        flag_type: flagData.flagType,
        flag_state: 'SHOWN',
        sector: flagData.sector,
        location: flagData.location ? `POINT(${flagData.location.lng} ${flagData.location.lat})` : undefined,
        location_description: flagData.locationDescription,
        reason: flagData.reason,
        incident_id: flagData.incidentId,
        user_id: flagData.userId,
        session_participant_id: flagData.sessionParticipantId,
        notes: flagData.notes
      })

      // Update active flags
      sessionFlags.set(flagData.flagType, {
        ...flagData,
        sessionId,
        flagState: 'SHOWN'
      })

      // Update session flag state in database
      await this.updateSessionFlagState(sessionId, flagData.flagType)

      // Record transition
      this.recordFlagTransition(sessionId, existingFlag?.flagType || 'NONE', flagData.flagType, initiatedBy, flagData.reason)

      // Emit event
      this.emit('flagShown', {
        sessionId,
        flagType: flagData.flagType,
        flagData: {
          ...flagData,
          flagState: 'SHOWN',
          timestamp: new Date(),
          initiatedBy
        }
      })

      // Handle special flag logic
      await this.handleSpecialFlagLogic(sessionId, flagData.flagType, 'SHOWN')

      logger.info('Flag shown successfully', { sessionId, flagType: flagData.flagType })
    } catch (error) {
      logger.error('Failed to show flag', { sessionId, flagData, error })
      throw error
    }
  }

  /**
   * Remove a flag for a session
   */
  async removeFlag(sessionId: string, flagType: string, clearedBy: string, reason?: string): Promise<void> {
    logger.info('Removing flag', { sessionId, flagType, clearedBy })

    try {
      const sessionFlags = this.activeFlags.get(sessionId)
      if (!sessionFlags || !sessionFlags.has(flagType)) {
        throw new Error('Flag is not currently shown')
      }

      const flagData = sessionFlags.get(flagType)!

      // Update flag record
      await flagRepository.updateFlagState(flagType, 'REMOVED', sessionId, clearedBy)

      // Remove from active flags
      sessionFlags.delete(flagType)

      // Update session flag state
      await this.updateSessionFlagState(sessionId, flagType, true)

      // Record transition
      this.recordFlagTransition(sessionId, flagType, 'NONE', clearedBy, reason)

      // Emit event
      this.emit('flagRemoved', {
        sessionId,
        flagType,
        clearedBy,
        clearedTime: new Date(),
        reason
      })

      // Handle special flag logic
      await this.handleSpecialFlagLogic(sessionId, flagType, 'REMOVED')

      logger.info('Flag removed successfully', { sessionId, flagType })
    } catch (error) {
      logger.error('Failed to remove flag', { sessionId, flagType, error })
      throw error
    }
  }

  /**
   * Get current flags for a session
   */
  getCurrentFlags(sessionId: string): Map<string, FlagState> {
    return this.activeFlags.get(sessionId) || new Map()
  }

  /**
   * Get flag history for a session
   */
  getFlagHistory(sessionId: string): FlagTransition[] {
    return this.flagHistory.get(sessionId) || []
  }

  /**
   * Show sector-specific yellow flag
   */
  async showSectorYellow(sessionId: string, sector: number, location?: { lat: number; lng: number }, reason?: string, initiatedBy?: string): Promise<void> {
    await this.showFlag({
      sessionId,
      flagType: 'YELLOW_SECTOR',
      flagState: 'SHOWN',
      sector,
      location,
      reason: reason || 'Incident in sector',
      locationDescription: location ? `Sector ${sector}` : undefined
    }, initiatedBy || 'system')
  }

  /**
   * Clear sector-specific yellow flag
   */
  async clearSectorYellow(sessionId: string, sector: number, clearedBy: string): Promise<void> {
    const sessionFlags = this.activeFlags.get(sessionId)
    if (sessionFlags) {
      for (const [flagType, flagData] of sessionFlags) {
        if (flagType === 'YELLOW_SECTOR' && flagData.sector === sector) {
          await this.removeFlag(sessionId, flagType, clearedBy, 'Sector cleared')
          break
        }
      }
    }
  }

  /**
   * Deploy safety car
   */
  async deploySafetyCar(sessionId: string, reason?: string, driverId?: string, initiatedBy?: string): Promise<void> {
    logger.info('Deploying safety car', { sessionId, reason, driverId })

    try {
      // Show yellow flags
      await this.showFlag({
        sessionId,
        flagType: 'YELLOW',
        flagState: 'SHOWN',
        reason: reason || 'Safety car deployed'
      }, initiatedBy || 'system')

      // Record deployment
      const deployment: SafetyCarDeployment = {
        sessionId,
        deployed: true,
        driverId,
        deploymentTime: new Date(),
        reason
      }

      this.safetyCarDeployments.set(sessionId, deployment)

      // Emit event
      this.emit('safetyCarDeployed', {
        sessionId,
        deployment,
        initiatedBy: initiatedBy || 'system'
      })

      logger.info('Safety car deployed successfully', { sessionId })
    } catch (error) {
      logger.error('Failed to deploy safety car', { sessionId, error })
      throw error
    }
  }

  /**
   * Recall safety car
   */
  async recallSafetyCar(sessionId: string, clearedBy: string): Promise<void> {
    logger.info('Recalling safety car', { sessionId, clearedBy })

    try {
      const deployment = this.safetyCarDeployments.get(sessionId)
      if (!deployment || !deployment.deployed) {
        throw new Error('Safety car is not currently deployed')
      }

      // Update deployment
      deployment.deployed = false
      deployment.recallTime = new Date()

      // Clear yellow flags if no other incidents
      await this.checkAndClearYellowFlags(sessionId, clearedBy)

      // Emit event
      this.emit('safetyCarRecalled', {
        sessionId,
        deployment,
        clearedBy
      })

      logger.info('Safety car recalled successfully', { sessionId })
    } catch (error) {
      logger.error('Failed to recall safety car', { sessionId, error })
      throw error
    }
  }

  /**
   * Show blue flag to specific driver
   */
  async showBlueFlag(sessionId: string, userId: string, sessionParticipantId: string, reason?: string, initiatedBy?: string): Promise<void> {
    await this.showFlag({
      sessionId,
      flagType: 'BLUE',
      flagState: 'SHOWN',
      userId,
      sessionParticipantId,
      reason: reason || 'Faster driver approaching'
    }, initiatedBy || 'system')
  }

  /**
   * Show black flag to specific driver
   */
  async showBlackFlag(sessionId: string, userId: string, sessionParticipantId: string, reason: string, initiatedBy?: string): Promise<void> {
    await this.showFlag({
      sessionId,
      flagType: 'BLACK',
      flagState: 'SHOWN',
      userId,
      sessionParticipantId,
      reason
    }, initiatedBy || 'system')

    // Also update participant status to DSQ (disqualified)
    const { sessionParticipantRepository } = await import('../database/repositories')
    await sessionParticipantRepository.updateStatus(sessionParticipantId, 'DSQ')
  }

  /**
   * Start race (show green flag)
   */
  async startRace(sessionId: string, initiatedBy?: string): Promise<void> {
    await this.showFlag({
      sessionId,
      flagType: 'GREEN',
      flagState: 'SHOWN',
      reason: 'Race start'
    }, initiatedBy || 'system')

    // Update session race state
    await sessionRepository.updateRaceState(sessionId, 'LIVE')
  }

  /**
   * End race (show checkered flag)
   */
  async endRace(sessionId: string, initiatedBy?: string): Promise<void> {
    await this.showFlag({
      sessionId,
      flagType: 'CHECKERED',
      flagState: 'SHOWN',
      reason: 'Race finished'
    }, initiatedBy || 'system')

    // Update session status
    await sessionRepository.updateStatus(sessionId, 'FINISHED')
    await sessionRepository.updateRaceState(sessionId, 'FINISHED')
  }

  /**
   * Red flag session (stop race)
   */
  async redFlagSession(sessionId: string, reason: string, initiatedBy?: string): Promise<void> {
    await this.showFlag({
      sessionId,
      flagType: 'RED',
      flagState: 'SHOWN',
      reason
    }, initiatedBy || 'system')

    // Update session race state
    await sessionRepository.updateRaceState(sessionId, 'ABORTED')
  }

  /**
   * Get safety car deployment status
   */
  getSafetyCarStatus(sessionId: string): SafetyCarDeployment | null {
    return this.safetyCarDeployments.get(sessionId) || null
  }

  /**
   * Check if session has any active flags
   */
  hasActiveFlags(sessionId: string): boolean {
    const flags = this.activeFlags.get(sessionId)
    return flags ? flags.size > 0 : false
  }

  /**
   * Get flag summary for session
   */
  getFlagSummary(sessionId: string): {
    activeFlags: string[]
    flagHistory: FlagTransition[]
    safetyCarDeployed: boolean
    lastUpdate: Date
  } {
    const flags = this.activeFlags.get(sessionId) || new Map()
    const history = this.flagHistory.get(sessionId) || []
    const safetyCar = this.safetyCarDeployments.get(sessionId)

    return {
      activeFlags: Array.from(flags.keys()),
      flagHistory: history,
      safetyCarDeployed: safetyCar?.deployed || false,
      lastUpdate: new Date()
    }
  }

  /**
   * Initialize session flag system
   */
  async initializeSession(sessionId: string): Promise<void> {
    logger.info('Initializing session flag system', { sessionId })

    // Load existing flags from database
    const existingFlags = await flagRepository.findBySession(sessionId)
    const sessionFlags = new Map<string, FlagState>()

    for (const flag of existingFlags) {
      if (flag.flag_state === 'SHOWN') {
        sessionFlags.set(flag.flag_type, {
          sessionId,
          flagType: flag.flag_type,
          flagState: flag.flag_state,
          sector: flag.sector,
          location: flag.location ? { lat: flag.location_lat!, lng: flag.location_lng! } : undefined,
          locationDescription: flag.location_description,
          reason: flag.reason,
          incidentId: flag.incident_id,
          userId: flag.user_id,
          sessionParticipantId: flag.session_participant_id,
          notes: flag.notes
        })
      }
    }

    this.activeFlags.set(sessionId, sessionFlags)
    this.flagHistory.set(sessionId, [])

    logger.info('Session flag system initialized', { sessionId, activeFlags: sessionFlags.size })
  }

  /**
   * Cleanup session flag system
   */
  cleanupSession(sessionId: string): void {
    logger.info('Cleaning up session flag system', { sessionId })

    this.activeFlags.delete(sessionId)
    this.flagHistory.delete(sessionId)
    this.safetyCarDeployments.delete(sessionId)

    logger.info('Session flag system cleaned up', { sessionId })
  }

  /**
   * Record flag transition
   */
  private recordFlagTransition(sessionId: string, from: string, to: string, initiatedBy: string, reason?: string): void {
    if (!this.flagHistory.has(sessionId)) {
      this.flagHistory.set(sessionId, [])
    }

    const history = this.flagHistory.get(sessionId)!
    history.push({
      from,
      to,
      timestamp: new Date(),
      reason,
      initiatedBy
    })

    // Keep only last 100 transitions
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
  }

  /**
   * Update session flag state in database
   */
  private async updateSessionFlagState(sessionId: string, flagType: string, clear = false): Promise<void> {
    if (clear) {
      // Check if this was the primary flag
      const sessionFlags = this.activeFlags.get(sessionId)
      if (sessionFlags && !sessionFlags.has(flagType)) {
        // Find next most important flag
        const flagPriority = ['RED', 'YELLOW', 'YELLOW_SECTOR', 'GREEN', 'BLUE', 'CHECKERED', 'WHITE', 'BLACK', 'BLACK_WHITE', 'SC_BOARD']
        for (const flag of flagPriority) {
          if (sessionFlags.has(flag)) {
            await sessionRepository.updateFlagState(sessionId, flag as any)
            return
          }
        }
        // No flags left
        await sessionRepository.updateFlagState(sessionId, 'NONE')
      }
    } else {
      await sessionRepository.updateFlagState(sessionId, flagType as any)
    }
  }

  /**
   * Handle special flag logic
   */
  private async handleSpecialFlagLogic(sessionId: string, flagType: string, action: 'SHOWN' | 'REMOVED'): Promise<void> {
    switch (flagType) {
      case 'RED':
        if (action === 'SHOWN') {
          // Red flag means race is stopped
          await sessionRepository.updateRaceState(sessionId, 'ABORTED')
          // Recall safety car if deployed
          const safetyCar = this.safetyCarDeployments.get(sessionId)
          if (safetyCar?.deployed) {
            await this.recallSafetyCar(sessionId, 'system')
          }
        }
        break

      case 'YELLOW':
        if (action === 'REMOVED') {
          await this.checkAndClearYellowFlags(sessionId, 'system')
        }
        break

      case 'CHECKERED':
        if (action === 'SHOWN') {
          // Checkered flag means race is finished
          await sessionRepository.updateStatus(sessionId, 'FINISHED')
          await sessionRepository.updateRaceState(sessionId, 'FINISHED')
        }
        break
    }
  }

  /**
   * Check and clear yellow flags if no incidents remain
   */
  private async checkAndClearYellowFlags(sessionId: string, clearedBy: string): Promise<void> {
    const sessionFlags = this.activeFlags.get(sessionId)
    if (!sessionFlags) return

    const hasYellowFlags = Array.from(sessionFlags.keys()).some(flag => 
      flag === 'YELLOW' || flag === 'YELLOW_SECTOR'
    )

    if (!hasYellowFlags) {
      // Clear yellow flag state in session
      await sessionRepository.updateFlagState(sessionId, 'NONE')
    }
  }
}

// Export singleton instance
export const flagService = new FlagService()
