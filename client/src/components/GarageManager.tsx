import React, { useState, useEffect } from 'react'

export interface CarProfile {
  id: string
  name: string
  make: string
  model: string
  year: number
  color: string
  carClass: 'GT3' | 'Supercar' | 'Touring' | 'Track Day' | 'Prototype' | 'Street'
  carNumber: string
  horsepower: number
  topSpeedKmh: number
  weightKg: number
  drivetrain: 'RWD' | 'AWD' | 'FWD'
  transmission: 'Sequential' | 'Dual-Clutch' | 'Manual'
  tireCompound: 'Soft Slick' | 'Medium Slick' | 'Wet' | 'Semi-Slick'
  isDefault: boolean
  lastTuned?: string
  notes?: string
}

const DEFAULT_CARS: CarProfile[] = [
  {
    id: 'car-apex-gt3',
    name: 'Apex GT3 Evolution',
    make: 'Porsche',
    model: '911 GT3 R',
    year: 2024,
    color: '#00ff88',
    carClass: 'GT3',
    carNumber: '77',
    horsepower: 565,
    topSpeedKmh: 298,
    weightKg: 1250,
    drivetrain: 'RWD',
    transmission: 'Sequential',
    tireCompound: 'Soft Slick',
    isDefault: true,
    lastTuned: '2026-08-28',
    notes: 'Aero wing adjusted to level 4. Differential preload tuned for high-speed corners.'
  },
  {
    id: 'car-vortex-r35',
    name: 'Midnight GTR Time Attack',
    make: 'Nissan',
    model: 'GT-R Nismo',
    year: 2023,
    color: '#00d4ff',
    carClass: 'Supercar',
    carNumber: '23',
    horsepower: 710,
    topSpeedKmh: 330,
    weightKg: 1680,
    drivetrain: 'AWD',
    transmission: 'Dual-Clutch',
    tireCompound: 'Semi-Slick',
    isDefault: false,
    lastTuned: '2026-08-15',
    notes: 'Carbon ceramic brakes installed. Boost pressure mapped for sprint qualifying.'
  },
  {
    id: 'car-lotus-cup',
    name: 'Featherlight Cup',
    make: 'Lotus',
    model: 'Exige V6 Cup',
    year: 2022,
    color: '#ffaa00',
    carClass: 'Track Day',
    carNumber: '4',
    horsepower: 430,
    topSpeedKmh: 280,
    weightKg: 1080,
    drivetrain: 'RWD',
    transmission: 'Manual',
    tireCompound: 'Medium Slick',
    isDefault: false,
    lastTuned: '2026-07-20',
    notes: 'Ultra-lightweight track setup. Ideal for technical circuits like Laguna Seca.'
  }
]

