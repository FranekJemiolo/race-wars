/**
 * Enforcement Zone Map Component
 * 
 * Displays a map with enforcement zones overlaid, including:
 * - Speed limit zones
 * - Speed trap zones
 * - No overtaking zones
 * - Real-time vehicle position
 * - Zone boundary visualization
 */

import React, { useState, useEffect, useRef } from 'react';

interface SpeedZone {
  id: string;
  name: string;
  speedLimit: number;
  coordinates: Array<[number, number]>;
  zoneType: 'speed_limit' | 'speed_trap' | 'no_overtaking';
  isActive: boolean;
}

interface VehiclePosition {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
}

interface EnforcementZoneMapProps {
  sessionId: string;
  userId: string;
  onZoneEnter?: (zone: SpeedZone) => void;
  onZoneExit?: (zone: SpeedZone) => void;
}

const EnforcementZoneMap: React.FC<EnforcementZoneMapProps> = ({
  sessionId,
  userId,
  onZoneEnter,
  onZoneExit,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [speedZones, setSpeedZones] = useState<SpeedZone[]>([]);
  const [currentPosition, setCurrentPosition] = useState<VehiclePosition>({
    lat: 37.7749,
    lng: -122.4194,
    speed: 0,
    heading: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<SpeedZone | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZone, setCurrentZone] = useState<SpeedZone | null>(null);

  // Mock map instance (in real implementation, this would be Mapbox, Google Maps, etc.)
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    loadSpeedZones();
    initializeMap();
    
    // Set up position updates
    const positionInterval = setInterval(updatePosition, 1000);
    
    return () => {
      clearInterval(positionInterval);
      // Clean up map instance
      if (mapInstance) {
        // mapInstance.remove();
      }
    };
  }, [sessionId, userId]);

  const loadSpeedZones = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Load speed zones from API
      // const zones = await enforcementService.getSpeedZones(sessionId);

      // Mock speed zones for demonstration
      const mockSpeedZones: SpeedZone[] = [
        {
          id: '1',
          name: 'Main Straight',
          speedLimit: 120,
          coordinates: [
            [37.7749, -122.4194],
            [37.7759, -122.4184],
            [37.7759, -122.4174],
            [37.7749, -122.4174],
          ],
          zoneType: 'speed_limit',
          isActive: true,
        },
        {
          id: '2',
          name: 'Turn 1 Chicane',
          speedLimit: 60,
          coordinates: [
            [37.7759, -122.4184],
            [37.7769, -122.4174],
            [37.7769, -122.4164],
            [37.7759, -122.4174],
          ],
          zoneType: 'speed_limit',
          isActive: true,
        },
        {
          id: '3',
          name: 'Speed Trap Sector 2',
          speedLimit: 80,
          coordinates: [
            [37.7779, -122.4164],
            [37.7789, -122.4154],
            [37.7789, -122.4144],
            [37.7779, -122.4154],
          ],
          zoneType: 'speed_trap',
          isActive: true,
        },
        {
          id: '4',
          name: 'No Overtaking Zone',
          speedLimit: 100,
          coordinates: [
            [37.7799, -122.4144],
            [37.7809, -122.4134],
            [37.7809, -122.4124],
            [37.7799, -122.4134],
          ],
          zoneType: 'no_overtaking',
          isActive: true,
        },
      ];

      setSpeedZones(mockSpeedZones);
    } catch (err) {
      setError('Failed to load speed zones');
      console.error('Error loading speed zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = async () => {
    try {
      // TODO: Initialize real map (Mapbox, Google Maps, etc.)
      // For now, we'll create a mock map visualization
      if (mapRef.current) {
        setMapInstance({ /* mock map instance */ });
        setMapLoaded(true);
      }
    } catch (err) {
      setError('Failed to initialize map');
      console.error('Error initializing map:', err);
    }
  };

  const updatePosition = () => {
    // TODO: Get real position from GPS/telemetry
    const newPosition: VehiclePosition = {
      lat: currentPosition.lat + (Math.random() - 0.5) * 0.001,
      lng: currentPosition.lng + (Math.random() - 0.5) * 0.001,
      speed: Math.floor(Math.random() * 40) + 60,
      heading: Math.random() * 360,
    };

    setCurrentPosition(newPosition);
    checkZoneEntry(newPosition);
  };

  const checkZoneEntry = (position: VehiclePosition) => {
    const point = [position.lat, position.lng] as [number, number];
    
    for (const zone of speedZones) {
      const isInside = isPointInPolygon(point, zone.coordinates);
      
      if (isInside && currentZone?.id !== zone.id) {
        // Entering a new zone
        setCurrentZone(zone);
        onZoneEnter?.(zone);
      } else if (!isInside && currentZone?.id === zone.id) {
        // Exiting current zone
        setCurrentZone(null);
        onZoneExit?.(zone);
      }
    }
  };

  const isPointInPolygon = (point: [number, number], polygon: Array<[number, number]>): boolean => {
    // Ray casting algorithm for point in polygon
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }

    return inside;
  };

  const getZoneColor = (zone: SpeedZone) => {
    switch (zone.zoneType) {
      case 'speed_limit':
        return zone.isActive ? 'rgba(59, 130, 246, 0.3)' : 'rgba(156, 163, 175, 0.3)'; // blue/gray
      case 'speed_trap':
        return zone.isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(156, 163, 175, 0.3)'; // red/gray
      case 'no_overtaking':
        return zone.isActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(156, 163, 175, 0.3)'; // orange/gray
      default:
        return 'rgba(156, 163, 175, 0.3)';
    }
  };

  const getZoneBorderColor = (zone: SpeedZone) => {
    switch (zone.zoneType) {
      case 'speed_limit':
        return zone.isActive ? '#3b82f6' : '#9ca3af'; // blue/gray
      case 'speed_trap':
        return zone.isActive ? '#ef4444' : '#9ca3af'; // red/gray
      case 'no_overtaking':
        return zone.isActive ? '#f59e0b' : '#9ca3af'; // orange/gray
      default:
        return '#9ca3af';
    }
  };

  const getZoneIcon = (zoneType: SpeedZone['zoneType']) => {
    switch (zoneType) {
      case 'speed_limit': return '⚡';
      case 'speed_trap': return '📸';
      case 'no_overtaking': return '🚫';
      default: return '📍';
    }
  };

  const formatCoordinates = (coords: Array<[number, number]>) => {
    return coords.map(([lat, lng]) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Map Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Enforcement Zone Map</h1>
            <div className="flex items-center space-x-4">
              {currentZone && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Current Zone:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getZoneIcon(currentZone.zoneType)} {currentZone.name}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                Speed: {currentPosition.speed} km/h
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-3">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              {/* Mock Map Visualization */}
              <div ref={mapRef} className="w-full h-full relative">
                {/* Simple SVG-based map visualization for demo */}
                <svg className="w-full h-full" viewBox="0 0 800 600">
                  {/* Draw speed zones */}
                  {speedZones.map((zone) => {
                    const scale = 10000; // Scale factor for coordinates
                    const offsetX = 400;
                    const offsetY = 300;
                    
                    const points = zone.coordinates.map(([lat, lng]) => {
                      const x = (lng - (-122.4194)) * scale + offsetX;
                      const y = (lat - 37.7749) * scale + offsetY;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <g key={zone.id}>
                        <polygon
                          points={points}
                          fill={getZoneColor(zone)}
                          stroke={getZoneBorderColor(zone)}
                          strokeWidth="2"
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          onClick={() => setSelectedZone(zone)}
                        />
                        <text
                          x={zone.coordinates[0][1] * scale + offsetX}
                          y={zone.coordinates[0][0] * scale + offsetY}
                          fill="#374151"
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {getZoneIcon(zone.zoneType)} {zone.speedLimit} km/h
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw vehicle position */}
                  <circle
                    cx={(currentPosition.lng - (-122.4194)) * 10000 + 400}
                    cy={(currentPosition.lat - 37.7749) * 10000 + 300}
                    r="8"
                    fill="#10b981"
                    stroke="#065f46"
                    strokeWidth="2"
                  >
                    <animate
                      attributeName="r"
                      values="8;10;8"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  
                  {/* Vehicle heading indicator */}
                  <line
                    x1={(currentPosition.lng - (-122.4194)) * 10000 + 400}
                    y1={(currentPosition.lat - 37.7749) * 10000 + 300}
                    x2={(currentPosition.lng - (-122.4194)) * 10000 + 400 + Math.cos(currentPosition.heading * Math.PI / 180) * 15}
                    y2={(currentPosition.lat - 37.7749) * 10000 + 300 + Math.sin(currentPosition.heading * Math.PI / 180) * 15}
                    stroke="#065f46"
                    strokeWidth="2"
                  />
                </svg>

                {/* Map Controls */}
                <div className="absolute top-4 right-4 space-y-2">
                  <button className="bg-white rounded-md shadow-md p-2 hover:bg-gray-50">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button className="bg-white rounded-md shadow-md p-2 hover:bg-gray-50">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>

                {/* Scale indicator */}
                <div className="absolute bottom-4 left-4 bg-white rounded-md shadow-md p-2">
                  <div className="text-xs text-gray-600">Scale: 1:10000</div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone Information Panel */}
          <div className="space-y-4">
            {/* Zone Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Zone Types</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-700">Speed Limit</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-700">Speed Trap</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm text-gray-700">No Overtaking</span>
                </div>
              </div>
            </div>

            {/* Selected Zone Details */}
            {selectedZone && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {getZoneIcon(selectedZone.zoneType)} {selectedZone.name}
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedZone.zoneType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Speed Limit:</span>
                    <span className="ml-2 text-gray-600">{selectedZone.speedLimit} km/h</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedZone.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedZone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Coordinates:</span>
                    <div className="mt-1 text-xs text-gray-600 font-mono break-all">
                      {formatCoordinates(selectedZone.coordinates)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Zone List */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">All Zones</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {speedZones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedZone?.id === zone.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedZone(zone)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{getZoneIcon(zone.zoneType)}</span>
                        <span className="text-sm font-medium text-gray-900">{zone.name}</span>
                      </div>
                      <span className="text-xs text-gray-600">{zone.speedLimit} km/h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <span className="ml-2 text-gray-600">
                    {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Speed:</span>
                  <span className="ml-2 text-gray-600">{currentPosition.speed} km/h</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Heading:</span>
                  <span className="ml-2 text-gray-600">{Math.round(currentPosition.heading)}°</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Current Zone:</span>
                  <span className="ml-2 text-gray-600">
                    {currentZone ? currentZone.name : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnforcementZoneMap;
