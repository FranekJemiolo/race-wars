/**
 * Leaderboard Service
 * 
 * Manages real-time race leaderboards with position tracking,
 * lap times, and WebSocket broadcasting
 */

import { query } from '../database/connection.simple';
import { logger } from '../utils/logger';
import { broadcast } from '../network/websocket';

export interface LeaderboardEntry {
  id: string;
  raceId: string;
  participantId: string;
  userId: string;
  username: string;
  currentPosition: number;
  previousPosition: number;
  currentLap: number;
  totalLaps: number;
  lapTime: number;
  bestLapTime: number;
  totalTime: number;
  gapToLeader: number;
  gapToPrevious: number;
  lastCheckpointTime: Date | null;
  speed: number;
  status: 'racing' | 'finished' | 'dnf' | 'pit' | 'disqualified';
  positionHistory: PositionUpdate[];
  lastUpdate: Date;
}

export interface PositionUpdate {
  timestamp: Date;
  position: number;
  lap: number;
  checkpointIndex: number;
  lapTime: number;
  speed: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface RaceLeaderboard {
  raceId: string;
  raceName: string;
  status: 'active' | 'finished' | 'paused' | 'cancelled';
  startTime: Date | null;
  endTime: Date | null;
  totalParticipants: number;
  finishedParticipants: number;
  entries: LeaderboardEntry[];
  lastUpdate: Date;
}

export interface PositionUpdateMessage {
  type: 'position_update';
  raceId: string;
  participantId: string;
  data: {
    position: number;
    lap: number;
    checkpointIndex: number;
    lapTime: number;
    speed: number;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  timestamp: number;
}

export class LeaderboardService {
  private leaderboardCache: Map<string, RaceLeaderboard> = new Map();
  private positionUpdateQueue: Map<string, PositionUpdateMessage[]> = new Map();
  private batchUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startBatchUpdates();
  }

  /**
   * Initialize a race leaderboard
   */
  async initializeRaceLeaderboard(raceId: string, raceName: string): Promise<void> {
    try {
      logger.info(`Initializing leaderboard for race: ${raceId}`);

      // Create race leaderboard entry
      await query(`
        INSERT INTO race_leaderboards (race_id, race_name, status, start_time)
        VALUES ($1, $2, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT (race_id) DO UPDATE SET
          race_name = EXCLUDED.race_name,
          status = 'active',
          start_time = CURRENT_TIMESTAMP,
          last_update = CURRENT_TIMESTAMP
      `, [raceId, raceName]);

      // Get race participants
      const participants = await query(`
        SELECT sp.id, sp.user_id, u.username, sp.car_number
        FROM session_participants sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.session_id = $1
        ORDER BY sp.car_number
      `, [raceId]);

      // Create leaderboard entries for each participant
      for (const participant of participants) {
        await query(`
          INSERT INTO leaderboard_entries (
            race_id, participant_id, user_id, current_position, previous_position,
            current_lap, total_laps, status
          )
          VALUES ($1, $2, $3, $4, $4, 1, 1, 'racing')
          ON CONFLICT (race_id, participant_id) DO NOTHING
        `, [raceId, participant.id, participant.user_id, participant.car_number || 1]);
      }

      // Update total participants count
      await query(`
        UPDATE race_leaderboards 
        SET total_participants = $2, last_update = CURRENT_TIMESTAMP
        WHERE race_id = $1
      `, [raceId, participants.length]);

      // Initialize cache
      const leaderboard = await this.getLeaderboard(raceId);
      this.leaderboardCache.set(raceId, leaderboard);

      logger.info(`Leaderboard initialized for race ${raceId} with ${participants.length} participants`);
    } catch (error) {
      logger.error(`Failed to initialize leaderboard for race ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Update participant position
   */
  async updatePosition(raceId: string, participantId: string, positionData: PositionUpdate): Promise<void> {
    try {
      // Queue the position update for batch processing
      if (!this.positionUpdateQueue.has(raceId)) {
        this.positionUpdateQueue.set(raceId, []);
      }

      const queue = this.positionUpdateQueue.get(raceId)!;
      queue.push({
        type: 'position_update',
        raceId,
        participantId,
        data: positionData,
        timestamp: Date.now()
      });

      logger.debug(`Position update queued for race ${raceId}, participant ${participantId}`);
    } catch (error) {
      logger.error(`Failed to queue position update:`, error);
      throw error;
    }
  }

  /**
   * Process batch position updates
   */
  private async processBatchUpdates(): Promise<void> {
    for (const [raceId, updates] of this.positionUpdateQueue.entries()) {
      if (updates.length === 0) continue;

      try {
        // Process each update
        for (const update of updates) {
          await this.processPositionUpdate(update);
        }

        // Clear the queue for this race
        this.positionUpdateQueue.set(raceId, []);

        // Get updated leaderboard and broadcast
        const leaderboard = await this.getLeaderboard(raceId);
        this.leaderboardCache.set(raceId, leaderboard);

        // Broadcast to all subscribers
        await this.broadcastLeaderboardUpdate(raceId, leaderboard);

        logger.debug(`Processed ${updates.length} position updates for race ${raceId}`);
      } catch (error) {
        logger.error(`Failed to process batch updates for race ${raceId}:`, error);
      }
    }
  }

  /**
   * Process individual position update
   */
  private async processPositionUpdate(update: PositionUpdateMessage): Promise<void> {
    const { raceId, participantId, data } = update;

    // Add position update to history
    await query(`
      INSERT INTO position_updates (
        race_id, participant_id, position, lap, checkpoint_index,
        lap_time, speed, coordinates_lat, coordinates_lng
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      raceId, participantId, data.position, data.lap, data.checkpointIndex,
      data.lapTime, data.speed, data.coordinates.lat, data.coordinates.lng
    ]);

    // Update leaderboard entry
    await query(`
      UPDATE leaderboard_entries 
      SET 
        current_position = $3,
        current_lap = $4,
        lap_time = $5,
        speed = $6,
        last_checkpoint_time = CURRENT_TIMESTAMP,
        position_history = position_history || $7::jsonb,
        last_update = CURRENT_TIMESTAMP
      WHERE race_id = $1 AND participant_id = $2
    `, [
      raceId, participantId, data.position, data.lap, data.lapTime, data.speed,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        position: data.position,
        lap: data.lap,
        checkpointIndex: data.checkpointIndex,
        lapTime: data.lapTime,
        speed: data.speed,
        coordinates: data.coordinates
      })
    ]);

