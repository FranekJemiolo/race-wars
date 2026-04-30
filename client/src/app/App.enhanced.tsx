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
import { authService, User } from "../network/authService"

type ViewState = 'connection' | 'race-selection' | 'race-creation' | 'racing' | 'spectating' | 'admin' | 'auth' | 'leaderboard' | 'team-management' | 'route-builder' | 'race-replay'

export default function EnhancedApp() {
  const [viewState, setViewState] = useState<ViewState>('connection')
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [mapInitialized, setMapInitialized] = useState(false)
  const [currentRace, setCurrentRace] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isSpectator, setIsSpectator] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = () => {
      const user = authService.getCurrentUser()
      if (user) {
        setCurrentUser(user)
        // User is authenticated, proceed to connection
        setViewState('connection')
      } else {
        // User not authenticated, show auth screen
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
      
      // Update player markers on map
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
    
    // Send join race message to server
    // This would be implemented in the network handlers
    console.log('Joining race:', raceId)
  }

  const handleSpectate = (raceId: string) => {
    setCurrentRace(raceId)
    setViewState('spectating')
    
    // Send spectate message to server
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

  const handleDisconnect = () => {
    disconnect()
    setViewState('connection')
    setCurrentRace(null)
  }

  const handleBackToSelection = () => {
    setViewState('race-selection')
    setCurrentRace(null)
  }

  const handleLeaderboardView = () => {
    setViewState('leaderboard')
  }

  const handleTeamManagementView = () => {
    setViewState('team-management')
  }

  const handleRouteBuilderView = () => {
    setViewState('route-builder')
  }

  const handleRaceReplayView = () => {
    setViewState('race-replay')
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

  // Connection Screen
  if (viewState === 'connection') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <ConnectionManager 
          onConnected={handleConnected}
          onRaceJoined={handleRaceJoined}
          onAdminAccess={() => setViewState('admin')}
          currentUser={currentUser}
          isSpectator={isSpectator}
          onLogout={handleLogout}
        />
      </div>
    )
  }

  // Admin Console Screen
  if (viewState === 'admin') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: '#f3f4f6',
        color: '#1f2937',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'auto'
      }}>
        <AdminConsole 
          onBack={() => setViewState('connection')}
        />
      </div>
    )
  }

  // Race Creation Screen
  if (viewState === 'race-creation') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: '#1a1a2e',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <RaceCreator 
          onRaceCreated={handleRaceCreated}
          onCancel={() => setViewState('race-selection')}
        />
      </div>
    )
  }

  // Race Selection Screen
  if (viewState === 'race-selection') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: '#1a1a2e',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <RaceSelector 
          onRaceJoined={handleRaceJoined}
          onSpectate={handleSpectate}
          onCreateRace={handleCreateRace}
          onBackToConnection={handleBackToConnection}
          onAdminAccess={() => setViewState('admin')}
          onLeaderboardView={handleLeaderboardView}
          onTeamManagementView={handleTeamManagementView}
          onRouteBuilderView={handleRouteBuilderView}
          onRaceReplayView={handleRaceReplayView}
        />
      </div>
    )
  }

  // Leaderboard Screen
  if (viewState === 'leaderboard') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: '#1a1a2e',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'auto'
      }}>
        <div style={{ padding: '20px' }}>
          <button
            onClick={handleBackToSelection}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '20px' }}>🏆 Live Leaderboard</h1>
          <Leaderboard />
        </div>
      </div>
    )
  }

  // Team Management Screen
  if (viewState === 'team-management') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: '#1a1a2e',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'auto'
      }}>
        <div style={{ padding: '20px' }}>
          <button
            onClick={handleBackToSelection}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}
          >
            ← Back
          </button>
          <TeamManager userId={currentUser?.id || 'demo-user'} />
        </div>
      </div>
    )
  }

  // Route Builder Screen
  if (viewState === 'route-builder') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: '#1a1a2e',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '20px' }}>
          <button
            onClick={handleBackToSelection}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '20px' }}>🗺️ Route Builder</h1>
          <RouteBuilder 
            onRouteCreated={(route) => {
              console.log('Route created:', route)
              handleBackToSelection()
            }}
            onCancel={handleBackToSelection}
          />
        </div>
      </div>
    )
  }

  // Race Replay Screen
  if (viewState === 'race-replay') {
    return (
      <div style={{ 
        width: '100vw',
        height: '100vh',
        background: '#1a1a2e',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'auto'
      }}>
        <div style={{ padding: '20px' }}>
          <button
            onClick={handleBackToSelection}
            style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '20px'
            }}
          >
            ← Back
          </button>
          <h1 style={{ color: '#fff', fontSize: '2rem', marginBottom: '20px' }}>🎬 Race Replay</h1>
          <RaceReplayPlayer showMap={true} showAnalysis={true} />
        </div>
      </div>
    )
  }

  // Racing/Spectating Screen
  return (
    <div style={{ 
      width: '100vw',
      height: '100vh',
      background: '#1a1a2e',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Map container */}
      <div 
        ref={mapRef}
        id="map" 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1
        }} 
      />

      {/* Race Info Header */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        background: 'rgba(26, 26, 46, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>
            {viewState === 'spectating' ? '👁️ Spectating' : '🏁 Racing'} - {currentRace || 'Unknown Race'}
          </h2>
          <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Server: {serverUrl || 'Local'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(46, 204, 113, 0.2)',
            border: '1px solid rgba(46, 204, 113, 0.5)',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#2ecc71'
            }} />
            <span style={{ color: '#2ecc71', fontSize: '0.9rem' }}>
              {connectionState === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={handleBackToSelection}
            style={{
              padding: '8px 16px',
              background: 'rgba(52, 152, 219, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ← Back to Races
          </button>
        </div>
      </div>

      {/* UI Components */}
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
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(26, 26, 46, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {viewState === 'spectating' ? '👁️' : '🏁'}
          </div>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>
            {viewState === 'spectating' ? 'Loading Spectator View...' : 'Loading Race Track...'}
          </h2>
          <p style={{ color: '#888' }}>
            Initializing map and connecting to race server
          </p>
        </div>
      )}
    </div>
  )
}
