/**
 * Race Service
 * Business logic for race management
 */

import { query } from '../database/connection.simple'
import { logger } from '../utils/logger'

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
   * Initialize with sample race data for development
   */
  private initializeSampleRaces() {
    const sampleRaces: Race[] = [
      {
        id: 'practice-1',
        name: 'Morning Practice Session',
        type: 'circuit',
        status: 'waiting',
        trackName: 'Test Circuit',
        participants: 8,
        maxParticipants: 20,
        duration: 1800, // 30 minutes
        startTime: new Date(Date.now() + 5 * 60000), // 5 minutes from now
        description: 'Open practice session for all skill levels',
        requirements: ['Valid driver license', 'Helmet required'],
        difficulty: 'easy',
        enforcementLevel: 'light',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'duel-championship',
        name: 'Duel Championship Round 1',
        type: 'duel',
        status: 'starting',
        trackName: 'Speedway Arena',
        participants: 9,
        maxParticipants: 10,
        duration: 900, // 15 minutes
        startTime: new Date(Date.now() + 2 * 60000), // 2 minutes from now
        description: 'Head-to-head racing tournament',
        requirements: ['Previous race experience', 'Vehicle inspection'],
        prizePool: 1000,
        entryFee: 50,
        difficulty: 'medium',
        enforcementLevel: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'custom-mountain',
        name: 'Mountain Pass Challenge',
        type: 'custom',
        status: 'in-progress',
        trackName: 'Mountain Pass',
        participants: 12,
        maxParticipants: 16,
        duration: 2400, // 40 minutes
        startTime: new Date(Date.now() - 10 * 60000), // Started 10 minutes ago
        description: 'Challenging custom route through mountain terrain',
        requirements: ['Advanced driving skills', 'Off-road experience'],
        prizePool: 2000,
        entryFee: 100,
        difficulty: 'hard',
        enforcementLevel: 'hard',
        createdBy: 'Admin',
        createdAt: new Date(Date.now() - 20 * 60000),
        updatedAt: new Date()
      },
      {
        id: 'circuit-championship',
        name: 'Circuit Championship Qualifier',
        type: 'circuit',
        status: 'waiting',
        trackName: 'Grand Prix Circuit',
        participants: 15,
        maxParticipants: 24,
        duration: 2700, // 45 minutes
        startTime: new Date(Date.now() + 15 * 60000), // 15 minutes from now
        description: 'Official championship qualifying session',
        requirements: ['Racing license', 'Vehicle compliance check'],
        prizePool: 5000,
        entryFee: 200,
        difficulty: 'expert',
        enforcementLevel: 'medium',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    sampleRaces.forEach(race => {
      this.races.set(race.id, race)
    })
    this.nextId = sampleRaces.length + 1
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
    return [
      'Test Circuit',
      'Grand Prix Circuit',
      'Speedway Arena',
      'Mountain Pass',
      'City Streets',
      'Coastal Highway',
      'Desert Circuit',
      'Forest Trail'
    ]
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
}

export const raceService = new RaceService()
