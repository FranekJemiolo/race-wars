import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface RoutePoint {
  id: string
  lat: number
  lng: number
  type: 'start' | 'checkpoint' | 'finish'
  order: number
  radius?: number
}

export interface RouteData {
  name: string
  type: 'sprint' | 'time-trial' | 'circuit'
  points: RoutePoint[]
  totalDistance: number
  estimatedTime?: number
  laps?: number
  description?: string
  id?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
}

interface RouteBuilderProps {
  onRouteCreated: (route: RouteData) => void
  onCancel: () => void
  initialRoute?: RouteData
}

export default function RouteBuilder({ onRouteCreated, onCancel, initialRoute }: RouteBuilderProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [routeType, setRouteType] = useState<'sprint' | 'time-trial' | 'circuit'>('sprint')
  const [routeName, setRouteName] = useState('')
  const [routeDescription, setRouteDescription] = useState('')
  const [points, setPoints] = useState<RoutePoint[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [laps, setLaps] = useState(1)
  const mapRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return

    const leafletMap = L.map(mapRef.current).setView([40.7128, -74.0060], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(leafletMap)

    setMap(leafletMap)

    return () => {
      leafletMap.remove()
    }
  }, [])

  // Load initial route if provided
  useEffect(() => {
    if (initialRoute && map) {
      setRouteType(initialRoute.type)
      setRouteName(initialRoute.name)
      setRouteDescription(initialRoute.description || '')
      setPoints(initialRoute.points)
      setLaps(initialRoute.laps || 1)
      renderRouteOnMap(initialRoute.points)
    }
  }, [initialRoute, map])

  // Calculate distance between two points
  const calculateDistance = (point1: RoutePoint, point2: RoutePoint): number => {
    const R = 6371000 // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180
    const lat2Rad = (point2.lat * Math.PI) / 180
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180
    const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // Calculate total route distance
  const calculateTotalDistance = (routePoints: RoutePoint[]): number => {
    if (routePoints.length < 2) return 0

    let distance = 0
    for (let i = 0; i < routePoints.length - 1; i++) {
      distance += calculateDistance(routePoints[i], routePoints[i + 1])
    }

    // For circuit races, add distance from finish to start
    if (routeType === 'circuit' && routePoints.length >= 2) {
      distance += calculateDistance(routePoints[routePoints.length - 1], routePoints[0])
    }

    return distance
  }

  // Estimate race time (very rough calculation)
  const estimateTime = (distance: number, type: string): number => {
    // Assume average speed of 50 km/h for sprint, 40 km/h for time trial, 45 km/h for circuit
    const avgSpeed = type === 'sprint' ? 50 : type === 'time-trial' ? 40 : 45 // km/h
    return (distance / 1000) / avgSpeed * 3600 // seconds
  }

  // Validate route based on type
  const validateRoute = (routePoints: RoutePoint[]): string[] => {
    const errors: string[] = []

    if (!routeName.trim()) {
      errors.push('Route name is required')
    }

    if (routePoints.length < 2) {
      errors.push('At least 2 points are required')
    }

    if (routeType === 'sprint') {
      // Sprint: point-to-point, needs start and finish
      const hasStart = routePoints.some(p => p.type === 'start')
      const hasFinish = routePoints.some(p => p.type === 'finish')
      
      if (!hasStart) errors.push('Sprint races need a start point')
      if (!hasFinish) errors.push('Sprint races need a finish point')
      
      // Check if start and finish are different points
      const startPoints = routePoints.filter(p => p.type === 'start')
      const finishPoints = routePoints.filter(p => p.type === 'finish')
      
      if (startPoints.length > 1) errors.push('Only one start point allowed')
      if (finishPoints.length > 1) errors.push('Only one finish point allowed')
    }

    if (routeType === 'time-trial') {
      // Time trial: every point is a checkpoint that must be visited
      if (routePoints.length < 3) {
        errors.push('Time trial races need at least 3 checkpoints')
      }
      
      // All points should be checkpoints except start and finish
      const hasStart = routePoints.some(p => p.type === 'start')
      const hasFinish = routePoints.some(p => p.type === 'finish')
      
      if (!hasStart) errors.push('Time trial races need a start point')
      if (!hasFinish) errors.push('Time trial races need a finish point')
    }

    if (routeType === 'circuit') {
      // Circuit: must form a closed loop, start/finish can be same point
      if (routePoints.length < 3) {
        errors.push('Circuit races need at least 3 points to form a loop')
      }
      
      if (laps < 1) {
        errors.push('Circuit races need at least 1 lap')
      }
      
      // Check if route forms a reasonable loop (start and finish should be close)
      if (routePoints.length >= 2) {
        const startFinishDistance = calculateDistance(routePoints[0], routePoints[routePoints.length - 1])
        const totalRouteDistance = calculateTotalDistance(routePoints)
        
        // Start and finish should be within 10% of total route distance for a circuit
        if (startFinishDistance > totalRouteDistance * 0.1) {
          errors.push('Circuit races should start and finish near each other to form a loop')
        }
      }
    }

    return errors
  }

  // Handle map click to add points
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isDrawing || !map) return

    const { lat, lng } = e.latlng
    const newPoint: RoutePoint = {
      id: `point-${Date.now()}`,
      lat,
      lng,
      type: points.length === 0 ? 'start' : points.length === 1 ? 'finish' : 'checkpoint',
      order: points.length,
      radius: 15 // 15 meter radius for checkpoints
    }

    const updatedPoints = [...points, newPoint]
    setPoints(updatedPoints)

    // Update point types based on route type
    if (routeType === 'sprint') {
      // Sprint: first point is start, last is finish, others are checkpoints
      updatedPoints.forEach((point, index) => {
        if (index === 0) point.type = 'start'
        else if (index === updatedPoints.length - 1) point.type = 'finish'
        else point.type = 'checkpoint'
      })
    } else if (routeType === 'time-trial') {
      // Time trial: first is start, last is finish, all are checkpoints
      updatedPoints.forEach((point, index) => {
        if (index === 0) point.type = 'start'
        else if (index === updatedPoints.length - 1) point.type = 'finish'
        else point.type = 'checkpoint'
      })
    } else if (routeType === 'circuit') {
      // Circuit: first is start/finish, others are checkpoints
      updatedPoints.forEach((point, index) => {
        if (index === 0) point.type = 'start'
        else point.type = 'checkpoint'
      })
    }

    renderRouteOnMap(updatedPoints)
  }

  // Render route on map
  const renderRouteOnMap = (routePoints: RoutePoint[]) => {
    if (!map) return

    // Clear existing markers and polylines
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }

    if (routePoints.length === 0) return

    // Add markers
    routePoints.forEach((point, index) => {
      const iconHtml = getPointIcon(point.type, index)
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })

      const marker = L.marker([point.lat, point.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`${point.type.charAt(0).toUpperCase() + point.type.slice(1)} Point ${index + 1}`)

      markersRef.current.push(marker)
    })

    // Draw polyline
    if (routePoints.length >= 2) {
      const latLngs: [number, number][] = routePoints.map(p => [p.lat, p.lng])
      
      // For circuit, close the loop
      if (routeType === 'circuit') {
        latLngs.push([routePoints[0].lat, routePoints[0].lng])
      }

      polylineRef.current = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 5'
      }).addTo(map)
    }

    // Update distance and time estimates
    const distance = calculateTotalDistance(routePoints)
    setTotalDistance(distance)
    setEstimatedTime(estimateTime(distance, routeType))

    // Validate route
    const errors = validateRoute(routePoints)
    setValidationErrors(errors)
  }

  // Get point icon HTML
  const getPointIcon = (type: string, index: number): string => {
    const colors = {
      start: '#10b981',
      finish: '#ef4444',
      checkpoint: '#3b82f6'
    }

    const symbols = {
      start: 'S',
      finish: 'F',
      checkpoint: (index + 1).toString()
    }

    return `
      <div style="
        background: ${colors[type as keyof typeof colors]};
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${symbols[type as keyof typeof symbols]}
      </div>
    `
  }

  // Start drawing mode
  const startDrawing = () => {
    setIsDrawing(true)
    setValidationErrors([])
    if (map) {
      map.on('click', handleMapClick)
      map.getContainer().style.cursor = 'crosshair'
    }
  }

  // Stop drawing mode
  const stopDrawing = () => {
    setIsDrawing(false)
    if (map) {
      map.off('click', handleMapClick)
      map.getContainer().style.cursor = ''
    }
  }

  // Clear all points
  const clearPoints = () => {
    setPoints([])
    setValidationErrors([])
    setTotalDistance(0)
    setEstimatedTime(0)
    renderRouteOnMap([])
  }

  // Remove last point
  const removeLastPoint = () => {
    if (points.length === 0) return
    
    const newPoints = points.slice(0, -1)
    setPoints(newPoints)
    renderRouteOnMap(newPoints)
  }

  // Handle route type change
  const handleRouteTypeChange = (newType: 'sprint' | 'time-trial' | 'circuit') => {
    setRouteType(newType)
    clearPoints()
  }

  // Save route
  const saveRoute = () => {
    const errors = validateRoute(points)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    const routeData: RouteData = {
      name: routeName,
      type: routeType,
      points,
      totalDistance,
      estimatedTime,
      laps: routeType === 'circuit' ? laps : undefined,
      description: routeDescription
    }

    onRouteCreated(routeData)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#1a1a2e',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Route Builder</h2>
        <button
          onClick={onCancel}
          style={{
            background: 'rgba(239, 68, 68, 0.8)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>

      {/* Controls Panel */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Route Type */}
        <div>
          <label style={{ color: '#b8c5d6', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
            Race Type
          </label>
          <select
            value={routeType}
            onChange={(e) => handleRouteTypeChange(e.target.value as any)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px'
            }}
          >
            <option value="sprint">Sprint (Point-to-Point)</option>
            <option value="time-trial">Time Trial (Checkpoints)</option>
            <option value="circuit">Circuit (Laps)</option>
          </select>
        </div>

        {/* Route Name */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ color: '#b8c5d6', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
            Route Name
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Enter route name"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Laps (for circuit) */}
        {routeType === 'circuit' && (
          <div>
            <label style={{ color: '#b8c5d6', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
              Laps
            </label>
            <input
              type="number"
              value={laps}
              onChange={(e) => setLaps(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{
                width: '80px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '4px'
              }}
            />
          </div>
        )}

        {/* Drawing Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isDrawing ? (
            <button
              onClick={startDrawing}
              style={{
                background: 'rgba(16, 185, 129, 0.8)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Start Drawing
            </button>
          ) : (
            <button
              onClick={stopDrawing}
              style={{
                background: 'rgba(239, 68, 68, 0.8)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Stop Drawing
            </button>
          )}

          <button
            onClick={removeLastPoint}
            disabled={points.length === 0}
            style={{
              background: 'rgba(251, 146, 60, 0.8)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: points.length === 0 ? 'not-allowed' : 'pointer',
              opacity: points.length === 0 ? 0.5 : 1
            }}
          >
            Undo Last
          </button>

          <button
            onClick={clearPoints}
            disabled={points.length === 0}
            style={{
              background: 'rgba(107, 114, 128, 0.8)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: points.length === 0 ? 'not-allowed' : 'pointer',
              opacity: points.length === 0 ? 0.5 : 1
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Route Info */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        gap: '24px',
        fontSize: '0.9rem'
      }}>
        <div style={{ color: '#b8c5d6' }}>
          Points: <span style={{ color: 'white', fontWeight: 'bold' }}>{points.length}</span>
        </div>
        <div style={{ color: '#b8c5d6' }}>
          Distance: <span style={{ color: 'white', fontWeight: 'bold' }}>{(totalDistance / 1000).toFixed(2)} km</span>
        </div>
        <div style={{ color: '#b8c5d6' }}>
          Est. Time: <span style={{ color: 'white', fontWeight: 'bold' }}>{Math.round(estimatedTime / 60)} min</span>
        </div>
        {routeType === 'circuit' && (
          <div style={{ color: '#b8c5d6' }}>
            Total Distance: <span style={{ color: 'white', fontWeight: 'bold' }}>{(totalDistance * laps / 1000).toFixed(2)} km</span>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {validationErrors.map((error, index) => (
            <div key={index} style={{ color: '#ef4444', fontSize: '0.9rem' }}>
              • {error}
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px'
          }}
        />
        
        {isDrawing && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(16, 185, 129, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.9rem',
            zIndex: 1000
          }}>
            Click on the map to add points
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <label style={{ color: '#b8c5d6', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>
          Description (optional)
        </label>
        <textarea
          value={routeDescription}
          onChange={(e) => setRouteDescription(e.target.value)}
          placeholder="Describe the route, terrain, special features..."
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        background: 'rgba(26, 26, 46, 0.95)',
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: '#b8c5d6', fontSize: '0.9rem' }}>
          {routeType === 'sprint' && 'Sprint: Point-to-point race from start to finish'}
          {routeType === 'time-trial' && 'Time Trial: Visit all checkpoints in order'}
          {routeType === 'circuit' && 'Circuit: Complete laps around the loop'}
        </div>
        
        <button
          onClick={saveRoute}
          disabled={validationErrors.length > 0 || points.length < 2}
          style={{
            background: validationErrors.length > 0 || points.length < 2 
              ? 'rgba(107, 114, 128, 0.5)' 
              : 'rgba(16, 185, 129, 0.8)',
            border: 'none',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '6px',
            cursor: validationErrors.length > 0 || points.length < 2 ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Create Route
        </button>
      </div>
    </div>
  )
}
