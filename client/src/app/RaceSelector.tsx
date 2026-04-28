import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { raceService, Race } from '../network/raceService'

interface RaceSelectorProps {
  onRaceJoined: (raceId: string) => void
  onSpectate: (raceId: string) => void
  onCreateRace: () => void
  onBackToConnection: () => void
}

export default function RaceSelector({ onRaceJoined, onSpectate, onCreateRace, onBackToConnection }: RaceSelectorProps) {
  const [races, setRaces] = useState<Race[]>([])
  const [filter, setFilter] = useState<'all' | 'circuit' | 'custom' | 'duel'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'starting-soon' | 'most-popular' | 'newest' | 'difficulty'>('starting-soon')

  // Fetch real race data from server
  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const racesData = await raceService.getRaces()
        setRaces(racesData)
      } catch (error) {
        console.error('Failed to fetch races:', error)
        setRaces([])
      }
    }

    fetchRaces()

    // Setup WebSocket for real-time updates
    raceService.setupWebSocket(
      (updatedRace) => {
        setRaces(prevRaces => 
          prevRaces.map(race => race.id === updatedRace.id ? updatedRace : race)
        )
      },
      (updatedRaces) => {
        setRaces(updatedRaces)
      }
    )

    // Cleanup WebSocket on unmount
    return () => {
      raceService.closeWebSocket()
    }
  }, [])

  const filteredRaces = races.filter(race => {
    const matchesFilter = filter === 'all' || race.type === filter
    const matchesSearch = race.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         race.trackName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const sortedRaces = [...filteredRaces].sort((a, b) => {
    switch (sortBy) {
      case 'starting-soon':
        return (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0)
      case 'most-popular':
        return (b.participants ?? 0) - (a.participants ?? 0)
      case 'newest':
        return (b.id.localeCompare(a.id))
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3, expert: 4 }
        return difficultyOrder[a.difficulty || 'medium'] - difficultyOrder[b.difficulty || 'medium']
      default:
        return 0
    }
  })

  const getStatusColor = (status: Race['status']) => {
    switch (status) {
      case 'waiting': return '#3498db'
      case 'starting': return '#f39c12'
      case 'in-progress': return '#2ecc71'
      case 'finished': return '#95a5a6'
      default: return '#95a5a6'
    }
  }

  const getStatusText = (status: Race['status']) => {
    switch (status) {
      case 'waiting': return 'Waiting'
      case 'starting': return 'Starting Soon'
      case 'in-progress': return 'In Progress'
      case 'finished': return 'Finished'
      default: return 'Unknown'
    }
  }

  const getTypeIcon = (type: Race['type']) => {
    switch (type) {
      case 'circuit': return '⭕'
      case 'custom': return '🛣️'
      case 'duel': return '⚔️'
      default: return '🏁'
    }
  }

  const getDifficultyColor = (difficulty: Race['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '#2ecc71'
      case 'medium': return '#f39c12'
      case 'hard': return '#e67e22'
      case 'expert': return '#e74c3c'
      default: return '#95a5a6'
    }
  }

  const formatTimeUntil = (startTime?: Date) => {
    if (!startTime) return 'Unknown'
    const now = new Date()
    const diff = startTime.getTime() - now.getTime()
    
    if (diff < 0) return 'Started'
    
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `Starts in ${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    return `Starts in ${hours}h ${minutes % 60}m`
  }

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(26, 26, 46, 0.98)',
      backdropFilter: 'blur(20px)',
      zIndex: 2500,
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBackToConnection}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ← Back
            </button>
            <h1 style={{ color: '#fff', fontSize: '2rem', margin: 0 }}>Race Selection</h1>
          </div>
          <button
            onClick={onCreateRace}
            style={{
              padding: '12px 24px',
              background: 'rgba(46, 204, 113, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            + Create Race
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search races or tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">All Types</option>
            <option value="circuit">⭕ Circuit</option>
            <option value="custom">🛣️ Custom</option>
            <option value="duel">⚔️ Duel</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            <option value="starting-soon">Starting Soon</option>
            <option value="most-popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>
      </div>

      {/* Race List */}
      <div style={{ padding: '20px' }}>
        {sortedRaces.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#888'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏁</div>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No races found</h3>
            <p>Try adjusting your filters or create a new race</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {sortedRaces.map((race) => (
              <div
                key={race.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Race Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${getStatusColor(race.status)}22, ${getStatusColor(race.status)}11)`,
                  padding: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>
                        {getTypeIcon(race.type)} {race.name}
                      </h3>
                      <p style={{ color: '#ccc', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                        🏔️ {race.trackName}
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      background: getStatusColor(race.status),
                      borderRadius: '20px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {getStatusText(race.status)}
                    </div>
                  </div>

                  {race.description && (
                    <p style={{ color: '#aaa', margin: '8px 0 0 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      {race.description}
                    </p>
                  )}
                </div>

                {/* Race Details */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Participants</div>
                      <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                        👥 {race.participants}/{race.maxParticipants}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Duration</div>
                      <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                        ⏱️ {race.duration ? `${Math.floor(race.duration / 60)}m` : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Difficulty</div>
                      <div style={{ 
                        color: getDifficultyColor(race.difficulty), 
                        fontSize: '1rem', 
                        fontWeight: 'bold' 
                      }}>
                        📊 {race.difficulty ? race.difficulty.charAt(0).toUpperCase() + race.difficulty.slice(1) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Enforcement</div>
                      <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                        🚔 {race.enforcementLevel || 'none'}
                      </div>
                    </div>
                  </div>

                  {race.startTime && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>Start Time</div>
                      <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                        🕐 {formatTimeUntil(race.startTime)}
                      </div>
                    </div>
                  )}

                  {/* Prize Pool */}
                  {(race.prizePool || race.entryFee) && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '16px',
                      padding: '8px',
                      background: 'rgba(255, 215, 0, 0.1)',
                      borderRadius: '6px'
                    }}>
                      {race.prizePool && (
                        <div style={{ color: '#ffd700', fontSize: '0.9rem' }}>
                          🏆 ${race.prizePool}
                        </div>
                      )}
                      {race.entryFee && (
                        <div style={{ color: '#ffd700', fontSize: '0.9rem' }}>
                          💰 Entry: ${race.entryFee}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {race.status === 'waiting' || race.status === 'starting' ? (
                      <button
                        onClick={() => onRaceJoined(race.id)}
                        disabled={(race.participants ?? 0) >= (race.maxParticipants ?? 0)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: (race.participants ?? 0) >= (race.maxParticipants ?? 0) 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(46, 204, 113, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: (race.participants ?? 0) >= (race.maxParticipants ?? 0) ? '#666' : '#fff',
                          cursor: (race.participants ?? 0) >= (race.maxParticipants ?? 0) ? 'not-allowed' : 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {(race.participants ?? 0) >= (race.maxParticipants ?? 0) ? 'Full' : 'Join Race'}
                      </button>
                    ) : race.status === 'in-progress' ? (
                      <button
                        onClick={() => onSpectate(race.id)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'rgba(52, 152, 219, 0.8)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        👁️ Spectate
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#666',
                          cursor: 'not-allowed',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}
                      >
                        Finished
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
