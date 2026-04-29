import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClientMessage, ServerMessage } from '@race-wars/shared';

interface LeaderboardEntry {
  position: number;
  participantId: string;
  name: string;
  time: number;
  gap: number;
  speed: number;
  distance: number;
  status: 'active' | 'finished' | 'disqualified' | 'dnf';
  lastUpdate: number;
  antiCheatRisk?: number;
  laps: number;
  currentLapTime: number;
  bestLapTime: number;
}

interface RaceInfo {
  id: string;
  name: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  startTime?: number;
  totalTime?: number;
  totalDistance: number;
  totalLaps: number;
  participants: number;
}

interface RealTimeLeaderboardProps {
  raceId: string;
  className?: string;
  showAntiCheat?: boolean;
  maxEntries?: number;
}

export const RealTimeLeaderboard: React.FC<RealTimeLeaderboardProps> = ({
  raceId,
  className = '',
  showAntiCheat = true,
  maxEntries = 20
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [raceInfo, setRaceInfo] = useState<RaceInfo | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'position' | 'speed' | 'bestLap'>('position');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'finished'>('all');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    const ws = new WebSocket(`ws://localhost:8080`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('Leaderboard WebSocket connected');
      
      // Request initial state
      const message: ClientMessage = {
        type: 'FULL_RESYNC',
        version: '1.0'
      };
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('Leaderboard WebSocket disconnected');
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('Leaderboard WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: ServerMessage) => {
    lastUpdateTimeRef.current = Date.now();

    switch (message.type) {
      case 'STATE_SNAPSHOT':
        if (message.state) {
          // Convert server state to leaderboard format
          const entries: LeaderboardEntry[] = message.state.players.map((player, index) => ({
            position: index + 1,
            participantId: player.id,
            name: player.name,
            time: player.totalTime || 0,
            gap: calculateGap(index, message.state.players),
            speed: player.currentSpeed || 0,
            distance: player.totalDistance || 0,
            status: player.status || 'active',
            lastUpdate: Date.now(),
            antiCheatRisk: player.antiCheatRisk || 0,
            laps: player.completedLaps || 0,
            currentLapTime: player.currentLapTime || 0,
            bestLapTime: player.bestLapTime || 0
          }));

          setLeaderboard(entries);
          setRaceInfo({
            id: message.state.race.id,
            name: message.state.race.name,
            status: message.state.race.status || 'waiting',
            startTime: message.state.race.startTime,
            totalTime: message.state.race.totalTime,
            totalDistance: message.state.race.totalLength || 0,
            totalLaps: message.state.race.totalLaps || 0,
            participants: message.state.players.length
          });
        }
        break;

      case 'LEADERBOARD_UPDATE':
        if (message.leaderboard) {
          setLeaderboard(message.leaderboard);
        }
        break;

      case 'ANTI_CHEAT_WARNING':
        if (showAntiCheat && message.participantId) {
          setLeaderboard(prev => prev.map(entry => 
            entry.participantId === message.participantId
              ? { ...entry, antiCheatRisk: message.riskScore }
              : entry
          ));
        }
        break;

      case 'RACE_STATUS_UPDATE':
        if (message.raceStatus) {
          setRaceInfo(prev => prev ? { ...prev, status: message.raceStatus } : null);
        }
        break;
    }
  }, [showAntiCheat]);

  // Calculate gap to leader
  const calculateGap = (index: number, players: any[]): number => {
    if (index === 0) return 0;
    const leaderTime = players[0]?.totalTime || 0;
    const currentTime = players[index]?.totalTime || 0;
    return currentTime - leaderTime;
  };

  // Format time display
  const formatTime = (time: number): string => {
    if (time === 0) return '--:--';
    
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Format gap display
  const formatGap = (gap: number): string => {
    if (gap === 0) return 'LEADER';
    return `+${formatTime(gap)}`;
  };

  // Format speed display
  const formatSpeed = (speed: number): string => {
    return `${speed.toFixed(1)} km/h`;
  };

  // Format distance display
  const formatDistance = (distance: number): string => {
    if (distance < 1000) return `${distance.toFixed(0)}m`;
    return `${(distance / 1000).toFixed(2)}km`;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'finished': return 'text-blue-600';
      case 'disqualified': return 'text-red-600';
      case 'dnf': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Get anti-cheat risk color
  const getAntiCheatRiskColor = (risk?: number): string => {
    if (!risk || risk === 0) return '';
    if (risk < 30) return 'text-yellow-600';
    if (risk < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  // Sort and filter leaderboard
  const getProcessedLeaderboard = (): LeaderboardEntry[] => {
    let filtered = [...leaderboard];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.status === filterStatus);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'speed':
          return b.speed - a.speed;
        case 'bestLap':
          return (a.bestLapTime || Infinity) - (b.bestLapTime || Infinity);
        case 'position':
        default:
          return a.position - b.position;
      }
    });
    
    // Limit entries
    return filtered.slice(0, maxEntries);
  };

  // Initialize connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [connectWebSocket]);

  // Animation loop for smooth updates
  useEffect(() => {
    const animate = () => {
      // Update time-based displays
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      // Update current lap times for active participants
      setLeaderboard(prev => prev.map(entry => {
        if (entry.status === 'active' && entry.currentLapTime > 0) {
          return {
            ...entry,
            currentLapTime: entry.currentLapTime + timeSinceLastUpdate
          };
        }
        return entry;
      }));
      
      lastUpdateTimeRef.current = now;
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const processedLeaderboard = getProcessedLeaderboard();

  return (
    <div className={`real-time-leaderboard bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Live Leaderboard</h2>
            {raceInfo && (
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600">{raceInfo.name}</span>
                <span className={`text-sm font-medium capitalize ${
                  raceInfo.status === 'racing' ? 'text-green-600' : 
                  raceInfo.status === 'finished' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {raceInfo.status}
                </span>
                <span className="text-sm text-gray-600">
                  {raceInfo.participants} participants
                </span>
              </div>
            )}
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="position">Position</option>
              <option value="speed">Speed</option>
              <option value="bestLap">Best Lap</option>
            </select>
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          {/* Race Info */}
          {raceInfo && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Laps: {raceInfo.totalLaps}</span>
              <span>Distance: {formatDistance(raceInfo.totalDistance)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gap
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Speed
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Best Lap
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {showAntiCheat && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedLeaderboard.map((entry, index) => (
              <tr
                key={entry.participantId}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedEntry === entry.participantId ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedEntry(
                  selectedEntry === entry.participantId ? null : entry.participantId
                )}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`font-bold ${
                      entry.position === 1 ? 'text-yellow-500' :
                      entry.position === 2 ? 'text-gray-400' :
                      entry.position === 3 ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {entry.position}
                    </span>
                    {index > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({index > 0 ? '+' + (entry.position - processedLeaderboard[0].position) : ''})
                      </span>
                    )}
                  </div>
                </td>
                
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Lap {entry.laps}/{raceInfo?.totalLaps || 0}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(entry.time)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatGap(entry.gap)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatSpeed(entry.speed)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {entry.bestLapTime > 0 ? formatTime(entry.bestLapTime) : '--:--'}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-sm font-medium capitalize ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </td>

                {showAntiCheat && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {entry.antiCheatRisk && entry.antiCheatRisk > 0 ? (
                      <div className="flex items-center">
                        <div className={`text-sm font-medium ${getAntiCheatRiskColor(entry.antiCheatRisk)}`}>
                          {entry.antiCheatRisk}%
                        </div>
                        {entry.antiCheatRisk > 70 && (
                          <span className="ml-1 text-red-500">⚠️</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">--</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {processedLeaderboard.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {connectionStatus === 'connected' ? 
              'No participants in this race yet' : 
              'Connecting to race...'
            }
          </div>
        </div>
      )}

      {/* Selected Entry Details */}
      {selectedEntry && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Distance:</span>
              <div className="text-gray-900">{formatDistance(leaderboard.find(e => e.participantId === selectedEntry)?.distance || 0)}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Current Lap:</span>
              <div className="text-gray-900">
                {formatTime(leaderboard.find(e => e.participantId === selectedEntry)?.currentLapTime || 0)}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Update:</span>
              <div className="text-gray-900">
                {new Date(leaderboard.find(e => e.participantId === selectedEntry)?.lastUpdate || 0).toLocaleTimeString()}
              </div>
            </div>
            {showAntiCheat && (
              <div>
                <span className="font-medium text-gray-700">Anti-Cheat:</span>
                <div className={`font-medium ${getAntiCheatRiskColor(leaderboard.find(e => e.participantId === selectedEntry)?.antiCheatRisk)}`}>
                  {leaderboard.find(e => e.participantId === selectedEntry)?.antiCheatRisk || 0}% risk
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
