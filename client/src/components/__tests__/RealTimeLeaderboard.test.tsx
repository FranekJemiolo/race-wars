import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealTimeLeaderboard } from '../RealTimeLeaderboard';
import { LeaderboardEntry } from '../../services/leaderboard.service';

// Mock WebSocket
const mockWebSocket = {
  readyState: WebSocket.OPEN,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock global WebSocket
Object.defineProperty(global, 'WebSocket', {
  value: jest.fn(() => mockWebSocket),
  writable: true,
});

describe('RealTimeLeaderboard', () => {
  const mockRaceId = 'test-race-123';
  
  const mockLeaderboardData: LeaderboardEntry[] = [
    {
      position: 1,
      participantId: 'driver-1',
      name: 'Speed Racer',
      time: 125000,
      gap: 0,
      speed: 120.5,
      distance: 5000,
      status: 'active',
      lastUpdate: Date.now(),
      antiCheatRisk: 0,
      laps: 2,
      currentLapTime: 45000,
      bestLapTime: 42000,
      avgSpeed: 118.0,
      maxSpeed: 135.0,
      progress: 0.5
    },
    {
      position: 2,
      participantId: 'driver-2',
      name: 'Drift King',
      time: 128000,
      gap: 3000,
      speed: 115.0,
      distance: 4800,
      status: 'active',
      lastUpdate: Date.now(),
      antiCheatRisk: 15,
      laps: 2,
      currentLapTime: 47000,
      bestLapTime: 43000,
      avgSpeed: 112.0,
      maxSpeed: 128.0,
      progress: 0.48
    },
    {
      position: 3,
      participantId: 'driver-3',
      name: 'Cheater Charlie',
      time: 130000,
      gap: 5000,
      speed: 150.0,
      distance: 4600,
      status: 'disqualified',
      lastUpdate: Date.now(),
      antiCheatRisk: 95,
      laps: 1,
      currentLapTime: 60000,
      bestLapTime: 38000,
      avgSpeed: 125.0,
      maxSpeed: 180.0,
      progress: 0.46
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebSocket.send.mockClear();
    mockWebSocket.close.mockClear();
  });

  test('renders leaderboard with basic structure', () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    expect(screen.getByText('Live Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('Pos')).toBeInTheDocument();
    expect(screen.getByText('Driver')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Gap')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Best Lap')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  test('shows connection status', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    // Should show connecting initially
    await waitFor(() => {
      expect(screen.getByText('connecting')).toBeInTheDocument();
    });
    
    // Simulate WebSocket open
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const openCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
    if (openCallback) openCallback();
    
    await waitFor(() => {
      expect(screen.getByText('connected')).toBeInTheDocument();
    });
  });

  test('displays anti-cheat column when enabled', () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} showAntiCheat={true} />);
    
    expect(screen.getByText('Risk')).toBeInTheDocument();
  });

  test('hides anti-cheat column when disabled', () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} showAntiCheat={false} />);
    
    expect(screen.queryByText('Risk')).not.toBeInTheDocument();
  });

  test('handles sorting changes', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    const sortSelect = screen.getByDisplayValue('Position');
    fireEvent.change(sortSelect, { target: { value: 'speed' } });
    
    expect(sortSelect).toHaveValue('speed');
  });

  test('handles filter changes', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    const filterSelect = screen.getByDisplayValue('All');
    fireEvent.change(filterSelect, { target: { value: 'active' } });
    
    expect(filterSelect).toHaveValue('active');
  });

  test('limits entries when maxEntries is set', () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} maxEntries={2} />);
    
    // Should only show 2 entries max
    // This would be tested with actual data via WebSocket messages
  });

  test('applies custom className', () => {
    const customClass = 'custom-leaderboard-class';
    render(<RealTimeLeaderboard raceId={mockRaceId} className={customClass} />);
    
    const leaderboard = screen.getByText('Live Leaderboard').closest('.real-time-leaderboard');
    expect(leaderboard).toHaveClass(customClass);
  });

  test('shows empty state when no data', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    // Simulate WebSocket connection but no data
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const openCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
    if (openCallback) openCallback();
    
    await waitFor(() => {
      expect(screen.getByText(/No participants in this race yet/)).toBeInTheDocument();
    });
  });

  test('handles WebSocket message for state snapshot', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    // Simulate WebSocket connection
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const openCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
    if (openCallback) openCallback();
    
    // Simulate receiving state snapshot
    const messageCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
    if (messageCallback) {
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: {
              id: mockRaceId,
              name: 'Test Race',
              status: 'racing',
              totalLength: 10000,
              totalLaps: 3
            },
            players: mockLeaderboardData.map(entry => ({
              id: entry.participantId,
              name: entry.name,
              totalTime: entry.time,
              totalDistance: entry.distance,
              status: entry.status,
              antiCheatRisk: entry.antiCheatRisk,
              completedLaps: entry.laps,
              currentLapTime: entry.currentLapTime,
              bestLapTime: entry.bestLapTime,
              avgSpeed: entry.avgSpeed,
              maxSpeed: entry.maxSpeed,
              currentSpeed: entry.speed
            }))
          }
        })
      });
    }
    
    await waitFor(() => {
      expect(screen.getByText('Speed Racer')).toBeInTheDocument();
      expect(screen.getByText('Drift King')).toBeInTheDocument();
      expect(screen.getByText('Cheater Charlie')).toBeInTheDocument();
    });
  });

  test('handles anti-cheat warning messages', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} showAntiCheat={true} />);
    
    // Simulate WebSocket connection
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const openCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
    if (openCallback) openCallback();
    
    // Simulate anti-cheat warning
    const messageCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
    if (messageCallback) {
      messageCallback({
        data: JSON.stringify({
          type: 'ANTI_CHEAT_WARNING',
          participantId: 'driver-2',
          riskScore: 85,
          anomalies: [
            {
              type: 'speed_spike',
              severity: 'high',
              description: 'Excessive speed detected'
            }
          ],
          recommendations: ['Monitor participant closely']
        })
      });
    }
    
    // Should update the risk score for the participant
    // This would be verified through the UI update
  });

  test('handles row selection', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    // First populate with data
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const openCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
    if (openCallback) openCallback();
    
    const messageCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
    if (messageCallback) {
      messageCallback({
        data: JSON.stringify({
          type: 'STATE_SNAPSHOT',
          state: {
            race: {
              id: mockRaceId,
              name: 'Test Race',
              status: 'racing',
              totalLength: 10000,
              totalLaps: 3
            },
            players: mockLeaderboardData.map(entry => ({
              id: entry.participantId,
              name: entry.name,
              totalTime: entry.time,
              totalDistance: entry.distance,
              status: entry.status,
              antiCheatRisk: entry.antiCheatRisk,
              completedLaps: entry.laps,
              currentLapTime: entry.currentLapTime,
              bestLapTime: entry.bestLapTime,
              avgSpeed: entry.avgSpeed,
              maxSpeed: entry.maxSpeed,
              currentSpeed: entry.speed
            }))
          }
        })
      });
    }
    
    await waitFor(() => {
      expect(screen.getByText('Speed Racer')).toBeInTheDocument();
    });
    
    // Click on a row to select it
    const driverRow = screen.getByText('Speed Racer').closest('tr');
    if (driverRow) {
      fireEvent.click(driverRow);
    }
    
    // Should show selection details
    await waitFor(() => {
      expect(screen.getByText('Distance:')).toBeInTheDocument();
      expect(screen.getByText('Current Lap:')).toBeInTheDocument();
      expect(screen.getByText('Last Update:')).toBeInTheDocument();
    });
  });

  test('handles WebSocket reconnection', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    
    // Simulate connection
    const openCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
    if (openCallback) openCallback();
    
    await waitFor(() => {
      expect(screen.getByText('connected')).toBeInTheDocument();
    });
    
    // Simulate disconnection
    const closeCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'close')?.[1];
    if (closeCallback) closeCallback();
    
    await waitFor(() => {
      expect(screen.getByText('disconnected')).toBeInTheDocument();
    });
    
    // Should attempt reconnection after delay
    jest.advanceTimersByTime(3000);
    
    // Should create new WebSocket instance
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });

  test('formats time display correctly', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    // Test time formatting would be verified through actual data display
    // This is more of an integration test with real data
  });

  test('formats speed display correctly', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    // Test speed formatting would be verified through actual data display
    // This is more of an integration test with real data
  });

  test('handles race status updates', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    const openCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'open')?.[1];
    if (openCallback) openCallback();
    
    const messageCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'message')?.[1];
    if (messageCallback) {
      messageCallback({
        data: JSON.stringify({
          type: 'RACE_STATUS_UPDATE',
          raceStatus: 'finished'
        })
      });
    }
    
    // Should update race status display
    // This would be verified through UI update
  });

  test('cleans up on unmount', () => {
    const { unmount } = render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    unmount();
    
    // Should close WebSocket connection
    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  test('handles error states gracefully', async () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} />);
    
    const wsInstance = (global.WebSocket as jest.Mock).mock.results[0].value;
    
    // Simulate WebSocket error
    const errorCallback = wsInstance.addEventListener.mock.calls.find(call => call[0] === 'error')?.[1];
    if (errorCallback) errorCallback(new Error('Connection failed'));
    
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });

  test('supports compact view mode', () => {
    render(<RealTimeLeaderboard raceId={mockRaceId} className="text-sm" />);
    
    const leaderboard = screen.getByText('Live Leaderboard').closest('.real-time-leaderboard');
    expect(leaderboard).toHaveClass('text-sm');
  });
});
