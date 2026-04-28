/**
 * Race Service
 * Business logic for race management
 */

import { query } from '../database/connection.simple'
import { logger } from '../utils/logger'
import { trackService } from './track.service'

export interface Race {
  id: string
  name: string
  type: 'circuit' | 'custom' | 'duel'
  status: 'waiting' | 'starting' | 'in-progress' | 'finished'
  trackName: string
  trackImage?: string
  participants: number
  maxParticipants: number
  duration?: number
  startTime?: Date
  description?: string
  rules?: string[]
  requirements?: string[]
  prizePool?: number
  entryFee?: number
  createdBy?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
  enforcementLevel?: 'none' | 'light' | 'medium' | 'hard'
  createdAt: Date
  updatedAt: Date
}

export interface CreateRaceRequest {
  name: string
  type: 'circuit' | 'custom' | 'duel'
  trackName: string
  maxParticipants: number
  duration: number
  startTime: Date
  description: string
  requirements: string[]
  entryFee: number
  prizePool: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  enforcementLevel: 'none' | 'light' | 'medium' | 'hard'
  isPublic: boolean
}

export class RaceService {
  private races: Map<string, Race> = new Map()
  private nextId = 1

  constructor() {
    this.initializeSampleRaces()
  }

  /**
   * Initialize with scheduled races for development
   */
  private initializeSampleRaces() {
    const scheduledRaces: Race[] = [
      // Race starting in 1 minute
      {
        id: 'scheduled-1min',
        name: 'Quick Sprint - 1 Minute Start',
        type: 'circuit',
        status: 'starting',
        trackName: 'Test Circuit',
        participants: 3,
        maxParticipants: 8,
        duration: 900, // 15 minutes
        startTime: new Date(Date.now() + 1 * 60000), // 1 minute from now
        description: 'Quick sprint race for fast action',
        requirements: ['Valid driver license'],
        difficulty: 'easy',
        enforcementLevel: 'light',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Race starting in 5 minutes
      {
        id: 'scheduled-5min',
        name: 'Practice Session - 5 Minute Start',
        type: 'circuit',
        status: 'waiting',
        trackName: 'Test Circuit',
        participants: 5,
        maxParticipants: 16,
        duration: 1800, // 30 minutes
        startTime: new Date(Date.now() + 5 * 60000), // 5 minutes from now
        description: 'Open practice session for all skill levels',
        requirements: ['Valid driver license', 'Helmet required'],
        difficulty: 'easy',
        enforcementLevel: 'light',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Race starting in 15 minutes
      {
        id: 'scheduled-15min',
        name: 'Duel Tournament - 15 Minute Start',
        type: 'duel',
        status: 'waiting',
        trackName: 'Speedway Arena',
        participants: 4,
        maxParticipants: 8,
        duration: 1200, // 20 minutes
        startTime: new Date(Date.now() + 15 * 60000), // 15 minutes from now
        description: 'Head-to-head racing tournament',
        requirements: ['Previous race experience', 'Vehicle inspection'],
        prizePool: 500,
        entryFee: 25,
        difficulty: 'medium',
        enforcementLevel: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Race starting in 30 minutes
      {
        id: 'scheduled-30min',
        name: 'Championship Qualifier - 30 Minute Start',
        type: 'circuit',
        status: 'waiting',
        trackName: 'Grand Prix Circuit',
        participants: 8,
        maxParticipants: 20,
        duration: 2700, // 45 minutes
        startTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
        description: 'Official championship qualifying session',
        requirements: ['Racing license', 'Vehicle compliance check'],
        prizePool: 2500,
        entryFee: 100,
        difficulty: 'hard',
        enforcementLevel: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Custom race starting in 20 minutes
      {
        id: 'scheduled-20min-custom',
        name: 'Mountain Challenge - 20 Minute Start',
        type: 'custom',
        status: 'waiting',
        trackName: 'Mountain Pass',
        participants: 6,
        maxParticipants: 12,
        duration: 2400, // 40 minutes
        startTime: new Date(Date.now() + 20 * 60000), // 20 minutes from now
        description: 'Challenging custom route through mountain terrain',
        requirements: ['Advanced driving skills', 'Off-road experience'],
        prizePool: 1500,
        entryFee: 75,
        difficulty: 'hard',
        enforcementLevel: 'hard',
        createdBy: 'System',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    scheduledRaces.forEach(race => {
      this.races.set(race.id, race)
    })
    this.nextId = scheduledRaces.length + 1
    
    logger.info(`Initialized ${scheduledRaces.length} scheduled races`)
    
    // Start race status update timer
    this.startRaceStatusUpdates()
  }

  /**
   * Get all races
   */
  async getAllRaces(): Promise<Race[]> {
    // In a real implementation, this would query the database
    return Array.from(this.races.values())
  }

  /**
   * Get race by ID
   */
  async getRaceById(raceId: string): Promise<Race | null> {
    return this.races.get(raceId) || null
  }

  /**
   * Create a new race
   */
  async createRace(raceData: CreateRaceRequest): Promise<Race> {
    const race: Race = {
      id: `race-${this.nextId++}`,
      name: raceData.name,
      type: raceData.type,
      status: 'waiting',
      trackName: raceData.trackName,
      participants: 0,
      maxParticipants: raceData.maxParticipants,
      duration: raceData.duration,
      startTime: raceData.startTime,
      description: raceData.description,
      requirements: raceData.requirements,
      entryFee: raceData.entryFee,
      prizePool: raceData.prizePool,
      difficulty: raceData.difficulty,
      enforcementLevel: raceData.enforcementLevel,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.races.set(race.id, race)
    logger.info(`Created race: ${race.name} (${race.id})`)
    
    return race
  }

  /**
   * Join a race
   */
  async joinRace(raceId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const race = this.races.get(raceId)
    
    if (!race) {
      return { success: false, error: 'Race not found' }
    }

    if (race.status !== 'waiting' && race.status !== 'starting') {
      return { success: false, error: 'Race is not accepting new participants' }
    }

    if (race.participants >= race.maxParticipants) {
      return { success: false, error: 'Race is full' }
    }

    // In a real implementation, check if user is already in race
    // For now, just increment participant count
    race.participants++
    race.updatedAt = new Date()
    
    logger.info(`User ${userId} joined race ${raceId}`)
    return { success: true }
  }

  /**
   * Leave a race
   */
  async leaveRace(raceId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const race = this.races.get(raceId)
    
    if (!race) {
      return { success: false, error: 'Race not found' }
    }

    if (race.status === 'in-progress') {
      return { success: false, error: 'Cannot leave race in progress' }
    }

    if (race.participants > 0) {
      race.participants--
      race.updatedAt = new Date()
    }
    
    logger.info(`User ${userId} left race ${raceId}`)
    return { success: true }
  }

  /**
   * Spectate a race
   */
  async spectateRace(raceId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const race = this.races.get(raceId)
    
    if (!race) {
      return { success: false, error: 'Race not found' }
    }

    // In a real implementation, add user to spectators list
    logger.info(`User ${userId} is spectating race ${raceId}`)
    return { success: true }
  }

  /**
   * Get available tracks
   */
  async getAvailableTracks(): Promise<string[]> {
    const tracks = await trackService.getAllTracks()
    return tracks.map(track => track.name)
  }

  /**
   * Get track details for race
   */
  async getTrackDetails(trackName: string): Promise<any> {
    const tracks = await trackService.getAllTracks()
    const track = tracks.find(t => t.name === trackName)
    return track || null
  }

  /**
   * Update race status
   */
  async updateRaceStatus(raceId: string, status: Race['status']): Promise<Race | null> {
    const race = this.races.get(raceId)
    
    if (!race) {
      return null
    }

    race.status = status
    race.updatedAt = new Date()
    
    logger.info(`Race ${raceId} status updated to ${status}`)
    return race
  }

  /**
   * Update race participant count
   */
  updateParticipantCount(raceId: string, count: number): void {
    const race = this.races.get(raceId)
    if (race) {
      race.participants = Math.max(0, Math.min(count, race.maxParticipants))
      race.updatedAt = new Date()
    }
  }

  /**
   * Get races by status
   */
  async getRacesByStatus(status: Race['status']): Promise<Race[]> {
    return Array.from(this.races.values()).filter(race => race.status === status)
  }

  /**
   * Get races by type
   */
  async getRacesByType(type: Race['type']): Promise<Race[]> {
    return Array.from(this.races.values()).filter(race => race.type === type)
  }

  /**
   * Start automatic race status updates
   */
  private startRaceStatusUpdates(): void {
    setInterval(() => {
      this.updateRaceStatuses()
    }, 30000) // Update every 30 seconds
  }

  /**
   * Update race statuses based on start times
   */
  private updateRaceStatuses(): void {
    const now = new Date()
    
    this.races.forEach((race, raceId) => {
      const startTime = race.startTime
      if (!startTime) return

      const timeUntilStart = startTime.getTime() - now.getTime()
      
      // Update status based on time until start
      if (race.status === 'waiting' && timeUntilStart <= 2 * 60000) { // 2 minutes
        race.status = 'starting'
        race.updatedAt = now
        logger.info(`Race ${raceId} status changed to starting`)
      } else if (race.status === 'starting' && timeUntilStart <= 0) {
        race.status = 'in-progress'
        race.updatedAt = now
        logger.info(`Race ${raceId} started`)
        
        // Schedule race end
        setTimeout(() => {
          this.endRace(raceId)
        }, (race.duration || 1800) * 1000)
      }
    })
  }

  /**
   * End a race
   */
  private endRace(raceId: string): void {
    const race = this.races.get(raceId)
    if (race && race.status === 'in-progress') {
      race.status = 'finished'
      race.updatedAt = new Date()
      logger.info(`Race ${raceId} finished`)
    }
  }
}

export const raceService = new RaceService()
