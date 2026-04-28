import { pool } from '../index';

export interface Incident {
  id: string;
  sessionId: string;
  participantId?: string;
  type: 'off_track' | 'crash' | 'debris' | 'mechanical' | 'collision' | 'spin' | 'stall' | 'other';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  locationLat?: number;
  locationLng?: number;
  locationGeometry?: string;
  description?: string;
  reportedBy?: string;
  reportedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  tags?: string[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncidentInput {
  sessionId: string;
  participantId?: string;
  type: 'off_track' | 'crash' | 'debris' | 'mechanical' | 'collision' | 'spin' | 'stall' | 'other';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  locationLat?: number;
  locationLng?: number;
  description?: string;
  reportedBy?: string;
  tags?: string[];
  metadata?: any;
}

export interface UpdateIncidentInput {
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  tags?: string[];
  metadata?: any;
}

export class IncidentRepository {
  async create(input: CreateIncidentInput): Promise<Incident> {
    const result = await pool.query(
      `INSERT INTO incidents (session_id, participant_id, type, severity, location_lat, location_lng, location_geometry, description, reported_by, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326), $7, $8, $9, $10)
       RETURNING *`,
      [
        input.sessionId,
        input.participantId || null,
        input.type,
        input.severity,
        input.locationLat || null,
        input.locationLng || null,
        input.description || null,
        input.reportedBy || null,
        input.tags || null,
        input.metadata ? JSON.stringify(input.metadata) : null
      ]
    );

    return this.mapRowToIncident(result.rows[0]);
  }

  async findById(id: string): Promise<Incident | null> {
    const result = await pool.query(
      `SELECT * FROM incidents WHERE id = $1`,
      [id]
    );

    return result.rows.length > 0 ? this.mapRowToIncident(result.rows[0]) : null;
  }

  async findBySessionId(sessionId: string, limit = 50, offset = 0): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE session_id = $1 
       ORDER BY reported_at DESC 
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    return result.rows.map(row => this.mapRowToIncident(row));
  }

  async findByParticipantId(participantId: string, limit = 50, offset = 0): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE participant_id = $1 
       ORDER BY reported_at DESC 
       LIMIT $2 OFFSET $3`,
      [participantId, limit, offset]
    );

    return result.rows.map(row => this.mapRowToIncident(row));
  }

  async findByType(type: string, limit = 50, offset = 0): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE type = $1 
       ORDER BY reported_at DESC 
       LIMIT $2 OFFSET $3`,
      [type, limit, offset]
    );

    return result.rows.map(row => this.mapRowToIncident(row));
  }

  async findBySeverity(severity: string, limit = 50, offset = 0): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE severity = $1 
       ORDER BY reported_at DESC 
       LIMIT $2 OFFSET $3`,
      [severity, limit, offset]
    );

    return result.rows.map(row => this.mapRowToIncident(row));
  }

  async findUnresolved(limit = 50, offset = 0): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE resolved_at IS NULL 
       ORDER BY reported_at DESC 
       LIMIT $2 OFFSET $3`,
      [limit, offset]
    );

    return result.rows.map(row => this.mapRowToIncident(row));
  }

  async findByTags(tags: string[], limit = 50, offset = 0): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE tags && $1 
       ORDER BY reported_at DESC 
       LIMIT $2 OFFSET $3`,
      [tags, limit, offset]
    );

    return result.rows.map(row => this.mapRowToIncident(row));
  }

  async findNearby(lat: number, lng: number, radiusMeters = 1000, limit = 50): Promise<Incident[]> {
    const result = await pool.query(
      `SELECT * FROM incidents 
       WHERE ST_DWithin(location_geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)
       ORDER BY reported_at DESC 
       LIMIT $4`,
      [lng, lat, radiusMeters, limit]
    );

    return result.rows.map(row => this.mapRowToIncident(row));
  }

  async update(id: string, input: UpdateIncidentInput): Promise<Incident | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.resolvedAt !== undefined) {
      updates.push(`resolved_at = $${paramIndex++}`);
      values.push(input.resolvedAt);
    }
    if (input.resolvedBy !== undefined) {
      updates.push(`resolved_by = $${paramIndex++}`);
      values.push(input.resolvedBy);
    }
    if (input.resolutionNotes !== undefined) {
      updates.push(`resolution_notes = $${paramIndex++}`);
      values.push(input.resolutionNotes);
    }
    if (input.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(input.tags);
    }
    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(input.metadata));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE incidents 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.mapRowToIncident(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM incidents WHERE id = $1`,
      [id]
    );

    return (result.rowCount || 0) > 0;
  }

  async getIncidentStats(sessionId: string): Promise<{
    total: number;
    unresolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE resolved_at IS NULL) as unresolved,
         json_object_agg(type, type_count) as by_type,
         json_object_agg(severity, severity_count) as by_severity
       FROM incidents 
       CROSS JOIN (SELECT type, COUNT(*) as type_count FROM incidents WHERE session_id = $1 GROUP BY type) type_counts
       CROSS JOIN (SELECT severity, COUNT(*) as severity_count FROM incidents WHERE session_id = $1 GROUP BY severity) severity_counts
       WHERE session_id = $1`,
      [sessionId]
    );

    const row = result.rows[0];
    return {
      total: parseInt(row.total),
      unresolved: parseInt(row.unresolved),
      byType: row.by_type || {},
      bySeverity: row.by_severity || {}
    };
  }

  private mapRowToIncident(row: any): Incident {
    return {
      id: row.id,
      sessionId: row.session_id,
      participantId: row.participant_id,
      type: row.type,
      severity: row.severity,
      locationLat: row.location_lat,
      locationLng: row.location_lng,
      locationGeometry: row.location_geometry,
      description: row.description,
      reportedBy: row.reported_by,
      reportedAt: row.reported_at,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by,
      resolutionNotes: row.resolution_notes,
      tags: row.tags,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const incidentRepository = new IncidentRepository();
