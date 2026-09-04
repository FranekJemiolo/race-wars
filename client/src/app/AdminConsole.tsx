import { useState, useEffect } from 'react'
import { raceService, Race } from '../network/raceService'
import { SectorFlagDisplay, Sector, SectorFlagState } from '../components/SectorFlagDisplay'
import { PenaltyAssignment } from '../components/PenaltyAssignment'
import { PenaltyHistory } from '../components/PenaltyHistory'
import { SessionTimeline } from '../components/SessionTimeline'

interface AdminConsoleProps {
  onBack: () => void
}

type AdminTab = 'race-control' | 'penalties' | 'timeline' | 'tracks' | 'system'

export default function AdminConsole({ onBack }: AdminConsoleProps) {
  const [races, setRaces] = useState<Race[]>([])
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('race-control')
  const [loading, setLoading] = useState(true)

  // Sector flags state for the selected session
  const [sectors, setSectors] = useState<Sector[]>([
    { id: 'sec-1', name: 'Sector 1 (Start/Finish)', order: 1, startDistance: 0, endDistance: 1200 },
    { id: 'sec-2', name: 'Sector 2 (Technical Esses)', order: 2, startDistance: 1200, endDistance: 2800 },
    { id: 'sec-3', name: 'Sector 3 (High-Speed Straight)', order: 3, startDistance: 2800, endDistance: 4500 }
  ])

  const [sectorFlags, setSectorFlags] = useState<SectorFlagState[]>([
    { sectorId: 'sec-1', flag: 'green', reason: 'Track Clear', updatedAt: Date.now() },
    { sectorId: 'sec-2', flag: 'green', reason: 'Track Clear', updatedAt: Date.now() },
    { sectorId: 'sec-3', flag: 'green', reason: 'Track Clear', updatedAt: Date.now() }
  ])

  const [systemStats, setSystemStats] = useState({
    totalRaces: 0,
    activeRaces: 0,
    totalParticipants: 0,
    systemUptime: '0:00:00',
    wsLatencyMs: 14,
    dbStatus: 'HEALTHY'
  })

  useEffect(() => {
    loadRaces()
    loadSystemStats()
    
    const interval = setInterval(() => {
      loadRaces()
      loadSystemStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadRaces = async () => {
    try {
      const racesData = await raceService.getRaces()
      setRaces(racesData)
      if (racesData.length > 0 && !selectedRace) {
        setSelectedRace(racesData[0])
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load races:', error)
      setLoading(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      const racesData = await raceService.getRaces()
      const activeRaces = racesData.filter(r => r.status === 'in-progress' || r.status === 'starting')
      const totalParticipants = racesData.reduce((sum, race) => sum + (race.participants || 0), 0)
      
      setSystemStats({
        totalRaces: racesData.length,
        activeRaces: activeRaces.length,
        totalParticipants,
        systemUptime: '14:28:12',
        wsLatencyMs: Math.floor(Math.random() * 8) + 12,
        dbStatus: 'HEALTHY'
      })
    } catch (error) {
      console.error('Failed to load system stats:', error)
    }
  }

  const updateRaceStatus = async (raceId: string, newStatus: Race['status']) => {
    try {
      setRaces(prev => prev.map(r => r.id === raceId ? { ...r, status: newStatus } : r))
      if (selectedRace?.id === raceId) {
        setSelectedRace(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Failed to update race status:', error)
    }
  }

  const handleSectorFlagChange = (sectorId: string, flag: any, reason: string) => {
    setSectorFlags(prev => prev.map(sf => 
      sf.sectorId === sectorId ? { ...sf, flag, reason, updatedAt: Date.now() } : sf
    ))
  }

  const handleBroadcastAllFlags = (flag: any, reason: string) => {
    setSectorFlags(prev => prev.map(sf => ({ ...sf, flag, reason, updatedAt: Date.now() })))
  }

  const getStatusBadge = (status: Race['status']) => {
    const styles: Record<Race['status'], { bg: string, color: string, border: string }> = {
      'waiting': { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.4)' },
      'starting': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.4)' },
      'in-progress': { bg: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: 'rgba(0, 255, 136, 0.4)' },
      'finished': { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: 'rgba(156, 163, 175, 0.4)' }
    }
    const current = styles[status] || styles['waiting']
    return (
      <span style={{
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        padding: '3px 8px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 700,
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      background: 'radial-gradient(circle at 20% 10%, #0d1322 0%, #06090f 100%)',
      color: '#f3f4f6',
      padding: '28px 24px',
      boxSizing: 'border-box',
      overflowY: 'auto',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ← Exit Console
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff',
                fontFamily: "'Orbitron', sans-serif"
              }}>
                RACE CONTROL COMMAND
              </h1>
              <span style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                LIVE STEWARD
              </span>
            </div>
            <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Session coordination, telemetry monitoring, sector flags, and steward enforcement.
            </p>
          </div>
        </div>

        {/* Global Live Indicators */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '8px 14px',
            display: 'flex',
            gap: '14px',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block' }}>PING</span>
              <span style={{ fontWeight: 700, color: '#00ff88', fontSize: '0.9rem' }}>{systemStats.wsLatencyMs}ms</span>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
            <div>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block' }}>ACTIVE RACES</span>
              <span style={{ fontWeight: 700, color: '#00d4ff', fontSize: '0.9rem' }}>{systemStats.activeRaces}</span>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
            <div>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block' }}>DB STATUS</span>
              <span style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem' }}>ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'race-control', label: '🏁 Race Control & Flags', icon: '🏁' },
          { id: 'penalties', label: '⚖️ Stewards & Penalties', icon: '⚖️' },
          { id: 'timeline', label: '⏱️ Session Timeline', icon: '⏱️' },
          { id: 'tracks', label: '🗺️ Track Sectors', icon: '🗺️' },
          { id: 'system', label: '🖥️ Telemetry & System', icon: '🖥️' }
        ].map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              style={{
                background: isActive ? 'rgba(0, 255, 136, 0.12)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #00ff88' : '2px solid transparent',
                color: isActive ? '#00ff88' : '#9ca3af',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: Race Control & Flags */}
      {activeTab === 'race-control' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Left: Active Session List */}
          <div style={{
            background: 'rgba(18, 24, 38, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff', fontWeight: 800 }}>
              Active Sessions ({races.length})
            </h3>

            {races.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                No active sessions found. Create a race in Race Selector.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {races.map(race => {
                  const isSelected = selectedRace?.id === race.id
                  return (
                    <div
                      key={race.id}
                      onClick={() => setSelectedRace(race)}
                      style={{
                        background: isSelected ? 'rgba(0, 255, 136, 0.08)' : 'rgba(0, 0, 0, 0.25)',
                        border: isSelected ? '1px solid #00ff88' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.98rem' }}>{race.name}</span>
                          {getStatusBadge(race.status)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>
                          {race.trackName} • {race.type} • {race.participants}/{race.maxParticipants} Drivers
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: isSelected ? '#00ff88' : '#6b7280' }}>
                        {isSelected ? 'MANAGED' : 'SELECT →'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Race Controller & Flag Station */}
          {selectedRace && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Session State Controls */}
              <div style={{
                background: 'rgba(18, 24, 38, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Selected Session</span>
                    <h2 style={{ margin: '2px 0 0 0', fontSize: '1.3rem', color: '#fff', fontWeight: 800 }}>
                      {selectedRace.name}
                    </h2>
                  </div>
                  {getStatusBadge(selectedRace.status)}
                </div>

                {/* Quick Director Commands */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  <button
                    onClick={() => updateRaceStatus(selectedRace.id, 'in-progress')}
                    style={{
                      background: 'rgba(0, 255, 136, 0.15)',
                      border: '1px solid #00ff88',
                      color: '#00ff88',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ▶ Start Race
                  </button>
                  <button
                    onClick={() => updateRaceStatus(selectedRace.id, 'waiting')}
                    style={{
                      background: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid #eab308',
                      color: '#eab308',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⏸ Pause Session
                  </button>
                  <button
                    onClick={() => handleBroadcastAllFlags('safety_car', 'Safety Car Deployed by Race Director')}
                    style={{
                      background: 'rgba(249, 115, 22, 0.15)',
                      border: '1px solid #f97316',
                      color: '#f97316',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ⚠️ Deploy SC
                  </button>
                  <button
                    onClick={() => handleBroadcastAllFlags('red', 'Session Suspended - Red Flag')}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🛑 Red Flag
                  </button>
                  <button
                    onClick={() => handleBroadcastAllFlags('green', 'Track Clear - Racing Resumed')}
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid #22c55e',
                      color: '#22c55e',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🟢 All Green
                  </button>
                  <button
                    onClick={() => updateRaceStatus(selectedRace.id, 'finished')}
                    style={{
                      background: 'rgba(156, 163, 175, 0.15)',
                      border: '1px solid #9ca3af',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🏁 Checkered Flag
                  </button>
                </div>

                {/* Sector Flags Live Status */}
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#9ca3af', textTransform: 'uppercase' }}>
                  Live Sector Flag Status
                </h4>
                <SectorFlagDisplay
                  sectors={sectors}
                  sectorFlags={sectorFlags}
                  onFlagClick={(sectorId) => {
                    const current = sectorFlags.find(sf => sf.sectorId === sectorId)?.flag || 'green'
                    const nextFlag = current === 'green' ? 'yellow' : current === 'yellow' ? 'red' : 'green'
                    handleSectorFlagChange(sectorId, nextFlag, `Updated by marshal to ${nextFlag}`)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Stewards & Penalties */}
      {activeTab === 'penalties' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <div style={{
            background: 'rgba(18, 24, 38, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              Assign Driver Penalty
            </h3>
            <PenaltyAssignment sessionId={selectedRace?.id || 'default-session'} />
          </div>

          <div style={{
            background: 'rgba(18, 24, 38, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
              Penalty Audit History
            </h3>
            <PenaltyHistory sessionId={selectedRace?.id || 'default-session'} />
          </div>
        </div>
      )}

      {/* TAB 3: Session Timeline */}
      {activeTab === 'timeline' && (
        <div style={{
          background: 'rgba(18, 24, 38, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
            Session Event Chronology
          </h3>
          <SessionTimeline sessionId={selectedRace?.id || 'default-session'} />
        </div>
      )}

      {/* TAB 4: Track Sectors */}
      {activeTab === 'tracks' && (
        <div style={{
          background: 'rgba(18, 24, 38, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
            Track Spatial Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {sectors.map(sec => (
              <div
                key={sec.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  padding: '16px'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#00d4ff', fontWeight: 700 }}>SECTOR {sec.order}</div>
                <h4 style={{ margin: '4px 0 8px 0', color: '#fff' }}>{sec.name}</h4>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  Distance: {sec.startDistance}m — {sec.endDistance}m ({sec.endDistance - sec.startDistance}m length)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Telemetry & System */}
      {activeTab === 'system' && (
        <div style={{
          background: 'rgba(18, 24, 38, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 800 }}>
            Telemetry Infrastructure Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>SYSTEM UPTIME</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00ff88', marginTop: '4px' }}>
                {systemStats.systemUptime}
              </div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ACTIVE RACERS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00d4ff', marginTop: '4px' }}>
                {systemStats.totalParticipants}
              </div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>TELEMETRY PING</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffaa00', marginTop: '4px' }}>
                {systemStats.wsLatencyMs} ms
              </div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ENFORCEMENT ENGINE</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>
                ONLINE
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
