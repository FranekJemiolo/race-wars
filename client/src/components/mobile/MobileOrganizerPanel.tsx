import React, { useState, useEffect, useRef } from 'react';
import { getLeaderboardService } from '../../services/leaderboard.service';
import { getRaceReplayService } from '../../services/raceReplay.service';

interface MobileOrganizerPanelProps {
  organizerId: string;
  className?: string;
}

interface Race {
  id: string;
  name: string;
  status: 'setup' | 'countdown' | 'racing' | 'finished' | 'cancelled';
  participants: number;
  startTime?: number;
  duration?: number;
  trackName: string;
  totalLaps: number;
}

interface Participant {
  id: string;
  name: string;
  status: 'registered' | 'ready' | 'racing' | 'finished' | 'disqualified' | 'dnf';
  position?: number;
  lap?: number;
  lapTime?: number;
  totalTime?: number;
  antiCheatRisk?: number;
}

export const MobileOrganizerPanel: React.FC<MobileOrganizerPanelProps> = ({
  organizerId,
  className = ''
}) => {
  const leaderboardService = getLeaderboardService();
  const replayService = getRaceReplayService();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'participants' | 'race' | 'replays'>('dashboard');
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [raceStatus, setRaceStatus] = useState<'setup' | 'countdown' | 'racing' | 'finished'>('setup');
  const [countdown, setCountdown] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [raceSettings, setRaceSettings] = useState({
    name: '',
    trackName: 'San Francisco Circuit',
    totalLaps: 3,
    maxParticipants: 12,
    startTime: null as Date | null,
    duration: 600000, // 10 minutes
    antiCheatLevel: 'medium' as 'low' | 'medium' | 'high'
  });

  const countdownIntervalRef = useRef<NodeJS.Timeout>();
  const swipeStartX = useRef<number>(0);
  const currentTabRef = useRef(activeTab);

  useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    // Simulate race data
    const mockRace: Race = {
      id: 'race-123',
      name: 'San Francisco Grand Prix',
      status: raceStatus,
      participants: participants.length,
      trackName: 'San Francisco Circuit',
      totalLaps: raceSettings.totalLaps
    };
    setCurrentRace(mockRace);

    // Mock participants
    const mockParticipants: Participant[] = Array.from({ length: 8 }, (_, i) => ({
      id: `driver-${i + 1}`,
      name: `Driver ${i + 1}`,
      status: raceStatus === 'racing' ? 'racing' : raceStatus === 'finished' ? 'finished' : 'registered',
      position: raceStatus === 'racing' ? i + 1 : undefined,
      lap: raceStatus === 'racing' ? 1 : undefined,
      lapTime: raceStatus === 'racing' ? 45000 + i * 2000 : undefined,
      totalTime: raceStatus === 'finished' ? 120000 + i * 5000 : undefined,
      antiCheatRisk: Math.random() > 0.8 ? Math.random() * 100 : 0
    }));
    setParticipants(mockParticipants);
  }, [raceStatus, participants.length, raceSettings]);

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    const swipeEndX = e.changedTouches[0].clientX;
    const swipeDistance = swipeStartX.current - swipeEndX;
    
    if (Math.abs(swipeDistance) > 50) {
      const tabs = ['dashboard', 'participants', 'race', 'replays'];
      const currentIndex = tabs.indexOf(currentTabRef.current);
      
      if (swipeDistance > 0 && currentIndex < tabs.length - 1) {
        // Swipe left - next tab
        setActiveTab(tabs[currentIndex + 1] as any);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // Swipe right - previous tab
        setActiveTab(tabs[currentIndex - 1] as any);
      }
    }
  };

  const startCountdown = () => {
    setRaceStatus('countdown');
    setCountdown(10);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          setRaceStatus('racing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRace = () => {
    setRaceStatus('racing');
    setCountdown(0);
  };

  const finishRace = () => {
    setRaceStatus('finished');
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  const cancelRace = () => {
    setRaceStatus('cancelled');
    setCountdown(0);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  const toggleParticipantSelection = (participantId: string) => {
    const newSelection = new Set(selectedParticipants);
    if (newSelection.has(participantId)) {
      newSelection.delete(participantId);
    } else {
      newSelection.add(participantId);
    }
    setSelectedParticipants(newSelection);
  };

  const selectAllParticipants = () => {
    if (selectedParticipants.size === participants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(participants.map(p => p.id)));
    }
  };

  const disqualifySelected = () => {
    // Disqualify selected participants
    console.log('Disqualifying participants:', Array.from(selectedParticipants));
    setSelectedParticipants(new Set());
  };

  const formatTime = (ms: number): string => {
    if (ms === 0) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'registered': return 'bg-blue-600';
      case 'ready': return 'bg-green-600';
      case 'racing': return 'bg-yellow-600';
      case 'finished': return 'bg-purple-600';
      case 'disqualified': return 'bg-red-600';
      case 'dnf': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getRiskColor = (risk?: number): string => {
    if (!risk || risk === 0) return 'text-green-600';
    if (risk < 30) return 'text-yellow-600';
    if (risk < 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`mobile-organizer-panel bg-gray-900 text-white min-h-screen ${className}`}
         onTouchStart={handleSwipeStart}
         onTouchEnd={handleSwipeEnd}>
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold">Race Organizer</h1>
            <p className="text-xs text-gray-400">Control Panel</p>
          </div>
          
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-2 bg-gray-700 rounded-lg touch-manipulation"
          >
            <span className="text-xl">⚙️</span>
          </button>
        </div>

        {/* Quick Actions */}
        {showQuickActions && (
          <div className="absolute top-16 right-4 bg-gray-800 rounded-lg shadow-lg p-2 z-50">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-left touch-manipulation"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-left mt-1 touch-manipulation"
            >
              👥 Participants
            </button>
            <button
              onClick={() => setActiveTab('race')}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-left mt-1 touch-manipulation"
            >
              🏁 Race Control
            </button>
            <button
              onClick={() => setActiveTab('replays')}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-left mt-1 touch-manipulation"
            >
              🎬 Replays
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-700">
          {['dashboard', 'participants', 'race', 'replays'].map((tab) => (
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
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Race Status Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Race Status</h2>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold">{currentRace?.name || 'No Active Race'}</p>
                  <p className="text-sm text-gray-400">{currentRace?.trackName}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  raceStatus === 'setup' ? 'bg-gray-600' :
                  raceStatus === 'countdown' ? 'bg-yellow-600 animate-pulse' :
                  raceStatus === 'racing' ? 'bg-green-600' :
                  raceStatus === 'finished' ? 'bg-blue-600' :
                  'bg-red-600'
                }`}>
                  {raceStatus === 'countdown' ? `Starting in ${countdown}s` : raceStatus.toUpperCase()}
                </div>
              </div>

              {/* Countdown Display */}
              {raceStatus === 'countdown' && (
                <div className="text-center py-8">
                  <div className="text-6xl font-bold text-yellow-400">{countdown}</div>
                  <p className="text-gray-400">Race Starting</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Participants</p>
                  <p className="text-2xl font-bold">{participants.length}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Total Laps</p>
                  <p className="text-2xl font-bold">{currentRace?.totalLaps || 0}</p>
                </div>
              </div>
            </div>

            {/* Race Controls */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Race Controls</h3>
              
              <div className="space-y-3">
                {raceStatus === 'setup' && (
                  <button
                    onClick={startCountdown}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-lg touch-manipulation"
                  >
                    🏁 Start Race
                  </button>
                )}
                
                {raceStatus === 'countdown' && (
                  <button
                    onClick={cancelRace}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-lg touch-manipulation"
                  >
                    ⏹ Cancel Race
                  </button>
                )}
                
                {raceStatus === 'racing' && (
                  <button
                    onClick={finishRace}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-lg touch-manipulation"
                  >
                    🏁 Finish Race
                  </button>
                )}
                
                {raceStatus === 'finished' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setRaceStatus('setup')}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium touch-manipulation"
                    >
                      🔄 New Race
                    </button>
                    <button
                      onClick={() => setActiveTab('replays')}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium touch-manipulation"
                    >
                      🎬 View Replay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Race started successfully</span>
                  <span className="text-gray-400 ml-auto">2m ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Driver 3 reported issue</span>
                  <span className="text-gray-400 ml-auto">5m ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Anti-cheat alert for Driver 7</span>
                  <span className="text-gray-400 ml-auto">8m ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Participant Management */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Participants ({participants.length})</h3>
                <button
                  onClick={selectAllParticipants}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation"
                >
                  {selectedParticipants.size === participants.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Bulk Actions */}
              {selectedParticipants.size > 0 && (
                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{selectedParticipants.size} selected</span>
                    <button
                      onClick={disqualifySelected}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm touch-manipulation"
                    >
                      Disqualify
                    </button>
                  </div>
                </div>
              )}

              {/* Participant List */}
              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`bg-gray-700 rounded-lg p-4 touch-manipulation ${
                      selectedParticipants.has(participant.id) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => toggleParticipantSelection(participant.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getStatusColor(participant.status)} flex items-center justify-center text-sm font-bold`}>
                          {participant.position || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-gray-400">
                            {participant.status === 'racing' && `Lap ${participant.lap} • ${formatTime(participant.lapTime || 0)}`}
                            {participant.status === 'finished' && `Finished • ${formatTime(participant.totalTime || 0)}`}
                            {participant.status === 'registered' && 'Registered'}
                            {participant.status === 'ready' && 'Ready'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {participant.antiCheatRisk && participant.antiCheatRisk > 0 && (
                          <p className={`text-xs font-medium ${getRiskColor(participant.antiCheatRisk)}`}>
                            ⚠️ {participant.antiCheatRisk}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Participant */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Add Participant</h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Participant name"
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                />
                <button className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium touch-manipulation">
                  + Add Participant
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'race' && (
          <div className="space-y-4">
            {/* Live Race View */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Live Race</h3>
              
              {raceStatus === 'racing' ? (
                <div className="space-y-4">
                  {/* Race Timer */}
                  <div className="text-center py-6 bg-gray-700 rounded-lg">
                    <div className="text-3xl font-bold">{formatTime(Date.now() - (currentRace?.startTime || Date.now()))}</div>
                    <p className="text-gray-400">Race Time</p>
                  </div>

                  {/* Leaderboard Preview */}
                  <div className="space-y-2">
                    {participants.slice(0, 5).map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between py-2 border-b border-gray-600 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">
                            {participant.position}
                          </div>
                          <span>{participant.name}</span>
                        </div>
                        <span className="text-sm text-gray-400">
                          Lap {participant.lap} • {formatTime(participant.lapTime || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏁</div>
                  <p className="text-gray-400">
                    {raceStatus === 'setup' ? 'Start a race to see live data' :
                     raceStatus === 'finished' ? 'Race has finished' :
                     'No active race'}
                  </p>
                </div>
              )}
            </div>

            {/* Race Settings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Race Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Race Name</label>
                  <input
                    type="text"
                    value={raceSettings.name}
                    onChange={(e) => setRaceSettings({...raceSettings, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                    placeholder="Enter race name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Total Laps</label>
                  <select
                    value={raceSettings.totalLaps}
                    onChange={(e) => setRaceSettings({...raceSettings, totalLaps: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value={1}>1 Lap</option>
                    <option value={3}>3 Laps</option>
                    <option value={5}>5 Laps</option>
                    <option value={10}>10 Laps</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Max Participants</label>
                  <select
                    value={raceSettings.maxParticipants}
                    onChange={(e) => setRaceSettings({...raceSettings, maxParticipants: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value={4}>4</option>
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Anti-Cheat Level</label>
                  <select
                    value={raceSettings.antiCheatLevel}
                    onChange={(e) => setRaceSettings({...raceSettings, antiCheatLevel: e.target.value as any})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'replays' && (
          <div className="space-y-4">
            {/* Replay Management */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Race Replays</h3>
              
              <div className="space-y-3">
                {/* Mock Replay List */}
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">Race #{i + 1}</p>
                        <p className="text-sm text-gray-400">
                          San Francisco Circuit • {new Date(Date.now() - (i + 1) * 86400000).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation">
                        ▶ Play
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>8 participants</span>
                      <span>3 laps</span>
                      <span>5:23.456</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recording Options */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recording Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-record races</span>
                  <button className="w-12 h-6 bg-blue-600 rounded-full relative touch-manipulation">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Include GPS data</span>
                  <button className="w-12 h-6 bg-blue-600 rounded-full relative touch-manipulation">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Save to cloud</span>
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
            <span className="text-xl">📊</span>
            <span className="text-xs text-gray-400">Dashboard</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">👥</span>
            <span className="text-xs text-gray-400">People</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🏁</span>
            <span className="text-xs text-gray-400">Race</span>
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
