import React, { useState } from 'react';
import { MobileParticipantDashboard } from '../components/mobile/MobileParticipantDashboard';
import { MobileOrganizerPanel } from '../components/mobile/MobileOrganizerPanel';
import { MobileSpectatorView } from '../components/mobile/MobileSpectatorView';
import { MobileRaceStats } from '../components/mobile/MobileRaceStats';

export const MobileDemo: React.FC = () => {
  const [activeView, setActiveView] = useState<'participant' | 'organizer' | 'spectator' | 'stats'>('participant');
  const [showUserTypeSelector, setShowUserTypeSelector] = useState(true);

  const handleUserTypeSelect = (type: 'participant' | 'organizer' | 'spectator' | 'stats') => {
    setActiveView(type);
    setShowUserTypeSelector(false);
  };

  if (showUserTypeSelector) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">🏁 Race Wars Mobile</h1>
            <p className="text-gray-400">Choose your role to experience the mobile interface</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleUserTypeSelect('participant')}
              className="w-full p-6 bg-blue-600 hover:bg-blue-700 rounded-xl text-left transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🏃‍♂️</div>
                <div>
                  <h2 className="text-xl font-semibold">Race Participant</h2>
                  <p className="text-sm text-gray-300">View your stats, GPS tracking, and race performance</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleUserTypeSelect('organizer')}
              className="w-full p-6 bg-green-600 hover:bg-green-700 rounded-xl text-left transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">👨‍💼</div>
                <div>
                  <h2 className="text-xl font-semibold">Race Organizer</h2>
                  <p className="text-sm text-gray-300">Manage races, participants, and race control</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleUserTypeSelect('spectator')}
              className="w-full p-6 bg-purple-600 hover:bg-purple-700 rounded-xl text-left transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">👀</div>
                <div>
                  <h2 className="text-xl font-semibold">Spectator</h2>
                  <p className="text-sm text-gray-300">Watch live races, leaderboards, and replays</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleUserTypeSelect('stats')}
              className="w-full p-6 bg-orange-600 hover:bg-orange-700 rounded-xl text-left transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">📊</div>
                <div>
                  <h2 className="text-xl font-semibold">Race Statistics</h2>
                  <p className="text-sm text-gray-300">Detailed performance analysis and trends</p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowUserTypeSelector(false)}
              className="text-gray-400 hover:text-white text-sm touch-manipulation"
            >
              Continue to main app →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Mobile View Switcher */}
      <div className="fixed top-4 left-4 z-50 bg-gray-800 rounded-lg p-2 shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('participant')}
            className={`px-3 py-2 rounded text-sm touch-manipulation ${
              activeView === 'participant' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            🏃‍♂️
          </button>
          <button
            onClick={() => setActiveView('organizer')}
            className={`px-3 py-2 rounded text-sm touch-manipulation ${
              activeView === 'organizer' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            👨‍💼
          </button>
          <button
            onClick={() => setActiveView('spectator')}
            className={`px-3 py-2 rounded text-sm touch-manipulation ${
              activeView === 'spectator' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            👀
          </button>
          <button
            onClick={() => setActiveView('stats')}
            className={`px-3 py-2 rounded text-sm touch-manipulation ${
              activeView === 'stats' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            📊
          </button>
        </div>
      </div>

      {/* Return to Selector */}
      <button
        onClick={() => setShowUserTypeSelector(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800 rounded-lg p-2 shadow-lg touch-manipulation"
      >
        <span className="text-sm">🏠</span>
      </button>

      {/* Active View */}
      <div>
        {activeView === 'participant' && (
          <MobileParticipantDashboard
            participantId="driver-1"
            raceId="mobile-demo-race"
          />
        )}
        {activeView === 'organizer' && (
          <MobileOrganizerPanel
            organizerId="organizer-1"
          />
        )}
        {activeView === 'spectator' && (
          <MobileSpectatorView
            raceId="mobile-demo-race"
          />
        )}
        {activeView === 'stats' && (
          <MobileRaceStats
            raceId="mobile-demo-race"
            participantId="driver-1"
          />
        )}
      </div>
    </div>
  );
};
