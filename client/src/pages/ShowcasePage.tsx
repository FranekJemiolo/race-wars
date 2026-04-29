import React, { useState } from 'react';

export const ShowcasePage: React.FC = () => {
  const [selectedMockup, setSelectedMockup] = useState<number>(0);

  const mockups = [
    {
      title: '📱 Mobile Team Management',
      type: 'mobile',
      description: 'Touch-friendly team interface with real-time stats and quick actions'
    },
    {
      title: '🏁 Live Racing Interface',
      type: 'mobile',
      description: 'Real-time GPS racing with live position tracking and leaderboard'
    },
    {
      title: '💬 Team Chat',
      type: 'mobile',
      description: 'Real-time team communication with reactions and achievements'
    },
    {
      title: '💻 Desktop Team Dashboard',
      type: 'desktop',
      description: 'Comprehensive team management with analytics and member statistics'
    },
    {
      title: '🎬 Race Replay System',
      type: 'desktop',
      description: 'Advanced race replay with video controls and detailed analysis'
    },
    {
      title: '📢 Admin Event Panel',
      type: 'desktop',
      description: 'Real-time race management with event broadcasting and analytics'
    }
  ];

  const currentMockup = mockups[selectedMockup];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🏁 Race Wars App Showcase</h1>
        
        {/* Mockup Selector */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {mockups.map((mockup, index) => (
            <button
              key={index}
              onClick={() => setSelectedMockup(index)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMockup === index
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              data-testid={`mockup-button-${index}`}
            >
              {mockup.title}
            </button>
          ))}
        </div>

        {/* Current Mockup Display */}
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-4">{currentMockup.title}</h2>
            <p className="text-gray-400 mb-6">{currentMockup.description}</p>
          </div>
          
          {/* Mockup Display */}
          <div className="flex-1 max-w-md mx-auto">
            {currentMockup.type === 'mobile' ? (
              <div className="mockup-mobile" data-testid="mobile-mockup">
                <div className="mobile-header">
                  <span>{currentMockup.title.split(' ')[1]} {currentMockup.title.split(' ')[2]}</span>
                  <span>📍 Live</span>
                </div>
                <div className="mobile-content">
                  {currentMockup.title.includes('Team Management') && (
                    <>
                      <div className="team-card">
                        <div className="team-header">
                          <span className="team-icon">🏢</span>
                          <div>
                            <div className="team-name">Speed Racers</div>
                            <div className="team-tag">SR</div>
                          </div>
                          <div className="team-rank">#3</div>
                        </div>
                        <div className="team-stats">
                          <span>📍 8/12</span>
                          <span>📊 1650</span>
                          <span>🥇 75%</span>
                          <span>🏁 25W</span>
                        </div>
                      </div>
                      <button className="create-team-btn">+ Create New Team</button>
                    </>
                  )}
                  {currentMockup.title.includes('Racing') && (
                    <>
                      <div className="race-map">
                        <div className="route-line"></div>
                        <div className="car-position"></div>
                        <div className="checkpoint"></div>
                      </div>
                      <div className="race-stats">
                        <div className="stat">📊 Position: 2nd</div>
                        <div className="stat">⚡ 245km/h</div>
                        <div className="stat">🏁 Lap: 12/20</div>
                        <div className="stat">⏱️ 1:23.456</div>
                      </div>
                      <div className="leaderboard-mini">
                        <div className="leader">1️⃣ Lightning - 1:21.234</div>
                        <div className="current">2️⃣ You - 1:23.456</div>
                        <div className="leader">3️⃣ Thunder - 1:24.789</div>
                      </div>
                    </>
                  )}
                  {currentMockup.title.includes('Chat') && (
                    <>
                      <div className="chat-messages">
                        <div className="message">
                          <div className="message-header">
                            <span>👤 Alex (Captain)</span>
                            <span>2:34 PM</span>
                          </div>
                          <div className="message-text">Great race everyone! 🏁</div>
                          <div className="reactions">👍 2  ❤️ 1</div>
                        </div>
                        <div className="message">
                          <div className="message-header">
                            <span>👤 Sarah</span>
                            <span>2:35 PM</span>
                          </div>
                          <div className="message-text">Thanks for the coordination! 🤝</div>
                          <div className="reactions">👍 1</div>
                        </div>
                      </div>
                      <div className="chat-input">
                        <span>[Type message...]</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="mockup-desktop" data-testid="desktop-mockup">
                <div className="desktop-header">
                  <span>🏁 Race Wars - {currentMockup.title.split(' ')[2]}</span>
                  <span>👤 Admin</span>
                </div>
                <div className="desktop-content">
                  {currentMockup.title.includes('Team Dashboard') && (
                    <>
                      <div className="team-overview">
                        <div className="team-info">
                          <h4>🏢 Speed Racers</h4>
                          <div className="team-stats-large">
                            <span>🏷️ SR</span>
                            <span>📍 12/12</span>
                            <span>📊 1850</span>
                            <span>🏆 #1</span>
                            <span>🥇 85%</span>
                            <span>🏁 45W</span>
                          </div>
                        </div>
                      </div>
                      <div className="leaderboard-desktop">
                        <h4>🏆 Seasonal Leaderboard</h4>
                        <div className="leaderboard-list">
                          <div className="leaderboard-item">
                            <span>#1 🏢 Speed Racers</span>
                            <span>📊 1850</span>
                            <span>⭐ 1125 pts</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {currentMockup.title.includes('Race Replay') && (
                    <>
                      <div className="replay-controls">
                        <div className="video-controls">
                          <span>⏮️ ⏸️ ⏯️ ⏹️</span>
                          <span>⏪ 0:45:23 ────────⏩ 1:23:45</span>
                        </div>
                        <div className="replay-map">
                          <div className="route-line"></div>
                          <div className="car-positions">
                            <span>🏎️ You (2nd)</span>
                            <span>🏎️ Lightning (1st)</span>
                          </div>
                        </div>
                      </div>
                      <div className="race-analysis">
                        <div className="analysis-section">
                          <h5>📊 Race Analysis</h5>
                          <div className="lap-times">
                            <div>Lap 1: 1:23.456</div>
                            <div>Lap 2: 1:22.987</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {currentMockup.title.includes('Admin Panel') && (
                    <>
                      <div className="admin-controls">
                        <h4>📢 Event Management</h4>
                        <div className="event-buttons">
                          <button className="event-btn">🏁 Start Race</button>
                          <button className="event-btn">🚨 Safety Car</button>
                          <button className="event-btn">🔴 Red Flag</button>
                        </div>
                      </div>
                      <div className="event-history">
                        <h4>📋 Event History</h4>
                        <div className="event-list">
                          <div className="event-item">Race started - 14:30</div>
                          <div className="event-item">Safety car deployed - 14:45</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mockup-mobile {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 25px;
          padding: 1rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(0,0,0,0.2);
          border-radius: 15px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .mobile-content {
          background: rgba(0,0,0,0.1);
          border-radius: 15px;
          padding: 1rem;
          min-height: 400px;
        }

        .team-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .team-name {
          font-weight: bold;
          color: #fbbf24;
        }

        .team-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .race-map {
          background: linear-gradient(45deg, #374151 25%, #4b5563 25%, #4b5563 50%, #374151 50%);
          background-size: 10px 10px;
          border-radius: 10px;
          height: 150px;
          position: relative;
          margin-bottom: 1rem;
        }

        .route-line {
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 3px;
          background: #ef4444;
          transform: translateY(-50%) rotate(-3deg);
        }

        .car-position {
          position: absolute;
          width: 15px;
          height: 15px;
          background: #fbbf24;
          border-radius: 50%;
          top: 50%;
          left: 40%;
          transform: translate(-50%, -50%);
        }

        .mockup-desktop {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .desktop-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-weight: bold;
        }

        .desktop-content {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
          padding: 1.5rem;
          min-height: 400px;
        }

        .team-stats-large {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .team-stats-large span {
          background: rgba(255,255,255,0.05);
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }

        .leaderboard-item {
          display: flex;
          justify-content: space-between;
          background: rgba(255,255,255,0.05);
          padding: 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        .video-controls {
          display: flex;
          justify-content: space-between;
          background: rgba(0,0,0,0.2);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .replay-map {
          background: linear-gradient(45deg, #374151 25%, #4b5563 25%, #4b5563 50%, #374151 50%);
          background-size: 15px 15px;
          border-radius: 10px;
          height: 150px;
          position: relative;
          margin-bottom: 1rem;
        }

        .event-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .event-btn {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #3b82f6;
        }

        .event-item {
          background: rgba(255,255,255,0.05);
          padding: 0.5rem;
          border-radius: 5px;
          margin-bottom: 0.5rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};
