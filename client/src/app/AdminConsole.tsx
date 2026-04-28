import { useState, useEffect } from 'react'
import { raceService, Race } from '../network/raceService'

interface AdminConsoleProps {
  onBack: () => void
}

export default function AdminConsole({ onBack }: AdminConsoleProps) {
  const [races, setRaces] = useState<Race[]>([])
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [activeTab, setActiveTab] = useState<'races' | 'tracks' | 'system'>('races')
  const [loading, setLoading] = useState(true)
  const [systemStats, setSystemStats] = useState({
    totalRaces: 0,
    activeRaces: 0,
    totalParticipants: 0,
    systemUptime: '0:00:00'
  })

  useEffect(() => {
    loadRaces()
    loadSystemStats()
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadRaces()
      loadSystemStats()
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const loadRaces = async () => {
    try {
      const racesData = await raceService.getRaces()
      setRaces(racesData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load races:', error)
      setLoading(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      // In a real implementation, this would fetch from an admin API
      const racesData = await raceService.getRaces()
      const activeRaces = racesData.filter(r => r.status === 'in-progress' || r.status === 'starting')
      const totalParticipants = racesData.reduce((sum, race) => sum + (race.participants || 0), 0)
      
      setSystemStats({
        totalRaces: racesData.length,
        activeRaces: activeRaces.length,
        totalParticipants,
        systemUptime: formatUptime(process.uptime())
      })
    } catch (error) {
      console.error('Failed to load system stats:', error)
    }
  }

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const updateRaceStatus = async (raceId: string, newStatus: Race['status']) => {
    try {
      // In a real implementation, this would call an admin API
      console.log(`Updating race ${raceId} to ${newStatus}`)
      await loadRaces()
    } catch (error) {
      console.error('Failed to update race status:', error)
    }
  }

  const deleteRace = async (raceId: string) => {
    if (!confirm('Are you sure you want to delete this race?')) return
    
    try {
      // In a real implementation, this would call a delete API
      console.log(`Deleting race ${raceId}`)
      await loadRaces()
      setSelectedRace(null)
    } catch (error) {
      console.error('Failed to delete race:', error)
    }
  }

  const getStatusColor = (status: Race['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'starting': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-green-100 text-green-800'
      case 'finished': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: Race['status']) => {
    switch (status) {
      case 'waiting': return '🕐'
      case 'starting': return '🚦'
      case 'in-progress': return '🏁'
      case 'finished': return '🏆'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading admin console...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Race Admin Console</h1>
          <p className="text-gray-600 mt-1">Manage races, tracks, and system settings</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← Back to Main
        </button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{systemStats.totalRaces}</div>
          <div className="text-gray-600 text-sm">Total Races</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{systemStats.activeRaces}</div>
          <div className="text-gray-600 text-sm">Active Races</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">{systemStats.totalParticipants}</div>
          <div className="text-gray-600 text-sm">Total Participants</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-600">{systemStats.systemUptime}</div>
          <div className="text-gray-600 text-sm">System Uptime</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('races')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'races'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Race Management
          </button>
          <button
            onClick={() => setActiveTab('tracks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tracks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Track Management
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            System Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'races' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Race List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">All Races</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {races.map((race) => (
                  <div
                    key={race.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedRace(race)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getStatusIcon(race.status)}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{race.name}</h3>
                            <p className="text-sm text-gray-500">{race.trackName} • {race.type}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>{race.participants}/{race.maxParticipants} participants</span>
                          <span>{race.difficulty}</span>
                          {race.startTime && (
                            <span>Starts: {new Date(race.startTime).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(race.status)}`}>
                          {race.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Race Details */}
          <div className="lg:col-span-1">
            {selectedRace ? (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Race Details</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{selectedRace.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <select
                        value={selectedRace.status}
                        onChange={(e) => updateRaceStatus(selectedRace.id, e.target.value as Race['status'])}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="waiting">Waiting</option>
                        <option value="starting">Starting</option>
                        <option value="in-progress">In Progress</option>
                        <option value="finished">Finished</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Track</label>
                    <p className="text-gray-900">{selectedRace.trackName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Participants</label>
                    <p className="text-gray-900">{selectedRace.participants}/{selectedRace.maxParticipants}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Difficulty</label>
                    <p className="text-gray-900">{selectedRace.difficulty}</p>
                  </div>
                  {selectedRace.startTime && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Time</label>
                      <p className="text-gray-900">{new Date(selectedRace.startTime).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedRace.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900">{selectedRace.description}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => deleteRace(selectedRace.id)}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Race
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-gray-500">Select a race to view details</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tracks' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Track Management</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500">
              <p>Track management interface coming soon...</p>
              <p className="mt-2">This will allow you to configure checkpoints, track layouts, and more.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500">
              <p>System settings interface coming soon...</p>
              <p className="mt-2">This will allow you to configure server settings, database connections, and more.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
