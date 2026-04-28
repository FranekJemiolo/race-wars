/**
 * Route Controller
 * Handles custom route creation and management
 */

import { Request, Response } from 'express'
import { routeService, CreateRouteRequest } from '../services/route.service'
import { logger } from '../utils/logger'

export class RouteController {
  /**
   * Create a new route
   */
  async createRoute(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const routeData: CreateRouteRequest = req.body
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      // Validate required fields
      const requiredFields = ['name', 'type', 'points', 'difficulty', 'surface']
      const missingFields = requiredFields.filter(field => !routeData[field as keyof CreateRouteRequest])
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        })
      }

      const route = await routeService.createRoute(routeData, user.id)
      
      res.status(201).json({
        success: true,
        data: { route },
        message: 'Route created successfully'
      })
    } catch (error) {
      logger.error('Failed to create route:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create route'
      const statusCode = errorMessage.includes('validation') ? 400 : 500
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      })
    }
  }

  /**
   * Get all routes
   */
  async getAllRoutes(req: Request, res: Response) {
    try {
      const { public: publicOnly, type, difficulty, tags } = req.query
      
      let routes
      
      if (publicOnly === 'true') {
        routes = await routeService.getPublicRoutes()
      } else {
        routes = await routeService.getAllRoutes()
      }

      // Filter by type if specified
      if (type && typeof type === 'string') {
        routes = routes.filter(route => route.type === type)
      }

      // Filter by difficulty if specified
      if (difficulty && typeof difficulty === 'string') {
        routes = routes.filter(route => route.difficulty === difficulty)
      }

      // Filter by tags if specified
      if (tags && typeof tags === 'string') {
        const tagList = tags.split(',').map(tag => tag.trim())
        routes = routes.filter(route => 
          tagList.some(tag => route.tags.includes(tag))
        )
      }

      res.json({
        success: true,
        data: { routes }
      })
    } catch (error) {
      logger.error('Failed to get routes:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get routes'
      })
    }
  }

  /**
   * Get route by ID
   */
  async getRouteById(req: Request, res: Response) {
    try {
      const { routeId } = req.params
      
      if (!routeId) {
        return res.status(400).json({
          success: false,
          error: 'Route ID is required'
        })
      }

      const route = await routeService.getRouteById(routeId)
      
      if (!route) {
        return res.status(404).json({
          success: false,
          error: 'Route not found'
        })
      }

      res.json({
        success: true,
        data: { route }
      })
    } catch (error) {
      logger.error('Failed to get route:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get route'
      })
    }
  }

  /**
   * Get routes created by current user
   */
  async getUserRoutes(req: Request, res: Response) {
    try {
      const user = (req as any).user
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      const routes = await routeService.getRoutesByUser(user.id)
      
      res.json({
        success: true,
        data: { routes }
      })
    } catch (error) {
      logger.error('Failed to get user routes:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get user routes'
      })
    }
  }

  /**
   * Update a route
   */
  async updateRoute(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const { routeId } = req.params
      const updates: Partial<CreateRouteRequest> = req.body
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      if (!routeId) {
        return res.status(400).json({
          success: false,
          error: 'Route ID is required'
        })
      }

      const route = await routeService.updateRoute(routeId, updates, user.id)
      
      res.json({
        success: true,
        data: { route },
        message: 'Route updated successfully'
      })
    } catch (error) {
      logger.error('Failed to update route:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update route'
      const statusCode = errorMessage.includes('not found') ? 404 : 
                           errorMessage.includes('Only route creator') ? 403 : 500
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      })
    }
  }

  /**
   * Delete a route
   */
  async deleteRoute(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const { routeId } = req.params
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        })
      }

      if (!routeId) {
        return res.status(400).json({
          success: false,
          error: 'Route ID is required'
        })
      }

      await routeService.deleteRoute(routeId, user.id)
      
      res.json({
        success: true,
        message: 'Route deleted successfully'
      })
    } catch (error) {
      logger.error('Failed to delete route:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete route'
      const statusCode = errorMessage.includes('not found') ? 404 : 
                           errorMessage.includes('Only route creator') ? 403 : 500
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      })
    }
  }

  /**
   * Search routes by tags
   */
  async searchRoutes(req: Request, res: Response) {
    try {
      const { tags } = req.query
      
      if (!tags || typeof tags !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Tags parameter is required'
        })
      }

      const tagList = tags.split(',').map(tag => tag.trim())
      const routes = await routeService.searchRoutesByTags(tagList)
      
      res.json({
        success: true,
        data: { routes }
      })
    } catch (error) {
      logger.error('Failed to search routes:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to search routes'
      })
    }
  }

  /**
   * Get routes by type
   */
  async getRoutesByType(req: Request, res: Response) {
    try {
      const { type } = req.params
      
      if (!type || !['sprint', 'time-trial', 'circuit'].includes(type as string)) {
        return res.status(400).json({
          success: false,
          error: 'Valid route type is required (sprint, time-trial, circuit)'
        })
      }

      const routes = await routeService.getRoutesByType(type as 'sprint' | 'time-trial' | 'circuit')
      
      res.json({
        success: true,
        data: { routes }
      })
    } catch (error) {
      logger.error('Failed to get routes by type:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get routes by type'
      })
    }
  }

  /**
   * Get routes by difficulty
   */
  async getRoutesByDifficulty(req: Request, res: Response) {
    try {
      const { difficulty } = req.params
      
      if (!difficulty || !['easy', 'medium', 'hard', 'expert'].includes(difficulty as string)) {
        return res.status(400).json({
          success: false,
          error: 'Valid difficulty is required (easy, medium, hard, expert)'
        })
      }

      const routes = await routeService.getRoutesByDifficulty(difficulty as 'easy' | 'medium' | 'hard' | 'expert')
      
      res.json({
        success: true,
        data: { routes }
      })
    } catch (error) {
      logger.error('Failed to get routes by difficulty:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get routes by difficulty'
      })
    }
  }

  /**
   * Convert route to track format
   */
  async convertRouteToTrack(req: Request, res: Response) {
    try {
      const { routeId } = req.params
      
      if (!routeId) {
        return res.status(400).json({
          success: false,
          error: 'Route ID is required'
        })
      }

      const track = await routeService.convertRouteToTrack(routeId)
      
      res.json({
        success: true,
        data: { track },
        message: 'Route converted to track format'
      })
    } catch (error) {
      logger.error('Failed to convert route to track:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to convert route to track'
      const statusCode = errorMessage.includes('not found') ? 404 : 500
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      })
    }
  }
}

export const routeController = new RouteController()
