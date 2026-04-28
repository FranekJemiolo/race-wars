import { useState, useEffect } from 'react'
import { raceService, CreateRaceRequest } from '../network/raceService'
import RouteBuilder, { RouteData } from '../components/RouteBuilder'
import { routeService } from '../network/routeService'

interface RaceFormData {
  name: string
  type: 'circuit' | 'custom' | 'duel'
  trackName: string
  maxParticipants: number
  duration: number
  startTime: Date
  description: string
  requirements: string[]
  entryFee: number
  prizePool: number
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  enforcementLevel: 'none' | 'light' | 'medium' | 'hard'
  isPublic: boolean
}

interface RaceCreatorProps {
  onRaceCreated: (raceData: any) => void
  onCancel: () => void
}

export default function RaceCreator({ onRaceCreated, onCancel }: RaceCreatorProps) {
  const [showRouteBuilder, setShowRouteBuilder] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null)
  const [availableRoutes, setAvailableRoutes] = useState<RouteData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<RaceFormData>({
    name: '',
    type: 'circuit',
    trackName: '',
    maxParticipants: 8,
    duration: 1800, // 30 minutes
    startTime: new Date(Date.now() + 60000), // 1 minute from now
    description: '',
    requirements: ['Valid driver license'],
    entryFee: 0,
    prizePool: 0,
    difficulty: 'easy',
    enforcementLevel: 'light',
    isPublic: true
  })

  const [newRequirement, setNewRequirement] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof RaceFormData, string>>>({})

  // Load available routes on mount
  useEffect(() => {
    loadAvailableRoutes()
  }, [])

  const loadAvailableRoutes = async () => {
    try {
      const routes = await routeService.getAllRoutes({ public: true })
      setAvailableRoutes(routes)
    } catch (error) {
      console.error('Failed to load routes:', error)
    }
  }

  const tracks = [
    'Test Circuit',
    'Grand Prix Circuit', 
    'Speedway Arena',
    'Mountain Pass',
    'City Streets',
    'Coastal Highway',
    'Desert Circuit',
    'Forest Trail'
  ]

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RaceFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Race name is required'
    }

    if (!formData.trackName.trim()) {
      newErrors.trackName = 'Track selection is required'
    }

    if (formData.maxParticipants < 2) {
      newErrors.maxParticipants = 'Minimum 2 participants required'
    }

    if (formData.maxParticipants > 50) {
      newErrors.maxParticipants = 'Maximum 50 participants allowed'
    }

    if (formData.duration < 300) {
      newErrors.duration = 'Minimum 5 minutes required'
    }

    if (formData.duration > 7200) {
      newErrors.duration = 'Maximum 2 hours allowed'
    }

    if (formData.entryFee < 0) {
      newErrors.entryFee = 'Entry fee cannot be negative'
    }

    if (formData.prizePool < 0) {
      newErrors.prizePool = 'Prize pool cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const raceData: CreateRaceRequest = {
        name: formData.name,
        type: formData.type,
        trackName: formData.trackName,
        maxParticipants: formData.maxParticipants,
        duration: formData.duration,
        startTime: formData.startTime,
        description: formData.description,
        requirements: formData.requirements,
        entryFee: formData.entryFee,
        prizePool: formData.prizePool,
        difficulty: formData.difficulty,
        enforcementLevel: formData.enforcementLevel,
        isPublic: formData.isPublic
      }

      await raceService.createRace(raceData)
      onRaceCreated(raceData)
    } catch (error) {
      setError('Failed to create race')
    } finally {
      setLoading(false)
    }
  }

  const handleRouteCreated = async (route: RouteData) => {
    try {
      // Create route on server
      const createdRoute = await routeService.createRoute({
        name: route.name,
        type: route.type,
        points: route.points,
        description: route.description,
        isPublic: true,
        difficulty: route.difficulty || 'medium',
        surface: 'asphalt',
        laps: route.laps
      })

      // Convert route to track format and use it
      const trackData = await routeService.convertRouteToTrack(createdRoute.id)
      
      // Update form with route data
      setFormData(prev => ({
        ...prev,
        name: prev.name || route.name,
        trackName: route.name,
        type: route.type === 'circuit' ? 'circuit' : 'custom',
        duration: route.estimatedTime || 1800,
        description: prev.description || route.description || ''
      }))

      setSelectedRoute(createdRoute)
      setShowRouteBuilder(false)
      
      // Load updated routes list
      await loadAvailableRoutes()
    } catch (error) {
      console.error('Failed to create route:', error)
      setError('Failed to create route')
    }
  }

  const handleRouteBuilderCancel = () => {
    setShowRouteBuilder(false)
  }

  const openRouteBuilder = () => {
    setShowRouteBuilder(true)
  }

  const selectExistingRoute = (route: RouteData) => {
    setSelectedRoute(route)
    setFormData(prev => ({
      ...prev,
      trackName: route.name,
      type: route.type === 'circuit' ? 'circuit' : 'custom',
      duration: route.estimatedTime || 1800,
      description: prev.description || route.description || ''
    }))
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show route builder if active
  if (showRouteBuilder) {
    return (
      <RouteBuilder
        onRouteCreated={handleRouteCreated}
        onCancel={handleRouteBuilderCancel}
      />
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '40px',
        background: 'rgba(26, 26, 46, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: '#fff', fontSize: '2rem', margin: 0 }}>Create Race</h1>
          <button
            onClick={onCancel}
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
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Basic Information</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Race Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter race name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: errors.name ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
                {errors.name && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>{errors.name}</div>}
              </div>

              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Race Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="circuit">🏁 Circuit Race</option>
                  <option value="custom">🛣️ Custom Route</option>
                  <option value="duel">⚔️ Duel</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your race..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Track Configuration */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Track Configuration</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#b8c5d6' }}>
                Track/Route
              </label>
              
              {/* Route Selection */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={openRouteBuilder}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    🗺️ Create New Route
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, trackName: '' }))}
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(107, 114, 128, 0.8)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Clear
                  </button>
                </div>
                
                {selectedRoute && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.8rem',
                    color: '#10b981'
                  }}>
                    📍 Selected: {selectedRoute.name} ({selectedRoute.type}, {(selectedRoute.totalDistance / 1000).toFixed(2)}km)
                  </div>
                )}
              </div>

              {/* Existing Routes */}
              {availableRoutes.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#b8c5d6', fontSize: '0.8rem', marginBottom: '6px' }}>
                    Or select an existing route:
                  </div>
                  <div style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '8px'
                  }}>
                    {availableRoutes.map(route => (
                      <div
                        key={route.id}
                        onClick={() => selectExistingRoute(route)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: selectedRoute?.id === route.id ? '#10b981' : '#b8c5d6',
                          background: selectedRoute?.id === route.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                          marginBottom: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (selectedRoute?.id !== route.id) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                        onMouseOut={(e) => {
                          if (selectedRoute?.id !== route.id) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{route.name}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          {route.type} • {(route.totalDistance / 1000).toFixed(2)}km • {route.difficulty || 'medium'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Traditional Track Selection */}
              <select
                value={selectedRoute ? '' : formData.trackName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, trackName: e.target.value }))
                  setSelectedRoute(null)
                }}
                disabled={selectedRoute !== null}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: selectedRoute ? 'rgba(107, 114, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: selectedRoute ? '#6b7280' : '#fff',
                  fontSize: '1rem',
                  cursor: selectedRoute ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Select a traditional track</option>
                {tracks.map(track => (
                  <option key={track} value={track}>{track}</option>
                ))}
              </select>
            </div>
            {errors.trackName && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>{errors.trackName}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>
                Max Participants ({formData.maxParticipants})
              </label>
              <input
                type="range"
                min="2"
                max="50"
                value={formData.maxParticipants}
                onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
              {errors.maxParticipants && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>{errors.maxParticipants}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>
                Duration ({formatDuration(formData.duration)})
              </label>
              <input
                type="range"
                min="300"
                max="7200"
                step="300"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
              {errors.duration && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>{errors.duration}</div>}
            </div>

            <div>
              <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Start Time *</label>
              <input
                type="datetime-local"
                value={formData.startTime.toISOString().slice(0, 16)}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: errors.startTime ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              {errors.startTime && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>{errors.startTime}</div>}
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>
                {formatDateTime(formData.startTime)}
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Requirements</h2>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="Add requirement (e.g., 'Valid driver license')"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
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
                type="button"
                onClick={addRequirement}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(52, 152, 219, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Add
              </button>
            </div>

            {formData.requirements.map((req, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#ccc' }}>✓ {req}</span>
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(231, 76, 60, 0.8)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Rules & Settings */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Rules & Settings</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🟠 Hard</option>
                  <option value="expert">🔴 Expert</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Enforcement Level</label>
                <select
                  value={formData.enforcementLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, enforcementLevel: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="none">🚫 None</option>
                  <option value="light">🟡 Light</option>
                  <option value="medium">🟠 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', color: '#ccc', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    style={{ marginRight: '8px' }}
                  />
                  Public Race (anyone can join)
                </label>
              </div>
            </div>
          </div>

          {/* Economics */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Economics</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Entry Fee ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.entryFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryFee: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: errors.entryFee ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
                {errors.entryFee && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>{errors.entryFee}</div>}
              </div>

              <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Prize Pool ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.prizePool}
                  onChange={(e) => setFormData(prev => ({ ...prev, prizePool: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: errors.prizePool ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
                {errors.prizePool && <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>{errors.prizePool}</div>}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: loading ? 'rgba(107, 114, 128, 0.5)' : 'rgba(46, 204, 113, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Creating...' : 'Create Race'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
