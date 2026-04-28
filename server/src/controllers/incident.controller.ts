/**
 * Incident Controller
 * 
 * Handles HTTP requests for incident management
 */

import { Request, Response } from 'express';
import { incidentRepository, type CreateIncidentInput, type UpdateIncidentInput } from '../database/repositories/incident.repository';
import { getIncidentDetectionService } from '../services/incidentDetection.service';

export class IncidentController {
  /**
   * Get all incidents for a session
   */
  async getSessionIncidents(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const incidents = await incidentRepository.findBySessionId(sessionId, limit, offset);
      const stats = await incidentRepository.getIncidentStats(sessionId);

      res.json({
        incidents,
        stats,
        pagination: {
          limit,
          offset,
          total: stats.total,
        },
      });
    } catch (error) {
      console.error('Error fetching session incidents:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get incidents for a participant
   */
  async getParticipantIncidents(req: Request, res: Response): Promise<void> {
    try {
      const { participantId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const incidents = await incidentRepository.findByParticipantId(participantId, limit, offset);

      res.json({
        incidents,
        pagination: {
          limit,
          offset,
          total: incidents.length,
        },
      });
    } catch (error) {
      console.error('Error fetching participant incidents:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get unresolved incidents
   */
  async getUnresolvedIncidents(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const incidents = await incidentRepository.findUnresolved(limit, offset);

      res.json({
        incidents,
        pagination: {
          limit,
          offset,
          total: incidents.length,
        },
      });
    } catch (error) {
      console.error('Error fetching unresolved incidents:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get incident by ID
   */
  async getIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const incident = await incidentRepository.findById(id);

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      res.json(incident);
    } catch (error) {
      console.error('Error fetching incident:', error);
      res.status(500).json({ error: 'Failed to fetch incident' });
    }
  }

  /**
   * Create a new incident
   */
  async createIncident(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateIncidentInput = req.body;

      // Validate required fields
      if (!input.sessionId || !input.type || !input.severity) {
        res.status(400).json({ error: 'Missing required fields: sessionId, type, severity' });
        return;
      }

      const incident = await incidentRepository.create({
        ...input,
        reportedBy: req.user?.id || 'manual',
      });

      res.status(201).json(incident);
    } catch (error) {
      console.error('Error creating incident:', error);
      res.status(500).json({ error: 'Failed to create incident' });
    }
  }

  /**
   * Update an incident (typically to resolve it)
   */
  async updateIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const input: UpdateIncidentInput = req.body;

      const incident = await incidentRepository.update(id, {
        ...input,
        resolvedBy: req.user?.id,
      });

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      res.json(incident);
    } catch (error) {
      console.error('Error updating incident:', error);
      res.status(500).json({ error: 'Failed to update incident' });
    }
  }

  /**
   * Resolve an incident
   */
  async resolveIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;

      const incident = await incidentRepository.update(id, {
        resolvedAt: new Date(),
        resolvedBy: req.user?.id,
        resolutionNotes,
      });

      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      res.json(incident);
    } catch (error) {
      console.error('Error resolving incident:', error);
      res.status(500).json({ error: 'Failed to resolve incident' });
    }
  }

  /**
   * Delete an incident
   */
  async deleteIncident(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await incidentRepository.delete(id);

      if (!deleted) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting incident:', error);
      res.status(500).json({ error: 'Failed to delete incident' });
    }
  }

  /**
   * Get incidents by type
   */
  async getIncidentsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const incidents = await incidentRepository.findByType(type, limit, offset);

      res.json({
        incidents,
        pagination: {
          limit,
          offset,
          total: incidents.length,
        },
      });
    } catch (error) {
      console.error('Error fetching incidents by type:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get incidents by severity
   */
  async getIncidentsBySeverity(req: Request, res: Response): Promise<void> {
    try {
      const { severity } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const incidents = await incidentRepository.findBySeverity(severity, limit, offset);

      res.json({
        incidents,
        pagination: {
          limit,
          offset,
          total: incidents.length,
        },
      });
    } catch (error) {
      console.error('Error fetching incidents by severity:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get incidents by tags
   */
  async getIncidentsByTags(req: Request, res: Response): Promise<void> {
    try {
      const { tags } = req.body;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!Array.isArray(tags) || tags.length === 0) {
        res.status(400).json({ error: 'Tags must be a non-empty array' });
        return;
      }

      const incidents = await incidentRepository.findByTags(tags, limit, offset);

      res.json({
        incidents,
        pagination: {
          limit,
          offset,
          total: incidents.length,
        },
      });
    } catch (error) {
      console.error('Error fetching incidents by tags:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Get nearby incidents
   */
  async getNearbyIncidents(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng } = req.query;
      const radius = parseInt(req.query.radius as string) || 1000;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!lat || !lng) {
        res.status(400).json({ error: 'Missing required parameters: lat, lng' });
        return;
      }

      const incidents = await incidentRepository.findNearby(
        parseFloat(lat as string),
        parseFloat(lng as string),
        radius,
        limit
      );

      res.json({
        incidents,
        pagination: {
          limit,
          offset: 0,
          total: incidents.length,
        },
      });
    } catch (error) {
      console.error('Error fetching nearby incidents:', error);
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  }

  /**
   * Update incident detection configuration
   */
  async updateDetectionConfig(req: Request, res: Response): Promise<void> {
    try {
      const service = getIncidentDetectionService();
      service.updateConfig(req.body);

      res.json({
        config: service.getConfig(),
      });
    } catch (error) {
      console.error('Error updating detection config:', error);
      res.status(500).json({ error: 'Failed to update config' });
    }
  }

  /**
   * Get incident detection configuration
   */
  async getDetectionConfig(req: Request, res: Response): Promise<void> {
    try {
      const service = getIncidentDetectionService();
      res.json({
        config: service.getConfig(),
      });
    } catch (error) {
      console.error('Error fetching detection config:', error);
      res.status(500).json({ error: 'Failed to fetch config' });
    }
  }
}

export const incidentController = new IncidentController();
