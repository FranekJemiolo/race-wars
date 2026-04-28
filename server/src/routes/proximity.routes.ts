/**
 * Proximity Detection Routes
 * 
 * Defines HTTP routes for proximity detection and safety alerts
 */

import { Router } from 'express';
import { proximityController } from '../controllers/proximity.controller';

const router = Router();

/**
 * Driver Position Routes
 */

// Update driver position
router.post('/positions', proximityController.updateDriverPosition.bind(proximityController));

// Remove driver from tracking
router.delete('/positions/:driverId', proximityController.removeDriver.bind(proximityController));

// Get all driver positions
router.get('/positions', proximityController.getAllDriverPositions.bind(proximityController));

// Get driver position by ID
router.get('/positions/:driverId', proximityController.getDriverPosition.bind(proximityController));

/**
 * Proximity Alert Routes
 */

// Check proximity alerts for a specific driver
router.get('/alerts/:driverId', proximityController.checkProximityAlerts.bind(proximityController));

// Check all drivers for proximity alerts
router.get('/alerts', proximityController.checkAllProximityAlerts.bind(proximityController));

/**
 * Query Routes
 */

// Get drivers near a specific position
router.get('/nearby', proximityController.getDriversNearPosition.bind(proximityController));

/**
 * Configuration Routes
 */

// Update proximity configuration
router.put('/config', proximityController.updateConfig.bind(proximityController));

// Get current proximity configuration
router.get('/config', proximityController.getConfig.bind(proximityController));

/**
 * Maintenance Routes
 */

// Clear recent alerts (for testing or reset)
router.post('/alerts/clear', proximityController.clearRecentAlerts.bind(proximityController));

// Clean up old positions
router.post('/positions/cleanup', proximityController.cleanupOldPositions.bind(proximityController));

export default router;
