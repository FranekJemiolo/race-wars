/**
 * App Showcase Page
 * 
 * Interactive demonstration of the Race Wars application with visual mockups
 * and feature descriptions for GitHub Pages presentation
 */

import React, { useState } from 'react';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  category: 'core' | 'team' | 'advanced';
}

interface MockupData {
  title: string;
  type: 'mobile' | 'desktop';
  description: string;
  content: React.ReactNode;
}

export const AppShowcase: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'core' | 'team' | 'advanced'>('all');
  const [selectedMockup, setSelectedMockup] = useState<number>(0);

  const features: FeatureCard[] = [
    // Core Features
    {
      icon: '🗺️',
      title: 'Custom Route Builder',
      description: 'Draw race routes on OpenStreetMap or import GPX files. Define checkpoints, start/finish lines, and race rules.',
      category: 'core'
    },
    {
      icon: '📍',
      title: 'GPS Projection Engine',
      description: 'Advanced geometry engine projects noisy GPS data onto route polylines with 5m accuracy using Turf.js.',
      category: 'core'
    },
    {
      icon: '🏁',
      title: 'Live Leaderboard',
      description: 'Real-time ranking system with sub-second updates. Supports multiple race types and competition formats.',
      category: 'core'
    },
    {
      icon: '🚨',
      title: 'Safety Awareness',
      description: 'Hazard zone system for safety warnings. Route deviation detection and enforcement for controlled events.',
      category: 'core'
    },
    {
      icon: '📱',
      title: 'Mobile-First Design',
      description: 'Progressive Web App works on any device with GPS. Offline map caching for reliable operation.',
      category: 'core'
    },
    {
      icon: '⚡',
      title: 'Real-Time Sync',
      description: 'WebSocket-based architecture delivers position updates at 1-2Hz with smooth 60fps rendering.',
      category: 'core'
    },

    // Team Features
    {
      icon: '🏢',
      title: 'Team Management',
      description: 'Create, join, and manage racing teams with roles, permissions, and member statistics.',
      category: 'team'
    },
    {
      icon: '💬',
      title: 'Team Communication',
      description: 'Real-time team chat with reactions, system messages, and achievement notifications.',
      category: 'team'
    },
    {
      icon: '🏆',
      title: 'Team Competitions',
      description: 'Seasonal, tournament, and championship formats with team scoring and rankings.',
      category: 'team'
    },
    {
      icon: '📊',
      title: 'Team Analytics',
      description: 'Performance metrics, achievements, and statistics. Track team progress and insights.',
      category: 'team'
    },

    // Advanced Features
    {
      icon: '🎞️',
      title: 'Race Replay System',
      description: 'Video-like playback with analysis tools, lap times, sector analysis, and performance metrics.',
      category: 'advanced'
    },
    {
      icon: '🏎️',
      title: 'Predefined Routes',
      description: 'Famous circuits: Monaco, Silverstone, Spa-Francorchamps, Suzuka, Nürburgring with realistic data.',
      category: 'advanced'
    },
    {
      icon: '📢',
      title: 'Admin Event System',
      description: 'Real-time race management with event broadcasting, safety car deployment, and penalties.',
      category: 'advanced'
    },
    {
      icon: '🛡️',
      title: 'Anti-Cheat Detection',
      description: 'Advanced GPS validation and pattern analysis. Detect suspicious behavior and ensure fair play.',
      category: 'advanced'
    }
  ];

  const mockups: MockupData[] = [
    {
      title: '📱 Mobile Team Management',
      type: 'mobile',
      description: 'Touch-friendly team interface with real-time stats and quick actions',
      content: (
        <div className="mobile-mockup">
          <div className="mobile-header">
            <span>🏁 Teams</span>
            <span>(2) 📬</span>
          </div>
          <div className="mobile-content">
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
            <div className="team-card">
              <div className="team-header">
                <span className="team-icon">🏢</span>
                <div>
                  <div className="team-name">Thunder Team</div>
                  <div className="team-tag">TT</div>
                </div>
                <div className="team-rank">#7</div>
              </div>
              <div className="team-stats">
                <span>📍 6/8</span>
                <span>📊 1580</span>
                <span>🥇 62%</span>
                <span>🏁 18W</span>
              </div>
            </div>
            <button className="create-team-btn">+ Create New Team</button>
          </div>
        </div>
      )
    },
    {
      title: '🏁 Live Racing Interface',
      type: 'mobile',
      description: 'Real-time GPS racing with live position tracking and leaderboard',
      content: (
        <div className="mobile-mockup">
          <div className="mobile-header">
            <span>🏁 Monaco Grand Prix</span>
            <span>📍 Live</span>
          </div>
          <div className="mobile-content">
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
          </div>
        </div>
      )
    },
    {
      title: '💬 Team Chat',
      type: 'mobile',
      description: 'Real-time team communication with reactions and achievements',
      content: (
        <div className="mobile-mockup">
          <div className="mobile-header">
            <span>💬 Team Chat - Speed Racers</span>
          </div>
          <div className="mobile-content">
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
              <div className="message system">
                <div className="message-header">
                  <span>🏆 System</span>
                  <span>2:36 PM</span>
                </div>
                <div className="message-text">Team unlocked: First Victory! 🎉</div>
                <div className="reactions">👍 5  🎉 3  🏆 2</div>
              </div>
            </div>
            <div className="chat-input">
              <span>[Type message...]</span>
              <div className="emoji-bar">📷 😊 👍 ❤️ 🏆 🎉</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '💻 Desktop Team Dashboard',
      type: 'desktop',
      description: 'Comprehensive team management with analytics and member statistics',
      content: (
        <div className="desktop-mockup">
          <div className="desktop-header">
            <span>🏁 Race Wars - Team Management</span>
            <span>👤 Admin</span>
          </div>
          <div className="desktop-content">
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
                  <span>📈 +5</span>
                </div>
                <p>"The fastest team on the track!"</p>
              </div>
              <div className="team-members">
                <h5>Team Members (12)</h5>
                <div className="member-list">
                  <div className="member">
                    <span>👑 Alex (Leader)</span>
                    <span>📊 1920</span>
                    <span>🏁 15W</span>
                    <span>🥇 88%</span>
                  </div>
                  <div className="member">
                    <span>🎯 Sarah (Co-Leader)</span>
                    <span>📊 1880</span>
                    <span>🏁 12W</span>
                    <span>🥇 82%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="leaderboard-desktop">
              <h4>🏆 Seasonal Leaderboard - Top 10 Teams</h4>
              <div className="leaderboard-list">
                <div className="leaderboard-item">
                  <span>#1 🏢 Speed Racers</span>
                  <span>📊 1850</span>
                  <span>🏁 45W</span>
                  <span>🥇 85%</span>
                  <span>⭐ 1125 pts</span>
                </div>
                <div className="leaderboard-item">
                  <span>#2 🏢 Lightning Team</span>
                  <span>📊 1820</span>
                  <span>🏁 42W</span>
                  <span>🥇 82%</span>
                  <span>⭐ 1050 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '🎬 Race Replay System',
      type: 'desktop',
      description: 'Advanced race replay with video controls and detailed analysis',
      content: (
        <div className="desktop-mockup">
          <div className="desktop-header">
            <span>🎬 Race Replay - Monaco Grand Prix 2024</span>
            <span>📅 June 15, 2024</span>
          </div>
          <div className="desktop-content">
            <div className="replay-controls">
              <div className="video-controls">
                <span>⏮️ ⏸️ ⏯️ ⏹️</span>
                <span>⏪ 0:45:23 ────────⏩ 1:23:45</span>
                <span>🔊 📺 ⚙️</span>
              </div>
              <div className="replay-map">
                <div className="route-line"></div>
                <div className="car-positions">
                  <span>🏎️ You (2nd)</span>
                  <span>🏎️ Lightning (1st)</span>
                  <span>🏎️ Thunder (3rd)</span>
                </div>
              </div>
            </div>
            <div className="race-analysis">
              <div className="analysis-section">
                <h5>📊 Race Analysis</h5>
                <div className="analysis-grid">
                  <div className="analysis-item">
                    <h6>Lap Times</h6>
                    <div className="lap-times">
                      <div>Lap 1: 1:23.456</div>
                      <div>Lap 2: 1:22.987</div>
                      <div>Lap 3: 1:23.234</div>
                      <div>Lap 4: 1:21.789</div>
                      <div>Lap 5: 1:22.456</div>
                    </div>
                  </div>
                  <div className="analysis-item">
                    <h6>Speed Profile</h6>
                    <div className="speed-stats">
                      <div>Max: 285 km/h</div>
                      <div>Avg: 245 km/h</div>
                      <div>Min: 180 km/h</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="race-results">
                <h5>🏆 Race Results</h5>
                <div className="results-list">
                  <div className="result-item">
                    <span>1️⃣ Lightning Team</span>
                    <span>1:21:234</span>
                    <span>⭐ +25 pts</span>
                    <span>🏆 Fastest Lap</span>
                  </div>
                  <div className="result-item">
                    <span>2️⃣ Your Team</span>
                    <span>1:21:456</span>
                    <span>⭐ +18 pts</span>
                    <span>📈 +2 positions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredFeatures = activeCategory === 'all' 
    ? features 
    : features.filter(f => f.category === activeCategory);

  const currentMockup = mockups[selectedMockup];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            🏁 Race Wars App Showcase
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Interactive demonstration of the comprehensive GPS racing platform
          </p>
          
          {/* Category Filter */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All Features
            </button>
            <button
              onClick={() => setActiveCategory('core')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'core' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🏁 Core
            </button>
            <button
              onClick={() => setActiveCategory('team')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'team' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              👥 Team
            </button>
            <button
              onClick={() => setActiveCategory('advanced')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeCategory === 'advanced' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🎬 Advanced
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors hover:transform hover:scale-105 duration-200"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Interactive Mockups */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">🖼️ Interactive App Interface</h2>
          
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
              >
                {mockup.type === 'mobile' ? '📱' : '💻'} {mockup.title.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Current Mockup Display */}
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-4 text-center lg:text-left">
                {currentMockup.title}
              </h3>
              <p className="text-gray-400 mb-6 text-center lg:text-left">
                {currentMockup.description}
              </p>
              
              {/* Mockup Stats */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-4 text-purple-400">Interface Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>Real-time updates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>Touch-optimized</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>Responsive design</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>Live synchronization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>Team collaboration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>Performance analytics</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mockup Display */}
            <div className="flex-1 max-w-md mx-auto">
              {currentMockup.content}
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">🛠️ Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-blue-400">TypeScript</h3>
              <p className="text-gray-400 text-sm mt-2">Type-safe development</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">⚛️</div>
              <h3 className="font-semibold text-blue-400">React</h3>
              <p className="text-gray-400 text-sm mt-2">Modern UI framework</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-semibold text-blue-400">Node.js</h3>
              <p className="text-gray-400 text-sm mt-2">WebSocket server</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🗺️</div>
              <h3 className="font-semibold text-blue-400">Leaflet</h3>
              <p className="text-gray-400 text-sm mt-2">Map rendering</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Racing?</h2>
          <p className="text-xl mb-6">Join the community and experience real-time GPS racing</p>
          <div className="flex justify-center gap-4">
            <a
              href="https://github.com/FranekJemiolo/race-wars"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View on GitHub
            </a>
            <a
              href="https://franekjemiolo.github.io/race-wars/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Live Demo
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mobile-mockup {
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

        .team-icon {
          font-size: 1.2rem;
        }

        .team-name {
          font-weight: bold;
          color: #fbbf24;
        }

        .team-tag {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .team-rank {
          background: #ef4444;
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 10px;
          font-size: 0.8rem;
        }

        .team-stats {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .create-team-btn {
          width: 100%;
          padding: 0.75rem;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid #3b82f6;
          border-radius: 8px;
          color: #3b82f6;
          font-weight: bold;
          cursor: pointer;
        }

        .race-map {
          background: linear-gradient(45deg, #374151 25%, #4b5563 25%, #4b5563 50%, #374151 50%, #374151 75%, #4b5563 75%);
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
          border-radius: 2px;
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
          box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
        }

        .checkpoint {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2px solid #06b6d4;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .race-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .stat {
          background: rgba(255,255,255,0.05);
          padding: 0.5rem;
          border-radius: 8px;
          font-size: 0.8rem;
        }

        .leaderboard-mini {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 0.75rem;
        }

        .leader {
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .current {
          font-size: 0.8rem;
          background: rgba(251, 191, 36, 0.1);
          padding: 0.25rem;
          border-radius: 4px;
          margin-bottom: 0.25rem;
        }

        .chat-messages {
          margin-bottom: 1rem;
        }

        .message {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .message.system {
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .message-text {
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .reactions {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .chat-input {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 0.75rem;
        }

        .emoji-bar {
          margin-top: 0.5rem;
          font-size: 1.2rem;
          color: #9ca3af;
        }

        .desktop-mockup {
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
          min-height: 500px;
        }

        .team-overview {
          margin-bottom: 2rem;
        }

        .team-info h4 {
          color: #fbbf24;
          margin-bottom: 1rem;
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

        .team-members h5 {
          color: #06b6d4;
          margin-bottom: 1rem;
        }

        .member-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .member {
          display: flex;
          justify-content: space-between;
          background: rgba(255,255,255,0.05);
          padding: 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }

        .leaderboard-desktop h4 {
          color: #fbbf24;
          margin-bottom: 1rem;
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .leaderboard-item {
          display: flex;
          justify-content: space-between;
          background: rgba(255,255,255,0.05);
          padding: 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }

        .replay-controls {
          margin-bottom: 2rem;
        }

        .video-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0,0,0,0.2);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .replay-map {
          background: linear-gradient(45deg, #374151 25%, #4b5563 25%, #4b5563 50%, #374151 50%, #374151 75%, #4b5563 75%);
          background-size: 15px 15px;
          border-radius: 10px;
          height: 150px;
          position: relative;
          margin-bottom: 1rem;
        }

        .car-positions {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.8rem;
        }

        .race-analysis {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .analysis-section h5 {
          color: #06b6d4;
          margin-bottom: 1rem;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .analysis-item h6 {
          color: #fbbf24;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .lap-times div, .speed-stats div {
          background: rgba(255,255,255,0.05);
          padding: 0.25rem;
          border-radius: 3px;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .race-results h5 {
          color: #fbbf24;
          margin-bottom: 1rem;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          background: rgba(255,255,255,0.05);
          padding: 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};
