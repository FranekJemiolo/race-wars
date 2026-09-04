import { useEffect, useState, useRef } from "react"
import { connect, disconnect, getConnectionState } from "../network/socket"
import { setupMessageHandlers } from "../network/handlers"
import { store } from "../state/store"
import { initializeMap } from "../map/map"
import { updatePlayerMarkers } from "../map/playerLayer"
import HUD from "../ui/HUD"
import Leaderboard from "../ui/Leaderboard"
import Status from "../ui/Status"
import ConnectionManager from "./ConnectionManager"
import RaceSelector from "./RaceSelector"
import RaceCreator from "./RaceCreator"
import AdminConsole from "./AdminConsole"
import AuthScreen from "./AuthScreen"
import { TeamManager } from "../components/TeamManager"
import RouteBuilder from "../components/RouteBuilder"
import { RaceReplayPlayer } from "../components/RaceReplayPlayer"
import { GarageManager } from "../components/GarageManager"
import { AnalyticsDashboard } from "../components/AnalyticsDashboard"
import { MultiCameraView } from "../components/MultiCameraView"
import { RealTimeLeaderboard } from "../components/RealTimeLeaderboard"
import { ShowcasePage } from "../pages/ShowcasePage"
import { authService, User } from "../network/authService"

type ViewState = 
  | 'connection' 
  | 'race-selection' 
  | 'race-creation' 
  | 'racing' 
  | 'spectating' 
  | 'admin' 
  | 'auth' 
  | 'leaderboard' 
  | 'team-management' 
  | 'route-builder' 
  | 'race-replay'
  | 'garage'
  | 'analytics'
  | 'multicam'

