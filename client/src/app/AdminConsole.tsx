import { useState, useEffect } from 'react'
import { raceService, Race } from '../network/raceService'

interface AdminConsoleProps {
  onBack: () => void
}

export default function AdminConsole({ onBack }: AdminConsoleProps) {
  const [races, setRaces] = useState<Race[]>([])
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [activeTab, setActiveTab] = useState<'races' | 'tracks' | 'system'>('races')
  const [loading, setLoading] = useState(true)
  const [systemStats, setSystemStats] = useState({
    totalRaces: 0,
    activeRaces: 0,
    totalParticipants: 0,
    systemUptime: '0:00:00'
  })

  useEffect(() => {
    loadRaces()
    loadSystemStats()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadRaces()
      loadSystemStats()
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const loadRaces = async () => {
    try {
      const racesData = await raceService.getRaces()
      setRaces(racesData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load races:', error)
      setLoading(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      // In a real implementation, this would fetch from an admin API
      const racesData = await raceService.getRaces()
      const activeRaces = racesData.filter(r => r.status === 'in-progress' || r.status === 'starting')
      const totalParticipants = racesData.reduce((sum, race) => sum + (race.participants || 0), 0)
      
      setSystemStats({
        totalRaces: racesData.length,
        activeRaces: activeRaces.length,
        totalParticipants,
        systemUptime: formatUptime(process.uptime())
      })
    } catch (error) {
      console.error('Failed to load system stats:', error)
    }
  }

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const updateRaceStatus = async (raceId: string, newStatus: Race['status']) => {
    try {
      // In a real implementation, this would call an admin API
      console.log(`Updating race ${raceId} to ${newStatus}`)
      await loadRaces()
    } catch (error) {
      console.error('Failed to update race status:', error)
    }
  }

  const deleteRace = async (raceId: string) => {
    if (!confirm('Are you sure you want to delete this race?')) return
    
    try {
      // In a real implementation, this would call a delete API
      console.log(`Deleting race ${raceId}`)
      await loadRaces()
      setSelectedRace(null)
    } catch (error) {
      console.error('Failed to delete race:', error)
    }
  }

  const getStatusColor = (status: Race['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'starting': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-green-100 text-green-800'
      case 'finished': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Race['status']) => {
    switch (status) {
      case 'waiting': return '🕐'
      case 'starting': return '🚦'
      case 'in-progress': return '🏁'
      case 'finished': return '🏆'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
        <div style={{ fontSize: '1.125rem' }}>Loading admin console...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Race Admin Console</h1>
          <p style={{ color: '#4b5563', marginTop: '0.25rem' }}>Manage races, tracks, and system settings</p>
        </div>
        <button
          onClick={onBack}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
        >
          ← Back to Main
        </button>
      </div>

      {/* System Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{systemStats.totalRaces}</div>
          <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>Total Races</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{systemStats.activeRaces}</div>
          <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>Active Races</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea' }}>{systemStats.totalParticipants}</div>
          <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>Total Participants</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4b5563' }}>{systemStats.systemUptime}</div>
          <div style={{ color: '#4b5563', fontSize: '0.875rem' }}>System Uptime</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('races')}
            style={{ padding: '0.5rem 0.25rem', borderBottom: activeTab === 'races' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: '500', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'races' ? '#2563eb' : '#6b7280', paddingBottom: '0.5rem' }}
          >
            Race Management
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            style={{ padding: '0.5rem 0.25rem', borderBottom: activeTab === 'tracks' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: '500', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'tracks' ? '#2563eb' : '#6b7280', paddingBottom: '0.5rem' }}
          >
            Track Management
          </button>
          <button
            onClick={() => setActiveTab('system')}
            style={{ padding: '0.5rem 0.25rem', borderBottom: activeTab === 'system' ? '2px solid #2563eb' : '2px solid transparent', fontWeight: '500', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'system' ? '#2563eb' : '#6b7280', paddingBottom: '0.5rem' }}
          >
            System Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'races' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Race List */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>All Races</h2>
              </div>
              <div>
                {races.map((race) => (
                  <div
                    key={race.id}
                    style={{ padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #e5e7eb' }}
                    onClick={() => setSelectedRace(race)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.125rem' }}>{getStatusIcon(race.status)}</span>
                          <div>
                            <h3 style={{ fontWeight: '500', color: '#111827' }}>{race.name}</h3>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{race.trackName} • {race.type}</p>
                          </div>
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <span>{race.participants}/{race.maxParticipants} participants</span>
                          <span>{race.difficulty}</span>
                          {race.startTime && (
                            <span>Starts: {new Date(race.startTime).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.75rem', 
                          fontWeight: '500', 
                          borderRadius: '9999px',
                          backgroundColor: race.status === 'waiting' ? '#fef3c7' : race.status === 'starting' ? '#dbeafe' : race.status === 'in-progress' ? '#dcfce7' : '#f3f4f6',
                          color: race.status === 'waiting' ? '#92400e' : race.status === 'starting' ? '#1e40af' : race.status === 'in-progress' ? '#166534' : '#374151'
                        }}>
                          {race.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Race Details */}
          <div>
            {selectedRace ? (
              <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Race Details</h2>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Name</label>
                    <p style={{ color: '#111827' }}>{selectedRace.name}</p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Status</label>
                    <select
                      value={selectedRace.status}
                      onChange={(e) => updateRaceStatus(selectedRace.id, e.target.value as Race['status'])}
                      style={{ display: 'block', width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', marginTop: '0.25rem' }}
                    >
                      <option value="waiting">Waiting</option>
                      <option value="starting">Starting</option>
                      <option value="in-progress">In Progress</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Track</label>
                    <p style={{ color: '#111827' }}>{selectedRace.trackName}</p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Participants</label>
                    <p style={{ color: '#111827' }}>{selectedRace.participants}/{selectedRace.maxParticipants}</p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Difficulty</label>
                    <p style={{ color: '#111827' }}>{selectedRace.difficulty}</p>
                  </div>
                  {selectedRace.startTime && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Start Time</label>
                      <p style={{ color: '#111827' }}>{new Date(selectedRace.startTime).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedRace.description && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>Description</label>
                      <p style={{ color: '#111827' }}>{selectedRace.description}</p>
                    </div>
                  )}
                  <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => deleteRace(selectedRace.id)}
                      style={{ width: '100%', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                    >
                      Delete Race
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                Select a race to view details
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tracks' && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Track Management</h2>
          </div>
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
            <p>Track management interface coming soon...</p>
            <p style={{ marginTop: '0.5rem' }}>This will allow you to configure checkpoints, track layouts, and more.</p>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>System Settings</h2>
          </div>
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
            <p>System settings interface coming soon...</p>
            <p style={{ marginTop: '0.5rem' }}>This will allow you to configure server settings, database connections, and more.</p>
          </div>
        </div>
      )}
    </div>
  )
}
