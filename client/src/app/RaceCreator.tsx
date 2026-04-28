import { useState } from 'react'

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
  onRaceCreated: (raceData: RaceFormData) => void
  onCancel: () => void
}

export default function RaceCreator({ onRaceCreated, onCancel }: RaceCreatorProps) {
  const [formData, setFormData] = useState<RaceFormData>({
    name: '',
    type: 'circuit',
    trackName: '',
    maxParticipants: 20,
    duration: 1800, // 30 minutes
    startTime: new Date(Date.now() + 10 * 60000), // 10 minutes from now
    description: '',
    requirements: [],
    entryFee: 0,
    prizePool: 0,
    difficulty: 'medium',
    enforcementLevel: 'medium',
    isPublic: true
  })

  const [newRequirement, setNewRequirement] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof RaceFormData, string>>>({})

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

  const validateForm = () => {
    const newErrors: Partial<Record<keyof RaceFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Race name is required'
    }

    if (!formData.trackName) {
      newErrors.trackName = 'Track selection is required'
    }

    if (formData.maxParticipants < 2 || formData.maxParticipants > 50) {
      newErrors.maxParticipants = 'Must be between 2 and 50 participants'
    }

    if (formData.duration < 300 || formData.duration > 7200) {
      newErrors.duration = 'Must be between 5 minutes and 2 hours'
    }

    if (formData.startTime.getTime() < Date.now() + 5 * 60000) {
      newErrors.startTime = 'Start time must be at least 5 minutes in the future'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onRaceCreated(formData)
    }
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
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${minutes}m`
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      zIndex: 3000,
      overflow: 'auto'
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
                  <option value="circuit">⭕ Circuit Race</option>
                  <option value="custom">🛣️ Custom Track</option>
                  <option value="duel">⚔️ Duel Match</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your race..."
                rows={3}
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

          {/* Track Configuration */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Track Configuration</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#ccc', marginBottom: '8px' }}>Track *</label>
              <select
                value={formData.trackName}
                onChange={(e) => setFormData(prev => ({ ...prev, trackName: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: errors.trackName ? '1px solid #e74c3c' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <option value="">Select a track</option>
                {tracks.map(track => (
                  <option key={track} value={track}>{track}</option>
                ))}
              </select>
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
            </div>
          </div>

          {/* Timing */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Timing</h2>
            
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
              style={{
                padding: '12px 32px',
                background: 'rgba(46, 204, 113, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              Create Race
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
