/**
 * Enforcement Controller
 * 
 * Handles HTTP requests for enforcement zone management and violation tracking
 */

import { Request, Response } from 'express';
import { enforcementZoneRepository } from '../database/repositories';
import { enforcementService } from '../services/enforcement.service';
import type { Position } from '../services/enforcement.service';

export class EnforcementController {
  /**
   * Get all enforcement zones for a route
   */
  async getZonesByRoute(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      
      if (!routeId) {
        res.status(400).json({ error: 'Route ID is required' });
        return;
      }
      
      const zones = await enforcementZoneRepository.findByRoute(routeId);
      res.json(zones);
    } catch (error) {
      console.error('Failed to get enforcement zones:', error);
      res.status(500).json({ error: 'Failed to get enforcement zones' });
    }
  }

  /**
   * Get visible enforcement zones for a route
   */
  async getVisibleZonesByRoute(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      
      if (!routeId) {
        res.status(400).json({ error: 'Route ID is required' });
        return;
      }
      
      const zones = await enforcementZoneRepository.findVisibleByRoute(routeId);
      res.json(zones);
    } catch (error) {
      console.error('Failed to get visible enforcement zones:', error);
      res.status(500).json({ error: 'Failed to get visible enforcement zones' });
    }
  }

  /**
   * Get enforcement zones by type
   */
  async getZonesByType(req: Request, res: Response): Promise<void> {
    try {
      const { routeId, zoneType } = req.params;
      
      if (!routeId || !zoneType) {
        res.status(400).json({ error: 'Route ID and zone type are required' });
        return;
      }
      
      const zones = await enforcementZoneRepository.findByType(routeId, zoneType as any);
      res.json(zones);
    } catch (error) {
      console.error('Failed to get enforcement zones by type:', error);
      res.status(500).json({ error: 'Failed to get enforcement zones by type' });
    }
  }

  /**
   * Get enforcement zone statistics
   */
  async getZoneStats(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      
      if (!routeId) {
        res.status(400).json({ error: 'Route ID is required' });
        return;
      }
      
      const stats = await enforcementZoneRepository.getStats(routeId);
      res.json(stats);
    } catch (error) {
      console.error('Failed to get enforcement zone statistics:', error);
      res.status(500).json({ error: 'Failed to get enforcement zone statistics' });
    }
  }

  /**
   * Create a new enforcement zone
   */
  async createZone(req: Request, res: Response): Promise<void> {
    try {
      const zoneData = req.body;
      
      if (!zoneData.route_id || !zoneData.name || !zoneData.geometry || !zoneData.zone_type) {
        res.status(400).json({ error: 'route_id, name, geometry, and zone_type are required' });
        return;
      }
      
      const zone = await enforcementZoneRepository.create(zoneData);
      res.status(201).json(zone);
    } catch (error) {
      console.error('Failed to create enforcement zone:', error);
      res.status(500).json({ error: 'Failed to create enforcement zone' });
    }
  }

  /**
   * Update an enforcement zone
   */
  async updateZone(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        res.status(400).json({ error: 'Zone ID is required' });
        return;
      }
      
      const zone = await enforcementZoneRepository.update(id, updateData);
      
      if (!zone) {
        res.status(404).json({ error: 'Enforcement zone not found' });
        return;
      }
      
      res.json(zone);
    } catch (error) {
      console.error('Failed to update enforcement zone:', error);
      res.status(500).json({ error: 'Failed to update enforcement zone' });
    }
  }

  /**
   * Delete an enforcement zone
   */
  async deleteZone(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Zone ID is required' });
        return;
      }
      
      const deleted = await enforcementZoneRepository.delete(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Enforcement zone not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete enforcement zone:', error);
      res.status(500).json({ error: 'Failed to delete enforcement zone' });
    }
  }

  /**
   * Check position for speed zone violations
   */
  async checkSpeedZones(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const { lat, lng, speed, heading, timestamp } = req.body;
      
      if (!routeId || lat === undefined || lng === undefined || speed === undefined) {
        res.status(400).json({ error: 'routeId, lat, lng, and speed are required' });
        return;
      }
      
      const position: Position = {
        lat,
        lng,
        speed,
        heading,
        timestamp: timestamp || Date.now()
      };
      
      const violations = await enforcementService.checkSpeedZones(position, routeId);
      res.json(violations);
    } catch (error) {
      console.error('Failed to check speed zones:', error);
      res.status(500).json({ error: 'Failed to check speed zones' });
    }
  }

  /**
   * Check position for speed trap triggers
   */
  async checkSpeedTraps(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const { lat, lng, speed, heading, timestamp } = req.body;
      
      if (!routeId || lat === undefined || lng === undefined || speed === undefined) {
        res.status(400).json({ error: 'routeId, lat, lng, and speed are required' });
        return;
      }
      
      const position: Position = {
        lat,
        lng,
        speed,
        heading,
        timestamp: timestamp || Date.now()
      };
      
      const triggers = await enforcementService.checkSpeedTraps(position, routeId);
      res.json(triggers);
    } catch (error) {
      console.error('Failed to check speed traps:', error);
      res.status(500).json({ error: 'Failed to check speed traps' });
    }
  }

  /**
   * Calculate penalty for a violation
   */
  async calculatePenalty(req: Request, res: Response): Promise<void> {
    try {
      const violation = req.body;
      
      if (!violation) {
        res.status(400).json({ error: 'Violation data is required' });
        return;
      }
      
      const penalty = enforcementService.calculatePenalty(violation);
      res.json(penalty);
    } catch (error) {
      console.error('Failed to calculate penalty:', error);
      res.status(500).json({ error: 'Failed to calculate penalty' });
    }
  }

  /**
   * Check for route deviation
   */
  async checkRouteDeviation(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, speed, heading, timestamp } = req.body;
      const { routePoints, toleranceMeters } = req.body;
      
      if (lat === undefined || lng === undefined || !routePoints || !Array.isArray(routePoints)) {
        res.status(400).json({ error: 'lat, lng, and routePoints are required' });
        return;
      }
      
      const position: Position = {
        lat,
        lng,
        speed: speed || 0,
        heading,
        timestamp: timestamp || Date.now()
      };
      
      const isDeviating = enforcementService.checkRouteDeviation(
        position,
        routePoints,
        toleranceMeters || 50
      );
      
      res.json({ isDeviating });
    } catch (error) {
      console.error('Failed to check route deviation:', error);
      res.status(500).json({ error: 'Failed to check route deviation' });
    }
  }

  /**
   * Check for checkpoint violation
   */
  async checkCheckpointViolation(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, speed, heading, timestamp } = req.body;
      const { checkpoint, previousPosition } = req.body;
      
      if (lat === undefined || lng === undefined || !checkpoint) {
        res.status(400).json({ error: 'lat, lng, and checkpoint are required' });
        return;
      }
      
      const position: Position = {
        lat,
        lng,
        speed: speed || 0,
        heading,
        timestamp: timestamp || Date.now()
      };
      
      const prevPos = previousPosition ? {
        lat: previousPosition.lat,
        lng: previousPosition.lng,
        speed: previousPosition.speed || 0,
        heading: previousPosition.heading,
        timestamp: previousPosition.timestamp || Date.now()
      } : undefined;
      
      const violation = enforcementService.checkCheckpointViolation(position, checkpoint, prevPos);
      res.json(violation);
    } catch (error) {
      console.error('Failed to check checkpoint violation:', error);
      res.status(500).json({ error: 'Failed to check checkpoint violation' });
    }
  }

  /**
   * Get risk level for a session
   */
  async getRiskLevel(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      
      if (!routeId) {
        res.status(400).json({ error: 'Route ID is required' });
        return;
      }
      
      const riskLevel = enforcementService.getRiskLevel(routeId);
      res.json({ riskLevel });
    } catch (error) {
      console.error('Failed to get risk level:', error);
      res.status(500).json({ error: 'Failed to get risk level' });
    }
  }

  /**
   * Clear violations for a session
   */
  async clearViolations(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      
      if (!routeId) {
        res.status(400).json({ error: 'Route ID is required' });
        return;
      }
      
      enforcementService.clearViolations(routeId);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to clear violations:', error);
      res.status(500).json({ error: 'Failed to clear violations' });
    }
  }
}

export const enforcementController = new EnforcementController();
