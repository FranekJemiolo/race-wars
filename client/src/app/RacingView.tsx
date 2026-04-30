import { useEffect, useRef } from 'react'
import L from 'leaflet'

interface RacingViewProps {
  onLeaveRace: () => void
  onSpectate: () => void
}

export default function RacingView({ onLeaveRace, onSpectate }: RacingViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map centered on a race track
      const map = L.map(mapRef.current).setView([51.505, -0.09], 13)
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Add race route (simulated track)
      const trackCoordinates: [number, number][] = [
        [51.505, -0.09],
        [51.51, -0.1],
        [51.51, -0.12],
        [51.505, -0.13],
        [51.5, -0.12],
        [51.5, -0.1],
        [51.505, -0.09]
      ]
      
      L.polyline(trackCoordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8
      }).addTo(map)

      // Add mock player markers
      const players = [
        { id: 1, name: 'Driver 1', lat: 51.505, lng: -0.09, color: '#ef4444' },
        { id: 2, name: 'Driver 2', lat: 51.507, lng: -0.095, color: '#22c55e' },
        { id: 3, name: 'Driver 3', lat: 51.503, lng: -0.092, color: '#3b82f6' },
        { id: 4, name: 'Driver 4', lat: 51.508, lng: -0.105, color: '#f59e0b' },
        { id: 5, name: 'Driver 5', lat: 51.502, lng: -0.098, color: '#8b5cf6' }
      ]

      players.forEach(player => {
        const marker = L.circleMarker([player.lat, player.lng], {
          radius: 8,
          fillColor: player.color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map)

        marker.bindPopup(`<b>${player.name}</b>`)
      })

      // Fit map to show all markers
      const group = L.featureGroup([
        L.polyline(trackCoordinates),
        ...players.map(p => L.circleMarker([p.lat, p.lng] as [number, number]))
      ])
      map.fitBounds(group.getBounds().pad(0.1))

      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map Container */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          🏁 Weekly Championship
        </div>
        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
          Lap 3 of 5
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '1rem',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        minWidth: '200px'
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
          📊 Leaderboard
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🥇 Driver 1</span>
            <span style={{ color: '#22c55e' }}>+2.4s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🥈 Driver 2</span>
            <span style={{ color: '#3b82f6' }}>+0.0s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🥉 Driver 3</span>
            <span style={{ color: '#f59e0b' }}>-1.2s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>4. Driver 4</span>
            <span style={{ color: '#ef4444' }}>-3.5s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>5. Driver 5</span>
            <span style={{ color: '#8b5cf6' }}>-5.8s</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1rem'
      }}>
        <button
          onClick={onLeaveRace}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Leave Race
        </button>
        <button
          onClick={onSpectate}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Spectate
        </button>
      </div>
    </div>
  )
}
