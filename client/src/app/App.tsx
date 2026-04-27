import { useEffect } from "react"

export default function App() {
  useEffect(() => {
    // TODO: Initialize WebSocket connection
    console.log("Race Wars client starting...")
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      background: '#1a1a2e',
      color: '#ffffff'
    }}>
      <h1>Race Wars</h1>
      <p>Real-time GPS Racing Engine</p>
      <p style={{ color: '#666' }}>Loading...</p>
    </div>
  )
}