    // Update best lap time if necessary
    await query(`
      UPDATE leaderboard_entries 
      SET best_lap_time = LEAST(best_lap_time, $3)
      WHERE race_id = $1 AND participant_id = $2 AND $3 > 0 AND (best_lap_time = 0 OR $3 < best_lap_time)
    `, [raceId, participantId, data.lapTime]);

    // Recalculate positions using database function
    await query('SELECT update_leaderboard_positions($1)', [raceId]);
  }

  /**
   * Get current leaderboard for a race
   */
  async getLeaderboard(raceId: string): Promise<RaceLeaderboard> {
    try {
      // Check cache first
      const cached = this.leaderboardCache.get(raceId);
      if (cached && (Date.now() - cached.lastUpdate.getTime()) < 5000) { // 5 second cache
        return cached;
      }

      // Get race leaderboard info
      const raceInfo = await query(`
        SELECT race_id, race_name, status, start_time, end_time,
               total_participants, finished_participants, last_update
        FROM race_leaderboards 
        WHERE race_id = $1
      `, [raceId]);

      if (raceInfo.length === 0) {
        throw new Error(`Race leaderboard not found: ${raceId}`);
      }

      const race = raceInfo[0];

      // Get leaderboard entries
      const entries = await query(`
        SELECT 
          le.id, le.race_id, le.participant_id, le.user_id, u.username,
          le.current_position, le.previous_position, le.current_lap, le.total_laps,
          le.lap_time, le.best_lap_time, le.total_time, le.gap_to_leader, le.gap_to_previous,
          le.last_checkpoint_time, le.speed, le.status, le.position_history, le.last_update
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        WHERE le.race_id = $1
        ORDER BY le.current_position ASC
      `, [raceId]);

      const leaderboardEntries: LeaderboardEntry[] = (entries || []).map((entry: any) => ({
        id: entry.id,
        raceId: entry.race_id,
        participantId: entry.participant_id,
        userId: entry.user_id,
        username: entry.username,
        currentPosition: entry.current_position,
        previousPosition: entry.previous_position,
        currentLap: entry.current_lap,
        totalLaps: entry.total_laps,
        lapTime: entry.lap_time,
        bestLapTime: entry.best_lap_time,
        totalTime: entry.total_time,
        gapToLeader: entry.gap_to_leader,
        gapToPrevious: entry.gap_to_previous,
        lastCheckpointTime: entry.last_checkpoint_time,
        speed: parseFloat(entry.speed),
        status: entry.status,
        positionHistory: entry.position_history || [],
        lastUpdate: entry.last_update
      }));

      const leaderboard: RaceLeaderboard = {
        raceId: race.race_id,
        raceName: race.race_name,
        status: race.status,
        startTime: race.start_time,
        endTime: race.end_time,
        totalParticipants: race.total_participants,
        finishedParticipants: race.finished_participants,
        entries: leaderboardEntries,
        lastUpdate: race.last_update
      };

      // Update cache
      this.leaderboardCache.set(raceId, leaderboard);

      return leaderboard;
    } catch (error) {
      logger.error(`Failed to get leaderboard for race ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Get participant position details
   */
  async getParticipantPosition(raceId: string, participantId: string): Promise<LeaderboardEntry | null> {
    try {
      const result = await query(`
        SELECT 
          le.id, le.race_id, le.participant_id, le.user_id, u.username,
          le.current_position, le.previous_position, le.current_lap, le.total_laps,
          le.lap_time, le.best_lap_time, le.total_time, le.gap_to_leader, le.gap_to_previous,
          le.last_checkpoint_time, le.speed, le.status, le.position_history, le.last_update
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        WHERE le.race_id = $1 AND le.participant_id = $2
      `, [raceId, participantId]);

      if (result.length === 0) {
        return null;
      }

      const entry = result[0];
      return {
        id: entry.id,
        raceId: entry.race_id,
        participantId: entry.participant_id,
        userId: entry.user_id,
        username: entry.username,
        currentPosition: entry.current_position,
        previousPosition: entry.previous_position,
        currentLap: entry.current_lap,
        totalLaps: entry.total_laps,
        lapTime: entry.lap_time,
        bestLapTime: entry.best_lap_time,
        totalTime: entry.total_time,
        gapToLeader: entry.gap_to_leader,
        gapToPrevious: entry.gap_to_previous,
        lastCheckpointTime: entry.last_checkpoint_time,
        speed: parseFloat(entry.speed),
        status: entry.status,
        positionHistory: entry.position_history || [],
        lastUpdate: entry.last_update
      };
    } catch (error) {
      logger.error(`Failed to get participant position:`, error);
      throw error;
    }
  }

  /**
   * Finish participant race
   */
  async finishParticipant(raceId: string, participantId: string, totalTime: number): Promise<void> {
    try {
      // Update participant status and total time
      await query('SELECT finish_participant($1, $2, $3)', [raceId, participantId, totalTime]);

      // Update cache
      this.leaderboardCache.delete(raceId); // Force refresh

      // Get updated leaderboard and broadcast
      const leaderboard = await this.getLeaderboard(raceId);
      this.leaderboardCache.set(raceId, leaderboard);

      await this.broadcastLeaderboardUpdate(raceId, leaderboard);

      logger.info(`Participant ${participantId} finished race ${raceId} with time ${totalTime}ms`);
    } catch (error) {
      logger.error(`Failed to finish participant:`, error);
      throw error;
    }
  }

  /**
   * Finish race
   */
  async finishRace(raceId: string): Promise<void> {
    try {
      await query(`
        UPDATE race_leaderboards 
        SET status = 'finished', end_time = CURRENT_TIMESTAMP, last_update = CURRENT_TIMESTAMP
        WHERE race_id = $1
      `, [raceId]);

      // Update cache
      this.leaderboardCache.delete(raceId);

      const leaderboard = await this.getLeaderboard(raceId);
      this.leaderboardCache.set(raceId, leaderboard);

      await this.broadcastLeaderboardUpdate(raceId, leaderboard);

      logger.info(`Race ${raceId} finished`);
    } catch (error) {
      logger.error(`Failed to finish race:`, error);
      throw error;
    }
  }

  /**
   * Broadcast leaderboard update to WebSocket clients
   */
  private async broadcastLeaderboardUpdate(raceId: string, leaderboard: RaceLeaderboard): Promise<void> {
    try {
      const message = {
        type: 'leaderboard_update',
        raceId,
        data: leaderboard,
        timestamp: Date.now()
      };

      broadcast(JSON.stringify(message));
      logger.debug(`Leaderboard update broadcasted for race ${raceId}`);
    } catch (error) {
      logger.error(`Failed to broadcast leaderboard update:`, error);
    }
  }

  /**
   * Start batch update processing
   */
  private startBatchUpdates(): void {
    this.batchUpdateInterval = setInterval(() => {
      this.processBatchUpdates();
    }, 500); // Process every 500ms
  }

  /**
   * Stop batch update processing
   */
  stopBatchUpdates(): void {
    if (this.batchUpdateInterval) {
      clearInterval(this.batchUpdateInterval);
      this.batchUpdateInterval = null;
    }
  }

  /**
   * Get race statistics
   */
  async getRaceStatistics(raceId: string): Promise<any> {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_participants,
          COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished_participants,
          COUNT(CASE WHEN status = 'racing' THEN 1 END) as active_participants,
          AVG(lap_time) as avg_lap_time,
          MIN(best_lap_time) as fastest_lap_time,
          MAX(speed) as max_speed
        FROM leaderboard_entries 
        WHERE race_id = $1
      `, [raceId]);

      return stats[0] || {};
    } catch (error) {
      logger.error(`Failed to get race statistics:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for a race
   */
  clearCache(raceId: string): void {
    this.leaderboardCache.delete(raceId);
    this.positionUpdateQueue.delete(raceId);
  }
}

export default LeaderboardService;
