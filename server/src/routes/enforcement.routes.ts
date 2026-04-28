/**
 * Enforcement Routes
 * 
 * Defines HTTP routes for enforcement zone management and violation tracking
 */

import { Router } from 'express';
import { enforcementController } from '../controllers/enforcement.controller';

const router = Router();

/**
 * Enforcement Zone Management Routes
 */

// Get all enforcement zones for a route
router.get('/zones/route/:routeId', enforcementController.getZonesByRoute.bind(enforcementController));

// Get visible enforcement zones for a route
router.get('/zones/route/:routeId/visible', enforcementController.getVisibleZonesByRoute.bind(enforcementController));

// Get enforcement zones by type
router.get('/zones/route/:routeId/type/:zoneType', enforcementController.getZonesByType.bind(enforcementController));

// Get enforcement zone statistics
router.get('/zones/route/:routeId/stats', enforcementController.getZoneStats.bind(enforcementController));

// Create a new enforcement zone
router.post('/zones', enforcementController.createZone.bind(enforcementController));

// Update an enforcement zone
router.put('/zones/:id', enforcementController.updateZone.bind(enforcementController));

// Delete an enforcement zone
router.delete('/zones/:id', enforcementController.deleteZone.bind(enforcementController));

/**
 * Violation Detection Routes
 */

// Check position for speed zone violations
router.post('/check/speed-zones/:routeId', enforcementController.checkSpeedZones.bind(enforcementController));

// Check position for speed trap triggers
router.post('/check/speed-traps/:routeId', enforcementController.checkSpeedTraps.bind(enforcementController));

// Calculate penalty for a violation
router.post('/calculate-penalty', enforcementController.calculatePenalty.bind(enforcementController));

// Check for route deviation
router.post('/check/route-deviation', enforcementController.checkRouteDeviation.bind(enforcementController));

// Check for checkpoint violation
router.post('/check/checkpoint-violation', enforcementController.checkCheckpointViolation.bind(enforcementController));

/**
 * Risk Management Routes
 */

// Get risk level for a session
router.get('/risk/:routeId', enforcementController.getRiskLevel.bind(enforcementController));

// Clear violations for a session
router.delete('/violations/:routeId', enforcementController.clearViolations.bind(enforcementController));

export default router;
