import React, { useState } from 'react';

export const ShowcasePage: React.FC = () => {
  const [selectedMockup, setSelectedMockup] = useState<number>(0);

  const mockups = [
    {
      title: '📱 Mobile Team Management',
      type: 'mobile',
      description: 'Touch-friendly squad coordination with live driver metrics, role distribution, and telemetry stats.'
    },
    {
      title: '🏁 Live Racing Interface',
      type: 'mobile',
      description: 'Real-time GPS racing HUD with live vector positioning, delta timing, speed traps, and sector splits.'
    },
    {
      title: '💬 Team Chat',
      type: 'mobile',
      description: 'Low-latency pit wall communications, strategy broadcasts, incident callouts, and crew reactions.'
    },
    {
      title: '💻 Desktop Team Dashboard',
      type: 'desktop',
      description: 'Comprehensive telemetry center with championship standings, constructor points, and telemetry telemetry.'
    },
    {
      title: '🎬 Race Replay System',
      type: 'desktop',
      description: 'Synchronized multi-angle playback with timeline scrubbers, GPS overlay, and sector delta analysis.'
    },
    {
      title: '📢 Admin Event Panel',
      type: 'desktop',
      description: 'Steward console featuring safety car deployment, live flag changes, penalty assignments, and incident timeline.'
    },
    {
      title: '🗺️ OpenStreetMap Route Builder',
      type: 'desktop',
      description: 'Interactive track designer powered by OpenStreetMap: custom circuits, GPS waypoint projection, elevation profiles, and checkpoints.'
    }
  ];

  const currentMockup = mockups[selectedMockup];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #111728 0%, #080c14 90%)',
      color: '#f3f4f6',
      padding: '20px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.6rem' }}>🏁</span>
            <h1 style={{
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              margin: 0,
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, #ffffff 0%, #00ff88 50%, #00d4ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Race Wars App Showcase
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '560px', margin: '0 auto' }}>
            Next-generation real-time GPS telemetry, mobile cockpit HUD, and professional race control suite.
          </p>
        </div>
        
        {/* Mockup Pill Selector - Horizontally scrollable on mobile, centered on desktop */}
        <div 
          className="mobile-scroll-x"
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '8px',
            marginBottom: '20px',
            overflowX: 'auto',
            paddingBottom: '8px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', margin: '0 auto', flexWrap: 'nowrap' }}>
            {mockups.map((mockup, index) => {
              const isSelected = selectedMockup === index;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedMockup(index)}
                  data-testid={`mockup-button-${index}`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    border: isSelected ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.18) 0%, rgba(0, 212, 255, 0.12) 100%)' 
                      : 'rgba(22, 27, 34, 0.7)',
                    color: isSelected ? '#00ff88' : '#94a3b8',
                    boxShadow: isSelected ? '0 0 16px rgba(0, 255, 136, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {mockup.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Display Stage */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          width: '100%'
        }}>
          {/* Subtitle & Description */}
          <div style={{ textAlign: 'center', maxWidth: '640px', padding: '0 12px' }}>
            <h2 style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 6px 0',
              fontFamily: "'Orbitron', sans-serif"
            }}>
              {currentMockup.title}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: 0 }}>
              {currentMockup.description}
            </p>
          </div>
          
          {/* Mockup Frame Canvas */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {currentMockup.type === 'mobile' ? (
              /* Phone Hardware Frame */
              <div 
                className="mockup-mobile" 
                data-testid="mobile-mockup"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  background: '#0c101a',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '32px',
                  padding: '16px 14px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 136, 0.1)',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}
              >
                {/* Speaker notch */}
                <div style={{
                  width: '90px',
                  height: '4px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2px',
                  margin: '0 auto 16px auto'
                }} />

                {/* Mobile App Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}>
                  <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span> {currentMockup.title.split(' ')[1]} {currentMockup.title.split(' ')[2]}
                  </span>
                  <span style={{
                    color: '#00ff88',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                    LIVE
                  </span>
                </div>

                {/* Mobile Content Details */}
                <div style={{ minHeight: '440px' }}>
                  {currentMockup.title.includes('Team Management') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(26, 35, 54, 0.9) 0%, rgba(15, 21, 34, 0.9) 100%)',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        borderRadius: '14px',
                        padding: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.8rem' }}>🏎️</span>
                            <div>
                              <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.05rem' }}>Apex Predators</div>
                              <div style={{ fontSize: '0.75rem', color: '#00d4ff', fontWeight: 700 }}>TIER 1 PRO SQUAD</div>
                            </div>
                          </div>
                          <div style={{
                            background: 'rgba(0, 255, 136, 0.15)',
                            border: '1px solid #00ff88',
                            color: '#00ff88',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 800,
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '0.9rem'
                          }}>
                            #1 RANK
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 4px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>ROSTER</span>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>8/10</span>
                          </div>
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 4px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>POINTS</span>
                            <span style={{ fontWeight: 700, color: '#00d4ff', fontSize: '0.9rem' }}>2,480</span>
                          </div>
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 4px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>WIN RATE</span>
                            <span style={{ fontWeight: 700, color: '#00ff88', fontSize: '0.9rem' }}>82%</span>
                          </div>
                          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 4px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>WINS</span>
                            <span style={{ fontWeight: 700, color: '#ffaa00', fontSize: '0.9rem' }}>34W</span>
                          </div>
                        </div>
                      </div>

                      {/* Driver Lineup */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
                          Active Drivers on Grid
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>#77 Marcus Kane (Lead)</span>
                            <span style={{ color: '#00ff88', fontSize: '0.8rem', fontWeight: 700 }}>1:22.410</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>#23 Sarah Connor</span>
                            <span style={{ color: '#00d4ff', fontSize: '0.8rem', fontWeight: 700 }}>+0.284s</span>
                          </div>
                        </div>
                      </div>

                      <button style={{
                        background: 'linear-gradient(135deg, #00ff88 0%, #00b35f 100%)',
                        color: '#05110a',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0, 255, 136, 0.25)'
                      }}>
                        ＋ Invite Competitor
                      </button>
                    </div>
                  )}

                  {currentMockup.title.includes('Racing') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Circuit GPS HUD */}
                      <div style={{
                        background: 'radial-gradient(circle at 50% 50%, #172338 0%, #090e18 100%)',
                        border: '1px solid rgba(0, 255, 136, 0.2)',
                        borderRadius: '14px',
                        height: '180px',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {/* Vector circuit map */}
                        <svg width="280" height="150" viewBox="0 0 280 150">
                          <path
                            d="M 30 110 C 30 50, 70 30, 140 30 C 210 30, 250 50, 250 80 C 250 120, 210 130, 160 130 C 110 130, 70 120, 30 110 Z"
                            fill="none"
                            stroke="rgba(0, 212, 255, 0.3)"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 30 110 C 30 50, 70 30, 140 30 C 210 30, 250 50, 250 80"
                            fill="none"
                            stroke="#00ff88"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <circle cx="200" cy="45" r="7" fill="#00ff88" />
                          <circle cx="200" cy="45" r="14" fill="none" stroke="#00ff88" strokeWidth="1.5" opacity="0.6" />
                          <circle cx="160" cy="30" r="5" fill="#ffaa00" />
                          <circle cx="240" cy="65" r="5" fill="#38bdf8" />
                        </svg>
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '12px',
                          background: 'rgba(0,0,0,0.6)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          color: '#00ff88',
                          fontWeight: 700
                        }}>
                          SECTOR 2 • CLEAR
                        </div>
                      </div>

                      {/* Telemetry Gauge Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>POSITION</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00ff88', fontFamily: "'Orbitron', sans-serif" }}>P2 / 16</div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SPEED</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00d4ff', fontFamily: "'Orbitron', sans-serif" }}>248 <span style={{ fontSize: '0.75rem' }}>KM/H</span></div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>LAP PROGRESS</span>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>14 / 20</div>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>LAST LAP</span>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffaa00', fontFamily: "'JetBrains Mono', monospace" }}>1:22.981</div>
                        </div>
                      </div>

                      {/* Live Mini Tower */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '10px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '4px' }}>
                          <span>1. #12 Verstappen</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>LEADER</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ff88', fontWeight: 700 }}>
                          <span>2. #77 YOU</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>+0.412s</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginTop: '4px' }}>
                          <span>3. #44 Hamilton</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>+1.205s</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentMockup.title.includes('Chat') && (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '420px', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '12px', borderLeft: '3px solid #00d4ff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#00d4ff' }}>Race Engineer (Pit Wall)</span>
                            <span>14:21:04</span>
                          </div>
                          <div style={{ fontSize: '0.86rem', color: '#fff' }}>
                            Box this lap for soft tire undercut. Gap behind is +4.2s.
                          </div>
                          <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                            👍 2 • 🟢 Confirmed
                          </div>
                        </div>

                        <div style={{ background: 'rgba(0, 255, 136, 0.08)', padding: '10px 12px', borderRadius: '12px', borderLeft: '3px solid #00ff88' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#00ff88' }}>Driver #77 (You)</span>
                            <span>14:21:18</span>
                          </div>
                          <div style={{ fontSize: '0.86rem', color: '#fff' }}>
                            Copy that. Tires still holding up, pushing on entry turn 6.
                          </div>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 12px', borderRadius: '12px', borderLeft: '3px solid #ef4444' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#ef4444', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700 }}>Race Control Marshal</span>
                            <span>14:22:00</span>
                          </div>
                          <div style={{ fontSize: '0.86rem', color: '#fca5a5' }}>
                            ⚠️ YELLOW FLAG in Sector 3. Car 18 stopped off track.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input
                          type="text"
                          readOnly
                          value="Copy pit confirm..."
                          style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            color: '#cbd5e1',
                            fontSize: '0.85rem'
                          }}
                        />
                        <button style={{
                          background: '#00d4ff',
                          color: '#000',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0 14px',
                          fontWeight: 800
                        }}>
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Desktop Widescreen Frame */
              <div 
                className="mockup-desktop" 
                data-testid="desktop-mockup"
                style={{
                  width: '100%',
                  maxWidth: '960px',
                  background: 'linear-gradient(145deg, #111827 0%, #0a0e17 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 212, 255, 0.08)',
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                {/* Desktop Window Title Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem', fontFamily: "'Orbitron', sans-serif" }}>
                      🏁 Race Wars — {currentMockup.title.split(' ')[2] || 'Command Console'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                    TELEMETRY ACTIVE
                  </div>
                </div>

                {/* Desktop Content Views */}
                <div>
                  {currentMockup.title.includes('Team Dashboard') && (
                    <div>
                      {/* Top Team Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '12px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CONSTRUCTOR RANK</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00ff88', fontFamily: "'Orbitron', sans-serif" }}>1st</div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>Premier Division</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '12px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>TOTAL SQUAD POINTS</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00d4ff', fontFamily: "'Orbitron', sans-serif" }}>3,890</div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>+120 this weekend</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '12px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PODIUM RATE</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffaa00', fontFamily: "'Orbitron', sans-serif" }}>88%</div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>42 / 48 starts</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '12px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>FLEET READINESS</span>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e', fontFamily: "'Orbitron', sans-serif" }}>100%</div>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>8 race cars tuned</span>
                        </div>
                      </div>

                      {/* Standings Table */}
                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1' }}>
                          Constructor Championship Standings
                        </div>
                        <div style={{ padding: '4px' }}>
                          {[
                            { rank: 1, team: 'Apex Predators Racing', tag: 'APR', points: 3890, wins: 28, form: '🥇🥇🥈' },
                            { rank: 2, team: 'Vortex Works Motorsport', tag: 'VWM', points: 3620, wins: 18, form: '🥈🥉🥇' },
                            { rank: 3, team: 'Chronos Time Attack', tag: 'CTA', points: 3105, wins: 14, form: '🥉④🥈' }
                          ].map(row => (
                            <div key={row.rank} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 12px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              fontSize: '0.82rem',
                              flexWrap: 'wrap',
                              gap: '8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 800, color: row.rank === 1 ? '#00ff88' : '#94a3b8', width: '20px' }}>#{row.rank}</span>
                                <span style={{ fontWeight: 700, color: '#fff' }}>{row.team}</span>
                                <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>{row.tag}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{ color: '#cbd5e1' }}>{row.wins}W</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#00d4ff' }}>{row.points} PTS</span>
                                <span>{row.form}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentMockup.title.includes('Race Replay') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Video / Map Replay Stage */}
                      <div style={{
                        height: '180px',
                        background: 'radial-gradient(circle at 50% 50%, #151e30 0%, #090e18 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        <svg viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', maxWidth: '100%' }}>
                          <path
                            d="M 50 140 C 50 40, 160 30, 300 30 C 440 30, 550 50, 550 110 C 550 170, 440 170, 320 170 C 180 170, 100 150, 50 140 Z"
                            fill="none"
                            stroke="rgba(0, 212, 255, 0.25)"
                            strokeWidth="10"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 50 140 C 50 40, 160 30, 300 30 C 440 30, 550 50, 550 110"
                            fill="none"
                            stroke="#00ff88"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                          <circle cx="480" cy="70" r="10" fill="#00ff88" />
                          <circle cx="440" cy="55" r="8" fill="#ffaa00" />
                        </svg>

                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '12px',
                          right: '12px',
                          background: 'rgba(0, 0, 0, 0.75)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                          fontSize: '0.78rem'
                        }}>
                          <span style={{ color: '#00ff88', fontWeight: 800 }}>P1 #77 Marcus Kane (278 KM/H)</span>
                          <span style={{ color: '#94a3b8' }}>GAP: -0.420s ahead</span>
                        </div>
                      </div>

                      {/* Scrubber Controls */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>⏮️ -10s</button>
                            <button style={{ background: '#00ff88', border: 'none', color: '#000', padding: '6px 14px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem' }}>▶ Play</button>
                            <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>+10s ⏭️</button>
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff', fontWeight: 700, fontSize: '0.78rem' }}>
                            14:23.850 / 28:45.000 (1.0x)
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '52%', height: '100%', background: 'linear-gradient(90deg, #00ff88, #00d4ff)' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentMockup.title.includes('Admin') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Marshall Actions */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '8px'
                      }}>
                        <button style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', padding: '10px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>🟢</span> Green Flag
                        </button>
                        <button style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', color: '#eab308', padding: '10px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>🟡</span> Yellow Flag
                        </button>
                        <button style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', color: '#f97316', padding: '10px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>⚠️</span> Safety Car
                        </button>
                        <button style={{ background: 'rgba(239, 68, 68, 0.18)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>🛑</span> Red Flag
                        </button>
                        <button style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '10px 8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>🏁</span> Finish Race
                        </button>
                      </div>

                      {/* Steward Log */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '14px',
                        boxSizing: 'border-box'
                      }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Live Incident & Stewards Log</span>
                          <span style={{ fontSize: '0.72rem', color: '#00d4ff', fontFamily: "'JetBrains Mono', monospace" }}>SESSION ACTIVE</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}>
                            <span style={{ color: '#e2e8f0' }}>⏱️ 14:18:22 • #44 Hamilton assigned +5.0s penalty (Track limits turn 4)</span>
                            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>STEWARDS</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}>
                            <span style={{ color: '#e2e8f0' }}>⏱️ 14:15:10 • Sector 2 Yellow flag cleared. All sectors green.</span>
                            <span style={{ color: '#00ff88', fontWeight: 700, fontSize: '0.72rem', background: 'rgba(0, 255, 136, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>MARSHAL</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}>
                            <span style={{ color: '#e2e8f0' }}>⏱️ 14:00:00 • Official Session 14 Started (Laguna Seca Grand Prix)</span>
                            <span style={{ color: '#00d4ff', fontWeight: 700, fontSize: '0.72rem', background: 'rgba(0, 212, 255, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>DIRECTOR</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentMockup.title.includes('Route Builder') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Builder Toolbar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ color: '#00d4ff', fontWeight: 800, fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem' }}>
                            🗺️ OpenStreetMap Circuit Designer
                          </span>
                          <span style={{ background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            LEAFLET + TURF.JS
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ background: '#00ff88', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}>
                            ✏️ Draw Route
                          </button>
                          <button style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                            📍 Add Checkpoint
                          </button>
                          <button style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Map Canvas with OpenStreetMap Aesthetic */}
                      <div style={{
                        position: 'relative',
                        height: '240px',
                        background: '#131b26',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 212, 255, 0.2)'
                      }}>
                        {/* OpenStreetMap Tile Grid Simulation */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
                          backgroundSize: '20px 20px, 40px 40px, 40px 40px'
                        }} />

                        {/* Simulated Circuit Track Overlay */}
                        <svg viewBox="0 0 800 240" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                          <path d="M 50 40 L 750 40 M 50 120 L 750 120 M 50 200 L 750 200 M 150 20 L 150 220 M 350 20 L 350 220 M 550 20 L 550 220" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="4,4" fill="none" />
                          <path d="M 0 160 Q 200 130 400 170 T 800 140" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="24" fill="none" />
                          <path d="M 120 70 C 220 50, 280 110, 420 90 C 560 70, 680 110, 680 160 C 680 200, 520 200, 360 180 C 200 160, 120 130, 120 70 Z" stroke="#3b82f6" strokeWidth="6" fill="rgba(59, 130, 246, 0.08)" />
                          <line x1="120" y1="55" x2="120" y2="85" stroke="#00ff88" strokeWidth="4" strokeDasharray="3,3" />
                          <circle cx="120" cy="70" r="7" fill="#00ff88" stroke="#fff" strokeWidth="2" />
                          <text x="135" y="65" fill="#00ff88" fontSize="11" fontWeight="800" fontFamily="Orbitron">START / FINISH</text>
                          <circle cx="420" cy="90" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
                          <text x="430" y="85" fill="#f59e0b" fontSize="10" fontWeight="700">Sector 1 Gate</text>
                          <circle cx="680" cy="160" r="5" fill="#00d4ff" stroke="#fff" strokeWidth="2" />
                          <text x="690" y="165" fill="#00d4ff" fontSize="10" fontWeight="700">Sector 2 Gate</text>
                          <circle cx="360" cy="180" r="5" fill="#bb44ff" stroke="#fff" strokeWidth="2" />
                          <text x="310" y="200" fill="#bb44ff" fontSize="10" fontWeight="700">Speed Trap (285 km/h)</text>
                        </svg>

                        {/* OpenStreetMap Attribution & Scale */}
                        <div style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.75)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          color: '#94a3b8'
                        }}>
                          🗺️ Leaflet | © OpenStreetMap contributors
                        </div>
                      </div>

                      {/* Route Geometry & Telemetry Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '8px'
                      }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Total Distance</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00ff88', fontFamily: "'JetBrains Mono', monospace" }}>5.420 KM</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Waypoints</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#00d4ff', fontFamily: "'JetBrains Mono', monospace" }}>24 Points</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Projection Accuracy</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>±5m (Turf.js)</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Est. Lap Pace</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#bb44ff', fontFamily: "'JetBrains Mono', monospace" }}>1:34.250</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowcasePage;
