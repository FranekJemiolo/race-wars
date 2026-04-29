import React, { useState, useEffect, useRef } from 'react';
import { getGPSTrackingService, PositionData, SimulationConfig } from '../services/gpsTracking.service';
import { getSimulationManager, RaceSimulationConfig, SimulationClient } from '../services/simulationClient.service';

interface GPSDemoProps {
  sessionId: string;
}

export const GPSDemo: React.FC<GPSDemoProps> = ({ sessionId }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<PositionData | null>(null);
  const [positionHistory, setPositionHistory] = useState<PositionData[]>([]);
  const [antiCheatAlerts, setAntiCheatAlerts] = useState<any[]>([]);
  const [simulationClients, setSimulationClients] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<'real' | 'simulation'>('real');
  
  const gpsServiceRef = useRef<any>(null);
  const simulationManagerRef = useRef<any>(null);

  // Initialize GPS service
  useEffect(() => {
    const gpsService = getGPSTrackingService({
      sessionId,
      onPositionUpdate: (position: PositionData) => {
        setCurrentPosition(position);
        setPositionHistory(prev => [...prev.slice(-99), position]);
      },
      onError: (error: Error) => {
        console.error('GPS error:', error);
        setAntiCheatAlerts(prev => [...prev, { type: 'error', message: error.message, timestamp: Date.now() }]);
      },
      enableSimulation: selectedMode === 'simulation',
      simulationConfig: selectedMode === 'simulation' ? {
        routeType: 'circular' as const,
        centerLat: 37.7749,
        centerLng: -122.4194,
        radius: 500,
        speed: 60,
        accuracyVariation: 5,
        signalLoss: true,
        drift: true,
        satelliteCount: 8,
        hdopRange: [1.0, 2.0] as [number, number],
        vdopRange: [1.2, 2.5] as [number, number],
      } : undefined
    });
    
    gpsServiceRef.current = gpsService;
    
    return () => {
      gpsService.stopTracking();
    };
  }, [sessionId, selectedMode]);

  // Handle WebSocket anti-cheat warnings
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'ANTI_CHEAT_WARNING') {
        setAntiCheatAlerts(prev => [...prev, {
          type: 'warning',
          riskScore: message.riskScore,
          anomalies: message.anomalies,
          recommendations: message.recommendations,
          timestamp: Date.now()
        }]);
      }
    };
    
    return () => {
      ws.close();
    };
  }, []);

  const startTracking = async () => {
    try {
      if (gpsServiceRef.current) {
        await gpsServiceRef.current.startTracking();
        setIsTracking(true);
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
      setAntiCheatAlerts(prev => [...prev, { type: 'error', message: 'Failed to start GPS tracking', timestamp: Date.now() }]);
    }
  };

  const stopTracking = () => {
    if (gpsServiceRef.current) {
      gpsServiceRef.current.stopTracking();
      setIsTracking(false);
    }
  };

  const startRaceSimulation = () => {
    const simulationManager = getSimulationManager();
    simulationManagerRef.current = simulationManager;
    
    const raceConfig: RaceSimulationConfig = {
      raceId: sessionId,
      trackCenter: { lat: 37.7749, lng: -122.4194 },
      trackRadius: 500,
      participants: [
        { id: 'sim-1', name: 'Speed Racer', skill: 'expert', vehicle: 'car', startingPosition: 0 },
        { id: 'sim-2', name: 'Drift King', skill: 'intermediate', vehicle: 'motorcycle', startingPosition: 0.25 },
        { id: 'sim-3', name: 'Trucker Tom', skill: 'beginner', vehicle: 'truck', startingPosition: 0.5 },
        { id: 'sim-4', name: 'Cheater Charlie', skill: 'expert', vehicle: 'car', startingPosition: 0.75 }, // This one will cheat
      ],
      raceDuration: 300 // 5 minutes
    };
    
    simulationManager.startRaceSimulation(raceConfig);
    setIsSimulation(true);
    
    // Update simulation status
    const updateInterval = setInterval(() => {
      const status = simulationManager.getSimulationStatus();
      setSimulationClients(status.participants);
    }, 1000);
    
    // Make cheater cheat
    setTimeout(() => {
      // This would be handled by the anti-cheat system detecting anomalies
      setAntiCheatAlerts(prev => [...prev, {
        type: 'warning',
        message: 'Cheater Charlie detected with speed spikes!',
        timestamp: Date.now()
      }]);
    }, 10000);
    
    return () => {
      clearInterval(updateInterval);
      simulationManager.stopRaceSimulation();
    };
  };

  const stopRaceSimulation = () => {
    if (simulationManagerRef.current) {
      simulationManagerRef.current.stopRaceSimulation();
      setIsSimulation(false);
      setSimulationClients([]);
    }
  };

  const formatPosition = (pos: PositionData) => ({
    lat: pos.lat.toFixed(6),
    lng: pos.lng.toFixed(6),
    speed: pos.speed.toFixed(1),
    heading: pos.heading.toFixed(0),
    accuracy: pos.accuracy.toFixed(1),
    source: pos.source,
    quality: pos.quality,
    satelliteCount: pos.satelliteCount || 'N/A'
  });

  return (
    <div className="gps-demo p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">GPS Tracking & Anti-Cheat Demo</h2>
      
      {/* Mode Selection */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Tracking Mode</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedMode('real')}
            className={`px-4 py-2 rounded ${selectedMode === 'real' ? 'bg-blue-500 text-white' : 'bg-white'}`}
            disabled={isTracking}
          >
            Real GPS
          </button>
          <button
            onClick={() => setSelectedMode('simulation')}
            className={`px-4 py-2 rounded ${selectedMode === 'simulation' ? 'bg-blue-500 text-white' : 'bg-white'}`}
            disabled={isTracking}
          >
            Simulation
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Controls</h3>
        <div className="flex gap-4">
          <button
            onClick={startTracking}
            disabled={isTracking}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            Start {selectedMode === 'real' ? 'GPS' : 'Simulation'} Tracking
          </button>
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            Stop Tracking
          </button>
          <button
            onClick={startRaceSimulation}
            disabled={isSimulation}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            Start Race Simulation
          </button>
          <button
            onClick={stopRaceSimulation}
            disabled={!isSimulation}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            Stop Race Simulation
          </button>
        </div>
      </div>

      {/* Current Position */}
      {currentPosition && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current Position</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Latitude:</span> {formatPosition(currentPosition).lat}
            </div>
            <div>
              <span className="font-medium">Longitude:</span> {formatPosition(currentPosition).lng}
            </div>
            <div>
              <span className="font-medium">Speed:</span> {formatPosition(currentPosition).speed} km/h
            </div>
            <div>
              <span className="font-medium">Heading:</span> {formatPosition(currentPosition).heading}°
            </div>
            <div>
              <span className="font-medium">Accuracy:</span> {formatPosition(currentPosition).accuracy}m
            </div>
            <div>
              <span className="font-medium">Source:</span> {formatPosition(currentPosition).source}
            </div>
            <div>
              <span className="font-medium">Quality:</span> {formatPosition(currentPosition).quality}
            </div>
            <div>
              <span className="font-medium">Satellites:</span> {formatPosition(currentPosition).satelliteCount}
            </div>
          </div>
        </div>
      )}

      {/* Anti-Cheat Alerts */}
      {antiCheatAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Anti-Cheat Alerts</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {antiCheatAlerts.slice(-5).map((alert, index) => (
              <div key={index} className={`p-2 rounded text-sm ${
                alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className="font-medium">{alert.type === 'error' ? 'Error' : 'Warning'}</div>
                <div>{alert.message}</div>
                {alert.riskScore && <div className="text-xs mt-1">Risk Score: {alert.riskScore}</div>}
                <div className="text-xs text-gray-600">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Clients */}
      {simulationClients.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Simulation Clients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simulationClients.map((client) => (
              <div key={client.id} className="p-3 bg-white rounded border">
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-gray-600">
                  Status: {client.status.isRunning ? 'Running' : 'Stopped'}
                </div>
                <div className="text-sm text-gray-600">
                  Updates: {client.status.positionCount}
                </div>
                <div className="text-sm text-gray-600">
                  Uptime: {Math.floor(client.status.uptime)}s
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Position History Chart */}
      {positionHistory.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Position History ({positionHistory.length} points)</h3>
          <div className="text-sm text-gray-600">
            <div>Latest: {positionHistory[positionHistory.length - 1].lat.toFixed(6)}, {positionHistory[positionHistory.length - 1].lng.toFixed(6)}</div>
            <div>Source: {positionHistory[positionHistory.length - 1].source}</div>
            <div>Quality: {positionHistory[positionHistory.length - 1].quality}</div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-medium">Tracking:</span> {isTracking ? 'Active' : 'Inactive'}
          </div>
          <div>
            <span className="font-medium">Mode:</span> {selectedMode}
          </div>
          <div>
            <span className="font-medium">Simulation:</span> {isSimulation ? 'Running' : 'Stopped'}
          </div>
          <div>
            <span className="font-medium">Session:</span> {sessionId}
          </div>
        </div>
      </div>
    </div>
  );
};
