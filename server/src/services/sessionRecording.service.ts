/**
 * Session Recording Service
 * 
 * Handles recording of session data for later playback:
 * - Position data recording
 * - Event recording (incidents, flags, penalties)
 * - Recording control (start, stop, pause)
 * - Recording storage and retrieval
 * - Export functionality
 */

import { pool } from '../database';

export interface RecordingSession {
  id: string;
  sessionId: string;
  name: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'recording' | 'paused' | 'completed' | 'failed';
  duration?: number;
  dataSize?: number;
  participantCount: number;
  metadata?: any;
}

export interface RecordedPosition {
  id: string;
  recordingId: string;
  participantId: string;
  timestamp: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
}

export interface RecordedEvent {
  id: string;
  recordingId: string;
  type: 'incident' | 'flag_change' | 'penalty' | 'checkpoint' | 'session_start' | 'session_end';
  timestamp: number;
  data: any;
}

export interface RecordingConfig {
  recordPositions: boolean;
  recordEvents: boolean;
  positionInterval: number; // milliseconds
  compressionEnabled: boolean;
  maxDuration: number; // milliseconds
  maxDataSize: number; // bytes
}

const DEFAULT_CONFIG: RecordingConfig = {
  recordPositions: true,
  recordEvents: true,
  positionInterval: 1000, // 1 second
  compressionEnabled: true,
  maxDuration: 7200000, // 2 hours
  maxDataSize: 1073741824, // 1GB
};

