/**
 * Incident Routes
 */

import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All incident routes require authentication
router.use(authenticateToken);

// Get incidents
router.get('/session/:sessionId', incidentController.getSessionIncidents.bind(incidentController));
router.get('/participant/:participantId', incidentController.getParticipantIncidents.bind(incidentController));
router.get('/unresolved', incidentController.getUnresolvedIncidents.bind(incidentController));
router.get('/type/:type', incidentController.getIncidentsByType.bind(incidentController));
router.get('/severity/:severity', incidentController.getIncidentsBySeverity.bind(incidentController));
router.post('/tags', incidentController.getIncidentsByTags.bind(incidentController));
router.get('/nearby', incidentController.getNearbyIncidents.bind(incidentController));
router.get('/:id', incidentController.getIncident.bind(incidentController));

// Create incident
router.post('/', incidentController.createIncident.bind(incidentController));

// Update incident
router.put('/:id', incidentController.updateIncident.bind(incidentController));
router.patch('/:id/resolve', incidentController.resolveIncident.bind(incidentController));

// Delete incident
router.delete('/:id', incidentController.deleteIncident.bind(incidentController));

// Detection configuration
router.get('/config/detection', incidentController.getDetectionConfig.bind(incidentController));
router.put('/config/detection', incidentController.updateDetectionConfig.bind(incidentController));

export default router;
