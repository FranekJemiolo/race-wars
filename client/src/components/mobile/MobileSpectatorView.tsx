import React, { useState, useEffect, useRef } from 'react';
import { getLeaderboardService } from '../../services/leaderboard.service';
import { getRaceReplayService } from '../../services/raceReplay.service';

interface MobileSpectatorViewProps {
  raceId: string;
  className?: string;
}

interface SpectatorRaceData {
  id: string;
  name: string;
  status: 'countdown' | 'racing' | 'finished';
  startTime?: number;
  trackInfo: {
    name: string;
    totalLaps: number;
    totalDistance: number;
  };
  participants: SpectatorParticipant[];
}

interface SpectatorParticipant {
  id: string;
  name: string;
  position: number;
  previousPosition: number;
  lap: number;
  lapTime: number;
  bestLapTime: number;
  totalTime: number;
  speed: number;
  status: 'active' | 'finished' | 'disqualified' | 'dnf';
  vehicle: string;
  gap?: number;
  antiCheatRisk?: number;
}

export const MobileSpectatorView: React.FC<MobileSpectatorViewProps> = ({
  raceId,
  className = ''
}) => {
  const leaderboardService = getLeaderboardService();
  const replayService = getRaceReplayService();
  
  const [activeTab, setActiveTab] = useState<'live' | 'leaderboard' | 'stats' | 'replay'>('live');
  const [raceData, setRaceData] = useState<SpectatorRaceData | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(1000);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(0);
  
  const swipeStartX = useRef<number>(0);
  const pinchStartDistance = useRef<number>(0);
  const currentScale = useRef<number>(1);
  const lastUpdateRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Check orientation
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    // Mock race data
    const mockRaceData: SpectatorRaceData = {
      id: raceId,
      name: 'San Francisco Grand Prix',
      status: 'racing',
      startTime: Date.now() - 120000,
      trackInfo: {
        name: 'San Francisco Circuit',
        totalLaps: 3,
        totalDistance: 15000
      },
      participants: Array.from({ length: 8 }, (_, i) => ({
        id: `driver-${i + 1}`,
        name: `Driver ${i + 1}`,
        position: i + 1,
        previousPosition: i + 1,
        lap: 1,
        lapTime: 45000 + i * 2000,
        bestLapTime: 44000 + i * 1000,
        totalTime: 45000 + i * 2000,
        speed: 160 + Math.random() * 40,
        status: 'active' as const,
        vehicle: i % 2 === 0 ? 'car' : 'motorcycle',
        gap: i === 0 ? 0 : (i * 1500),
        antiCheatRisk: Math.random() > 0.8 ? Math.random() * 100 : 0
      }))
    };

    setRaceData(mockRaceData);

    // Simulate live updates
    if (autoRefresh) {
      const interval = setInterval(() => {
        updateRaceData(mockRaceData);
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [raceId, refreshInterval, autoRefresh]);

  const updateRaceData = (currentData: SpectatorRaceData) => {
    const now = Date.now();
    const elapsed = now - (currentData.startTime || now);
    
    const updatedParticipants = currentData.participants.map((participant, index) => {
      const newLap = Math.floor(elapsed / 60000) + 1;
      const newLapTime = elapsed % 60000;
      const newSpeed = 160 + Math.sin(elapsed / 5000 + index) * 30;
      
      return {
        ...participant,
        position: index + 1,
        previousPosition: participant.position,
        lap: Math.min(newLap, currentData.trackInfo.totalLaps),
        lapTime: newLapTime,
        totalTime: elapsed,
        speed: Math.max(100, Math.min(220, newSpeed)),
        status: newLap > currentData.trackInfo.totalLaps ? 'finished' : 'active',
        gap: index === 0 ? 0 : index * 1500 + Math.random() * 500
      };
    });

    setRaceData({
      ...currentData,
      participants: updatedParticipants
    });
  };

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeDistance = swipeStartX.current - swipeEndX;
    
    if (Math.abs(swipeDistance) > 50) {
      const tabs = ['live', 'leaderboard', 'stats', 'replay'];
      const currentIndex = tabs.indexOf(activeTab);
      
      if (swipeDistance > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1] as any);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1] as any);
      }
    }
  };

  const handlePinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handlePinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / pinchStartDistance.current;
      
      currentScale.current = Math.max(0.5, Math.min(2, scale));
    }
  };

  const formatTime = (ms: number): string => {
    if (ms === 0) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const formatGap = (gap?: number): string => {
    if (!gap || gap === 0) return 'LEADER';
    if (gap < 1000) return `+${gap}ms`;
    return `+${formatTime(gap)}`;
  };

  const formatSpeed = (kmh: number): string => {
    return `${kmh.toFixed(1)} km/h`;
  };

  const getPositionChange = (current: number, previous: number): number => {
    return previous - current;
  };

  const getPositionChangeIcon = (change: number): string => {
    if (change > 0) return '⬆️';
    if (change < 0) return '⬇️';
    return '➡️';
  };

  const getPositionChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const toggleFullscreen = () => {
    setShowFullscreen(!showFullscreen);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (!raceData) {
    return (
      <div className={`mobile-spectator-view bg-gray-900 text-white min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🏁</div>
          <p className="text-xl">Loading race data...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`mobile-spectator-view bg-gray-900 text-white min-h-screen ${className} ${
        showFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      onTouchStartCapture={handlePinchStart}
      onTouchMoveCapture={handlePinchMove}
      style={{ transform: `scale(${currentScale.current})` }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold truncate">{raceData.name}</h1>
            <p className="text-xs text-gray-400">{raceData.trackInfo.name}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoRefresh}
              className={`p-2 rounded-lg touch-manipulation ${
                autoRefresh ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span className="text-sm">🔄</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 rounded-lg touch-manipulation"
            >
              <span className="text-sm">{showFullscreen ? '🔽' : '🔼'}</span>
            </button>
          </div>
        </div>

        {/* Race Status Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              raceData.status === 'racing' ? 'bg-green-600' :
              raceData.status === 'finished' ? 'bg-blue-600' :
              'bg-yellow-600'
            }`}>
              {raceData.status.toUpperCase()}
            </div>
            <div className="text-xs text-gray-400">
              {raceData.participants.filter(p => p.status === 'finished').length}/{raceData.participants.length} Finished
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-700">
          {['live', 'leaderboard', 'stats', 'replay'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-sm font-medium capitalize touch-manipulation ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Live Leaderboard */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Live Positions</h3>
              
              <div className="space-y-2">
                {raceData.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`bg-gray-700 rounded-lg p-4 touch-manipulation ${
                      selectedParticipant === participant.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedParticipant(
                      selectedParticipant === participant.id ? null : participant.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          participant.position === 1 ? 'bg-yellow-600' :
                          participant.position === 2 ? 'bg-gray-400' :
                          participant.position === 3 ? 'bg-orange-600' :
                          'bg-gray-600'
                        }`}>
                          {participant.position}
                        </div>
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{participant.vehicle}</span>
                            <span>•</span>
                            <span>{formatSpeed(participant.speed)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className={`text-sm ${getPositionChangeColor(
                            getPositionChange(participant.position, participant.previousPosition)
                          )}`}>
                            {getPositionChangeIcon(
                              getPositionChange(participant.position, participant.previousPosition)
                            )}
                          </span>
                          <span className="font-mono text-sm">{formatGap(participant.gap)}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Lap {participant.lap}/{raceData.trackInfo.totalLaps}
                        </p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedParticipant === participant.id && (
                      <div className="mt-4 pt-4 border-t border-gray-600 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Lap Time:</span>
                          <p className="font-mono">{formatTime(participant.lapTime)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Best Lap:</span>
                          <p className="font-mono">{formatTime(participant.bestLapTime)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Time:</span>
                          <p className="font-mono">{formatTime(participant.totalTime)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <p className="capitalize">{participant.status}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Race Overview */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Race Overview</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{raceData.participants.length}</p>
                  <p className="text-xs text-gray-400">Participants</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{raceData.trackInfo.totalLaps}</p>
                  <p className="text-xs text-gray-400">Total Laps</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{(raceData.trackInfo.totalDistance / 1000).toFixed(1)}</p>
                  <p className="text-xs text-gray-400">Track Length (km)</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{formatTime(Date.now() - (raceData.startTime || Date.now()))}</p>
                  <p className="text-xs text-gray-400">Race Time</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Full Leaderboard */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Complete Leaderboard</h3>
              
              <div className="space-y-2">
                {raceData.participants
                  .sort((a, b) => a.position - b.position)
                  .map((participant) => (
                    <div key={participant.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            participant.position === 1 ? 'bg-yellow-600' :
                            participant.position === 2 ? 'bg-gray-400' :
                            participant.position === 3 ? 'bg-orange-600' :
                            'bg-gray-600'
                          }`}>
                            {participant.position}
                          </div>
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-sm text-gray-400">{participant.vehicle}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-mono text-sm">{formatGap(participant.gap)}</p>
                          <p className="text-xs text-gray-400">
                            {participant.status === 'finished' ? formatTime(participant.totalTime) : `Lap ${participant.lap}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Position Changes */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Position Changes</h3>
              
              <div className="space-y-2">
                {raceData.participants
                  .filter(p => getPositionChange(p.position, p.previousPosition) !== 0)
                  .map((participant) => {
                    const change = getPositionChange(participant.position, participant.previousPosition);
                    return (
                      <div key={participant.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg ${getPositionChangeColor(change)}`}>
                            {getPositionChangeIcon(change)}
                          </span>
                          <span>{participant.name}</span>
                        </div>
                        <span className={`font-medium ${getPositionChangeColor(change)}`}>
                          {change > 0 ? '+' : ''}{change} {change > 0 ? 'gained' : 'lost'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Top Performers */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
              
              <div className="space-y-4">
                {/* Fastest Lap */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Fastest Lap</p>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span>{raceData.participants.reduce((fastest, p) => 
                        p.bestLapTime < fastest.bestLapTime ? p : fastest
                      ).name}</span>
                      <span className="font-mono">
                        {formatTime(Math.min(...raceData.participants.map(p => p.bestLapTime)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Speed */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Top Speed</p>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span>{raceData.participants.reduce((fastest, p) => 
                        p.speed > fastest.speed ? p : fastest
                      ).name}</span>
                      <span>{formatSpeed(Math.max(...raceData.participants.map(p => p.speed)))}</span>
                    </div>
                  </div>
                </div>

                {/* Most Consistent */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Most Consistent</p>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span>Driver 3</span>
                      <span>95% lap time variance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Race Statistics */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Race Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Average Speed</p>
                  <p className="text-lg font-semibold">
                    {formatSpeed(raceData.participants.reduce((sum, p) => sum + p.speed, 0) / raceData.participants.length)}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Average Lap Time</p>
                  <p className="text-lg font-semibold">
                    {formatTime(raceData.participants.reduce((sum, p) => sum + p.lapTime, 0) / raceData.participants.length)}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Finished</p>
                  <p className="text-lg font-semibold">
                    {raceData.participants.filter(p => p.status === 'finished').length}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-400 text-sm">Still Racing</p>
                  <p className="text-lg font-semibold">
                    {raceData.participants.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Lap Times Analysis */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Current Lap Times</h3>
              
              <div className="space-y-2">
                {raceData.participants
                  .sort((a, b) => a.lapTime - b.lapTime)
                  .slice(0, 5)
                  .map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                      <span className="text-sm">{participant.name}</span>
                      <span className="font-mono text-sm">{formatTime(participant.lapTime)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'replay' && (
          <div className="space-y-4">
            {/* Replay Controls */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Race Replay</h3>
              
              <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <p className="text-gray-400">Replay Player</p>
                  <p className="text-sm text-gray-500 mt-1">Watch the race again</p>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium touch-manipulation">
                  ▶ Start Replay
                </button>
                <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation">
                  📥 Download Replay
                </button>
              </div>
            </div>

            {/* Available Replays */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4">Past Replays</h3>
              
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Race #{i + 1}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation">
                        ▶ Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🔴</span>
            <span className="text-xs text-gray-400">Live</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🏆</span>
            <span className="text-xs text-gray-400">Standings</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📊</span>
            <span className="text-xs text-gray-400">Stats</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🎬</span>
            <span className="text-xs text-gray-400">Replay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
