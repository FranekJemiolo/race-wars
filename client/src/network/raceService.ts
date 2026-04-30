/**
 * Race Service - Handles race-related API calls and real-time updates
 */

interface Race {
  id: string
  name: string
  type: 'circuit' | 'custom' | 'duel'
  status: 'waiting' | 'starting' | 'in-progress' | 'finished'
  trackName: string
  trackImage?: string
  participants?: number
  maxParticipants?: number
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
}

interface CreateRaceRequest {
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

class RaceService {
  private baseUrl: string
  private ws: WebSocket | null = null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082'
    console.log('RaceService initialized with baseUrl:', this.baseUrl)
    console.log('Available VITE env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
  }

  /**
   * Get all available races from the server
   */
  async getRaces(): Promise<Race[]> {
    try {
      const response = await fetch(`${this.baseUrl}/races`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const races = await response.json()
      
      // Convert date strings back to Date objects
      return races.map((race: any) => ({
        ...race,
        startTime: race.startTime ? new Date(race.startTime) : undefined
      }))
    } catch (error) {
      console.error('Failed to fetch races:', error)
      // Return mock data for development/screenshots
      return this.getMockRaces()
    }
  }

  /**
   * Get mock race data for development
   */
  private getMockRaces(): Race[] {
    const now = new Date()
    return [
      {
        id: 'race-1',
        name: 'Monaco Grand Prix',
        type: 'circuit',
        status: 'waiting',
        trackName: 'Monaco Circuit',
        participants: 12,
        maxParticipants: 20,
        duration: 3600,
        startTime: new Date(now.getTime() + 15 * 60 * 1000), // 15 minutes from now
        description: 'The prestigious Monaco street circuit race',
        rules: ['No shortcuts', 'Respect track limits', 'Fair play'],
        requirements: ['Level 5+', 'Verified account'],
        prizePool: 10000,
        entryFee: 100,
        createdBy: 'admin',
        difficulty: 'expert',
        enforcementLevel: 'hard'
      },
      {
        id: 'race-2',
        name: 'Silverstone Sprint',
        type: 'circuit',
        status: 'starting',
        trackName: 'Silverstone',
        participants: 18,
        maxParticipants: 20,
        duration: 1800,
        startTime: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes from now
        description: 'Fast-paced sprint race on the historic Silverstone track',
        rules: ['Standard racing rules'],
        requirements: ['Level 3+'],
        prizePool: 5000,
        entryFee: 50,
        createdBy: 'admin',
        difficulty: 'medium',
        enforcementLevel: 'medium'
      },
      {
        id: 'race-3',
        name: 'Mountain Pass Custom',
        type: 'custom',
        status: 'in-progress',
        trackName: 'Mountain Pass',
        participants: 8,
        maxParticipants: 10,
        duration: 2400,
        startTime: new Date(now.getTime() - 10 * 60 * 1000), // Started 10 minutes ago
        description: 'Challenging custom route through mountain terrain',
        rules: ['GPS tracking required', 'No assistance'],
        requirements: ['Level 10+', 'Premium account'],
        prizePool: 15000,
        entryFee: 200,
        createdBy: 'testdriver',
        difficulty: 'hard',
        enforcementLevel: 'hard'
      },
      {
        id: 'race-4',
        name: 'Duel Championship',
        type: 'duel',
        status: 'waiting',
        trackName: 'Speedway Arena',
        participants: 4,
        maxParticipants: 10,
        duration: 900,
        startTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
        description: 'Head-to-head duels in the arena',
        rules: ['1v1 format', 'Elimination style'],
        requirements: ['Level 1+'],
        prizePool: 2000,
        entryFee: 20,
        createdBy: 'admin',
        difficulty: 'easy',
        enforcementLevel: 'light'
      },
      {
        id: 'race-5',
        name: 'Spa Endurance',
        type: 'circuit',
        status: 'waiting',
        trackName: 'Spa-Francorchamps',
        participants: 15,
        maxParticipants: 25,
        duration: 7200,
        startTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        description: 'Endurance race on the legendary Spa circuit',
        rules: ['Pit stops required', 'Fuel management'],
        requirements: ['Level 8+', 'Endurance license'],
        prizePool: 25000,
        entryFee: 500,
        createdBy: 'admin',
        difficulty: 'expert',
        enforcementLevel: 'hard'
      }
    ]
  }

  /**
   * Get a specific race by ID
   */
  async getRace(raceId: string): Promise<Race | null> {
    try {
      const response = await fetch(`${this.baseUrl}/races/${raceId}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const race = await response.json()
      return {
        ...race,
        startTime: race.startTime ? new Date(race.startTime) : undefined
      }
    } catch (error) {
      console.error('Failed to fetch race:', error)
      return null
    }
  }

  /**
   * Create a new race
   */
  async createRace(raceData: CreateRaceRequest): Promise<Race> {
    try {
      const token = localStorage.getItem('race_wars_token')
      const response = await fetch(`${this.baseUrl}/races`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(raceData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const race = await response.json()
      return race
    } catch (error) {
      console.error('Failed to create race:', error)
      throw error
    }
  }

  /**
   * Join a race
   */
  async joinRace(raceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/races/${raceId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to join race:', error)
      throw error
    }
  }

  /**
   * Leave a race
   */
  async leaveRace(raceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/races/${raceId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to leave race:', error)
      throw error
    }
  }

  /**
   * Spectate a race
   */
  async spectateRace(raceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/races/${raceId}/spectate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to spectate race:', error)
      throw error
    }
  }

  /**
   * Get available tracks
   */
  async getTracks(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tracks`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch tracks:', error)
      // Return fallback tracks
      return ['Test Circuit', 'Grand Prix Circuit', 'Speedway Arena', 'Mountain Pass']
    }
  }

  /**
   * Setup WebSocket connection for real-time race updates
   */
  setupWebSocket(onRaceUpdate: (race: Race) => void, onRaceListUpdate: (races: Race[]) => void): void {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
    
    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('Connected to race WebSocket')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'race_update':
              onRaceUpdate({
                ...data.race,
                startTime: data.race.startTime ? new Date(data.race.startTime) : undefined
              })
              break
            case 'race_list_update':
              onRaceListUpdate(data.races.map((race: any) => ({
                ...race,
                startTime: race.startTime ? new Date(race.startTime) : undefined
              })))
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('Disconnected from race WebSocket')
        // Don't auto-reconnect for screenshots/development
      }

      this.ws.onerror = (error) => {
        // Silently ignore WebSocket errors for screenshots/development
        console.debug('WebSocket connection failed (expected if server not running)')
      }
    } catch (error) {
      // Silently ignore WebSocket setup errors for screenshots/development
      console.debug('Failed to setup WebSocket (expected if server not running)')
    }
  }

  /**
   * Close WebSocket connection
   */
  closeWebSocket(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Export singleton instance
export const raceService = new RaceService()
export type { Race, CreateRaceRequest }