export class SessionRecordingService {
  private config: RecordingConfig;
  private activeRecordings: Map<string, RecordingSession> = new Map();
  private positionBuffers: Map<string, RecordedPosition[]> = new Map();
  private eventBuffers: Map<string, RecordedEvent[]> = new Map();
  private flushIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<RecordingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start recording a session
   */
  async startRecording(sessionId: string, name: string, participantCount: number): Promise<RecordingSession> {
    const recordingId = `rec_${Date.now()}_${sessionId}`;
    
    const recording: RecordingSession = {
      id: recordingId,
      sessionId,
      name,
      startedAt: new Date(),
      status: 'recording',
      participantCount,
    };

    // Save to database
    await pool.query(
      `INSERT INTO session_recordings (id, session_id, name, started_at, status, participant_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recordingId, sessionId, name, recording.startedAt, recording.status, participantCount]
    );

    this.activeRecordings.set(recordingId, recording);
    this.positionBuffers.set(recordingId, []);
    this.eventBuffers.set(recordingId, []);

    // Start periodic flush
    this.startFlushInterval(recordingId);

    return recording;
  }

  /**
   * Stop recording a session
   */
  async stopRecording(recordingId: string): Promise<RecordingSession | null> {
    const recording = this.activeRecordings.get(recordingId);
    if (!recording) return null;

    // Flush remaining data
    await this.flushBuffers(recordingId);

    // Update recording
    recording.endedAt = new Date();
    recording.status = 'completed';
    recording.duration = recording.endedAt.getTime() - recording.startedAt.getTime();

    await pool.query(
      `UPDATE session_recordings 
       SET ended_at = $1, status = $2, duration = $3
       WHERE id = $4`,
      [recording.endedAt, recording.status, recording.duration, recordingId]
    );

    // Clear intervals
    const interval = this.flushIntervals.get(recordingId);
    if (interval) {
      clearInterval(interval);
      this.flushIntervals.delete(recordingId);
    }

    // Clear buffers
    this.positionBuffers.delete(recordingId);
    this.eventBuffers.delete(recordingId);
    this.activeRecordings.delete(recordingId);

    return recording;
  }

  /**
   * Pause recording
   */
  async pauseRecording(recordingId: string): Promise<boolean> {
    const recording = this.activeRecordings.get(recordingId);
    if (!recording) return false;

    recording.status = 'paused';

    await pool.query(
      `UPDATE session_recordings SET status = $1 WHERE id = $2`,
      ['paused', recordingId]
    );

    return true;
  }

  /**
   * Resume recording
   */
  async resumeRecording(recordingId: string): Promise<boolean> {
    const recording = this.activeRecordings.get(recordingId);
    if (!recording) return false;

    recording.status = 'recording';

    await pool.query(
      `UPDATE session_recordings SET status = $1 WHERE id = $2`,
      ['recording', recordingId]
    );

    return true;
  }

  /**
   * Record a position update
   */
  async recordPosition(recordingId: string, position: {
    participantId: string;
    timestamp: number;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
  }): Promise<void> {
    const recording = this.activeRecordings.get(recordingId);
    if (!recording || recording.status !== 'recording') return;
    if (!this.config.recordPositions) return;

    const recordedPosition: RecordedPosition = {
      id: `pos_${Date.now()}_${position.participantId}`,
      recordingId,
      ...position,
    };

    const buffer = this.positionBuffers.get(recordingId);
    if (buffer) {
      buffer.push(recordedPosition);

      // Flush if buffer is too large
      if (buffer.length >= 100) {
        await this.flushPositionBuffer(recordingId);
      }
    }
  }

  /**
   * Record an event
   */
  async recordEvent(recordingId: string, event: {
    type: 'incident' | 'flag_change' | 'penalty' | 'checkpoint' | 'session_start' | 'session_end';
    timestamp: number;
    data: any;
  }): Promise<void> {
    const recording = this.activeRecordings.get(recordingId);
    if (!recording || recording.status !== 'recording') return;
    if (!this.config.recordEvents) return;

    const recordedEvent: RecordedEvent = {
      id: `evt_${Date.now()}_${event.type}`,
      recordingId,
      ...event,
    };

    const buffer = this.eventBuffers.get(recordingId);
    if (buffer) {
      buffer.push(recordedEvent);

      // Flush if buffer is too large
      if (buffer.length >= 50) {
        await this.flushEventBuffer(recordingId);
      }
    }
  }

  /**
   * Get recording data for playback
   */
  async getRecordingData(recordingId: string): Promise<{
    recording: RecordingSession;
    positions: RecordedPosition[];
    events: RecordedEvent[];
  } | null> {
    // Get recording info
    const recordingResult = await pool.query(
      `SELECT * FROM session_recordings WHERE id = $1`,
      [recordingId]
    );

    if (recordingResult.rows.length === 0) return null;

    const recording = this.mapRowToRecording(recordingResult.rows[0]);

    // Get positions
    const positionsResult = await pool.query(
      `SELECT * FROM recorded_positions WHERE recording_id = $1 ORDER BY timestamp`,
      [recordingId]
    );

    const positions = positionsResult.rows.map(row => this.mapRowToPosition(row));

    // Get events
    const eventsResult = await pool.query(
      `SELECT * FROM recorded_events WHERE recording_id = $1 ORDER BY timestamp`,
      [recordingId]
    );

    const events = eventsResult.rows.map(row => this.mapRowToEvent(row));

    return { recording, positions, events };
  }

  /**
   * Get all recordings for a session
   */
  async getSessionRecordings(sessionId: string): Promise<RecordingSession[]> {
    const result = await pool.query(
      `SELECT * FROM session_recordings WHERE session_id = $1 ORDER BY started_at DESC`,
      [sessionId]
    );

    return result.rows.map(row => this.mapRowToRecording(row));
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<boolean> {
    await pool.query('DELETE FROM recorded_positions WHERE recording_id = $1', [recordingId]);
    await pool.query('DELETE FROM recorded_events WHERE recording_id = $1', [recordingId]);
    const result = await pool.query('DELETE FROM session_recordings WHERE id = $1', [recordingId]);

    return (result.rowCount || 0) > 0;
  }

  /**
   * Export recording as JSON
   */
  async exportRecording(recordingId: string): Promise<string | null> {
    const data = await this.getRecordingData(recordingId);
    if (!data) return null;

    return JSON.stringify(data, null, 2);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RecordingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): RecordingConfig {
    return { ...this.config };
  }

  private startFlushInterval(recordingId: string): void {
    const interval = setInterval(() => {
      this.flushBuffers(recordingId);
    }, 5000); // Flush every 5 seconds

    this.flushIntervals.set(recordingId, interval);
  }

  private async flushBuffers(recordingId: string): Promise<void> {
    await this.flushPositionBuffer(recordingId);
    await this.flushEventBuffer(recordingId);
  }

  private async flushPositionBuffer(recordingId: string): Promise<void> {
    const buffer = this.positionBuffers.get(recordingId);
    if (!buffer || buffer.length === 0) return;

    try {
      for (const position of buffer) {
        await pool.query(
          `INSERT INTO recorded_positions (id, recording_id, participant_id, timestamp, lat, lng, speed, heading, accuracy)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            position.id,
            position.recordingId,
            position.participantId,
            position.timestamp,
            position.lat,
            position.lng,
            position.speed,
            position.heading,
            position.accuracy,
          ]
        );
      }

      buffer.length = 0;
    } catch (error) {
      console.error('Failed to flush position buffer:', error);
    }
  }

  private async flushEventBuffer(recordingId: string): Promise<void> {
    const buffer = this.eventBuffers.get(recordingId);
    if (!buffer || buffer.length === 0) return;

    try {
      for (const event of buffer) {
        await pool.query(
          `INSERT INTO recorded_events (id, recording_id, type, timestamp, data)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            event.id,
            event.recordingId,
            event.type,
            event.timestamp,
            JSON.stringify(event.data),
          ]
        );
      }

      buffer.length = 0;
    } catch (error) {
      console.error('Failed to flush event buffer:', error);
    }
  }

  private mapRowToRecording(row: any): RecordingSession {
    return {
      id: row.id,
      sessionId: row.session_id,
      name: row.name,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
      duration: row.duration,
      dataSize: row.data_size,
      participantCount: row.participant_count,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    };
  }

  private mapRowToPosition(row: any): RecordedPosition {
    return {
      id: row.id,
      recordingId: row.recording_id,
      participantId: row.participant_id,
      timestamp: row.timestamp,
      lat: row.lat,
      lng: row.lng,
      speed: row.speed,
      heading: row.heading,
      accuracy: row.accuracy,
    };
  }

  private mapRowToEvent(row: any): RecordedEvent {
    return {
      id: row.id,
      recordingId: row.recording_id,
      type: row.type,
      timestamp: row.timestamp,
      data: row.data ? JSON.parse(row.data) : null,
    };
  }
}

// Singleton instance
let sessionRecordingService: SessionRecordingService | null = null;

export function getSessionRecordingService(config?: Partial<RecordingConfig>): SessionRecordingService {
  if (!sessionRecordingService) {
    sessionRecordingService = new SessionRecordingService(config);
  }
  return sessionRecordingService;
}

export function resetSessionRecordingService(): void {
  if (sessionRecordingService) {
    sessionRecordingService = null;
  }
}
