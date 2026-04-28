/**
 * Route Service
 * Handles custom route creation and management
 */

import { logger } from '../utils/logger'

export interface RoutePoint {
  id: string
  lat: number
  lng: number
  type: 'start' | 'checkpoint' | 'finish'
  order: number
  radius?: number
}

export interface RouteData {
  id: string
  name: string
  type: 'sprint' | 'time-trial' | 'circuit'
  points: RoutePoint[]
  totalDistance: number
  estimatedTime?: number
  laps?: number
  description?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  surface: 'asphalt' | 'gravel' | 'dirt' | 'mixed'
  elevationGain?: number
  maxSpeed?: number
  tags: string[]
}

export interface CreateRouteRequest {
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

export class RouteService {
  private routes: Map<string, RouteData> = new Map()
  private nextRouteId = 1

  constructor() {
    this.initializeSampleRoutes()
  }

  /**
   * Initialize sample routes
   */
  private initializeSampleRoutes(): void {
    const sampleRoutes: Omit<RouteData, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Mountain Sprint',
        type: 'sprint',
        points: [
          { id: 'p1', lat: 40.7128, lng: -74.0060, type: 'start', order: 0, radius: 15 },
          { id: 'p2', lat: 40.7200, lng: -74.0100, type: 'checkpoint', order: 1, radius: 15 },
          { id: 'p3', lat: 40.7250, lng: -74.0050, type: 'finish', order: 2, radius: 15 }
        ],
        totalDistance: 2500,
        estimatedTime: 180,
        description: 'Challenging mountain sprint with elevation changes',
        createdBy: 'system',
        isPublic: true,
        difficulty: 'hard',
        surface: 'mixed',
        elevationGain: 150,
        maxSpeed: 80,
        tags: ['mountain', 'elevation', 'technical']
      },
      {
        name: 'City Circuit',
        type: 'circuit',
        points: [
          { id: 'p1', lat: 40.7580, lng: -73.9855, type: 'start', order: 0, radius: 15 },
          { id: 'p2', lat: 40.7610, lng: -73.9880, type: 'checkpoint', order: 1, radius: 15 },
          { id: 'p3', lat: 40.7620, lng: -73.9830, type: 'checkpoint', order: 2, radius: 15 },
          { id: 'p4', lat: 40.7590, lng: -73.9810, type: 'checkpoint', order: 3, radius: 15 }
        ],
        totalDistance: 3200,
        estimatedTime: 240,
        laps: 3,
        description: 'Technical city circuit with tight corners',
        createdBy: 'system',
        isPublic: true,
        difficulty: 'medium',
        surface: 'asphalt',
        elevationGain: 25,
        maxSpeed: 100,
        tags: ['city', 'technical', 'circuit']
      }
    ]

