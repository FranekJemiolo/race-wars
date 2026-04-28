/**
 * Race Participation Service
 * Tracks all race participations, results, and statistics
 */

import { logger } from '../utils/logger'

export interface RaceParticipant {
  id: string
  raceId: string
  userId: string
  username: string
  displayName: string
  status: 'joined' | 'racing' | 'finished' | 'disconnected' | 'disqualified'
  joinedAt: Date
  leftAt?: Date
  finishedAt?: Date
  position?: number
  totalTime?: number // seconds
  bestLapTime?: number // seconds
  checkpointsPassed: number
  currentCheckpoint: number
  lapCount: number
  isDNF: boolean // Did Not Finish
  disqualificationReason?: string
  vehicle?: string
  notes?: string
}

export interface RaceResult {
  id: string
  raceId: string
  participantId: string
  position: number
  totalTime: number // seconds
  bestLapTime?: number // seconds
  averageLapTime?: number // seconds
  gapToLeader?: number // seconds
  status: 'finished' | 'dnf' | 'dsq' | 'dns'
  points?: number
  prizeMoney?: number
}

export interface ParticipationStats {
  userId: string
  totalRaces: number
  racesFinished: number
  racesWon: number
  podiums: number
  totalRacingTime: number // seconds
  bestOverallLapTime?: number // seconds
  averagePosition?: number
  totalPoints: number
  totalPrizeMoney: number
  dnfCount: number
  dsqCount: number
  lastRaceDate?: Date
}

export class ParticipationService {
  private participants: Map<string, RaceParticipant> = new Map()
  private results: Map<string, RaceResult> = new Map()
  private stats: Map<string, ParticipationStats> = new Map()
  private nextParticipantId = 1
  private nextResultId = 1

  /**
   * Add a participant to a race
   */
  async addParticipant(raceId: string, userId: string, username: string, displayName: string): Promise<RaceParticipant> {
    const participantId = `participant-${this.nextParticipantId++}`
    
    const participant: RaceParticipant = {
      id: participantId,
      raceId,
      userId,
      username,
      displayName,
      status: 'joined',
      joinedAt: new Date(),
      checkpointsPassed: 0,
      currentCheckpoint: 0,
      lapCount: 0,
      isDNF: false
    }

    this.participants.set(participantId, participant)
    
    // Update user stats
    await this.updateUserStats(userId, {
      totalRaces: 1
    })

    logger.info(`User ${username} joined race ${raceId}`)
    return participant
  }

  /**
   * Remove a participant from a race
   */
  async removeParticipant(participantId: string, reason?: string): Promise<void> {
    const participant = this.participants.get(participantId)
    if (!participant) return

    participant.leftAt = new Date()
    participant.status = reason === 'disqualified' ? 'disqualified' : 'disconnected'
    
    if (reason === 'disqualified') {
      participant.disqualificationReason = reason
      await this.updateUserStats(participant.userId, {
        dsqCount: 1
      })
    }

    logger.info(`User ${participant.username} left race ${participant.raceId}`)
  }

  /**
   * Start race for a participant
   */
  async startParticipant(participantId: string): Promise<void> {
    const participant = this.participants.get(participantId)
    if (!participant) return

    participant.status = 'racing'
    logger.info(`User ${participant.username} started racing in ${participant.raceId}`)
  }

  /**
   * Finish race for a participant
   */
  async finishParticipant(participantId: string, position: number, totalTime: number, bestLapTime?: number): Promise<void> {
    const participant = this.participants.get(participantId)
    if (!participant) return

    participant.status = 'finished'
    participant.finishedAt = new Date()
    participant.position = position
    participant.totalTime = totalTime
    participant.bestLapTime = bestLapTime
    participant.isDNF = false

    // Create race result
    const resultId = `result-${this.nextResultId++}`
    const result: RaceResult = {
      id: resultId,
      raceId: participant.raceId,
      participantId: participant.id,
      position,
      totalTime,
      bestLapTime,
      status: 'finished'
    }

    this.results.set(resultId, result)

    // Update user stats
    const statsUpdate: Partial<ParticipationStats> = {
      racesFinished: 1,
      totalRacingTime: totalTime,
      lastRaceDate: new Date()
    }

    if (position === 1) {
      statsUpdate.racesWon = 1
    }
    if (position <= 3) {
      statsUpdate.podiums = 1
    }
    if (bestLapTime) {
      statsUpdate.bestOverallLapTime = bestLapTime
    }

    await this.updateUserStats(participant.userId, statsUpdate)

    logger.info(`User ${participant.username} finished race ${participant.raceId} in position ${position}`)
  }

