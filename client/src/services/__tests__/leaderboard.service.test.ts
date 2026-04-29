import { describe, it, expect, beforeEach, jest, afterEach } from 'vitest';
import { LeaderboardService, LeaderboardEntry, RaceInfo } from '../leaderboard.service';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  url = '';
  send = jest.fn();
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();

  constructor(url: string) {
    this.url = url;
  }
}

// Mock global WebSocket
Object.defineProperty(global, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
});

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new LeaderboardService({
      updateInterval: 100,
      maxHistorySize: 10,
      enableAnimations: false,
      showAntiCheatWarnings: true,
      autoRefresh: false // Disable auto-refresh for tests
    });
    mockWs = new MockWebSocket('ws://localhost:8080');
  });

  afterEach(() => {
    jest.useRealTimers();
    service.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      await service.connect('test-race');
      
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080?raceId=test-race');
      expect(mockWs.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWs.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should send FULL_RESYNC message on connection', async () => {
      await service.connect('test-race');
      
      const openCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
      openCallback();
      
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'FULL_RESYNC',
        version: '1.0'
      }));
    });

    it('should handle connection timeout', async () => {
      const timeout = 1000;
      service = new LeaderboardService({ updateInterval: timeout });
      
      await expect(service.connect('test-race')).rejects.toThrow('Connection timeout');
      
      jest.advanceTimersByTime(timeout);
    });

    it('should disconnect properly', async () => {
      await service.connect('test-race');
      service.disconnect();
      
      expect(mockWs.close).toHaveBeenCalled();
      expect(service.getConnectionStatus()).toBe('disconnected');
    });

    it('should handle connection errors', async () => {
      const errorCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'error')?.[1];
      
      await service.connect('test-race');
      errorCallback(new Error('Connection failed'));
      
      expect(service.getConnectionStatus()).toBe('error');
    });

    it('should handle disconnection', async () => {
      const closeCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'close')?.[1];
      
      await service.connect('test-race');
      closeCallback();
      
      expect(service.getConnectionStatus()).toBe('disconnected');
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await service.connect('test-race');
      const openCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
      openCallback();
    });

    it('should handle STATE_SNAPSHOT message', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      const mockState = {
        race: {
          id: 'test-race',
          name: 'Test Race',
          status: 'racing',
          totalLength: 10000,
          totalLaps: 3
        },
        players: [
          {
            id: 'driver-1',
            name: 'Speed Racer',
            totalTime: 120000,
            totalDistance: 5000,
            status: 'active',
            antiCheatRisk: 0,
            completedLaps: 2,
            currentLapTime: 45000,
            bestLapTime: 42000,
            avgSpeed: 120,
            maxSpeed: 150,
            currentSpeed: 130
          },
          {
            id: 'driver-2',
            name: 'Drift King',
            totalTime: 125000,
            totalDistance: 4800,
            status: 'active',
            antiCheatRisk: 15,
            completedLaps: 2,
            currentLapTime: 47000,
            bestLapTime: 43000,
            avgSpeed: 115,
            maxSpeed: 140,
            currentSpeed: 125
          }
        ]
      };
      
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: mockState
        })
      });
      
      const leaderboard = service.getLeaderboard();
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].name).toBe('Speed Racer');
      expect(leaderboard[0].position).toBe(1);
      expect(leaderboard[1].name).toBe('Drift King');
      expect(leaderboard[1].position).toBe(2);
      
      const raceInfo = service.getRaceInfo();
      expect(raceInfo?.name).toBe('Test Race');
      expect(raceInfo?.status).toBe('racing');
    });

    it('should handle LEADERBOARD_UPDATE message', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      const mockLeaderboard = [
        {
          position: 1,
          participantId: 'driver-1',
          name: 'Speed Racer',
          time: 120000,
          gap: 0,
          speed: 130,
          distance: 5000,
          status: 'active',
          lastUpdate: Date.now(),
          antiCheatRisk: 0,
          laps: 2,
          currentLapTime: 45000,
          bestLapTime: 42000,
          avgSpeed: 120,
          maxSpeed: 150,
          progress: 0.5
        }
      ];
      
      messageCallback({
        data: JSON.stringify({
          type: 'LEADERBOARD_UPDATE',
          leaderboard: mockLeaderboard
        })
      });
      
      const leaderboard = service.getLeaderboard();
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].name).toBe('Speed Racer');
    });

    it('should handle POSITION_UPDATE message', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      // First set up initial state
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [{
              id: 'driver-1',
              name: 'Speed Racer',
              totalTime: 120000,
              totalDistance: 5000,
              status: 'active',
              currentSpeed: 130
            }]
          }
        })
      });
      
      // Then update position
      messageCallback({
        data: JSON.stringify({
          type: 'POSITION_UPDATE',
          participantId: 'driver-1',
          speed: 140,
          distance: 5200
        })
      });
      
      const entry = service.getEntry('driver-1');
      expect(entry?.speed).toBe(140);
      expect(entry?.distance).toBe(5200);
    });

    it('should handle ANTI_CHEAT_WARNING message', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      // Set up initial state
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [{
              id: 'driver-1',
              name: 'Speed Racer',
              totalTime: 120000,
              totalDistance: 5000,
              status: 'active',
              antiCheatRisk: 0
            }]
          }
        })
      });
      
      // Send anti-cheat warning
      messageCallback({
        data: JSON.stringify({
          type: 'ANTI_CHEAT_WARNING',
          participantId: 'driver-1',
          riskScore: 85,
          anomalies: [{ type: 'speed_spike', severity: 'high' }],
          recommendations: ['Monitor closely']
        })
      });
      
      const entry = service.getEntry('driver-1');
      expect(entry?.antiCheatRisk).toBe(85);
    });

    it('should handle PARTICIPANT_FINISHED message', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      // Set up initial state
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [{
              id: 'driver-1',
              name: 'Speed Racer',
              totalTime: 120000,
              totalDistance: 5000,
              status: 'active'
            }]
          }
        })
      });
      
      // Send finish message
      messageCallback({
        data: JSON.stringify({
          type: 'PARTICIPANT_FINISHED',
          participantId: 'driver-1',
          position: 1,
          time: 120000
        })
      });
      
      const entry = service.getEntry('driver-1');
      expect(entry?.status).toBe('finished');
      expect(entry?.time).toBe(120000);
      expect(entry?.position).toBe(1);
    });

    it('should handle PARTICIPANT_DISQUALIFIED message', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      // Set up initial state
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [{
              id: 'driver-1',
              name: 'Speed Racer',
              totalTime: 120000,
              totalDistance: 5000,
              status: 'active',
              antiCheatRisk: 0
            }]
          }
        })
      });
      
      // Send disqualification message
      messageCallback({
        data: JSON.stringify({
          type: 'PARTICIPANT_DISQUALIFIED',
          participantId: 'driver-1'
        })
      });
      
      const entry = service.getEntry('driver-1');
      expect(entry?.status).toBe('disqualified');
      expect(entry?.antiCheatRisk).toBe(100);
    });

    it('should handle RACE_STATUS_UPDATE message', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      // Set up initial state
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', status: 'waiting', totalLength: 10000, totalLaps: 3 },
            players: []
          }
        })
      });
      
      // Update race status
      messageCallback({
        data: JSON.stringify({
          type: 'RACE_STATUS_UPDATE',
          raceStatus: 'racing'
        })
      });
      
      const raceInfo = service.getRaceInfo();
      expect(raceInfo?.status).toBe('racing');
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await service.connect('test-race');
      const openCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
      openCallback();
    });

    it('should emit position_changed events', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      const mockListener = jest.fn();
      
      service.on('position_changed', mockListener);
      
      // Initial state
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [
              { id: 'driver-1', name: 'Driver 1', totalDistance: 5000, totalTime: 120000 },
              { id: 'driver-2', name: 'Driver 2', totalDistance: 4800, totalTime: 125000 }
            ]
          }
        })
      });
      
      // Update positions
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [
              { id: 'driver-1', name: 'Driver 1', totalDistance: 5200, totalTime: 122000 },
              { id: 'driver-2', name: 'Driver 2', totalDistance: 5000, totalTime: 124000 }
            ]
          }
        })
      });
      
      expect(mockListener).toHaveBeenCalledWith({
        type: 'position_changed',
        participantId: 'driver-2',
        oldPosition: 2,
        newPosition: 1
      });
    });

    it('should emit anti_cheat_warning events', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      const mockListener = jest.fn();
      
      service.on('anti_cheat_warning', mockListener);
      
      messageCallback({
        data: JSON.stringify({
          type: 'ANTI_CHEAT_WARNING',
          participantId: 'driver-1',
          riskScore: 85
        })
      });
      
      expect(mockListener).toHaveBeenCalledWith({
        type: 'anti_cheat_warning',
        participantId: 'driver-1',
        riskScore: 85
      });
    });

    it('should emit participant_finished events', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      const mockListener = jest.fn();
      
      service.on('participant_finished', mockListener);
      
      messageCallback({
        data: JSON.stringify({
          type: 'PARTICIPANT_FINISHED',
          participantId: 'driver-1',
          position: 1,
          time: 120000
        })
      });
      
      expect(mockListener).toHaveBeenCalledWith({
        type: 'participant_finished',
        participantId: 'driver-1',
        position: 1,
        time: 120000
      });
    });

    it('should remove event listeners', () => {
      const mockListener = jest.fn();
      
      service.on('test_event', mockListener);
      service.off('test_event', mockListener);
      
      // Should not crash when trying to remove
      expect(() => service.off('test_event', mockListener)).not.toThrow();
    });
  });

  describe('Data Management', () => {
    beforeEach(async () => {
      await service.connect('test-race');
      const openCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
      openCallback();
    });

    it('should get leaderboard entries sorted by position', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [
              { id: 'driver-3', name: 'Driver 3', totalDistance: 3000, totalTime: 140000 },
              { id: 'driver-1', name: 'Driver 1', totalDistance: 5000, totalTime: 120000 },
              { id: 'driver-2', name: 'Driver 2', totalDistance: 4000, totalTime: 130000 }
            ]
          }
        })
      });
      
      const leaderboard = service.getLeaderboard();
      expect(leaderboard[0].name).toBe('Driver 1');
      expect(leaderboard[1].name).toBe('Driver 2');
      expect(leaderboard[2].name).toBe('Driver 3');
    });

    it('should get specific entry by participant ID', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [
              { id: 'driver-1', name: 'Driver 1', totalDistance: 5000, totalTime: 120000 }
            ]
          }
        })
      });
      
      const entry = service.getEntry('driver-1');
      expect(entry?.name).toBe('Driver 1');
      expect(entry?.participantId).toBe('driver-1');
    });

    it('should return undefined for non-existent entry', () => {
      const entry = service.getEntry('non-existent');
      expect(entry).toBeUndefined();
    });

    it('should clear all data', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [
              { id: 'driver-1', name: 'Driver 1', totalDistance: 5000, totalTime: 120000 }
            ]
          }
        })
      });
      
      expect(service.getLeaderboard()).toHaveLength(1);
      expect(service.getRaceInfo()).toBeTruthy();
      
      service.clear();
      
      expect(service.getLeaderboard()).toHaveLength(0);
      expect(service.getRaceInfo()).toBeNull();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await service.connect('test-race');
      const openCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
      openCallback();
    });

    it('should calculate correct statistics', () => {
      const messageCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
      
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: { id: 'test-race', name: 'Test Race', totalLength: 10000, totalLaps: 3 },
            players: [
              {
                id: 'driver-1',
                name: 'Driver 1',
                totalDistance: 5000,
                totalTime: 120000,
                status: 'active',
                avgSpeed: 120,
                bestLapTime: 42000
              },
              {
                id: 'driver-2',
                name: 'Driver 2',
                totalDistance: 4800,
                totalTime: 125000,
                status: 'finished',
                avgSpeed: 115,
                bestLapTime: 43000
              },
              {
                id: 'driver-3',
                name: 'Driver 3',
                totalDistance: 3000,
                totalTime: 140000,
                status: 'dnf',
                avgSpeed: 100,
                bestLapTime: 45000
              }
            ]
          }
        })
      });
      
      const stats = service.getStats();
      
      expect(stats.totalParticipants).toBe(3);
      expect(stats.activeParticipants).toBe(1);
      expect(stats.finishedParticipants).toBe(1);
      expect(stats.averageSpeed).toBeCloseTo(111.67, 1);
      expect(stats.bestLapTime).toBe(42000);
    });

    it('should handle empty statistics', () => {
      const stats = service.getStats();
      
      expect(stats.totalParticipants).toBe(0);
      expect(stats.activeParticipants).toBe(0);
      expect(stats.finishedParticipants).toBe(0);
      expect(stats.averageSpeed).toBe(0);
      expect(stats.bestLapTime).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        updateInterval: 500,
        maxHistorySize: 50,
        enableAnimations: true
      };
      
      service.updateConfig(newConfig);
      
      const config = service.getConfig();
      expect(config.updateInterval).toBe(500);
      expect(config.maxHistorySize).toBe(50);
      expect(config.enableAnimations).toBe(true);
      expect(config.showAntiCheatWarnings).toBe(true); // Should preserve existing
    });

    it('should get current configuration', () => {
      const config = service.getConfig();
      
      expect(config.updateInterval).toBe(100);
      expect(config.maxHistorySize).toBe(10);
      expect(config.enableAnimations).toBe(false);
      expect(config.showAntiCheatWarnings).toBe(true);
      expect(config.autoRefresh).toBe(false);
    });
  });

  describe('Heartbeat', () => {
    it('should send heartbeat messages', async () => {
      service = new LeaderboardService({ autoRefresh: true });
      await service.connect('test-race');
      
      const openCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
      openCallback();
      
      // Clear initial send calls
      mockWs.send.mockClear();
      
      // Advance time to trigger heartbeat
      jest.advanceTimersByTime(30000);
      
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'PING',
        timestamp: expect.any(Number)
      }));
    });

    it('should stop heartbeat on disconnect', async () => {
      service = new LeaderboardService({ autoRefresh: true });
      await service.connect('test-race');
      
      const openCallback = mockWs.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
      openCallback();
      
      service.disconnect();
      
      // Advance time - should not send heartbeat
      jest.advanceTimersByTime(30000);
      
      expect(mockWs.send).not.toHaveBeenCalledWith(
        expect.stringContaining('PING')
      );
    });
  });
});
