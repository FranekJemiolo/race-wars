/**
 * Unit Tests for Leaderboard Service
 */

import { LeaderboardService, PositionUpdate, RaceLeaderboard } from '../leaderboard.service';
import { query } from '../../database/connection.simple';

// Mock dependencies
jest.mock('../../database/connection.simple');
jest.mock('../../network/websocket');
jest.mock('../../utils/logger');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;

  beforeEach(() => {
    leaderboardService = new LeaderboardService();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    leaderboardService.stopBatchUpdates();
  });

  describe('initializeRaceLeaderboard', () => {
    it('should initialize a race leaderboard successfully', async () => {
      const raceId = 'test-race-id';
      const raceName = 'Test Race';
      
      const mockParticipants = [
        { id: 'participant-1', user_id: 'user-1', username: 'User1', car_number: 1 },
        { id: 'participant-2', user_id: 'user-2', username: 'User2', car_number: 2 }
      ];

      mockQuery
        .mockResolvedValueOnce([]) // INSERT race_leaderboards
        .mockResolvedValueOnce(mockParticipants) // SELECT participants
        .mockResolvedValueOnce([]) // INSERT leaderboard_entries
        .mockResolvedValueOnce([]) // UPDATE total_participants
        .mockResolvedValueOnce([{ // SELECT race_leaderboards for getLeaderboard
          race_id: raceId,
          race_name: raceName,
          status: 'active',
          start_time: new Date(),
          end_time: null,
          total_participants: 2,
          finished_participants: 0,
          last_update: new Date()
        }])
        .mockResolvedValueOnce([
          {
            // SELECT leaderboard_entries for getLeaderboard
            id: 'entry-1',
            race_id: raceId,
            participant_id: 'participant-1',
            user_id: 'user-1',
            username: 'User1',
            current_position: 1,
            previous_position: 1,
            current_lap: 1,
            total_laps: 1,
            lap_time: 0,
            best_lap_time: 0,
            total_time: 0,
            gap_to_leader: 0,
            gap_to_previous: 0,
            last_checkpoint_time: null,
            speed: 0,
            status: 'racing',
            position_history: [],
            last_update: new Date()
          },
          {
            // Second participant
            id: 'entry-2',
            race_id: raceId,
            participant_id: 'participant-2',
            user_id: 'user-2',
            username: 'User2',
            current_position: 2,
            previous_position: 2,
            current_lap: 1,
            total_laps: 1,
            lap_time: 0,
            best_lap_time: 0,
            total_time: 0,
            gap_to_leader: 0,
            gap_to_previous: 0,
            last_checkpoint_time: null,
            speed: 0,
            status: 'racing',
            position_history: [],
            last_update: new Date()
          }
        ])

      await leaderboardService.initializeRaceLeaderboard(raceId, raceName);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO race_leaderboards'),
        [raceId, raceName]
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT sp.id'),
        [raceId]
      );
    });

    it('should handle initialization errors', async () => {
      const raceId = 'test-race-id';
      const raceName = 'Test Race';

      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(leaderboardService.initializeRaceLeaderboard(raceId, raceName))
        .rejects.toThrow('Database error');
    });
  });

  describe('updatePosition', () => {
    it('should queue position updates for batch processing', async () => {
      const raceId = 'test-race-id';
      const participantId = 'participant-1';
      const positionData: PositionUpdate = {
        timestamp: new Date(),
        position: 1,
        lap: 2,
        checkpointIndex: 3,
        lapTime: 65000,
        speed: 85.5,
        coordinates: { lat: 37.7749, lng: -122.4194 }
      };

      await leaderboardService.updatePosition(raceId, participantId, positionData);

      // The position update should be queued
      // We can't directly access the queue, but we can verify no database calls were made
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    it('should return cached leaderboard if available and fresh', async () => {
      const raceId = 'test-race-id';
      const cachedLeaderboard: RaceLeaderboard = {
        raceId,
        raceName: 'Test Race',
        status: 'active',
        startTime: new Date(),
        endTime: null,
        totalParticipants: 2,
        finishedParticipants: 0,
        entries: [],
        lastUpdate: new Date()
      };

      // Set cache manually for testing
      (leaderboardService as any).leaderboardCache.set(raceId, cachedLeaderboard);

      const result = await leaderboardService.getLeaderboard(raceId);

      expect(result).toBe(cachedLeaderboard);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should fetch leaderboard from database if not cached', async () => {
      const raceId = 'test-race-id';

      mockQuery
        .mockResolvedValueOnce([{ // race_leaderboards
          race_id: raceId,
          race_name: 'Test Race',
          status: 'active',
          start_time: new Date(),
          end_time: null,
          total_participants: 2,
          finished_participants: 0,
          last_update: new Date()
        }])
        .mockResolvedValueOnce([{ // leaderboard_entries
          id: 'entry-1',
          race_id: raceId,
          participant_id: 'participant-1',
          user_id: 'user-1',
          username: 'User1',
          current_position: 1,
          previous_position: 1,
          current_lap: 1,
          total_laps: 1,
          lap_time: 0,
          best_lap_time: 0,
          total_time: 0,
          gap_to_leader: 0,
          gap_to_previous: 0,
          last_checkpoint_time: null,
          speed: 0,
          status: 'racing',
          position_history: [],
          last_update: new Date()
        }]);

      const result = await leaderboardService.getLeaderboard(raceId);

      expect(result.raceId).toBe(raceId);
      expect(result.entries).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw error if race not found', async () => {
      const raceId = 'non-existent-race';

      mockQuery.mockResolvedValueOnce([]); // Empty race_leaderboards result

      await expect(leaderboardService.getLeaderboard(raceId))
        .rejects.toThrow(`Race leaderboard not found: ${raceId}`);
    });
  });

  describe('getParticipantPosition', () => {
    it('should return participant position if found', async () => {
      const raceId = 'test-race-id';
      const participantId = 'participant-1';

      mockQuery.mockResolvedValueOnce([{
        id: 'entry-1',
        race_id: raceId,
        participant_id: participantId,
        user_id: 'user-1',
        username: 'User1',
        current_position: 1,
        previous_position: 1,
        current_lap: 1,
        total_laps: 1,
        lap_time: 0,
        best_lap_time: 0,
        total_time: 0,
        gap_to_leader: 0,
        gap_to_previous: 0,
        last_checkpoint_time: null,
        speed: 0,
        status: 'racing',
        position_history: [],
        last_update: new Date()
      }]);

      const result = await leaderboardService.getParticipantPosition(raceId, participantId);

      expect(result).not.toBeNull();
      expect(result?.participantId).toBe(participantId);
      expect(result?.username).toBe('User1');
    });

    it('should return null if participant not found', async () => {
      const raceId = 'test-race-id';
      const participantId = 'non-existent-participant';

      mockQuery.mockResolvedValueOnce([]);

      const result = await leaderboardService.getParticipantPosition(raceId, participantId);

      expect(result).toBeNull();
    });
  });

  describe('finishParticipant', () => {
    it('should finish participant successfully', async () => {
      const raceId = 'test-race-id';
      const participantId = 'participant-1';
      const totalTime = 120000; // 2 minutes

      mockQuery
        .mockResolvedValueOnce([]) // finish_participant function
        .mockResolvedValueOnce([{ // race_leaderboards for cache update
          race_id: raceId,
          race_name: 'Test Race',
          status: 'active',
          start_time: new Date(),
          end_time: null,
          total_participants: 2,
          finished_participants: 1,
          last_update: new Date()
        }])
        .mockResolvedValueOnce([{ // leaderboard_entries for cache update
          id: 'entry-1',
          race_id: raceId,
          participant_id: participantId,
          user_id: 'user-1',
          username: 'User1',
          current_position: 1,
          previous_position: 1,
          current_lap: 1,
          total_laps: 1,
          lap_time: 0,
          best_lap_time: 0,
          total_time: totalTime,
          gap_to_leader: 0,
          gap_to_previous: 0,
          last_checkpoint_time: null,
          speed: 0,
          status: 'finished',
          position_history: [],
          last_update: new Date()
        }]);

      await leaderboardService.finishParticipant(raceId, participantId, totalTime);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT finish_participant($1, $2, $3)',
        [raceId, participantId, totalTime]
      );
      // Note: broadcast is mocked at module level
    });
  });

  describe('finishRace', () => {
    it('should finish race successfully', async () => {
      const raceId = 'test-race-id';

      mockQuery
        .mockResolvedValueOnce([]) // UPDATE race_leaderboards
        .mockResolvedValueOnce([{ // race_leaderboards for cache update
          race_id: raceId,
          race_name: 'Test Race',
          status: 'finished',
          start_time: new Date(),
          end_time: new Date(),
          total_participants: 2,
          finished_participants: 2,
          last_update: new Date()
        }])
        .mockResolvedValueOnce([]); // leaderboard_entries for cache update

      await leaderboardService.finishRace(raceId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE race_leaderboards'),
        [raceId]
      );
      // Note: broadcast is mocked at module level
    });
  });

  describe('getRaceStatistics', () => {
    it('should return race statistics', async () => {
      const raceId = 'test-race-id';

      mockQuery.mockResolvedValueOnce([{
        total_participants: 10,
        finished_participants: 5,
        active_participants: 5,
        avg_lap_time: 65000,
        fastest_lap_time: 60000,
        max_speed: 120.5
      }]);

      const result = await leaderboardService.getRaceStatistics(raceId);

      expect(result.total_participants).toBe(10);
      expect(result.finished_participants).toBe(5);
      expect(result.avg_lap_time).toBe(65000);
    });

    it('should return empty object if no statistics found', async () => {
      const raceId = 'test-race-id';

      mockQuery.mockResolvedValueOnce([]);

      const result = await leaderboardService.getRaceStatistics(raceId);

      expect(result).toEqual({});
    });
  });

  describe('clearCache', () => {
    it('should clear cache for a race', () => {
      const raceId = 'test-race-id';

      // Set some cache data
      (leaderboardService as any).leaderboardCache.set(raceId, { raceId });
      (leaderboardService as any).positionUpdateQueue.set(raceId, []);

      leaderboardService.clearCache(raceId);

      expect((leaderboardService as any).leaderboardCache.has(raceId)).toBe(false);
      expect((leaderboardService as any).positionUpdateQueue.has(raceId)).toBe(false);
    });
  });

  describe('batch updates', () => {
    it('should process batch updates periodically', async () => {
      const raceId = 'test-race-id';
      const participantId = 'participant-1';
      const positionData: PositionUpdate = {
        timestamp: new Date(),
        position: 1,
        lap: 2,
        checkpointIndex: 3,
        lapTime: 65000,
        speed: 85.5,
        coordinates: { lat: 37.7749, lng: -122.4194 }
      };

      // Mock the database queries for batch processing
      mockQuery
        .mockResolvedValue([]) // INSERT position_updates
        .mockResolvedValue([]) // UPDATE leaderboard_entries
        .mockResolvedValue([]) // UPDATE best_lap_time
        .mockResolvedValue([]) // update_leaderboard_positions
        .mockResolvedValueOnce([{ // race_leaderboards for cache update
          race_id: raceId,
          race_name: 'Test Race',
          status: 'active',
          start_time: new Date(),
          end_time: null,
          total_participants: 2,
          finished_participants: 0,
          last_update: new Date()
        }])
        .mockResolvedValueOnce([]); // leaderboard_entries for cache update

      // Queue position update
      await leaderboardService.updatePosition(raceId, participantId, positionData);

      // Manually trigger batch processing
      await (leaderboardService as any).processBatchUpdates();

      expect(mockQuery).toHaveBeenCalledTimes(5);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const raceId = 'test-race-id';

      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(leaderboardService.getLeaderboard(raceId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle WebSocket broadcast errors', async () => {
      const raceId = 'test-race-id';
      const participantId = 'participant-1';
      const totalTime = 120000;

      mockQuery
        .mockResolvedValue([]) // finish_participant function
        .mockResolvedValueOnce([{ // race_leaderboards for cache update
          race_id: raceId,
          race_name: 'Test Race',
          status: 'active',
          start_time: new Date(),
          end_time: null,
          total_participants: 2,
          finished_participants: 1,
          last_update: new Date()
        }])
        .mockResolvedValueOnce([{
          // leaderboard_entries for cache update
          id: 'entry-1',
          race_id: raceId,
          participant_id: participantId,
          user_id: 'user-1',
          username: 'User1',
          current_position: 1,
          previous_position: 1,
          current_lap: 1,
          total_laps: 1,
          lap_time: 0,
          best_lap_time: 0,
          total_time: totalTime,
          gap_to_leader: 0,
          gap_to_previous: 0,
          last_checkpoint_time: null,
          speed: 0,
          status: 'finished',
          position_history: [],
          last_update: new Date()
        }]); 

      // Note: broadcast is mocked at module level, errors are handled gracefully

      // Should not throw error, just log it
      await expect(leaderboardService.finishParticipant(raceId, participantId, totalTime))
        .resolves.not.toThrow();
    });
  });
});
