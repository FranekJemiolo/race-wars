import React, { useState, useEffect, useRef } from 'react';
import { getLeaderboardService } from '../../services/leaderboard.service';

interface MobileRaceStatsProps {
  raceId: string;
  participantId?: string;
  className?: string;
}

interface RaceStats {
  totalDistance: number;
  avgSpeed: number;
  maxSpeed: number;
  avgLapTime: number;
  bestLapTime: number;
  currentPosition: number;
  previousPosition: number;
  overtakes: number;
  timeGained: number;
  timeLost: number;
  consistency: number;
  raceProgress: number;
  estimatedFinishTime: number;
}

interface LapStats {
  lapNumber: number;
  lapTime: number;
  sector1: number;
  sector2: number;
  sector3: number;
  speed: number;
  position: number;
}

export const MobileRaceStats: React.FC<MobileRaceStatsProps> = ({
  raceId,
  participantId,
  className = ''
}) => {
  const leaderboardService = getLeaderboardService();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'laps' | 'comparison' | 'trends'>('overview');
  const [stats, setStats] = useState<RaceStats | null>(null);
  const [lapStats, setLapStats] = useState<LapStats[]>([]);
  const [selectedLap, setSelectedLap] = useState<number | null>(null);
  const [comparisonParticipant, setComparisonParticipant] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const chartRef = useRef<HTMLCanvasElement>(null);
  const pullToRefreshRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [raceId, participantId]);

  useEffect(() => {
    if (chartRef.current && stats) {
      drawSpeedChart();
    }
  }, [stats, activeTab]);

  const loadStats = async () => {
    try {
      // Mock stats data
      const mockStats: RaceStats = {
        totalDistance: 12500,
        avgSpeed: 165.5,
        maxSpeed: 198.3,
        avgLapTime: 45234,
        bestLapTime: 43891,
        currentPosition: 3,
        previousPosition: 4,
        overtakes: 2,
        timeGained: 3456,
        timeLost: 1234,
        consistency: 87.3,
        raceProgress: 65.4,
        estimatedFinishTime: 67890
      };

      const mockLapStats: LapStats[] = Array.from({ length: 2 }, (_, i) => ({
        lapNumber: i + 1,
        lapTime: 45000 + i * 2000,
        sector1: 15000 + i * 500,
        sector2: 18000 + i * 800,
        sector3: 12000 + i * 700,
        speed: 160 + i * 10,
        position: 4 - i
      }));

      setStats(mockStats);
      setLapStats(mockLapStats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
      const touch = e.touches[0];
      setPullDistance(touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPulling) {
      const touch = e.touches[0];
      const distance = touch.clientY - pullDistance;
      if (distance > 0 && distance < 150) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isPulling && pullDistance > 80) {
      handleRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const drawSpeedChart = () => {
    if (!chartRef.current || !stats) return;
    
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw speed chart
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points = 50;
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const speedVariation = Math.sin(i / 5) * 20;
      const y = height - ((stats.avgSpeed + speedVariation) / 220) * height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();

    // Draw max speed line
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const maxY = height - (stats.maxSpeed / 220) * height;
    ctx.moveTo(0, maxY);
    ctx.lineTo(width, maxY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (kmh: number): string => {
    return `${kmh.toFixed(1)} km/h`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const getPositionChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getConsistencyColor = (consistency: number): string => {
    if (consistency >= 90) return 'text-green-500';
    if (consistency >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!stats) {
    return (
      <div className={`mobile-race-stats bg-gray-900 text-white min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-race-stats bg-gray-900 text-white min-h-screen ${className}`}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}>
      
      {/* Pull to Refresh */}
      <div
        ref={pullToRefreshRef}
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center items-center bg-gray-800 transition-transform duration-200 ${
          isPulling ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ transform: isPulling ? `translateY(${Math.min(pullDistance - 80, 0)}px)` : '' }}
      >
        <div className="flex items-center gap-2 py-4">
          <div className={`w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full ${
            isRefreshing ? 'animate-spin' : ''
          }`} />
          <span className="text-sm text-gray-400">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700 safe-area-top">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold">Race Statistics</h1>
            <p className="text-xs text-gray-400">
              Updated {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-gray-700 rounded-lg touch-manipulation disabled:opacity-50"
          >
            <span className={`text-xl ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-700">
          {['overview', 'laps', 'comparison', 'trends'].map((tab) => (
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
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Position Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Position & Performance</h3>
              
              <div className="flex items-center justify-between mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-1">#{stats.currentPosition}</div>
                  <div className="text-sm text-gray-400">Current Position</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getPositionChangeColor(stats.previousPosition - stats.currentPosition)}`}>
                    {stats.previousPosition - stats.currentPosition > 0 ? '+' : ''}
                    {stats.previousPosition - stats.currentPosition}
                  </div>
                  <div className="text-sm text-gray-400">Position Change</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats.overtakes}</div>
                  <div className="text-sm text-gray-400">Overtakes</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Time Gained</p>
                  <p className="text-lg font-semibold text-green-500">
                    +{formatTime(stats.timeGained)}
                  </p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Time Lost</p>
                  <p className="text-lg font-semibold text-red-500">
                    -{formatTime(stats.timeLost)}
                  </p>
                </div>
              </div>
            </div>

            {/* Speed & Distance */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Speed & Distance</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Average Speed</span>
                    <span>{formatSpeed(stats.avgSpeed)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(stats.avgSpeed / 220) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Max Speed</span>
                    <span>{formatSpeed(stats.maxSpeed)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(stats.maxSpeed / 220) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Total Distance</span>
                    <span>{formatDistance(stats.totalDistance)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats.raceProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speed Chart */}
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-2">Speed Profile</p>
                <canvas
                  ref={chartRef}
                  width={300}
                  height={100}
                  className="w-full bg-gray-700 rounded-lg"
                />
              </div>
            </div>

            {/* Lap Times */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Lap Performance</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Average Lap</p>
                  <p className="text-lg font-semibold">{formatTime(stats.avgLapTime)}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Best Lap</p>
                  <p className="text-lg font-semibold text-green-500">{formatTime(stats.bestLapTime)}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Consistency</span>
                  <span className={`font-semibold ${getConsistencyColor(stats.consistency)}`}>
                    {stats.consistency.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stats.consistency >= 90 ? 'bg-green-500' :
                      stats.consistency >= 75 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${stats.consistency}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Race Progress */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Race Progress</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress</span>
                  <span>{stats.raceProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.raceProgress}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Est. Finish Time</span>
                  <span>{formatTime(stats.estimatedFinishTime)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'laps' && (
          <div className="space-y-4">
            {/* Lap Times */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Lap Analysis</h3>
              
              <div className="space-y-3">
                {lapStats.map((lap) => (
                  <div
                    key={lap.lapNumber}
                    className={`bg-gray-700 rounded-lg p-4 touch-manipulation ${
                      selectedLap === lap.lapNumber ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedLap(
                      selectedLap === lap.lapNumber ? null : lap.lapNumber
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {lap.lapNumber}
                        </div>
                        <div>
                          <p className="font-medium">Lap {lap.lapNumber}</p>
                          <p className="text-sm text-gray-400">Position {lap.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono">{formatTime(lap.lapTime)}</p>
                        <p className="text-sm text-gray-400">{formatSpeed(lap.speed)}</p>
                      </div>
                    </div>

                    {/* Expanded Lap Details */}
                    {selectedLap === lap.lapNumber && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <p className="text-sm text-gray-400 mb-2">Sector Times</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-600 rounded p-2">
                            <p className="text-xs text-gray-400">S1</p>
                            <p className="font-mono text-sm">{formatTime(lap.sector1)}</p>
                          </div>
                          <div className="bg-gray-600 rounded p-2">
                            <p className="text-xs text-gray-400">S2</p>
                            <p className="font-mono text-sm">{formatTime(lap.sector2)}</p>
                          </div>
                          <div className="bg-gray-600 rounded p-2">
                            <p className="text-xs text-gray-400">S3</p>
                            <p className="font-mono text-sm">{formatTime(lap.sector3)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lap Comparison */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Lap Comparison</h3>
              
              <div className="space-y-3">
                {lapStats.map((lap) => (
                  <div key={lap.lapNumber} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <span className="text-sm">Lap {lap.lapNumber}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm">{formatTime(lap.lapTime)}</span>
                      <span className="text-xs text-gray-400">
                        {lap.lapTime === stats.bestLapTime ? 'BEST' : 
                         `+${formatTime(lap.lapTime - stats.bestLapTime)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-4">
            {/* Participant Comparison */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Compare with</h3>
              
              <select
                value={comparisonParticipant}
                onChange={(e) => setComparisonParticipant(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white mb-4"
              >
                <option value="">Select participant...</option>
                <option value="driver-2">Driver 2</option>
                <option value="driver-3">Driver 3</option>
                <option value="driver-4">Driver 4</option>
              </select>

              {comparisonParticipant && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Your Position</p>
                      <p className="text-lg font-semibold">#{stats.currentPosition}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Their Position</p>
                      <p className="text-lg font-semibold">#2</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Your Best Lap</p>
                      <p className="font-mono">{formatTime(stats.bestLapTime)}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Their Best Lap</p>
                      <p className="font-mono">{formatTime(42500)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">Gap to Leader</p>
                    <div className="flex items-center justify-between">
                      <span>You: +{formatTime(2500)}</span>
                      <span>Them: +{formatTime(1200)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Speed</span>
                    <span>{formatSpeed(stats.avgSpeed)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Consistency</span>
                    <span>{stats.consistency.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.consistency}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Racecraft</span>
                    <span>Good</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-4">
            {/* Performance Trends */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Position Trend</p>
                  <div className="flex items-end justify-between h-20">
                    {[4, 3, 4, 3, 2, 3].map((pos, i) => (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-4 bg-blue-500 rounded-t"
                          style={{ height: `${(5 - pos) * 16}px` }}
                        />
                        <span className="text-xs text-gray-400 mt-1">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Lap Time Trend</p>
                  <div className="flex items-end justify-between h-20">
                    {[45000, 44000, 45500, 43800, 44500].map((time, i) => (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div 
                          className="w-4 bg-green-500 rounded-t"
                          style={{ height: `${((46000 - time) / 3000) * 64}px` }}
                        />
                        <span className="text-xs text-gray-400 mt-1">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Predictions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Race Predictions</h3>
              
              <div className="space-y-3">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Final Position</span>
                    <span className="font-semibold">2nd</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Based on current pace</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Finish Time</span>
                    <span className="font-semibold">{formatTime(stats.estimatedFinishTime)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Estimated completion time</p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Podium Chance</span>
                    <span className="font-semibold text-green-500">78%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Probability of finishing top 3</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40 safe-area-bottom">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📊</span>
            <span className="text-xs text-gray-400">Overview</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🏁</span>
            <span className="text-xs text-gray-400">Laps</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">⚖️</span>
            <span className="text-xs text-gray-400">Compare</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📈</span>
            <span className="text-xs text-gray-400">Trends</span>
          </button>
        </div>
      </div>
    </div>
  );
};
