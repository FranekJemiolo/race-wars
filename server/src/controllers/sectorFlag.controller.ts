/**
 * Sector Flag Controller
 * 
 * Handles HTTP requests for sector-based flag management
 */

import { Request, Response } from 'express';
import { sectorFlagService } from '../services/sectorFlag.service';
import type { MarshalZone } from '../services/sectorFlag.service';
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

  /**
   * Initialize marshal zones for a track
   */
  async initializeMarshalZones(req: Request, res: Response): Promise<void> {
    try {
      const { zones } = req.body;
      
      if (!zones || !Array.isArray(zones)) {
        res.status(400).json({ error: 'zones array is required' });
        return;
      }
      
      sectorFlagService.initializeMarshalZones(zones);
      res.json({ message: 'Marshal zones initialized successfully', zones });
    } catch (error) {
      console.error('Failed to initialize marshal zones:', error);
      res.status(500).json({ error: 'Failed to initialize marshal zones' });
    }
  }

  /**
   * Get all marshal zones
   */
  async getMarshalZones(req: Request, res: Response): Promise<void> {
    try {
      const zones = sectorFlagService.getMarshalZones();
      res.json(zones);
    } catch (error) {
      console.error('Failed to get marshal zones:', error);
      res.status(500).json({ error: 'Failed to get marshal zones' });
    }
  }

  /**
   * Get marshal zone by ID
   */
  async getMarshalZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;
      
      if (!zoneId) {
        res.status(400).json({ error: 'Zone ID is required' });
        return;
      }
      
      const zone = sectorFlagService.getMarshalZone(zoneId);
      
      if (!zone) {
        res.status(404).json({ error: 'Marshal zone not found' });
        return;
      }
      
      res.json(zone);
    } catch (error) {
      console.error('Failed to get marshal zone:', error);
      res.status(500).json({ error: 'Failed to get marshal zone' });
    }
  }

  /**
   * Get marshal zones for a sector
   */
  async getMarshalZonesForSector(req: Request, res: Response): Promise<void> {
    try {
      const { sectorId } = req.params;
      
      if (!sectorId) {
        res.status(400).json({ error: 'Sector ID is required' });
        return;
      }
      
      const zones = sectorFlagService.getMarshalZonesForSector(sectorId);
      res.json(zones);
    } catch (error) {
      console.error('Failed to get marshal zones for sector:', error);
      res.status(500).json({ error: 'Failed to get marshal zones for sector' });
    }
  }

  /**
   * Activate a marshal zone
   */
  async activateMarshalZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;
      
      if (!zoneId) {
        res.status(400).json({ error: 'Zone ID is required' });
        return;
      }
      
      sectorFlagService.activateMarshalZone(zoneId);
      res.json({ message: 'Marshal zone activated' });
    } catch (error) {
      console.error('Failed to activate marshal zone:', error);
      res.status(500).json({ error: 'Failed to activate marshal zone' });
    }
  }

  /**
   * Deactivate a marshal zone
   */
  async deactivateMarshalZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;
      
      if (!zoneId) {
        res.status(400).json({ error: 'Zone ID is required' });
        return;
      }
      
      sectorFlagService.deactivateMarshalZone(zoneId);
      res.json({ message: 'Marshal zone deactivated' });
    } catch (error) {
      console.error('Failed to deactivate marshal zone:', error);
      res.status(500).json({ error: 'Failed to deactivate marshal zone' });
    }
  }

  /**
   * Get nearest marshal zone to a position
   */
  async getNearestMarshalZone(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        res.status(400).json({ error: 'lat and lng are required' });
        return;
      }
      
      const zone = sectorFlagService.getNearestMarshalZone(parseFloat(lat as string), parseFloat(lng as string));
      
      if (!zone) {
        res.status(404).json({ error: 'No active marshal zone found' });
        return;
      }
      
      res.json(zone);
    } catch (error) {
      console.error('Failed to get nearest marshal zone:', error);
      res.status(500).json({ error: 'Failed to get nearest marshal zone' });
    }
  }

  /**
   * Report incident to marshal zone
   */
  async reportIncidentToMarshalZone(req: Request, res: Response): Promise<void> {
    try {
      const { zoneId } = req.params;
      const { incident } = req.body;
      
      if (!zoneId || !incident) {
        res.status(400).json({ error: 'zoneId and incident are required' });
        return;
      }
      
      sectorFlagService.reportIncidentToMarshalZone(zoneId, incident);
      res.json({ message: 'Incident reported to marshal zone' });
    } catch (error) {
      console.error('Failed to report incident to marshal zone:', error);
      res.status(500).json({ error: 'Failed to report incident to marshal zone' });
    }
  }

  /**
   * Get marshal zone status summary
   */
  async getMarshalZoneStatusSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = sectorFlagService.getMarshalZoneStatusSummary();
      res.json(summary);
    } catch (error) {
      console.error('Failed to get marshal zone status summary:', error);
      res.status(500).json({ error: 'Failed to get marshal zone status summary' });
    }
  }
}

export const sectorFlagController = new SectorFlagController();
