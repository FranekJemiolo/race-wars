/**
 * Authentication Service - Client Side
 * Handles user authentication, token management, and session persistence
 */

interface User {
  id: string
  username: string
  email: string
  displayName: string
  role: 'user' | 'admin'
  isVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  stats: {
    racesParticipated: number
    racesWon: number
    totalTimeRaced: number
    bestLapTime?: number
  }
}

interface AuthResponse {
  user: User
  token: string
  expiresIn: number
}

interface RegisterRequest {
  username: string
  email: string
  password: string
  displayName: string
}

interface LoginRequest {
  username: string
  password: string
}

class AuthService {
  private baseUrl: string
  private token: string | null = null
  private user: User | null = null
  private tokenExpiryTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8082'
    this.loadStoredAuth()
  }

  /**
   * Load authentication data from localStorage
   */
  private loadStoredAuth(): void {
    try {
      const storedToken = localStorage.getItem('race_wars_token')
      const storedUser = localStorage.getItem('race_wars_user')
      const storedExpiry = localStorage.getItem('race_wars_token_expiry')

      if (storedToken && storedUser && storedExpiry) {
        const expiryTime = parseInt(storedExpiry)
        if (Date.now() < expiryTime) {
          this.token = storedToken
          this.user = JSON.parse(storedUser)
          this.scheduleTokenExpiry(expiryTime - Date.now())
        } else {
          this.clearStoredAuth()
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error)
      this.clearStoredAuth()
    }
  }

  /**
   * Store authentication data in localStorage
   */
  private storeAuth(token: string, user: User, expiresIn: number): void {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000)
      localStorage.setItem('race_wars_token', token)
      localStorage.setItem('race_wars_user', JSON.stringify(user))
      localStorage.setItem('race_wars_token_expiry', expiryTime.toString())
      
      this.token = token
      this.user = user
      this.scheduleTokenExpiry(expiresIn * 1000)
    } catch (error) {
      console.error('Failed to store auth:', error)
    }
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('race_wars_token')
    localStorage.removeItem('race_wars_user')
    localStorage.removeItem('race_wars_token_expiry')
    this.token = null
    this.user = null
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout)
      this.tokenExpiryTimeout = null
    }
  }

  /**
   * Schedule token expiry
   */
  private scheduleTokenExpiry(timeUntilExpiry: number): void {
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout)
    }
    
    this.tokenExpiryTimeout = setTimeout(() => {
      console.log('Token expired, logging out...')
      this.logout()
    }, timeUntilExpiry)
  }

  /**
   * Register a new user
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Registration failed')
      }

      const authData: AuthResponse = result.data
      this.storeAuth(authData.token, authData.user, authData.expiresIn)
      
      return authData
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Login failed')
      }

      const authData: AuthResponse = result.data
      this.storeAuth(authData.token, authData.user, authData.expiresIn)
      
      return authData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${this.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      this.clearStoredAuth()
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.user?.role === 'admin'
  }

  /**
   * Check if user is verified
   */
  isVerified(): boolean {
    return this.user?.isVerified === true
  }

  /**
   * Verify token with server
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        return null
      }

      return result.data.user
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User | null> {
    if (!this.token) {
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          this.clearStoredAuth()
        }
        return null
      }

      const updatedUser = result.data.user
      this.user = updatedUser
      localStorage.setItem('race_wars_user', JSON.stringify(updatedUser))
      
      return updatedUser
    } catch (error) {
      console.error('Get profile failed:', error)
      return null
    }
  }

  /**
   * Refresh user data
   */
  async refreshUserData(): Promise<void> {
    await this.getProfile()
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.token) {
      throw new Error('No authentication token available')
    }

    const authenticatedOptions: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`
      }
    }

    const response = await fetch(`${this.baseUrl}${url}`, authenticatedOptions)

    if (response.status === 401) {
      this.clearStoredAuth()
      throw new Error('Authentication expired')
    }

    return response
  }

  /**
   * Update user stats (call after race participation)
   */
  async updateUserStats(stats: Partial<User['stats']>): Promise<void> {
    if (!this.user) return

    this.user.stats = { ...this.user.stats, ...stats }
    localStorage.setItem('race_wars_user', JSON.stringify(this.user))
  }
}

export const authService = new AuthService()
export type { User, AuthResponse, RegisterRequest, LoginRequest }
