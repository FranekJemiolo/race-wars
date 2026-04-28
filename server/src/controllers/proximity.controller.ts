/**
 * Proximity Detection Controller
 * 
 * Handles HTTP requests for proximity detection and safety alerts
 */

import { Request, Response } from 'express';
import { proximityService } from '../services/proximity.service';
import type { DriverPosition, ProximityAlert, ProximityConfig } from '../services/proximity.service';

export class ProximityController {
  /**
   * Update driver position
   */
  async updateDriverPosition(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, position, speed, heading } = req.body;
      
      if (!driverId || !position || speed === undefined || heading === undefined) {
        res.status(400).json({ error: 'driverId, position, speed, and heading are required' });
        return;
      }
      
      const driverData: DriverPosition = {
        driverId,
        position,
        speed,
        heading,
        timestamp: Date.now()
      };
      
      proximityService.updateDriverPosition(driverData);
      res.json({ message: 'Driver position updated', driverData });
    } catch (error) {
      console.error('Failed to update driver position:', error);
      res.status(500).json({ error: 'Failed to update driver position' });
    }
  }

  /**
   * Remove driver from tracking
   */
  async removeDriver(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      
      if (!driverId) {
        res.status(400).json({ error: 'Driver ID is required' });
        return;
      }
      
      proximityService.removeDriver(driverId);
      res.json({ message: 'Driver removed from tracking' });
    } catch (error) {
      console.error('Failed to remove driver:', error);
      res.status(500).json({ error: 'Failed to remove driver' });
    }
  }

  /**
   * Get all driver positions
   */
  async getAllDriverPositions(req: Request, res: Response): Promise<void> {
    try {
      const positions = proximityService.getAllDriverPositions();
      res.json(positions);
    } catch (error) {
      console.error('Failed to get driver positions:', error);
      res.status(500).json({ error: 'Failed to get driver positions' });
    }
  }

  /**
   * Get driver position by ID
   */
  async getDriverPosition(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      
      if (!driverId) {
        res.status(400).json({ error: 'Driver ID is required' });
        return;
      }
      
      const position = proximityService.getDriverPosition(driverId);
      
      if (!position) {
        res.status(404).json({ error: 'Driver position not found' });
        return;
      }
      
      res.json(position);
    } catch (error) {
      console.error('Failed to get driver position:', error);
      res.status(500).json({ error: 'Failed to get driver position' });
    }
  }

  /**
   * Check proximity alerts for a specific driver
   */
  async checkProximityAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      
      if (!driverId) {
        res.status(400).json({ error: 'Driver ID is required' });
        return;
      }
      
      const alerts = proximityService.checkProximityAlerts(driverId);
      res.json(alerts);
    } catch (error) {
      console.error('Failed to check proximity alerts:', error);
      res.status(500).json({ error: 'Failed to check proximity alerts' });
    }
  }

  /**
   * Check all drivers for proximity alerts
   */
  async checkAllProximityAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = proximityService.checkAllProximityAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Failed to check all proximity alerts:', error);
      res.status(500).json({ error: 'Failed to check all proximity alerts' });
    }
  }

  /**
   * Get drivers near a specific position
   */
  async getDriversNearPosition(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng || !radius) {
        res.status(400).json({ error: 'lat, lng, and radius are required' });
        return;
      }
      
      const position = {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string),
        speed: 0,
        timestamp: Date.now()
      };
      
      const nearby = proximityService.getDriversNearPosition(
        position,
        parseFloat(radius as string)
      );
      
      res.json(nearby);
    } catch (error) {
      console.error('Failed to get drivers near position:', error);
      res.status(500).json({ error: 'Failed to get drivers near position' });
    }
  }

  /**
   * Update proximity configuration
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const newConfig: Partial<ProximityConfig> = req.body;
      
      proximityService.updateConfig(newConfig);
      const updatedConfig = proximityService.getConfig();
      
      res.json({ message: 'Configuration updated', config: updatedConfig });
    } catch (error) {
      console.error('Failed to update configuration:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }

  /**
   * Get current proximity configuration
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = proximityService.getConfig();
      res.json(config);
    } catch (error) {
      console.error('Failed to get configuration:', error);
      res.status(500).json({ error: 'Failed to get configuration' });
    }
  }

  /**
   * Clear recent alerts (for testing or reset)
   */
  async clearRecentAlerts(req: Request, res: Response): Promise<void> {
    try {
      proximityService.clearRecentAlerts();
      res.json({ message: 'Recent alerts cleared' });
    } catch (error) {
      console.error('Failed to clear recent alerts:', error);
      res.status(500).json({ error: 'Failed to clear recent alerts' });
    }
  }

  /**
   * Clean up old positions
   */
  async cleanupOldPositions(req: Request, res: Response): Promise<void> {
    try {
      const { maxAge } = req.query;
      
      if (!maxAge) {
        res.status(400).json({ error: 'maxAge is required' });
        return;
      }
      
      proximityService.cleanupOldPositions(parseInt(maxAge as string));
      res.json({ message: 'Old positions cleaned up' });
    } catch (error) {
      console.error('Failed to cleanup old positions:', error);
      res.status(500).json({ error: 'Failed to cleanup old positions' });
    }
  }
}

export const proximityController = new ProximityController();
