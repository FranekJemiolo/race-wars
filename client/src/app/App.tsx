import { useEffect, useState, useRef } from "react"
import { connect, getConnectionState } from "../network/socket"
import { setupMessageHandlers } from "../network/handlers"
import { store } from "../state/store"
import { initializeMap } from "../map/map"
import { updatePlayerMarkers } from "../map/playerLayer"
import HUD from "../ui/HUD"
import Leaderboard from "../ui/Leaderboard"
import Status from "../ui/Status"

export default function App() {
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("disconnected")
  const [mapInitialized, setMapInitialized] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log("App mounted, setting up connection...")
    
    // Setup message handlers
    setupMessageHandlers()

    // Connect to server
    connect("ws://localhost:8080")

    // Subscribe to connection state changes
    const checkConnection = setInterval(() => {
      setConnectionState(getConnectionState())
    }, 1000)

    // Subscribe to store changes for player updates
    const unsubscribe = store.subscribe(() => {
      const state = store.getState()
      
      // Update player markers on map
      if (mapInitialized) {
        updatePlayerMarkers(Array.from(state.players.values()), state.selfPlayerId)
      }
    })

    return () => {
      clearInterval(checkConnection)
      unsubscribe()
    }
  }, [mapInitialized])

  useEffect(() => {
    // Initialize map when container is ready
    if (mapRef.current && !mapInitialized) {
      try {
        initializeMap("map")
        setMapInitialized(true)
      } catch (e) {
        console.error("Failed to initialize map:", e)
      }
    }
  }, [mapInitialized])

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

      {/* Connection indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        borderRadius: '20px',
        background: connectionState === 'connected' ? 'rgba(46, 204, 113, 0.9)' : connectionState === 'connecting' ? 'rgba(243, 156, 18, 0.9)' : 'rgba(231, 76, 60, 0.9)',
        color: '#fff',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        backdropFilter: 'blur(10px)',
        zIndex: 1000
      }}>
        {connectionState === 'connected' ? '● Connected' : connectionState === 'connecting' ? '● Connecting...' : '● Disconnected'}
      </div>

      {/* UI Components */}
      {connectionState === 'connected' && (
        <>
          <HUD />
          <Leaderboard />
          <Status />
        </>
      )}

      {/* Loading screen */}
      {connectionState !== 'connected' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(26, 26, 46, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Race Wars</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#888' }}>Real-time GPS Racing Engine</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            {connectionState === 'connecting' ? 'Connecting to server...' : 'Waiting for server connection...'}
          </p>
        </div>
      )}
    </div>
  )
}