  /**
   * Mark participant as DNF (Did Not Finish)
   */
  async markDNF(participantId: string, reason?: string): Promise<void> {
    const participant = this.participants.get(participantId)
    if (!participant) return

    participant.status = 'finished'
    participant.finishedAt = new Date()
    participant.isDNF = true
    participant.notes = reason

    // Create DNF result
    const resultId = `result-${this.nextResultId++}`
    const result: RaceResult = {
      id: resultId,
      raceId: participant.raceId,
      participantId: participant.id,
      position: 999, // High number for DNF
      totalTime: 0,
      status: 'dnf'
    }

    this.results.set(resultId, result)

    // Update user stats
    await this.updateUserStats(participant.userId, {
      dnfCount: 1,
      lastRaceDate: new Date()
    })

    logger.info(`User ${participant.username} DNF in race ${participant.raceId}`)
  }

  /**
   * Update participant checkpoint progress
   */
  async updateCheckpointProgress(participantId: string, checkpointNumber: number, lapTime?: number): Promise<void> {
    const participant = this.participants.get(participantId)
    if (!participant) return

    participant.currentCheckpoint = checkpointNumber
    participant.checkpointsPassed++

    // Check if completed a lap
    const trackService = require('./track.service').trackService
    const track = await trackService.getTrackByRaceId(participant.raceId)
    if (track && checkpointNumber === 0 && participant.checkpointsPassed > 0) {
      participant.lapCount++
      
      // Update best lap time
      if (lapTime && (!participant.bestLapTime || lapTime < participant.bestLapTime)) {
        participant.bestLapTime = lapTime
      }
    }
  }

  /**
   * Get all participants for a race
   */
  async getRaceParticipants(raceId: string): Promise<RaceParticipant[]> {
    return Array.from(this.participants.values()).filter(p => p.raceId === raceId)
  }

  /**
   * Get active participants for a race
   */
  async getActiveParticipants(raceId: string): Promise<RaceParticipant[]> {
    return Array.from(this.participants.values())
      .filter(p => p.raceId === raceId && p.status === 'racing')
  }

  /**
   * Get results for a race
   */
  async getRaceResults(raceId: string): Promise<RaceResult[]> {
    return Array.from(this.results.values())
      .filter(r => r.raceId === raceId)
      .sort((a, b) => a.position - b.position)
  }

  /**
   * Get user's participation history
   */
  async getUserParticipationHistory(userId: string, limit: number = 50): Promise<RaceParticipant[]> {
    return Array.from(this.participants.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())
      .slice(0, limit)
  }

