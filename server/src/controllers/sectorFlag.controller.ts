/**
 * Sector Flag Controller
 * 
 * Handles HTTP requests for sector-based flag management
 */

import { Request, Response } from 'express';
import { sectorFlagService } from '../services/sectorFlag.service';
import type { Sector, FlagType } from '../services/sectorFlag.service';

export class SectorFlagController {
  /**
   * Initialize sectors for a track
   */
  async initializeSectors(req: Request, res: Response): Promise<void> {
    try {
      const { sectors } = req.body;
      
      if (!sectors || !Array.isArray(sectors)) {
        res.status(400).json({ error: 'sectors array is required' });
        return;
      }
      
      sectorFlagService.initializeSectors(sectors);
      res.json({ message: 'Sectors initialized successfully', sectors });
    } catch (error) {
      console.error('Failed to initialize sectors:', error);
      res.status(500).json({ error: 'Failed to initialize sectors' });
    }
  }

  /**
   * Get all sectors
   */
  async getSectors(req: Request, res: Response): Promise<void> {
    try {
      const sectors = sectorFlagService.getSectors();
      res.json(sectors);
    } catch (error) {
      console.error('Failed to get sectors:', error);
      res.status(500).json({ error: 'Failed to get sectors' });
    }
  }

  /**
   * Get sector by ID
   */
  async getSector(req: Request, res: Response): Promise<void> {
    try {
      const { sectorId } = req.params;
      
      if (!sectorId) {
        res.status(400).json({ error: 'Sector ID is required' });
        return;
      }
      
      const sector = sectorFlagService.getSector(sectorId);
      
      if (!sector) {
        res.status(404).json({ error: 'Sector not found' });
        return;
      }
      
      res.json(sector);
    } catch (error) {
      console.error('Failed to get sector:', error);
      res.status(500).json({ error: 'Failed to get sector' });
    }
  }

  /**
   * Get flag state for a sector
   */
  async getSectorFlag(req: Request, res: Response): Promise<void> {
    try {
      const { sectorId } = req.params;
      
      if (!sectorId) {
        res.status(400).json({ error: 'Sector ID is required' });
        return;
      }
      
      const flagState = sectorFlagService.getSectorFlag(sectorId);
      
      if (!flagState) {
        res.status(404).json({ error: 'Sector flag state not found' });
        return;
      }
      
      res.json(flagState);
    } catch (error) {
      console.error('Failed to get sector flag:', error);
      res.status(500).json({ error: 'Failed to get sector flag' });
    }
  }

  /**
   * Get all sector flag states
   */
  async getAllSectorFlags(req: Request, res: Response): Promise<void> {
    try {
      const flags = sectorFlagService.getAllSectorFlags();
      res.json(flags);
    } catch (error) {
      console.error('Failed to get all sector flags:', error);
      res.status(500).json({ error: 'Failed to get all sector flags' });
    }
  }

  /**
   * Set flag for a specific sector
   */
  async setSectorFlag(req: Request, res: Response): Promise<void> {
    try {
      const { sectorId } = req.params;
      const { flag, reason, updatedBy, propagate } = req.body;
      
      if (!sectorId || !flag) {
        res.status(400).json({ error: 'sectorId and flag are required' });
        return;
      }
      
      const changes = sectorFlagService.setSectorFlag(
        sectorId,
        flag as FlagType,
        reason,
        updatedBy,
        propagate !== false
      );
      
      res.json({ changes });
    } catch (error) {
      console.error('Failed to set sector flag:', error);
      res.status(500).json({ error: 'Failed to set sector flag' });
    }
  }

  /**
   * Get flag for a specific position on track
   */
  async getFlagAtPosition(req: Request, res: Response): Promise<void> {
    try {
      const { distanceMeters } = req.params;
      
      if (distanceMeters === undefined) {
        res.status(400).json({ error: 'distanceMeters is required' });
        return;
      }
      
      const flag = sectorFlagService.getFlagAtPosition(parseFloat(distanceMeters));
      res.json({ flag });
    } catch (error) {
      console.error('Failed to get flag at position:', error);
      res.status(500).json({ error: 'Failed to get flag at position' });
    }
  }

