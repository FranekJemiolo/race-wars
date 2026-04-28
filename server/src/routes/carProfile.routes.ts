/**
 * Car Profile Routes
 */

import { Router } from 'express';
import { carProfileController } from '../controllers/carProfile.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All car profile routes require authentication
router.use(authenticateToken);

// Get car profiles
router.get('/', carProfileController.getUserCarProfiles.bind(carProfileController));
router.get('/default', carProfileController.getDefaultCarProfile.bind(carProfileController));
router.get('/class/:carClass', carProfileController.getCarProfilesByClass.bind(carProfileController));
router.get('/:id', carProfileController.getCarProfile.bind(carProfileController));

// Create car profile
router.post('/', carProfileController.createCarProfile.bind(carProfileController));

// Update car profile
router.put('/:id', carProfileController.updateCarProfile.bind(carProfileController));

// Set as default
router.patch('/:id/default', carProfileController.setDefaultCarProfile.bind(carProfileController));

// Delete car profile
router.delete('/:id', carProfileController.deleteCarProfile.bind(carProfileController));

export default router;
