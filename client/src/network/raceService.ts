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
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  }

  /**
   * Get all available races from the server
   */
  async getRaces(): Promise<Race[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/races`)
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
      // Return empty array on error, let UI handle empty state
      return []
    }
  }

  /**
   * Get a specific race by ID
   */
  async getRace(raceId: string): Promise<Race | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/races/${raceId}`)
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
      const response = await fetch(`${this.baseUrl}/api/races`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(raceData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const race = await response.json()
      return {
        ...race,
        startTime: race.startTime ? new Date(race.startTime) : undefined
      }
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
      const response = await fetch(`${this.baseUrl}/api/races/${raceId}/join`, {
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
      const response = await fetch(`${this.baseUrl}/api/races/${raceId}/leave`, {
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
      const response = await fetch(`${this.baseUrl}/api/races/${raceId}/spectate`, {
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
      const response = await fetch(`${this.baseUrl}/api/tracks`)
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
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:8081').replace('http', 'ws')
    
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
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          this.setupWebSocket(onRaceUpdate, onRaceListUpdate)
        }, 5000)
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to setup WebSocket:', error)
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
