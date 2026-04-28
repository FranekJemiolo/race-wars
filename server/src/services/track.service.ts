/**
 * Track Service
 * Manages tracks, checkpoints, and race infrastructure
 */

import { logger } from '../utils/logger'

export interface Checkpoint {
  id: string
  name: string
  position: {
    lat: number
    lng: number
  }
  radius: number // meters
  order: number
  isStartFinish: boolean
  isPitLane?: boolean
}

export interface Track {
  id: string
  name: string
  type: 'circuit' | 'custom' | 'duel'
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  length: number // meters
  estimatedLapTime: number // seconds
  checkpoints: Checkpoint[]
  maxParticipants: number
  hasPitLane: boolean
  elevationProfile: {
    min: number
    max: number
    totalClimb: number
  }
  surface: 'asphalt' | 'mixed' | 'gravel' | 'dirt'
  weatherAffected: boolean
  createdAt: Date
  updatedAt: Date
}

export class TrackService {
  private tracks: Map<string, Track> = new Map()

  constructor() {
    this.initializeTracks()
  }

  /**
   * Initialize tracks with checkpoints
   */
  private initializeTracks(): void {
    const tracks: Track[] = [
      {
        id: 'test-circuit',
        name: 'Test Circuit',
        type: 'circuit',
        description: 'A simple circuit perfect for practice and testing',
        difficulty: 'easy',
        length: 3200, // 3.2km
        estimatedLapTime: 120, // 2 minutes
        maxParticipants: 20,
        hasPitLane: true,
        elevationProfile: {
          min: 100,
          max: 120,
          totalClimb: 50
        },
        surface: 'asphalt',
        weatherAffected: false,
        checkpoints: [
          {
            id: 'start-finish',
            name: 'Start/Finish Line',
            position: { lat: 40.7128, lng: -74.0060 },
            radius: 20,
            order: 0,
            isStartFinish: true
          },
          {
            id: 'turn-1',
            name: 'Turn 1',
            position: { lat: 40.7138, lng: -74.0070 },
            radius: 15,
            order: 1,
            isStartFinish: false
          },
          {
            id: 'turn-2',
            name: 'Turn 2',
            position: { lat: 40.7148, lng: -74.0080 },
            radius: 15,
            order: 2,
            isStartFinish: false
          },
          {
            id: 'hairpin',
            name: 'Hairpin Turn',
            position: { lat: 40.7158, lng: -74.0090 },
            radius: 12,
            order: 3,
            isStartFinish: false
          },
          {
            id: 'final-straight',
            name: 'Final Straight',
            position: { lat: 40.7168, lng: -74.0070 },
            radius: 20,
            order: 4,
            isStartFinish: false
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'speedway-arena',
        name: 'Speedway Arena',
        type: 'duel',
        description: 'High-speed oval track designed for head-to-head racing',
        difficulty: 'medium',
        length: 1500, // 1.5km
        estimatedLapTime: 45, // 45 seconds
        maxParticipants: 10,
        hasPitLane: true,
        elevationProfile: {
          min: 95,
          max: 105,
          totalClimb: 20
        },
        surface: 'asphalt',
        weatherAffected: true,
        checkpoints: [
          {
            id: 'start-finish',
            name: 'Start/Finish Line',
            position: { lat: 40.7200, lng: -74.0100 },
            radius: 25,
            order: 0,
            isStartFinish: true
          },
          {
            id: 'turn-1-oval',
            name: 'Turn 1',
            position: { lat: 40.7220, lng: -74.0120 },
            radius: 20,
            order: 1,
            isStartFinish: false
          },
          {
            id: 'turn-2-oval',
            name: 'Turn 2',
            position: { lat: 40.7220, lng: -74.0080 },
            radius: 20,
            order: 2,
            isStartFinish: false
          },
          {
            id: 'turn-3-oval',
            name: 'Turn 3',
            position: { lat: 40.7180, lng: -74.0060 },
            radius: 20,
            order: 3,
            isStartFinish: false
          },
          {
            id: 'turn-4-oval',
            name: 'Turn 4',
            position: { lat: 40.7180, lng: -74.0140 },
            radius: 20,
            order: 4,
            isStartFinish: false
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'grand-prix-circuit',
        name: 'Grand Prix Circuit',
        type: 'circuit',
        description: 'Championship-level circuit with technical corners and long straights',
        difficulty: 'expert',
        length: 5200, // 5.2km
        estimatedLapTime: 180, // 3 minutes
        maxParticipants: 24,
        hasPitLane: true,
        elevationProfile: {
          min: 80,
          max: 150,
          totalClimb: 200
        },
        surface: 'asphalt',
        weatherAffected: true,
        checkpoints: [
          {
            id: 'start-finish-gp',
            name: 'Start/Finish Line',
            position: { lat: 40.7300, lng: -74.0200 },
            radius: 30,
            order: 0,
            isStartFinish: true
          },
          {
            id: 'chicane-1',
            name: 'Chicane 1',
            position: { lat: 40.7320, lng: -74.0220 },
            radius: 15,
            order: 1,
            isStartFinish: false
          },
          {
            id: 's-curve',
            name: 'S-Curve Complex',
            position: { lat: 40.7340, lng: -74.0240 },
            radius: 12,
            order: 2,
            isStartFinish: false
          },
          {
            id: 'technical-section',
            name: 'Technical Section',
            position: { lat: 40.7360, lng: -74.0260 },
            radius: 10,
            order: 3,
            isStartFinish: false
          },
          {
            id: 'hairpin-gp',
            name: 'GP Hairpin',
            position: { lat: 40.7380, lng: -74.0280 },
            radius: 8,
            order: 4,
            isStartFinish: false
          },
          {
            id: 'fast-sweep',
            name: 'Fast Sweep',
            position: { lat: 40.7350, lng: -74.0300 },
            radius: 25,
            order: 5,
            isStartFinish: false
          },
          {
            id: 'final-chicane',
            name: 'Final Chicane',
            position: { lat: 40.7320, lng: -74.0180 },
            radius: 12,
            order: 6,
            isStartFinish: false
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'mountain-pass',
        name: 'Mountain Pass',
        type: 'custom',
        description: 'Challenging mountain route with elevation changes and varied surfaces',
        difficulty: 'hard',
        length: 8500, // 8.5km
        estimatedLapTime: 420, // 7 minutes
        maxParticipants: 12,
        hasPitLane: false,
        elevationProfile: {
          min: 200,
          max: 450,
          totalClimb: 800
        },
        surface: 'mixed',
        weatherAffected: true,
        checkpoints: [
          {
            id: 'mountain-start',
            name: 'Mountain Start',
            position: { lat: 40.7400, lng: -74.0400 },
            radius: 25,
            order: 0,
            isStartFinish: true
          },
          {
            id: 'climb-1',
            name: 'First Climb',
            position: { lat: 40.7450, lng: -74.0450 },
            radius: 20,
            order: 1,
            isStartFinish: false
          },
          {
            id: 'ridge-crossing',
            name: 'Ridge Crossing',
            position: { lat: 40.7500, lng: -74.0500 },
            radius: 15,
            order: 2,
            isStartFinish: false
          },
          {
            id: 'summit',
            name: 'Summit Checkpoint',
            position: { lat: 40.7550, lng: -74.0550 },
            radius: 18,
            order: 3,
            isStartFinish: false
          },
          {
            id: 'descent-1',
            name: 'Technical Descent',
            position: { lat: 40.7500, lng: -74.0600 },
            radius: 12,
            order: 4,
            isStartFinish: false
          },
          {
            id: 'forest-section',
            name: 'Forest Section',
            position: { lat: 40.7450, lng: -74.0650 },
            radius: 20,
            order: 5,
            isStartFinish: false
          },
          {
            id: 'valley-floor',
            name: 'Valley Floor',
            position: { lat: 40.7400, lng: -74.0600 },
            radius: 25,
            order: 6,
            isStartFinish: false
          },
          {
            id: 'final-ascent',
            name: 'Final Ascent',
            position: { lat: 40.7420, lng: -74.0450 },
            radius: 18,
            order: 7,
            isStartFinish: false
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    tracks.forEach(track => {
      this.tracks.set(track.id, track)
    })

    logger.info(`Initialized ${tracks.length} tracks with checkpoints`)
  }

  /**
   * Get all available tracks
   */
  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values())
  }

  /**
   * Get track by ID
   */
  async getTrackById(trackId: string): Promise<Track | null> {
    return this.tracks.get(trackId) || null
  }

  /**
   * Get tracks by type
   */
  async getTracksByType(type: Track['type']): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(track => track.type === type)
  }

  /**
   * Get tracks by difficulty
   */
  async getTracksByDifficulty(difficulty: Track['difficulty']): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(track => track.difficulty === difficulty)
  }

  /**
   * Get track checkpoints
   */
  async getTrackCheckpoints(trackId: string): Promise<Checkpoint[]> {
    const track = this.tracks.get(trackId)
    return track?.checkpoints || []
  }

  /**
   * Validate checkpoint passage
   */
  validateCheckpointPassage(
    trackId: string, 
    checkpointId: string, 
    position: { lat: number; lng: number }
  ): boolean {
    const track = this.tracks.get(trackId)
    if (!track) return false

    const checkpoint = track.checkpoints.find(cp => cp.id === checkpointId)
    if (!checkpoint) return false

    // Calculate distance to checkpoint
    const distance = this.calculateDistance(
      position,
      checkpoint.position
    )

    return distance <= checkpoint.radius
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(
    pos1: { lat: number; lng: number },
    pos2: { lat: number; lng: number }
  ): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRadians(pos2.lat - pos1.lat)
    const dLng = this.toRadians(pos2.lng - pos1.lng)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(pos1.lat)) * Math.cos(this.toRadians(pos2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Get next checkpoint in sequence
   */
  getNextCheckpoint(trackId: string, currentCheckpointOrder: number): Checkpoint | null {
    const track = this.tracks.get(trackId)
    if (!track) return null

    const nextOrder = currentCheckpointOrder + 1
    return track.checkpoints.find(cp => cp.order === nextOrder) || null
  }

  /**
   * Get start/finish checkpoint
   */
  getStartFinishCheckpoint(trackId: string): Checkpoint | null {
    const track = this.tracks.get(trackId)
    if (!track) return null

    return track.checkpoints.find(cp => cp.isStartFinish) || null
  }
}

export const trackService = new TrackService()
