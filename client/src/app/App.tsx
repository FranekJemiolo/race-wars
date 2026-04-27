import { useEffect, useState } from "react"
import { connect, getConnectionState } from "../network/socket"
import { setupMessageHandlers } from "../network/handlers"
import { store } from "../state/store"

export default function App() {
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("disconnected")

  useEffect(() => {
    // Setup message handlers
    setupMessageHandlers()

    // Connect to server
    connect("ws://localhost:8080")

    // Subscribe to connection state changes
    const checkConnection = setInterval(() => {
      setConnectionState(getConnectionState())
    }, 1000)

    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => {
      // React to state changes
    })

    return () => {
      clearInterval(checkConnection)
      unsubscribe()
    }
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      background: '#1a1a2e',
      color: '#ffffff',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Race Wars</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Real-time GPS Racing Engine</p>
      
      <div style={{ 
        padding: '1rem 2rem', 
        borderRadius: '8px',
        background: connectionState === 'connected' ? '#2ecc71' : connectionState === 'connecting' ? '#f39c12' : '#e74c3c',
        marginBottom: '1rem'
      }}>
        {connectionState === 'connected' ? '● Connected' : connectionState === 'connecting' ? '● Connecting...' : '● Disconnected'}
      </div>
      
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        {connectionState === 'connected' ? 'Ready to race!' : 'Waiting for server connection...'}
      </p>
    </div>
  )
}
