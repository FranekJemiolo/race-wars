/**
 * Car Profile Controller
 * 
 * Handles HTTP requests for car profile management
 */

import { Request, Response } from 'express';
import { carProfileRepository, type CreateCarProfileInput, type UpdateCarProfileInput } from '../database/repositories/carProfile.repository';

export class CarProfileController {
  /**
   * Get all car profiles for a user
   */
  async getUserCarProfiles(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const profiles = await carProfileRepository.findByUserId(userId);
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching car profiles:', error);
      res.status(500).json({ error: 'Failed to fetch car profiles' });
    }
  }

  /**
   * Get default car profile for a user
   */
  async getDefaultCarProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const profile = await carProfileRepository.findDefaultByUserId(userId);
      
      if (!profile) {
        res.status(404).json({ error: 'No default car profile found' });
        return;
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching default car profile:', error);
      res.status(500).json({ error: 'Failed to fetch default car profile' });
    }
  }

  /**
   * Get car profile by ID
   */
  async getCarProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await carProfileRepository.findById(id);

      if (!profile) {
        res.status(404).json({ error: 'Car profile not found' });
        return;
      }

      // Check ownership
      if (profile.userId !== req.user?.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching car profile:', error);
      res.status(500).json({ error: 'Failed to fetch car profile' });
    }
  }

  /**
   * Create a new car profile
   */
  async createCarProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const input: CreateCarProfileInput = {
        ...req.body,
        userId,
      };

      // Validate required fields
      if (!input.name) {
        res.status(400).json({ error: 'Missing required field: name' });
        return;
      }

      const profile = await carProfileRepository.create(input);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Error creating car profile:', error);
      res.status(500).json({ error: 'Failed to create car profile' });
    }
  }

  /**
   * Update a car profile
   */
  async updateCarProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input: UpdateCarProfileInput = req.body;

      // Check ownership
      const existing = await carProfileRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Car profile not found' });
        return;
      }

      if (existing.userId !== req.user?.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const profile = await carProfileRepository.update(id, input);
      res.json(profile);
    } catch (error) {
      console.error('Error updating car profile:', error);
      res.status(500).json({ error: 'Failed to update car profile' });
    }
  }

  /**
   * Delete a car profile
   */
  async deleteCarProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check ownership
      const existing = await carProfileRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Car profile not found' });
        return;
      }

      if (existing.userId !== req.user?.id) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const deleted = await carProfileRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Car profile not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting car profile:', error);
      res.status(500).json({ error: 'Failed to delete car profile' });
    }
  }

  /**
   * Set a car profile as default
   */
  async setDefaultCarProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check ownership
      const existing = await carProfileRepository.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Car profile not found' });
        return;
      }

      if (existing.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const success = await carProfileRepository.setDefault(userId, id);

      if (!success) {
        res.status(404).json({ error: 'Car profile not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error setting default car profile:', error);
      res.status(500).json({ error: 'Failed to set default car profile' });
    }
  }

  /**
   * Get car profiles by class
   */
  async getCarProfilesByClass(req: Request, res: Response): Promise<void> {
    try {
      const { carClass } = req.params;
      const profiles = await carProfileRepository.findByClass(carClass);
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching car profiles by class:', error);
      res.status(500).json({ error: 'Failed to fetch car profiles' });
    }
  }
}

export const carProfileController = new CarProfileController();