    sampleRoutes.forEach(routeData => {
      const route: RouteData = {
        ...routeData,
        id: `route-${this.nextRouteId++}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      this.routes.set(route.id, route)
    })

    logger.info(`Initialized ${sampleRoutes.length} sample routes`)
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371000 // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180
    const lat2Rad = (point2.lat * Math.PI) / 180
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Calculate total route distance
   */
  private calculateTotalDistance(points: RoutePoint[], type: string, laps?: number): number {
    if (points.length < 2) return 0

    let distance = 0
    for (let i = 0; i < points.length - 1; i++) {
      distance += this.calculateDistance(points[i], points[i + 1])
    }

    // For circuit races, add distance from finish to start
    if (type === 'circuit' && points.length >= 2) {
      distance += this.calculateDistance(points[points.length - 1], points[0])
    }

    // Multiply by laps for circuit races
    if (type === 'circuit' && laps && laps > 1) {
      distance *= laps
    }

    return distance
  }

  /**
   * Estimate race time
   */
  private estimateTime(distance: number, type: string, difficulty: string): number {
    // Base speeds in km/h adjusted by difficulty
    const baseSpeeds = {
      easy: 60,
      medium: 50,
      hard: 40,
      expert: 35
    }

    const typeMultipliers = {
      sprint: 1.1,
      'time-trial': 0.9,
      circuit: 1.0
    }

    const baseSpeed = baseSpeeds[difficulty as keyof typeof baseSpeeds]
    const multiplier = typeMultipliers[type as keyof typeof typeMultipliers]
    const adjustedSpeed = baseSpeed * multiplier

    return (distance / 1000) / adjustedSpeed * 3600 // seconds
  }

  /**
   * Validate route based on type
   */
  private validateRoute(routeData: CreateRouteRequest): string[] {
    const errors: string[] = []

    if (!routeData.name.trim()) {
      errors.push('Route name is required')
    }

    if (!routeData.points || routeData.points.length < 2) {
      errors.push('At least 2 points are required')
    }

    if (routeData.type === 'sprint') {
      // Sprint: point-to-point, needs start and finish
      const hasStart = routeData.points.some(p => p.type === 'start')
      const hasFinish = routeData.points.some(p => p.type === 'finish')
      
      if (!hasStart) errors.push('Sprint races need a start point')
      if (!hasFinish) errors.push('Sprint races need a finish point')
      
      const startPoints = routeData.points.filter(p => p.type === 'start')
      const finishPoints = routeData.points.filter(p => p.type === 'finish')
      
      if (startPoints.length > 1) errors.push('Only one start point allowed')
      if (finishPoints.length > 1) errors.push('Only one finish point allowed')
    }

    if (routeData.type === 'time-trial') {
      // Time trial: every point is a checkpoint that must be visited
      if (routeData.points.length < 3) {
        errors.push('Time trial races need at least 3 checkpoints')
      }
      
      const hasStart = routeData.points.some(p => p.type === 'start')
      const hasFinish = routeData.points.some(p => p.type === 'finish')
      
      if (!hasStart) errors.push('Time trial races need a start point')
      if (!hasFinish) errors.push('Time trial races need a finish point')
    }

    if (routeData.type === 'circuit') {
      // Circuit: must form a closed loop, start/finish can be same point
      if (routeData.points.length < 3) {
        errors.push('Circuit races need at least 3 points to form a loop')
      }
      
      if (!routeData.laps || routeData.laps < 1) {
        errors.push('Circuit races need at least 1 lap')
      }
      
      // Check if route forms a reasonable loop
      if (routeData.points.length >= 2) {
        const startFinishDistance = this.calculateDistance(routeData.points[0], routeData.points[routeData.points.length - 1])
        const totalRouteDistance = this.calculateTotalDistance(routeData.points, routeData.type, 1)
        
        // Start and finish should be within 10% of total route distance for a circuit
        if (startFinishDistance > totalRouteDistance * 0.1) {
          errors.push('Circuit races should start and finish near each other to form a loop')
        }
      }
    }

    return errors
  }

  /**
   * Create a new route
   */
  async createRoute(routeData: CreateRouteRequest, createdBy: string): Promise<RouteData> {
    const errors = this.validateRoute(routeData)
    if (errors.length > 0) {
      throw new Error(`Route validation failed: ${errors.join(', ')}`)
    }

    // Calculate route metrics
    const totalDistance = this.calculateTotalDistance(routeData.points, routeData.type, routeData.laps)
    const estimatedTime = this.estimateTime(totalDistance, routeData.type, routeData.difficulty)

    const route: RouteData = {
      id: `route-${this.nextRouteId++}`,
      name: routeData.name,
      type: routeData.type,
      points: routeData.points,
      totalDistance,
      estimatedTime,
      laps: routeData.type === 'circuit' ? routeData.laps : undefined,
      description: routeData.description,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: routeData.isPublic,
      difficulty: routeData.difficulty,
      surface: routeData.surface,
      tags: routeData.tags || []
    }

    this.routes.set(route.id, route)
    logger.info(`Route created: ${route.name} (${route.id}) by ${createdBy}`)

    return route
  }

  /**
   * Get all routes
   */
  async getAllRoutes(): Promise<RouteData[]> {
    return Array.from(this.routes.values())
  }

  /**
   * Get public routes
   */
  async getPublicRoutes(): Promise<RouteData[]> {
    return Array.from(this.routes.values()).filter(route => route.isPublic)
  }

  /**
   * Get routes by user
   */
  async getRoutesByUser(createdBy: string): Promise<RouteData[]> {
    return Array.from(this.routes.values()).filter(route => route.createdBy === createdBy)
  }

  /**
   * Get route by ID
   */
  async getRouteById(routeId: string): Promise<RouteData | null> {
    return this.routes.get(routeId) || null
  }

  /**
   * Update route
   */
  async updateRoute(routeId: string, updates: Partial<CreateRouteRequest>, updatedBy: string): Promise<RouteData> {
    const route = this.routes.get(routeId)
    if (!route) {
      throw new Error('Route not found')
    }

    if (route.createdBy !== updatedBy) {
      throw new Error('Only route creator can update the route')
    }

    const updatedRoute: RouteData = {
      ...route,
      ...updates,
      updatedAt: new Date()
    }

    // Recalculate metrics if points changed
    if (updates.points) {
      updatedRoute.totalDistance = this.calculateTotalDistance(updates.points, updatedRoute.type, updatedRoute.laps)
      updatedRoute.estimatedTime = this.estimateTime(updatedRoute.totalDistance, updatedRoute.type, updatedRoute.difficulty)
    }

    this.routes.set(routeId, updatedRoute)
    logger.info(`Route updated: ${updatedRoute.name} (${routeId})`)

    return updatedRoute
  }

  /**
   * Delete route
   */
  async deleteRoute(routeId: string, deletedBy: string): Promise<void> {
    const route = this.routes.get(routeId)
    if (!route) {
      throw new Error('Route not found')
    }

    if (route.createdBy !== deletedBy) {
      throw new Error('Only route creator can delete the route')
    }

    this.routes.delete(routeId)
    logger.info(`Route deleted: ${route.name} (${routeId})`)
  }

  /**
   * Search routes by tags
   */
  async searchRoutesByTags(tags: string[]): Promise<RouteData[]> {
    return Array.from(this.routes.values()).filter(route => 
      route.isPublic && tags.some(tag => route.tags.includes(tag))
    )
  }

  /**
   * Get routes by type
   */
  async getRoutesByType(type: 'sprint' | 'time-trial' | 'circuit'): Promise<RouteData[]> {
    return Array.from(this.routes.values()).filter(route => route.type === type && route.isPublic)
  }

  /**
   * Get routes by difficulty
   */
  async getRoutesByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'expert'): Promise<RouteData[]> {
    return Array.from(this.routes.values()).filter(route => route.difficulty === difficulty && route.isPublic)
  }

  /**
   * Convert route to track format for race creation
   */
  async convertRouteToTrack(routeId: string): Promise<any> {
    const route = await this.getRouteById(routeId)
    if (!route) {
      throw new Error('Route not found')
    }

    // Convert route points to track checkpoints
    const checkpoints = route.points.map((point, index) => ({
      id: `checkpoint-${index}`,
      lat: point.lat,
      lng: point.lng,
      radius: point.radius || 15,
      order: point.order,
      isStartFinish: point.type === 'start' || (point.type === 'finish' && route.type === 'sprint'),
      isPitLane: false
    }))

    return {
      name: route.name,
      description: route.description,
      type: route.type,
      difficulty: route.difficulty,
      distance: route.totalDistance,
      estimatedTime: route.estimatedTime,
      laps: route.laps,
      surface: route.surface,
      elevationGain: route.elevationGain,
      maxSpeed: route.maxSpeed,
      checkpoints,
      createdBy: route.createdBy,
      tags: route.tags
    }
  }
}

export const routeService = new RouteService()
