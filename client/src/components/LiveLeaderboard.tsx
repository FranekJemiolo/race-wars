/**
 * Live Leaderboard Component
 * 
 * Displays real-time leaderboard for a session with:
 * - Current positions
 * - Lap times
 * - Gap to leader
 * - Last lap time
 * - Best lap time
 * - Real-time updates via WebSocket
 */

import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  position: number;
  participantId: string;
  name: string;
  carNumber: string;
  totalLaps: number;
  lastLapTime: number;
  bestLapTime: number;
  gapToLeader: number;
  gapToAhead: number;
  currentSpeed: number;
  lastSector: number;
  inPit: boolean;
  retired: boolean;
}

interface LiveLeaderboardProps {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  sessionId,
  autoRefresh = true,
  refreshInterval = 1000,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'position' | 'bestLap' | 'lastLap'>('position');
  const [showRetired, setShowRetired] = useState(false);

  useEffect(() => {
    loadLeaderboard();

    if (autoRefresh) {
      const interval = setInterval(loadLeaderboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [sessionId, autoRefresh, refreshInterval]);

  const loadLeaderboard = async () => {
    try {
      // Mock data - replace with actual API call
      const mockEntries: LeaderboardEntry[] = [
        {
          position: 1,
          participantId: '1',
          name: 'John Doe',
          carNumber: '42',
          totalLaps: 12,
          lastLapTime: 89.5,
          bestLapTime: 88.3,
          gapToLeader: 0,
          gapToAhead: 0,
          currentSpeed: 165.2,
          lastSector: 3,
          inPit: false,
          retired: false,
        },
        {
          position: 2,
          participantId: '2',
          name: 'Jane Smith',
          carNumber: '7',
          totalLaps: 12,
          lastLapTime: 90.2,
          bestLapTime: 89.1,
          gapToLeader: 2.3,
          gapToAhead: 2.3,
          currentSpeed: 158.7,
          lastSector: 2,
          inPit: false,
          retired: false,
        },
        {
          position: 3,
          participantId: '3',
          name: 'Bob Johnson',
          carNumber: '11',
          totalLaps: 12,
          lastLapTime: 91.8,
          bestLapTime: 90.5,
          gapToLeader: 5.1,
          gapToAhead: 2.8,
          currentSpeed: 152.3,
          lastSector: 1,
          inPit: false,
          retired: false,
        },
        {
          position: 4,
          participantId: '4',
          name: 'Alice Williams',
          carNumber: '23',
          totalLaps: 11,
          lastLapTime: 92.5,
          bestLapTime: 91.2,
          gapToLeader: 8.4,
          gapToAhead: 3.3,
          currentSpeed: 0,
          lastSector: 0,
          inPit: true,
          retired: false,
        },
        {
          position: 5,
          participantId: '5',
          name: 'Charlie Brown',
          carNumber: '5',
          totalLaps: 10,
          lastLapTime: 94.2,
          bestLapTime: 92.8,
          gapToLeader: 15.2,
          gapToAhead: 6.8,
          currentSpeed: 0,
          lastSector: 0,
          inPit: false,
          retired: true,
        },
      ];

      setEntries(mockEntries);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const getSortedEntries = () => {
    const sorted = [...entries];
    
    if (sortBy === 'bestLap') {
      sorted.sort((a, b) => a.bestLapTime - b.bestLapTime);
    } else if (sortBy === 'lastLap') {
      sorted.sort((a, b) => a.lastLapTime - b.lastLapTime);
    }
    
    return sorted;
  };

  const displayedEntries = showRetired 
    ? getSortedEntries()
    : getSortedEntries().filter(e => !e.retired);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(3);
    return `${minutes}:${seconds}`;
  };

  const formatGap = (gap: number) => {
    if (gap === 0) return '-';
    return `+${gap.toFixed(1)}s`;
  };

  const getPositionChange = (entry: LeaderboardEntry) => {
    // In a real implementation, this would compare with previous position
    return null;
  };

  const getBestLapHighlight = (entry: LeaderboardEntry) => {
    const bestTime = Math.min(...entries.map(e => e.bestLapTime));
    return entry.bestLapTime === bestTime;
  };

  if (isLoading) {
    return <div className="p-6">Loading leaderboard...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Live Leaderboard</h2>
        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="position">Position</option>
            <option value="bestLap">Best Lap</option>
            <option value="lastLap">Last Lap</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showRetired}
              onChange={(e) => setShowRetired(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Retired</span>
          </label>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Pos</th>
              <th className="text-left py-3 px-4">Car</th>
              <th className="text-left py-3 px-4">Driver</th>
              <th className="text-right py-3 px-4">Laps</th>
              <th className="text-right py-3 px-4">Gap</th>
              <th className="text-right py-3 px-4">Int</th>
              <th className="text-right py-3 px-4">Last Lap</th>
              <th className="text-right py-3 px-4">Best Lap</th>
              <th className="text-right py-3 px-4">Speed</th>
              <th className="text-center py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayedEntries.map((entry, index) => (
              <tr
                key={entry.participantId}
                className={`border-b hover:bg-gray-50 ${
                  entry.position === 1 ? 'bg-yellow-50' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${
                      entry.position === 1 ? 'text-yellow-600' :
                      entry.position === 2 ? 'text-gray-400' :
                      entry.position === 3 ? 'text-orange-400' :
                      'text-gray-600'
                    }`}>
                      {entry.position}
                    </span>
                    {getPositionChange(entry) && (
                      <span className="text-xs text-green-600">▲</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">#{entry.carNumber}</td>
                <td className="py-3 px-4">{entry.name}</td>
                <td className="py-3 px-4 text-right font-medium">{entry.totalLaps}</td>
                <td className="py-3 px-4 text-right">{formatGap(entry.gapToLeader)}</td>
                <td className="py-3 px-4 text-right">{formatGap(entry.gapToAhead)}</td>
                <td className="py-3 px-4 text-right">{formatTime(entry.lastLapTime)}</td>
                <td className={`py-3 px-4 text-right ${
                  getBestLapHighlight(entry) ? 'font-bold text-green-600' : ''
                }`}>
                  {formatTime(entry.bestLapTime)}
                  {getBestLapHighlight(entry) && ' 🏆'}
                </td>
                <td className="py-3 px-4 text-right">
                  {entry.currentSpeed > 0 ? `${entry.currentSpeed.toFixed(0)} km/h` : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  {entry.inPit && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">PIT</span>
                  )}
                  {entry.retired && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">RET</span>
                  )}
                  {!entry.inPit && !entry.retired && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">RUN</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Total Drivers</div>
            <div className="text-xl font-bold">{entries.length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-xl font-bold">{entries.filter(e => !e.retired).length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">In Pit</div>
            <div className="text-xl font-bold">{entries.filter(e => e.inPit).length}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Best Lap</div>
            <div className="text-xl font-bold text-green-600">
              {formatTime(Math.min(...entries.map(e => e.bestLapTime)))}
            </div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span>Live updates every {refreshInterval / 1000}s</span>
      </div>
    </div>
  );
};