  /**
   * Get user's race results
   */
  async getUserRaceResults(userId: string, limit: number = 50): Promise<RaceResult[]> {
    const userParticipants = Array.from(this.participants.values())
      .filter(p => p.userId === userId)
      .map(p => p.id)

    return Array.from(this.results.values())
      .filter(r => userParticipants.includes(r.participantId))
      .sort((a, b) => {
        // Sort by race date (most recent first)
        const aParticipant = this.participants.get(a.participantId)
        const bParticipant = this.participants.get(b.participantId)
        if (!aParticipant || !bParticipant) return 0
        return bParticipant.joinedAt.getTime() - aParticipant.joinedAt.getTime()
      })
      .slice(0, limit)
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ParticipationStats | null> {
    let stats = this.stats.get(userId)
    
    if (!stats) {
      // Calculate stats from scratch
      const participations = Array.from(this.participants.values()).filter(p => p.userId === userId)
      const userResults = Array.from(this.results.values()).filter(r => {
        const participant = this.participants.get(r.participantId)
        return participant?.userId === userId
      })

      stats = {
        userId,
        totalRaces: participations.length,
        racesFinished: userResults.filter(r => r.status === 'finished').length,
        racesWon: userResults.filter(r => r.status === 'finished' && r.position === 1).length,
        podiums: userResults.filter(r => r.status === 'finished' && r.position <= 3).length,
        totalRacingTime: userResults.reduce((sum, r) => sum + r.totalTime, 0),
        bestOverallLapTime: Math.min(...userResults.map(r => r.bestLapTime || Infinity).filter(t => t < Infinity)),
        totalPoints: userResults.reduce((sum, r) => sum + (r.points || 0), 0),
        totalPrizeMoney: userResults.reduce((sum, r) => sum + (r.prizeMoney || 0), 0),
        dnfCount: userResults.filter(r => r.status === 'dnf').length,
        dsqCount: participations.filter(p => p.status === 'disqualified').length,
        averagePosition: userResults.length > 0 
          ? userResults.reduce((sum, r) => sum + r.position, 0) / userResults.length 
          : undefined
      }

      this.stats.set(userId, stats)
    }

    return stats
  }

  /**
   * Update user statistics
   */
  async updateUserStats(userId: string, updates: Partial<ParticipationStats>): Promise<void> {
    const existingStats = this.stats.get(userId) || {
      userId,
      totalRaces: 0,
      racesFinished: 0,
      racesWon: 0,
      podiums: 0,
      totalRacingTime: 0,
      totalPoints: 0,
      totalPrizeMoney: 0,
      dnfCount: 0,
      dsqCount: 0
    }

    const updatedStats = { ...existingStats }
    
    // Increment numeric fields
    if (updates.totalRaces) updatedStats.totalRaces += updates.totalRaces
    if (updates.racesFinished) updatedStats.racesFinished += updates.racesFinished
    if (updates.racesWon) updatedStats.racesWon += updates.racesWon
    if (updates.podiums) updatedStats.podiums += updates.podiums
    if (updates.totalRacingTime) updatedStats.totalRacingTime += updates.totalRacingTime
    if (updates.totalPoints) updatedStats.totalPoints += updates.totalPoints
    if (updates.totalPrizeMoney) updatedStats.totalPrizeMoney += updates.totalPrizeMoney
    if (updates.dnfCount) updatedStats.dnfCount += updates.dnfCount
    if (updates.dsqCount) updatedStats.dsqCount += updates.dsqCount

    // Update specific fields
    if (updates.bestOverallLapTime !== undefined) {
      if (!updatedStats.bestOverallLapTime || updates.bestOverallLapTime < updatedStats.bestOverallLapTime) {
        updatedStats.bestOverallLapTime = updates.bestOverallLapTime
      }
    }
    if (updates.lastRaceDate) updatedStats.lastRaceDate = updates.lastRaceDate
    if (updates.averagePosition !== undefined) updatedStats.averagePosition = updates.averagePosition

    this.stats.set(userId, updatedStats)
  }

  /**
   * Get leaderboard for a race
   */
  async getRaceLeaderboard(raceId: string): Promise<RaceResult[]> {
    return this.getRaceResults(raceId)
  }

  /**
   * Get overall leaderboard
   */
  async getOverallLeaderboard(limit: number = 100): Promise<ParticipationStats[]> {
    return Array.from(this.stats.values())
      .sort((a, b) => {
        // Sort by points first, then wins
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints
        }
        if (b.racesWon !== a.racesWon) {
          return b.racesWon - a.racesWon
        }
        return b.podiums - a.podiums
      })
      .slice(0, limit)
  }

  /**
   * Clean up old data (optional maintenance)
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000))
    
    // Remove old participations
    for (const [id, participant] of this.participants.entries()) {
      if (participant.joinedAt < cutoffDate) {
        this.participants.delete(id)
      }
    }

    // Remove old results
    for (const [id, result] of this.results.entries()) {
      const participant = this.participants.get(result.participantId)
      if (!participant || participant.joinedAt < cutoffDate) {
        this.results.delete(id)
      }
    }

    logger.info(`Cleaned up participation data older than ${daysToKeep} days`)
  }
}

export const participationService = new ParticipationService()
