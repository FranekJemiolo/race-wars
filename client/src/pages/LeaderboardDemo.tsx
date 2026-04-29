import React, { useState, useEffect } from 'react';
import { RealTimeLeaderboard } from '../components/RealTimeLeaderboard';
import { GPSDemo } from '../components/GPSDemo';
import { getSimulationManager, RaceSimulationConfig } from '../services/simulationClient.service';
import { getLeaderboardService } from '../services/leaderboard.service';

export const LeaderboardDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'gps' | 'both'>('both');
  const [raceId] = useState('demo-race-' + Date.now());
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [participantCount, setParticipantCount] = useState(4);
  const [selectedView, setSelectedView] = useState<'compact' | 'detailed'>('detailed');

  const simulationManager = getSimulationManager();
  const leaderboardService = getLeaderboardService();

  // Initialize race simulation
  const startRaceSimulation = () => {
    if (isSimulationRunning) return;

    const raceConfig: RaceSimulationConfig = {
      raceId,
      trackCenter: { lat: 37.7749, lng: -122.4194 },
      trackRadius: 1000,
      participants: Array.from({ length: participantCount }, (_, i) => ({
        id: `sim-${i + 1}`,
        name: `Driver ${i + 1}`,
        skill: i === 0 ? 'expert' : i === 1 ? 'intermediate' : 'beginner',
        vehicle: i % 2 === 0 ? 'car' : 'motorcycle',
        startingPosition: i / participantCount
      })),
      raceDuration: 300 // 5 minutes
    };

    simulationManager.startRaceSimulation(raceConfig);
    setIsSimulationRunning(true);

    // Add some variety to make it interesting
    setTimeout(() => {
      // Simulate one driver having issues
      console.log('Driver 3 experiencing GPS issues...');
    }, 30000);

    setTimeout(() => {
      // Simulate another driver finishing
      console.log('Driver 1 crossing finish line...');
    }, 120000);
  };

  const stopRaceSimulation = () => {
    simulationManager.stopRaceSimulation();
    setIsSimulationRunning(false);
  };

  // Connect to leaderboard service
  useEffect(() => {
    const connectToLeaderboard = async () => {
      try {
        await leaderboardService.connect(raceId);
        console.log('Connected to leaderboard service');
      } catch (error) {
        console.error('Failed to connect to leaderboard:', error);
      }
    };

    connectToLeaderboard();

    return () => {
      leaderboardService.disconnect();
    };
  }, [raceId]);

  // Listen for leaderboard events
  useEffect(() => {
    const handlePositionChange = (event: any) => {
      console.log(`Position change: ${event.participantId} moved from ${event.oldPosition} to ${event.newPosition}`);
    };

    const handleAntiCheatWarning = (event: any) => {
      console.log(`Anti-cheat warning for ${event.participantId}: ${event.riskScore}% risk`);
    };

    const handleParticipantFinished = (event: any) => {
      console.log(`Participant ${event.participantId} finished in position ${event.position} with time ${event.time}ms`);
    };

    leaderboardService.on('position_changed', handlePositionChange);
    leaderboardService.on('anti_cheat_warning', handleAntiCheatWarning);
    leaderboardService.on('participant_finished', handleParticipantFinished);

    return () => {
      leaderboardService.off('position_changed', handlePositionChange);
      leaderboardService.off('anti_cheat_warning', handleAntiCheatWarning);
      leaderboardService.off('participant_finished', handleParticipantFinished);
    };
  }, []);

  return (
    <div className="leaderboard-demo min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Race Wars Leaderboard Demo</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time GPS tracking with advanced anti-cheat detection
              </p>
            </div>
            
            {/* Race Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Participants:</label>
                <select
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Number(e.target.value))}
                  disabled={isSimulationRunning}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                </select>
              </div>
              
              <button
                onClick={isSimulationRunning ? stopRaceSimulation : startRaceSimulation}
                className={`px-4 py-2 rounded text-white font-medium ${
                  isSimulationRunning 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSimulationRunning ? 'Stop Race' : 'Start Race'}
              </button>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">View:</label>
                <select
                  value={selectedView}
                  onChange={(e) => setSelectedView(e.target.value as any)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="compact">Compact</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leaderboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('gps')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              GPS Tracking
            </button>
            <button
              onClick={() => setActiveTab('both')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'both'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Both Views
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isSimulationRunning ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-700">
                  Race Status: {isSimulationRunning ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                Race ID: {raceId}
              </div>
              
              <div className="text-sm text-gray-600">
                Participants: {participantCount}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div>Connection: {leaderboardService.getConnectionStatus()}</div>
              <div>Last Update: {new Date(leaderboardService.getStats().lastUpdateTime).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`grid ${
          activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        } gap-6`}>
          {/* Leaderboard */}
          {(activeTab === 'leaderboard' || activeTab === 'both') && (
            <div className={activeTab === 'both' ? 'order-1' : ''}>
              <RealTimeLeaderboard
                raceId={raceId}
                className={selectedView === 'compact' ? 'text-sm' : ''}
                showAntiCheat={true}
                maxEntries={selectedView === 'compact' ? 10 : 20}
              />
            </div>
          )}

          {/* GPS Demo */}
          {(activeTab === 'gps' || activeTab === 'both') && (
            <div className={activeTab === 'both' ? 'order-2' : ''}>
              <GPSDemo sessionId={raceId} />
            </div>
          )}
        </div>

        {/* Statistics Panel */}
        {activeTab === 'both' && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Race Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {leaderboardService.getStats().totalParticipants}
                </div>
                <div className="text-sm text-gray-600">Total Drivers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {leaderboardService.getStats().activeParticipants}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {leaderboardService.getStats().averageSpeed.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Speed (km/h)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {leaderboardService.getStats().finishedParticipants}
                </div>
                <div className="text-sm text-gray-600">Finished</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Start Race" to begin a simulated race with multiple participants</li>
            <li>• Watch the leaderboard update in real-time as participants progress</li>
            <li>• Monitor GPS tracking data and anti-cheat warnings</li>
            <li>• Switch between views to focus on different aspects</li>
            <li>• Click on leaderboard entries to see detailed information</li>
            <li>• Anti-cheat system will flag suspicious behavior with risk scores</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
