/**
 * Route Service - Client Side
 * Handles custom route creation and management
 */

interface RoutePoint {
  id: string
  lat: number
  lng: number
  type: 'start' | 'checkpoint' | 'finish'
  order: number
  radius?: number
}

interface RouteData {
  id: string
  name: string
  type: 'sprint' | 'time-trial' | 'circuit'
  points: RoutePoint[]
  totalDistance: number
  estimatedTime?: number
  laps?: number
  description?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isPublic: boolean
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  surface: 'asphalt' | 'gravel' | 'dirt' | 'mixed'
  elevationGain?: number
  maxSpeed?: number
  tags: string[]
}

interface CreateRouteRequest {
  name: string
  type: 'sprint' | 'time-trial' | 'circuit'
  points: RoutePoint[]
  description?: string
  isPublic: boolean
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  surface: 'asphalt' | 'gravel' | 'dirt' | 'mixed'
  laps?: number
  tags?: string[]
}

class RouteService {
  private baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082'
  }

  /**
   * Create a new route
   */
  async createRoute(routeData: CreateRouteRequest): Promise<RouteData> {
    try {
      const token = localStorage.getItem('race_wars_token')
      const response = await fetch(`${this.baseUrl}/api/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(routeData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.route
    } catch (error) {
      console.error('Failed to create route:', error)
      throw error
    }
  }

  /**
   * Get all routes
   */
  async getAllRoutes(filters?: {
    public?: boolean
    type?: string
    difficulty?: string
    tags?: string[]
  }): Promise<RouteData[]> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.public !== undefined) {
        params.append('public', filters.public.toString())
      }
      if (filters?.type) {
        params.append('type', filters.type)
      }
      if (filters?.difficulty) {
        params.append('difficulty', filters.difficulty)
      }
      if (filters?.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','))
      }

      const response = await fetch(`${this.baseUrl}/api/routes?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.routes
    } catch (error) {
      console.error('Failed to get routes:', error)
      throw error
    }
  }

  /**
   * Get route by ID
   */
  async getRouteById(routeId: string): Promise<RouteData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/routes/${routeId}`)
      
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.route
    } catch (error) {
      console.error('Failed to get route:', error)
      throw error
    }
  }

  /**
   * Get routes created by current user
   */
  async getUserRoutes(): Promise<RouteData[]> {
    try {
      const token = localStorage.getItem('race_wars_token')
      const response = await fetch(`${this.baseUrl}/api/routes/user`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.routes
    } catch (error) {
      console.error('Failed to get user routes:', error)
      throw error
    }
  }

  /**
   * Update a route
   */
  async updateRoute(routeId: string, updates: Partial<CreateRouteRequest>): Promise<RouteData> {
    try {
      const token = localStorage.getItem('race_wars_token')
      const response = await fetch(`${this.baseUrl}/api/routes/${routeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.route
    } catch (error) {
      console.error('Failed to update route:', error)
      throw error
    }
  }

  /**
   * Delete a route
   */
  async deleteRoute(routeId: string): Promise<void> {
    try {
      const token = localStorage.getItem('race_wars_token')
      const response = await fetch(`${this.baseUrl}/api/routes/${routeId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to delete route:', error)
      throw error
    }
  }

  /**
   * Search routes by tags
   */
  async searchRoutesByTags(tags: string[]): Promise<RouteData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/routes/search?tags=${tags.join(',')}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.routes
    } catch (error) {
      console.error('Failed to search routes:', error)
      throw error
    }
  }

  /**
   * Get routes by type
   */
  async getRoutesByType(type: 'sprint' | 'time-trial' | 'circuit'): Promise<RouteData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/routes/type/${type}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.routes
    } catch (error) {
      console.error('Failed to get routes by type:', error)
      throw error
    }
  }

  /**
   * Get routes by difficulty
   */
  async getRoutesByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): Promise<RouteData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/routes/difficulty/${difficulty}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.routes
    } catch (error) {
      console.error('Failed to get routes by difficulty:', error)
      throw error
    }
  }

  /**
   * Convert route to track format for race creation
   */
  async convertRouteToTrack(routeId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/routes/${routeId}/convert`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data.track
    } catch (error) {
      console.error('Failed to convert route to track:', error)
      throw error
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('race_wars_token')
    
    const authenticatedOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    }

    const response = await fetch(`${this.baseUrl}${url}`, authenticatedOptions)

    if (response.status === 401) {
      localStorage.removeItem('race_wars_token')
      localStorage.removeItem('race_wars_user')
      localStorage.removeItem('race_wars_token_expiry')
      throw new Error('Authentication expired')
    }

    return response
  }
}

export const routeService = new RouteService()
export type { RouteData, CreateRouteRequest, RoutePoint }