export const GarageManager: React.FC = () => {
  const [cars, setCars] = useState<CarProfile[]>(() => {
    try {
      const saved = localStorage.getItem('racewars_garage_cars')
      return saved ? JSON.parse(saved) : DEFAULT_CARS
    } catch {
      return DEFAULT_CARS
    }
  })

  const [selectedCarId, setSelectedCarId] = useState<string>(() => {
    const def = cars.find(c => c.isDefault)
    return def ? def.id : (cars[0]?.id || '')
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<CarProfile | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<CarProfile>>({
    make: '',
    model: '',
    year: 2024,
    color: '#00ff88',
    carClass: 'GT3',
    carNumber: '99',
    horsepower: 500,
    topSpeedKmh: 300,
    weightKg: 1300,
    drivetrain: 'RWD',
    transmission: 'Sequential',
    tireCompound: 'Soft Slick',
    isDefault: false,
    notes: ''
  })

  useEffect(() => {
    try {
      localStorage.setItem('racewars_garage_cars', JSON.stringify(cars))
    } catch (e) {
      console.error('Failed to persist garage cars', e)
    }
  }, [cars])

  const selectedCar = cars.find(c => c.id === selectedCarId) || cars[0]

  const handleSetDefault = (carId: string) => {
    setCars(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === carId
    })))
  }

  const handleDelete = (carId: string) => {
    if (cars.length <= 1) {
      alert('You must have at least one car in your garage.')
      return
    }
    if (confirm('Are you sure you want to remove this vehicle from your garage?')) {
      const remaining = cars.filter(c => c.id !== carId)
      setCars(remaining)
      if (selectedCarId === carId) {
        setSelectedCarId(remaining[0].id)
      }
    }
  }

  const handleOpenAddModal = () => {
    setEditingCar(null)
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '#00ff88',
      carClass: 'GT3',
      carNumber: String(Math.floor(Math.random() * 89) + 10),
      horsepower: 520,
      topSpeedKmh: 295,
      weightKg: 1320,
      drivetrain: 'RWD',
      transmission: 'Sequential',
      tireCompound: 'Soft Slick',
      isDefault: cars.length === 0,
      notes: ''
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (car: CarProfile) => {
    setEditingCar(car)
    setFormData({ ...car })
    setIsModalOpen(true)
  }

  const handleSaveCar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.make || !formData.model) {
      alert('Please fill in Make and Model.')
      return
    }

    const name = `${formData.make} ${formData.model}`
    if (editingCar) {
      // Update
      setCars(prev => prev.map(c => {
        if (c.id === editingCar.id) {
          return {
            ...c,
            ...formData,
            name,
            lastTuned: new Date().toISOString().split('T')[0]
          } as CarProfile
        }
        if (formData.isDefault) {
          return { ...c, isDefault: false }
        }
        return c
      }))
    } else {
      // Create new
      const newCar: CarProfile = {
        id: `car-${Date.now()}`,
        name,
        make: formData.make || 'Custom',
        model: formData.model || 'Special',
        year: Number(formData.year) || 2024,
        color: formData.color || '#00ff88',
        carClass: formData.carClass as any || 'GT3',
        carNumber: formData.carNumber || '00',
        horsepower: Number(formData.horsepower) || 450,
        topSpeedKmh: Number(formData.topSpeedKmh) || 280,
        weightKg: Number(formData.weightKg) || 1350,
        drivetrain: formData.drivetrain as any || 'RWD',
        transmission: formData.transmission as any || 'Sequential',
        tireCompound: formData.tireCompound as any || 'Soft Slick',
        isDefault: Boolean(formData.isDefault),
        lastTuned: new Date().toISOString().split('T')[0],
        notes: formData.notes || ''
      }

      setCars(prev => {
        if (newCar.isDefault) {
          return [...prev.map(c => ({ ...c, isDefault: false })), newCar]
        }
        return [...prev, newCar]
      })
      setSelectedCarId(newCar.id)
    }

    setIsModalOpen(false)
  }

  // Calculate power-to-weight ratio (HP / ton)
  const powerToWeight = selectedCar ? ((selectedCar.horsepower / selectedCar.weightKg) * 1000).toFixed(1) : '0'

  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      background: 'radial-gradient(circle at 10% 20%, #101624 0%, #080c14 90%)',
      color: '#f3f4f6',
      padding: '32px 24px',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.2rem' }}>🏎️</span>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              background: 'linear-gradient(135deg, #ffffff 0%, #a0aec0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Orbitron', -apple-system, BlinkMacSystemFont, sans-serif"
            }}>
              DRIVER GARAGE
            </h1>
            <span style={{
              background: 'rgba(0, 255, 136, 0.12)',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              color: '#00ff88',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '999px',
              letterSpacing: '0.05em'
            }}>
              {cars.length} VEHICLES READY
            </span>
          </div>
          <p style={{ color: '#9ca3af', margin: '6px 0 0 0', fontSize: '0.92rem' }}>
            Manage your competitive racing fleet, configure specs, and assign your active race vehicle.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #00ff88 0%, #00b35f 100%)',
            color: '#05110a',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 22px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(0, 255, 136, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <span>＋</span> Add New Car
        </button>
      </div>

      {/* Main Grid: Left is Selected Car Showcase, Right is Garage Fleet Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {/* Active Inspection Panel */}
        {selectedCar && (
          <div style={{
            background: 'linear-gradient(145deg, rgba(22, 27, 34, 0.85) 0%, rgba(13, 17, 23, 0.95) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(12px)',
            position: 'relative'
          }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: selectedCar.color,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    display: 'inline-block',
                    boxShadow: `0 0 10px ${selectedCar.color}`
                  }} />
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    letterSpacing: '0.08em'
                  }}>
                    {selectedCar.make} • {selectedCar.year}
                  </span>
                  {selectedCar.isDefault && (
                    <span style={{
                      background: 'rgba(0, 212, 255, 0.15)',
                      color: '#00d4ff',
                      border: '1px solid rgba(0, 212, 255, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      PRIMARY CAR
                    </span>
                  )}
                </div>
                <h2 style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  margin: 0,
                  color: '#ffffff',
                  fontFamily: "'Orbitron', sans-serif"
                }}>
                  #{selectedCar.carNumber} {selectedCar.name}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleOpenEditModal(selectedCar)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedCar.id)}
                  style={{
                    background: 'rgba(255, 51, 102, 0.12)',
                    border: '1px solid rgba(255, 51, 102, 0.3)',
                    color: '#ff3366',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Car Visual Stage */}
            <div style={{
              background: 'radial-gradient(circle at 50% 60%, rgba(0, 255, 136, 0.08) 0%, rgba(10, 15, 25, 0.9) 80%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '28px',
              textAlign: 'center',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
                🏎️
              </div>
              <div style={{
                display: 'inline-flex',
                gap: '16px',
                marginTop: '12px',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'block' }}>CLASS</span>
                  <span style={{ fontWeight: 700, color: '#00ff88' }}>{selectedCar.carClass}</span>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'block' }}>DRIVETRAIN</span>
                  <span style={{ fontWeight: 700, color: '#00d4ff' }}>{selectedCar.drivetrain}</span>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'block' }}>TIRES</span>
                  <span style={{ fontWeight: 700, color: '#ffaa00' }}>{selectedCar.tireCompound}</span>
                </div>
              </div>
            </div>

            {/* Spec Gauges Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Horsepower</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00ff88', fontFamily: "'Orbitron', sans-serif" }}>
                    {selectedCar.horsepower}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>HP</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (selectedCar.horsepower / 800) * 100)}%`, height: '100%', background: '#00ff88' }} />
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Top Speed</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00d4ff', fontFamily: "'Orbitron', sans-serif" }}>
                    {selectedCar.topSpeedKmh}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>KM/H</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (selectedCar.topSpeedKmh / 380) * 100)}%`, height: '100%', background: '#00d4ff' }} />
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Curb Weight</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', fontFamily: "'Orbitron', sans-serif" }}>
                    {selectedCar.weightKg}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>KG</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (selectedCar.weightKg / 2000) * 100)}%`, height: '100%', background: '#f59e0b' }} />
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase' }}>Power/Weight</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ec4899', fontFamily: "'Orbitron', sans-serif" }}>
                    {powerToWeight}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>HP/TON</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (Number(powerToWeight) / 600) * 100)}%`, height: '100%', background: '#ec4899' }} />
                </div>
              </div>
            </div>

            {/* Notes & Telemetry log */}
            {selectedCar.notes && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: '#cbd5e1'
              }}>
                <strong style={{ color: '#94a3b8' }}>Race Engineer Notes:</strong> {selectedCar.notes}
              </div>
            )}

            {!selectedCar.isDefault && (
              <button
                onClick={() => handleSetDefault(selectedCar.id)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  color: '#00d4ff',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ★ Set as Default Race Vehicle
              </button>
            )}
          </div>
        )}

        {/* Garage Fleet List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{
            margin: '0 0 4px 0',
            fontSize: '1.1rem',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Your Fleet Collection
          </h3>

          {cars.map(car => {
            const isSelected = car.id === selectedCarId
            return (
              <div
                key={car.id}
                onClick={() => setSelectedCarId(car.id)}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(22, 27, 34, 0.95) 100%)'
                    : 'rgba(22, 27, 34, 0.65)',
                  border: isSelected
                    ? '1px solid rgba(0, 255, 136, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 20px rgba(0, 255, 136, 0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: `2px solid ${car.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    fontFamily: "'Orbitron', sans-serif",
                    color: car.color
                  }}>
                    {car.carNumber}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                        {car.name}
                      </span>
                      {car.isDefault && (
                        <span style={{
                          background: 'rgba(0, 212, 255, 0.2)',
                          color: '#00d4ff',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                      {car.carClass} • {car.horsepower} HP • {car.drivetrain} • {car.transmission}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.8rem',
                    color: isSelected ? '#00ff88' : '#6b7280',
                    fontWeight: 600
                  }}>
                    {isSelected ? 'ACTIVE' : 'SELECT →'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                {editingCar ? 'Edit Vehicle Profile' : 'Add Vehicle to Garage'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCar}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Make</label>
                  <input
                    type="text"
                    required
                    value={formData.make || ''}
                    onChange={e => setFormData({ ...formData, make: e.target.value })}
                    placeholder="e.g., Porsche"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Model</label>
                  <input
                    type="text"
                    required
                    value={formData.model || ''}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., 911 GT3"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Year</label>
                  <input
                    type="number"
                    value={formData.year || 2024}
                    onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Number</label>
                  <input
                    type="text"
                    value={formData.carNumber || '77'}
                    onChange={e => setFormData({ ...formData, carNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Color</label>
                  <input
                    type="color"
                    value={formData.color || '#00ff88'}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '4px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Category / Class</label>
                  <select
                    value={formData.carClass || 'GT3'}
                    onChange={e => setFormData({ ...formData, carClass: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0d1117',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="GT3">GT3</option>
                    <option value="Supercar">Supercar</option>
                    <option value="Touring">Touring</option>
                    <option value="Track Day">Track Day</option>
                    <option value="Prototype">Prototype</option>
                    <option value="Street">Street</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Drivetrain</label>
                  <select
                    value={formData.drivetrain || 'RWD'}
                    onChange={e => setFormData({ ...formData, drivetrain: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0d1117',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="RWD">RWD (Rear-Wheel Drive)</option>
                    <option value="AWD">AWD (All-Wheel Drive)</option>
                    <option value="FWD">FWD (Front-Wheel Drive)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Power (HP)</label>
                  <input
                    type="number"
                    value={formData.horsepower || 500}
                    onChange={e => setFormData({ ...formData, horsepower: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Top Speed (km/h)</label>
                  <input
                    type="number"
                    value={formData.topSpeedKmh || 300}
                    onChange={e => setFormData({ ...formData, topSpeedKmh: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weightKg || 1300}
                    onChange={e => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>Engineer Setup Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Aero setup, gear ratio balance, damper clicks..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault || false}
                  onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="isDefault" style={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Set as primary race vehicle
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    background: '#00ff88',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default GarageManager
