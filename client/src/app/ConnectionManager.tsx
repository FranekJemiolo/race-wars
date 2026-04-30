import { useState, useEffect } from 'react'
import { connect, disconnect, getConnectionState } from '../network/socket'
import { QRCodeSVG } from 'qrcode.react'

interface ServerInfo {
  id: string
  name: string
  url: string
  status: 'online' | 'offline' | 'busy'
  currentRace?: string
  participants: number
  maxParticipants: number
  trackName?: string
  raceType?: 'circuit' | 'custom' | 'duel'
}

interface ConnectionManagerProps {
  onConnected: () => void
  onRaceJoined: (raceId: string) => void
  onAdminAccess?: () => void
  currentUser?: any
  isSpectator?: boolean
  onLogout?: () => Promise<void>
}

export default function ConnectionManager({ onConnected, onRaceJoined, onAdminAccess, currentUser, isSpectator, onLogout }: ConnectionManagerProps) {
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null)
  const [customUrl, setCustomUrl] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [connectionError, setConnectionError] = useState('')

  // Mock server data for development
  useEffect(() => {
    const mockServers: ServerInfo[] = [
      {
        id: 'local-dev',
        name: 'Local Development',
        url: 'ws://localhost:8080',
        status: 'online',
        currentRace: 'Practice Session',
        participants: 3,
        maxParticipants: 20,
        trackName: 'Test Circuit',
        raceType: 'circuit'
      },
      {
        id: 'staging',
        name: 'Staging Server',
        url: 'ws://staging.race-wars.com:8080',
        status: 'online',
        currentRace: 'Duel Championship',
        participants: 8,
        maxParticipants: 10,
        trackName: 'Speedway Arena',
        raceType: 'duel'
      },
      {
        id: 'public-1',
        name: 'Public Server 1',
        url: 'ws://public1.race-wars.com:8080',
        status: 'busy',
        currentRace: 'Custom Race Night',
        participants: 15,
        maxParticipants: 16,
        trackName: 'Mountain Pass',
        raceType: 'custom'
      }
    ]
    setServers(mockServers)
  }, [])

  // Monitor connection state
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionState(getConnectionState())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleConnect = (server: ServerInfo) => {
    setSelectedServer(server)
    setConnectionState('connecting')
    setConnectionError('')
    
    try {
      connect(server.url)
      // Wait a moment for connection to establish before calling onConnected
      setTimeout(() => {
        setConnectionState('connected')
        onConnected()
        // Clear selected server immediately to hide the overlay
        // This allows the parent component (RaceSelection) to be visible
        setSelectedServer(null)
      }, 500)
    } catch (error) {
      setConnectionError('Failed to connect to server')
      setConnectionState('disconnected')
    }
  }

  const handleCustomConnect = () => {
    if (!customUrl.trim()) return
    
    const customServer: ServerInfo = {
      id: 'custom',
      name: 'Custom Server',
      url: customUrl.trim(),
      status: 'online',
      participants: 0,
      maxParticipants: 0
    }
    
    handleConnect(customServer)
  }

  const handleDisconnect = () => {
    disconnect()
    setSelectedServer(null)
    setConnectionState('disconnected')
  }

  const getServerConnectionUrl = (server: ServerInfo) => {
    const baseUrl = window.location.origin
    return `${baseUrl}?server=${encodeURIComponent(server.url)}`
  }

  const handleAdminAccess = () => {
    if (onAdminAccess) {
      onAdminAccess()
    }
  }

  if (connectionState === 'connected' && selectedServer) {
    return (
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(26, 26, 46, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        minWidth: '250px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#2ecc71',
            marginRight: '8px'
          }} />
          <span style={{ fontWeight: 'bold', color: '#fff' }}>{selectedServer?.name || 'Connected'}</span>
        </div>
        
        {selectedServer?.currentRace && (
          <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '8px' }}>
            Current: {selectedServer.currentRace}
          </div>
        )}
        
        {/* User Information */}
        {currentUser && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '8px', 
            borderRadius: '6px', 
            marginBottom: '12px',
            fontSize: '0.8rem'
          }}>
            <div style={{ color: '#667eea', fontWeight: 'bold', marginBottom: '4px' }}>
              👤 {currentUser.displayName}
            </div>
            <div style={{ color: '#888' }}>
              {currentUser.role === 'admin' ? '🛠️ Admin' : '🏁 Racer'} • {currentUser.isVerified ? '✅ Verified' : '⏳ Pending'}
            </div>
          </div>
        )}
        
        {isSpectator && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '8px', 
            borderRadius: '6px', 
            marginBottom: '12px',
            fontSize: '0.8rem',
            color: '#87ceeb'
          }}>
            👁️ Spectating Mode
          </div>
        )}
        
        {selectedServer && (
          <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '12px' }}>
            {selectedServer.participants}/{selectedServer.maxParticipants} participants
          </div>
        )}
        
        <button
          onClick={handleDisconnect}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(231, 76, 60, 0.8)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '8px'
          }}
        >
          Disconnect
        </button>
        
        {onAdminAccess && currentUser?.role === 'admin' && (
          <button
            onClick={handleAdminAccess}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(155, 89, 182, 0.8)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '8px'
            }}
          >
            🛠️ Admin Console
          </button>
        )}
        
        {currentUser && onLogout && (
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '8px'
            }}
          >
            🚪 Logout
          </button>
        )}
      </div>
    )
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000
    }}>
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h1 style={{ 
          color: '#fff', 
          textAlign: 'center', 
          marginBottom: '8px',
          fontSize: '2.5rem'
        }}>
          Race Wars
        </h1>
        
        <p style={{ 
          color: '#888', 
          textAlign: 'center', 
          marginBottom: '32px',
          fontSize: '1.1rem'
        }}>
          Connect to a server to start racing
        </p>

        {connectionError && (
          <div style={{
            background: 'rgba(231, 76, 60, 0.2)',
            border: '1px solid rgba(231, 76, 60, 0.5)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#e74c3c',
            textAlign: 'center'
          }}>
            {connectionError}
          </div>
        )}

        {/* Server List */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', marginBottom: '16px' }}>Available Servers</h3>
          
          {servers.map((server) => (
            <div
              key={server.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                cursor: server.status === 'online' ? 'pointer' : 'not-allowed',
                opacity: server.status === 'online' ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
              onClick={() => server.status === 'online' && handleConnect(server)}
              onMouseEnter={(e) => {
                if (server.status === 'online') {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: server.status === 'online' ? '#2ecc71' : server.status === 'busy' ? '#f39c12' : '#e74c3c',
                    marginRight: '8px'
                  }} />
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{server.name}</span>
                </div>
                <span style={{ 
                  color: '#888', 
                  fontSize: '0.8rem',
                  textTransform: 'uppercase'
                }}>
                  {server.status}
                </span>
              </div>
              
              {server.currentRace && (
                <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '4px' }}>
                  🏁 {server.currentRace}
                </div>
              )}
              
              <div style={{ color: '#888', fontSize: '0.8rem' }}>
                👥 {server.participants}/{server.maxParticipants} • 🏔️ {server.trackName} • 
                {' '}{server.raceType === 'circuit' ? '⭕ Circuit' : server.raceType === 'duel' ? '⚔️ Duel' : '🛣️ Custom'}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Server Connection */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowCustom(!showCustom)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(52, 152, 219, 0.2)',
              border: '1px solid rgba(52, 152, 219, 0.5)',
              borderRadius: '8px',
              color: '#3498db',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: showCustom ? '16px' : '0'
            }}
          >
            {showCustom ? 'Hide' : 'Show'} Custom Server
          </button>
          
          {showCustom && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="ws://server:port"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              <button
                onClick={handleCustomConnect}
                disabled={!customUrl.trim()}
                style={{
                  padding: '12px 24px',
                  background: customUrl.trim() ? 'rgba(46, 204, 113, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: customUrl.trim() ? '#fff' : '#666',
                  cursor: customUrl.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem'
                }}
              >
                Connect
              </button>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#fff', marginBottom: '12px' }}>Quick Connect</h4>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '16px' }}>
            Scan QR code or share link to connect
          </p>
          
          {servers.slice(0, 2).map((server) => (
            <div key={server.id} style={{ marginBottom: '16px' }}>
              <div style={{ 
                background: '#fff', 
                padding: '16px', 
                borderRadius: '8px', 
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                <QRCodeSVG 
                  value={getServerConnectionUrl(server)}
                  size={120}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <div style={{ color: '#888', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {getServerConnectionUrl(server)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