  /**
   * Get sector by position
   */
  async getSectorAtPosition(req: Request, res: Response): Promise<void> {
    try {
      const { distanceMeters } = req.params;
      
      if (distanceMeters === undefined) {
        res.status(400).json({ error: 'distanceMeters is required' });
        return;
      }
      
      const sector = sectorFlagService.getSectorAtPosition(parseFloat(distanceMeters));
      
      if (!sector) {
        res.status(404).json({ error: 'No sector found at position' });
        return;
      }
      
      res.json(sector);
    } catch (error) {
      console.error('Failed to get sector at position:', error);
      res.status(500).json({ error: 'Failed to get sector at position' });
    }
  }

  /**
   * Clear all flags (reset to green)
   */
  async clearAllFlags(req: Request, res: Response): Promise<void> {
    try {
      const { updatedBy } = req.body;
      const changes = sectorFlagService.clearAllFlags(updatedBy);
      res.json({ changes });
    } catch (error) {
      console.error('Failed to clear all flags:', error);
      res.status(500).json({ error: 'Failed to clear all flags' });
    }
  }

  /**
   * Get flag history
   */
  async getFlagHistory(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const history = sectorFlagService.getFlagHistory(limit ? parseInt(limit as string) : 100);
      res.json(history);
    } catch (error) {
      console.error('Failed to get flag history:', error);
      res.status(500).json({ error: 'Failed to get flag history' });
    }
  }

  /**
   * Get active yellow flag sectors
   */
  async getYellowFlagSectors(req: Request, res: Response): Promise<void> {
    try {
      const sectors = sectorFlagService.getYellowFlagSectors();
      res.json(sectors);
    } catch (error) {
      console.error('Failed to get yellow flag sectors:', error);
      res.status(500).json({ error: 'Failed to get yellow flag sectors' });
    }
  }

  /**
   * Get active red flag sectors
   */
  async getRedFlagSectors(req: Request, res: Response): Promise<void> {
    try {
      const sectors = sectorFlagService.getRedFlagSectors();
      res.json(sectors);
    } catch (error) {
      console.error('Failed to get red flag sectors:', error);
      res.status(500).json({ error: 'Failed to get red flag sectors' });
    }
  }

  /**
   * Check if any sector has a specific flag
   */
  async hasFlag(req: Request, res: Response): Promise<void> {
    try {
      const { flag } = req.params;
      
      if (!flag) {
        res.status(400).json({ error: 'Flag type is required' });
        return;
      }
      
      const hasFlag = sectorFlagService.hasFlag(flag as FlagType);
      res.json({ hasFlag });
    } catch (error) {
      console.error('Failed to check flag:', error);
      res.status(500).json({ error: 'Failed to check flag' });
    }
  }

  /**
   * Get overall track status flag
   */
  async getOverallTrackStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = sectorFlagService.getOverallTrackStatus();
      res.json({ status });
    } catch (error) {
      console.error('Failed to get overall track status:', error);
      res.status(500).json({ error: 'Failed to get overall track status' });
    }
  }

  /**
   * Set blue flag for a specific driver
   */
  async setBlueFlagForDriver(req: Request, res: Response): Promise<void> {
    try {
      const { driverId, sectorId, reason } = req.body;
      
      if (!driverId || !sectorId) {
        res.status(400).json({ error: 'driverId and sectorId are required' });
        return;
      }
      
      const change = sectorFlagService.setBlueFlagForDriver(driverId, sectorId, reason);
      res.json(change);
    } catch (error) {
      console.error('Failed to set blue flag for driver:', error);
      res.status(500).json({ error: 'Failed to set blue flag for driver' });
    }
  }
}

export const sectorFlagController = new SectorFlagController();
