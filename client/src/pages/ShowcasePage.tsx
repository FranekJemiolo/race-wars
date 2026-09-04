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
    }
  ];

  const currentMockup = mockups[selectedMockup];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #111728 0%, #080c14 90%)',
      color: '#f3f4f6',
      padding: '36px 24px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '2rem' }}>🏁</span>
            <h1 style={{
              fontSize: '2.4rem',
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
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            Next-generation real-time GPS telemetry, mobile cockpit HUD, and professional race control suite.
          </p>
        </div>
        
        {/* Mockup Pill Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '36px',
          flexWrap: 'wrap'
        }}>
          {mockups.map((mockup, index) => {
            const isSelected = selectedMockup === index;
            return (
              <button
                key={index}
                onClick={() => setSelectedMockup(index)}
                data-testid={`mockup-button-${index}`}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.18) 0%, rgba(0, 212, 255, 0.12) 100%)' 
                    : 'rgba(22, 27, 34, 0.7)',
                  color: isSelected ? '#00ff88' : '#94a3b8',
                  boxShadow: isSelected ? '0 0 16px rgba(0, 255, 136, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {mockup.title}
              </button>
            );
          })}
        </div>

        {/* Hero Display Stage */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Subtitle & Description */}
          <div style={{ textAlign: 'center', maxWidth: '700px' }}>
            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 8px 0',
              fontFamily: "'Orbitron', sans-serif"
            }}>
              {currentMockup.title}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
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
                  width: '380px',
                  background: '#0c101a',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '36px',
                  padding: '20px 16px',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 136, 0.1)',
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
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 212, 255, 0.08)',
                  boxSizing: 'border-box'
                }}
              >
                {/* Desktop Window Title Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                    </div>
                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '1rem', fontFamily: "'Orbitron', sans-serif" }}>
                      🏁 Race Wars — {currentMockup.title.split(' ')[2] || 'Command Console'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 8px #00ff88' }} />
                    TELEMETRY ACTIVE
                  </div>
                </div>

                {/* Desktop Content Views */}
                <div>
                  {currentMockup.title.includes('Team Dashboard') && (
                    <div>
                      {/* Top Team Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CONSTRUCTOR RANK</span>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00ff88', fontFamily: "'Orbitron', sans-serif" }}>1st</div>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Premier Division</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TOTAL SQUAD POINTS</span>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00d4ff', fontFamily: "'Orbitron', sans-serif" }}>3,890</div>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>+120 this weekend</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PODIUM RATE</span>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffaa00', fontFamily: "'Orbitron', sans-serif" }}>88%</div>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>42 podiums / 48 starts</span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '16px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>FLEET READINESS</span>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22c55e', fontFamily: "'Orbitron', sans-serif" }}>100%</div>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>8 race cars tuned</span>
                        </div>
                      </div>

                      {/* Standings Table */}
                      <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 18px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontWeight: 700, fontSize: '0.9rem', color: '#cbd5e1' }}>
                          Constructor Championship Standings
                        </div>
                        <div style={{ padding: '8px' }}>
                          {[
                            { rank: 1, team: 'Apex Predators Racing', tag: 'APR', points: 3890, wins: 28, form: '🥇🥇🥈' },
                            { rank: 2, team: 'Vortex Works Motorsport', tag: 'VWM', points: 3620, wins: 18, form: '🥈🥉🥇' },
                            { rank: 3, team: 'Chronos Time Attack', tag: 'CTA', points: 3105, wins: 14, form: '🥉④🥈' }
                          ].map(row => (
                            <div key={row.rank} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              fontSize: '0.9rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <span style={{ fontWeight: 800, color: row.rank === 1 ? '#00ff88' : '#94a3b8', width: '20px' }}>#{row.rank}</span>
                                <span style={{ fontWeight: 700, color: '#fff' }}>{row.team}</span>
                                <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>{row.tag}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <span style={{ color: '#cbd5e1' }}>{row.wins} Wins</span>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Video / Map Replay Stage */}
                      <div style={{
                        height: '240px',
                        background: 'radial-gradient(circle at 50% 50%, #151e30 0%, #090e18 100%)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="600" height="200" viewBox="0 0 600 200">
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
                          bottom: '16px',
                          left: '20px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center'
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
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>⏮️ -10s</button>
                            <button style={{ background: '#00ff88', border: 'none', color: '#000', padding: '6px 16px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>▶ Play</button>
                            <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>+10s ⏭️</button>
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#00d4ff', fontWeight: 700 }}>
                            14:23.850 / 28:45.000 (1.0x Real-time)
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {/* Marshall Actions */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        <button style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', padding: '12px', borderRadius: '10px', fontWeight: 800 }}>
                          🟢 Green Flag
                        </button>
                        <button style={{ background: 'rgba(234, 179, 8, 0.15)', border: '1px solid #eab308', color: '#eab308', padding: '12px', borderRadius: '10px', fontWeight: 800 }}>
                          🟡 Yellow Flag
                        </button>
                        <button style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', color: '#f97316', padding: '12px', borderRadius: '10px', fontWeight: 800 }}>
                          ⚠️ Safety Car
                        </button>
                        <button style={{ background: 'rgba(239, 68, 68, 0.18)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '10px', fontWeight: 800 }}>
                          🛑 Red Flag
                        </button>
                        <button style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '12px', borderRadius: '10px', fontWeight: 800 }}>
                          🏁 Finish Race
                        </button>
                      </div>

                      {/* Steward Log */}
                      <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '12px' }}>
                          Live Incident & Stewards Log
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                            <span>⏱️ 14:18:22 • #44 Hamilton assigned +5.0s penalty (Track limits turn 4)</span>
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>STEWARDS</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                            <span>⏱️ 14:15:10 • Sector 2 Yellow flag cleared. All sectors green.</span>
                            <span style={{ color: '#00ff88', fontWeight: 700 }}>MARSHAL</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                            <span>⏱️ 14:00:00 • Official Session 14 Started (Laguna Seca Grand Prix)</span>
                            <span style={{ color: '#00d4ff', fontWeight: 700 }}>DIRECTOR</span>
                          </div>
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
