import React, { useState, useEffect, useRef } from 'react';
import { getGPSManager, GPSData } from '../../services/gpsTracking.service';
import { getLeaderboardService } from '../../services/leaderboard.service';

interface MobileParticipantDashboardProps {
  participantId: string;
  raceId: string;
  className?: string;
}

export const MobileParticipantDashboard: React.FC<MobileParticipantDashboardProps> = ({
  participantId,
  raceId,
  className = ''
}) => {
  const gpsManager = getGPSManager();
  const leaderboardService = getLeaderboardService();
  
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentLap, setCurrentLap] = useState(1);
  const [totalLaps, setTotalLaps] = useState(3);
  const [lapTime, setLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [antiCheatRisk, setAntiCheatRisk] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'map' | 'actions'>('overview');
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const pullToRefreshRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    // Update connection status
    const updateConnectionStatus = () => {
      const connected = gpsManager.isConnected();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    };

    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Listen for GPS updates
    const handleGPSUpdate = (data: GPSData) => {
      if (data.participantId === participantId) {
        setCurrentSpeed(data.speed);
        setDistance(data.totalDistance || 0);
        setLapTime(data.currentLapTime || 0);
        setBestLapTime(data.bestLapTime || 0);
        setTotalTime(data.totalTime || 0);
        setCurrentLap(data.lap || 1);
      }
    };

    gpsManager.on('position_update', handleGPSUpdate);
    return () => gpsManager.off('position_update', handleGPSUpdate);
  }, [participantId]);

  useEffect(() => {
    // Listen for leaderboard updates
    const handleLeaderboardUpdate = () => {
      const entry = leaderboardService.getEntry(participantId);
      if (entry) {
        setCurrentPosition(entry.position);
        setAntiCheatRisk(entry.antiCheatRisk || 0);
      }
    };

    leaderboardService.on('entry_updated', handleLeaderboardUpdate);
    return () => leaderboardService.off('entry_updated', handleLeaderboardUpdate);
  }, [participantId]);

  // Pull to refresh functionality
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
      // Trigger refresh
      refreshData();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  const refreshData = () => {
    // Force data refresh
    const entry = leaderboardService.getEntry(participantId);
    if (entry) {
      setCurrentPosition(entry.position);
      setAntiCheatRisk(entry.antiCheatRisk || 0);
    }
  };

  const toggleTracking = () => {
    if (isTracking) {
      gpsManager.stopTracking();
      setIsTracking(false);
    } else {
      gpsManager.startTracking(participantId);
      setIsTracking(true);
    }
  };

  const formatTime = (ms: number): string => {
    if (ms === 0) return '--:--';
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

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getRiskColor = () => {
    if (antiCheatRisk === 0) return 'text-green-600';
    if (antiCheatRisk < 30) return 'text-yellow-600';
    if (antiCheatRisk < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`mobile-participant-dashboard bg-gray-900 text-white min-h-screen ${className}`}>
      {/* Pull to Refresh Indicator */}
      <div
        ref={pullToRefreshRef}
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center items-center bg-gray-800 transition-transform duration-200 ${
          isPulling ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ transform: isPulling ? `translateY(${Math.min(pullDistance - 80, 0)}px)` : '' }}
      >
        <div className="flex items-center gap-2 py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Refreshing...</span>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getConnectionColor()}`} />
            <div>
              <h1 className="text-lg font-bold">Race Dashboard</h1>
              <p className="text-xs text-gray-400">Position {currentPosition}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-2 bg-gray-700 rounded-lg touch-manipulation"
          >
            <span className="text-xl">⚡</span>
          </button>
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="absolute top-16 right-4 bg-gray-800 rounded-lg shadow-lg p-2 z-50">
            <button
              onClick={toggleTracking}
              className={`w-full px-4 py-2 rounded text-left touch-manipulation ${
                isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
            </button>
            <button
              onClick={refreshData}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-left mt-1 touch-manipulation"
            >
              🔄 Refresh
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-700">
          {['overview', 'stats', 'map', 'actions'].map((tab) => (
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
      <div className="p-4 pb-20" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Position Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">#{currentPosition}</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentPosition === 1 ? 'bg-yellow-600' :
                  currentPosition === 2 ? 'bg-gray-400' :
                  currentPosition === 3 ? 'bg-orange-600' :
                  'bg-gray-600'
                }`}>
                  {currentPosition === 1 ? 'LEADER' : `Position ${currentPosition}`}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Current Speed</p>
                  <p className="text-xl font-semibold">{formatSpeed(currentSpeed)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Lap {currentLap}/{totalLaps}</p>
                  <p className="text-xl font-semibold">{formatTime(lapTime)}</p>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Race Progress</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Distance</span>
                    <span>{formatDistance(distance)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((distance / (totalLaps * 5000)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Lap Progress</span>
                    <span>{Math.round((distance % 5000) / 50)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((distance % 5000) / 5000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Total Time</p>
                <p className="text-lg font-semibold">{formatTime(totalTime)}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Best Lap</p>
                <p className="text-lg font-semibold">{formatTime(bestLapTime)}</p>
              </div>
            </div>

            {/* Anti-Cheat Warning */}
            {antiCheatRisk > 0 && (
              <div className={`bg-gray-800 rounded-xl p-4 border ${
                antiCheatRisk > 70 ? 'border-red-500' :
                antiCheatRisk > 30 ? 'border-orange-500' :
                'border-yellow-500'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold">Anti-Cheat Alert</p>
                    <p className={`text-sm ${getRiskColor()}`}>Risk Level: {antiCheatRisk}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Speed Stats */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Performance</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Speed</span>
                  <span className="font-semibold">{formatSpeed(currentSpeed * 0.9)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Speed</span>
                  <span className="font-semibold">{formatSpeed(currentSpeed * 1.1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Consistency</span>
                  <span className="font-semibold">85%</span>
                </div>
              </div>
            </div>

            {/* Lap Times */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Lap Times</h3>
              
              <div className="space-y-2">
                {Array.from({ length: currentLap }, (_, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <span className="text-gray-400">Lap {i + 1}</span>
                    <span className="font-mono">
                      {i === currentLap - 1 ? formatTime(lapTime) : formatTime(45000 + i * 2000)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Position History */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Position History</h3>
              
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-700 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-yellow-600' :
                      i === 1 ? 'bg-gray-400' :
                      i === 2 ? 'bg-orange-600' :
                      'bg-gray-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Lap {i + 1}</span>
                        <span className="text-sm">{formatTime(i * 60000)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* Map View */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Live Map</h3>
              
              <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="text-gray-400">Map View</p>
                  <p className="text-sm text-gray-500 mt-1">Interactive race map coming soon</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-gray-400">Latitude</p>
                  <p className="font-mono">37.7749°N</p>
                </div>
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-gray-400">Longitude</p>
                  <p className="font-mono">122.4194°W</p>
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Track Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Track Name</span>
                  <span>San Francisco Circuit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Length</span>
                  <span>5.0 km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Laps</span>
                  <span>{totalLaps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Race Distance</span>
                  <span>{(totalLaps * 5).toFixed(1)} km</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="space-y-4">
            {/* Tracking Control */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">GPS Tracking</h3>
              
              <button
                onClick={toggleTracking}
                className={`w-full py-4 rounded-lg font-medium text-lg touch-manipulation ${
                  isTracking 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isTracking ? '⏹ Stop GPS Tracking' : '▶ Start GPS Tracking'}
              </button>
              
              <div className="mt-4 text-sm text-gray-400">
                <p>• Tracking: {isTracking ? 'Active' : 'Inactive'}</p>
                <p>• Accuracy: ±5 meters</p>
                <p>• Update Rate: 1 second</p>
              </div>
            </div>

            {/* Race Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Race Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium touch-manipulation">
                  🏁 Start Race
                </button>
                <button className="w-full py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-medium touch-manipulation">
                  ⚠️ Report Issue
                </button>
                <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation">
                  📊 View Full Leaderboard
                </button>
                <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation">
                  🎬 Watch Replay
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Notifications</span>
                  <button className="w-12 h-6 bg-blue-600 rounded-full relative touch-manipulation">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Auto-refresh</span>
                  <button className="w-12 h-6 bg-blue-600 rounded-full relative touch-manipulation">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Sound Effects</span>
                  <button className="w-12 h-6 bg-gray-600 rounded-full relative touch-manipulation">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-gray-400">Home</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🏁</span>
            <span className="text-xs text-gray-400">Race</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📊</span>
            <span className="text-xs text-gray-400">Stats</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">⚙️</span>
            <span className="text-xs text-gray-400">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
