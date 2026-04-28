/**
 * Sector Flag Routes
 * 
 * Defines HTTP routes for sector-based flag management
 */

import { Router } from 'express';
import { sectorFlagController } from '../controllers/sectorFlag.controller';

const router = Router();

/**
 * Sector Management Routes
 */

// Initialize sectors for a track
router.post('/sectors/initialize', sectorFlagController.initializeSectors.bind(sectorFlagController));

// Get all sectors
router.get('/sectors', sectorFlagController.getSectors.bind(sectorFlagController));

// Get sector by ID
router.get('/sectors/:sectorId', sectorFlagController.getSector.bind(sectorFlagController));

/**
 * Flag State Routes
 */

// Get flag state for a sector
router.get('/flags/sector/:sectorId', sectorFlagController.getSectorFlag.bind(sectorFlagController));

// Get all sector flag states
router.get('/flags', sectorFlagController.getAllSectorFlags.bind(sectorFlagController));

// Set flag for a specific sector
router.put('/flags/sector/:sectorId', sectorFlagController.setSectorFlag.bind(sectorFlagController));

// Get flag for a specific position on track
router.get('/flags/position/:distanceMeters', sectorFlagController.getFlagAtPosition.bind(sectorFlagController));

// Get sector by position
router.get('/sectors/position/:distanceMeters', sectorFlagController.getSectorAtPosition.bind(sectorFlagController));

// Clear all flags (reset to green)
router.post('/flags/clear', sectorFlagController.clearAllFlags.bind(sectorFlagController));

/**
 * Flag History and Status Routes
 */

// Get flag history
router.get('/flags/history', sectorFlagController.getFlagHistory.bind(sectorFlagController));

// Get active yellow flag sectors
router.get('/flags/yellow-sectors', sectorFlagController.getYellowFlagSectors.bind(sectorFlagController));

// Get active red flag sectors
router.get('/flags/red-sectors', sectorFlagController.getRedFlagSectors.bind(sectorFlagController));

// Check if any sector has a specific flag
router.get('/flags/has/:flag', sectorFlagController.hasFlag.bind(sectorFlagController));

// Get overall track status flag
router.get('/flags/overall-status', sectorFlagController.getOverallTrackStatus.bind(sectorFlagController));

/**
 * Driver-Specific Flag Routes
 */

// Set blue flag for a specific driver
router.post('/flags/blue', sectorFlagController.setBlueFlagForDriver.bind(sectorFlagController));

export default router;