export default function EnhancedApp() {
  const [viewState, setViewState] = useState<ViewState>('connection')
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [mapInitialized, setMapInitialized] = useState(false)
  const [currentRace, setCurrentRace] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isSpectator, setIsSpectator] = useState(false)
  const [showShowcase, setShowShowcase] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Check URL hash for showcase mode
  useEffect(() => {
    const handleHash = () => {
      setShowShowcase(window.location.hash === '#showcase')
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = () => {
      const user = authService.getCurrentUser()
      if (user) {
        setCurrentUser(user)
        setViewState('connection')
      } else {
        setViewState('auth')
      }
    }
    checkAuth()
  }, [])

  // Check URL parameters for server connection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const serverParam = urlParams.get('server')
    if (serverParam) {
      setServerUrl(serverParam)
    }
  }, [])

  // Setup message handlers
  useEffect(() => {
    setupMessageHandlers()
  }, [])

  // Monitor connection state
  useEffect(() => {
    const checkConnection = setInterval(() => {
      setConnectionState(getConnectionState())
    }, 1000)
    return () => clearInterval(checkConnection)
  }, [])

  // Subscribe to store changes for player updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState()
      if (mapInitialized && (viewState === 'racing' || viewState === 'spectating')) {
        updatePlayerMarkers(Array.from(state.players.values()), state.selfPlayerId)
      }
    })
    return () => unsubscribe()
  }, [mapInitialized, viewState])

  // Initialize map when container is ready and we're in racing view
  useEffect(() => {
    if (mapRef.current && !mapInitialized && (viewState === 'racing' || viewState === 'spectating')) {
      try {
        initializeMap("map")
        setMapInitialized(true)
      } catch (e) {
        console.error("Failed to initialize map:", e)
      }
    }
  }, [mapInitialized, viewState])

  const handleConnected = () => {
    setViewState('race-selection')
  }

  const handleRaceJoined = (raceId: string) => {
    setCurrentRace(raceId)
    setViewState('racing')
    console.log('Joining race:', raceId)
  }

  const handleSpectate = (raceId: string) => {
    setCurrentRace(raceId)
    setViewState('spectating')
    console.log('Spectating race:', raceId)
  }

  const handleCreateRace = () => {
    setViewState('race-creation')
  }

  const handleRaceCreated = (raceData: any) => {
    console.log('Race created:', raceData)
    setViewState('race-selection')
  }

  const handleBackToConnection = () => {
    setViewState('connection')
    setCurrentRace(null)
  }

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user)
    setIsSpectator(false)
    setViewState('connection')
  }

  const handleSpectatorMode = () => {
    setCurrentUser(null)
    setIsSpectator(true)
    setViewState('connection')
  }

  const handleLogout = async () => {
    await authService.logout()
    setCurrentUser(null)
    setIsSpectator(false)
    setViewState('auth')
  }

  const handleBackToSelection = () => {
    setViewState('race-selection')
    setCurrentRace(null)
  }

  // Showcase Screen for Automated Playwright Screenshots
  if (showShowcase) {
    return <ShowcasePage />
  }

  // Authentication Screen
  if (viewState === 'auth') {
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess}
        onSpectatorMode={handleSpectatorMode}
      />
    )
  }

  // Global Navigation Bar Component for authenticated / spectator view
  const renderNavBar = () => (
    <nav style={{
      height: '56px',
      background: 'rgba(9, 13, 22, 0.95)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 10000,
      position: 'relative',
      flexShrink: 0
    }}>
      {/* Brand & Connection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          onClick={() => setViewState('race-selection')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{
            fontSize: '1.15rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            fontFamily: "'Orbitron', sans-serif",
            background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            RACE WARS
          </span>
        </div>

        {/* Live Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: connectionState === 'connected' 
            ? 'rgba(0, 255, 136, 0.12)' 
            : 'rgba(234, 179, 8, 0.12)',
          border: `1px solid ${connectionState === 'connected' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: connectionState === 'connected' ? '#00ff88' : '#eab308'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: connectionState === 'connected' ? '#00ff88' : '#eab308',
            boxShadow: connectionState === 'connected' ? '0 0 6px #00ff88' : 'none'
          }} />
          <span>{connectionState.toUpperCase()}</span>
        </div>
      </div>

      {/* Center Nav Links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'race-selection', label: 'Lobby', icon: '🏁' },
          { id: 'garage', label: 'Garage', icon: '🏎️' },
          { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
          { id: 'admin', label: 'Race Control', icon: '🛡️' },
          { id: 'team-management', label: 'Teams', icon: '👥' },
          { id: 'route-builder', label: 'Track Studio', icon: '🗺️' },
          { id: 'analytics', label: 'Telemetry', icon: '📊' },
          { id: 'race-replay', label: 'Replay', icon: '🎬' }
        ].map(item => {
          const isActive = viewState === item.id || 
            (item.id === 'race-selection' && (viewState === 'racing' || viewState === 'spectating'))
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'race-selection' && currentRace) {
                  setViewState('racing')
                } else {
                  setViewState(item.id as ViewState)
                }
              }}
              style={{
                background: isActive ? 'rgba(0, 255, 136, 0.12)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #00ff88' : '2px solid transparent',
                color: isActive ? '#00ff88' : '#9ca3af',
                padding: '6px 12px',
                borderRadius: '6px 6px 0 0',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Right User & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                {currentUser.displayName || currentUser.email}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#00d4ff', textTransform: 'capitalize' }}>
                {(currentUser as any).experienceLevel || currentUser.role || 'Driver'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setViewState('auth')}
            style={{
              background: '#00ff88',
              color: '#000',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  )

  // Layout wrapper for all non-racing screens
  const renderLayout = (content: React.ReactNode) => (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#090d16',
      overflow: 'hidden'
    }}>
      {renderNavBar()}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {content}
      </div>
    </div>
  )

  // Connection Screen
  if (viewState === 'connection') {
    return renderLayout(
      <ConnectionManager 
        onConnected={handleConnected}
        onRaceJoined={handleRaceJoined}
        onAdminAccess={() => setViewState('admin')}
        currentUser={currentUser}
        isSpectator={isSpectator}
        onLogout={handleLogout}
      />
    )
  }

  // Admin Console Screen
  if (viewState === 'admin') {
    return renderLayout(
      <AdminConsole onBack={() => setViewState('race-selection')} />
    )
  }

  // Garage Screen
  if (viewState === 'garage') {
    return renderLayout(<GarageManager />)
  }

  // Analytics Screen
  if (viewState === 'analytics') {
    return renderLayout(
      <div style={{ padding: '24px' }}>
        <AnalyticsDashboard sessionId={currentRace || 'session-telemetry-live'} />
      </div>
    )
  }

  // MultiCamera View Screen
  if (viewState === 'multicam') {
    return renderLayout(
      <MultiCameraView 
        sessionId={currentRace || 'session-multicam-live'} 
        onExit={() => setViewState('racing')} 
      />
    )
  }

  // Race Creation Screen
  if (viewState === 'race-creation') {
    return renderLayout(
      <RaceCreator 
        onRaceCreated={handleRaceCreated}
        onCancel={() => setViewState('race-selection')}
      />
    )
  }

  // Race Selection Screen
  if (viewState === 'race-selection') {
    return renderLayout(
      <RaceSelector 
        onRaceJoined={handleRaceJoined}
        onSpectate={handleSpectate}
        onCreateRace={handleCreateRace}
        onBackToConnection={handleBackToConnection}
        onAdminAccess={() => setViewState('admin')}
        onLeaderboardView={() => setViewState('leaderboard')}
        onTeamManagementView={() => setViewState('team-management')}
        onRouteBuilderView={() => setViewState('route-builder')}
        onRaceReplayView={() => setViewState('race-replay')}
      />
    )
  }

  // Leaderboard Screen
  if (viewState === 'leaderboard') {
    return renderLayout(
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            fontFamily: "'Orbitron', sans-serif",
            color: '#fff',
            margin: '0 0 6px 0'
          }}>
            🏆 REAL-TIME TIMING & LEADERBOARDS
          </h1>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>
            Live sector splits, delta pacing, speed trap analysis, and anti-cheat validation.
          </p>
        </div>
        <RealTimeLeaderboard raceId={currentRace || 'global-live-standings'} />
      </div>
    )
  }

  // Team Management Screen
  if (viewState === 'team-management') {
    return renderLayout(
      <div style={{ padding: '24px' }}>
        <TeamManager userId={currentUser?.id || 'demo-user'} />
      </div>
    )
  }

  // Route Builder Screen
  if (viewState === 'route-builder') {
    return renderLayout(
      <div style={{ padding: '24px', height: 'calc(100vh - 56px)' }}>
        <RouteBuilder 
          onRouteCreated={(route) => {
            console.log('Route created:', route)
            handleBackToSelection()
          }}
          onCancel={handleBackToSelection}
        />
      </div>
    )
  }

  // Race Replay Screen
  if (viewState === 'race-replay') {
    return renderLayout(
      <div style={{ padding: '24px' }}>
        <RaceReplayPlayer showMap={true} showAnalysis={true} />
      </div>
    )
  }

  // Racing / Spectating Screen (Full Cockpit Map HUD)
  return (
    <div style={{ 
      width: '100vw',
      height: '100vh',
      background: '#090d16',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {renderNavBar()}

      {/* Map container */}
      <div 
        ref={mapRef}
        id="map" 
        style={{ 
          width: '100%', 
          height: 'calc(100% - 56px)',
          position: 'absolute',
          top: '56px',
          left: 0,
          zIndex: 1
        }} 
      />

      {/* Cockpit Overlay Quick Bar */}
      <div style={{
        position: 'absolute',
        top: '72px',
        left: '20px',
        right: '20px',
        background: 'rgba(9, 13, 22, 0.88)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '12px 18px',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>
            {viewState === 'spectating' ? '👁️' : '🏁'}
          </span>
          <div>
            <h2 style={{
              color: '#fff',
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 800,
              fontFamily: "'Orbitron', sans-serif"
            }}>
              {viewState === 'spectating' ? 'SPECTATING' : 'COCKPIT HUD'} — {currentRace || 'Laguna Seca Grand Prix'}
            </h2>
            <p style={{ color: '#9ca3af', margin: '2px 0 0 0', fontSize: '0.8rem' }}>
              Telemetry Server: {serverUrl || 'Connected'} • 60 FPS GPS Stream
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setViewState('multicam')}
            style={{
              padding: '8px 14px',
              background: 'rgba(0, 212, 255, 0.15)',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: '8px',
              color: '#00d4ff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            🎥 Multi-Cam
          </button>
          <button
            onClick={handleBackToSelection}
            style={{
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            ← Exit Cockpit
          </button>
        </div>
      </div>

      {/* UI Cockpit Overlays */}
      {connectionState === 'connected' && (
        <>
          <HUD />
          <Leaderboard />
          <Status />
        </>
      )}

      {/* Loading overlay for map initialization */}
      {!mapInitialized && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          width: '100%',
          height: 'calc(100% - 56px)',
          background: 'rgba(9, 13, 22, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>
            {viewState === 'spectating' ? '👁️' : '🏎️'}
          </div>
          <h2 style={{
            color: '#fff',
            marginBottom: '0.5rem',
            fontFamily: "'Orbitron', sans-serif"
          }}>
            {viewState === 'spectating' ? 'Loading Spectator Stream...' : 'Calibrating GPS & Track Sensors...'}
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            Initializing vector map and synchronizing telemetry
          </p>
        </div>
      )}
    </div>
  )
}
