/**
 * Enforcement Dashboard Component
 * 
 * Provides drivers with enforcement information including:
 * - Current speed and speed limit
 * - Active speed zones
 * - Recent violations and penalties
 * - Speed trap triggers
 * - Enforcement zone status
 */

import React, { useState, useEffect } from 'react';

interface SpeedZone {
  id: string;
  name: string;
  speedLimit: number;
  coordinates: Array<[number, number]>;
  zoneType: 'speed_limit' | 'speed_trap' | 'no_overtaking';
  isActive: boolean;
}

interface Violation {
  id: string;
  type: 'speed_violation' | 'route_deviation' | 'checkpoint_missed';
  speed?: number;
  speedLimit?: number;
  location: string;
  timestamp: Date;
  penalty: {
    type: 'time_penalty' | 'position_penalty' | 'warning';
    amount: number;
    description: string;
  };
}

interface SpeedTrapTrigger {
  id: string;
  trapName: string;
  speed: number;
  speedLimit: number;
  timestamp: Date;
  location: string;
  penalty?: {
    type: 'time_penalty' | 'position_penalty';
    amount: number;
  };
}

interface EnforcementDashboardProps {
  sessionId: string;
  userId: string;
}

const EnforcementDashboard: React.FC<EnforcementDashboardProps> = ({ sessionId, userId }) => {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentSpeedLimit, setCurrentSpeedLimit] = useState(0);
  const [speedZones, setSpeedZones] = useState<SpeedZone[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [speedTrapTriggers, setSpeedTrapTriggers] = useState<SpeedTrapTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEnforcementData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      updateCurrentSpeed();
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, userId]);

  const loadEnforcementData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Load data from API
      // const [zones, userViolations, traps] = await Promise.all([
      //   enforcementService.getActiveSpeedZones(sessionId),
      //   enforcementService.getUserViolations(userId, sessionId),
      //   enforcementService.getSpeedTrapTriggers(userId, sessionId)
      // ]);

      // Mock data for now
      const mockSpeedZones: SpeedZone[] = [
        {
          id: '1',
          name: 'Main Straight',
          speedLimit: 120,
          coordinates: [[0, 0], [100, 0], [100, 50], [0, 50]],
          zoneType: 'speed_limit',
          isActive: true,
        },
        {
          id: '2',
          name: 'Turn 1 Chicane',
          speedLimit: 60,
          coordinates: [[100, 0], [150, 20], [150, 30], [100, 50]],
          zoneType: 'speed_limit',
          isActive: true,
        },
        {
          id: '3',
          name: 'Speed Trap Sector 2',
          speedLimit: 80,
          coordinates: [[200, 0], [250, 0], [250, 50], [200, 50]],
          zoneType: 'speed_trap',
          isActive: true,
        },
      ];

      const mockViolations: Violation[] = [
        {
          id: '1',
          type: 'speed_violation',
          speed: 85,
          speedLimit: 60,
          location: 'Turn 1 Chicane',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          penalty: {
            type: 'time_penalty',
            amount: 5,
            description: '5 second time penalty for speeding',
          },
        },
      ];

      const mockSpeedTrapTriggers: SpeedTrapTrigger[] = [
        {
          id: '1',
          trapName: 'Speed Trap Sector 2',
          speed: 95,
          speedLimit: 80,
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          location: 'Sector 2',
          penalty: {
            type: 'time_penalty',
            amount: 3,
          },
        },
      ];

      setSpeedZones(mockSpeedZones);
      setViolations(mockViolations);
      setSpeedTrapTriggers(mockSpeedTrapTriggers);
      setCurrentSpeedLimit(80); // Current zone speed limit
    } catch (err) {
      setError('Failed to load enforcement data');
      console.error('Error loading enforcement data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCurrentSpeed = () => {
    // TODO: Get current speed from GPS/telemetry
    const mockSpeed = Math.floor(Math.random() * 40) + 60; // 60-100 km/h
    setCurrentSpeed(mockSpeed);
  };

  const getSpeedStatus = () => {
    if (currentSpeedLimit === 0) return { status: 'unknown', color: 'gray' };
    
    const percentage = (currentSpeed / currentSpeedLimit) * 100;
    
    if (percentage <= 90) return { status: 'safe', color: 'green' };
    if (percentage <= 100) return { status: 'warning', color: 'yellow' };
    if (percentage <= 110) return { status: 'over', color: 'orange' };
    return { status: 'danger', color: 'red' };
  };

  const speedStatus = getSpeedStatus();

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getZoneTypeIcon = (type: SpeedZone['zoneType']) => {
    switch (type) {
      case 'speed_limit': return '⚡';
      case 'speed_trap': return '📸';
      case 'no_overtaking': return '🚫';
      default: return '📍';
    }
  };

  const getViolationIcon = (type: Violation['type']) => {
    switch (type) {
      case 'speed_violation': return '⚠️';
      case 'route_deviation': return '🔄';
      case 'checkpoint_missed': return '❌';
      default: return '📋';
    }
  };

  const getPenaltyColor = (type: Violation['penalty']['type']) => {
    switch (type) {
      case 'time_penalty': return 'text-red-600';
      case 'position_penalty': return 'text-orange-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Current Speed Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Current Speed</h2>
        <div className="flex items-center justify-center">
          <div className={`text-6xl font-bold text-${speedStatus.color}-600`}>
            {currentSpeed}
          </div>
          <div className="ml-4">
            <div className="text-2xl text-gray-600">km/h</div>
            <div className="text-sm text-gray-500">Limit: {currentSpeedLimit} km/h</div>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${speedStatus.color}-100 text-${speedStatus.color}-800`}>
            {speedStatus.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Speed Zones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Speed Zones</h2>
          <div className="space-y-3">
            {speedZones.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active speed zones</p>
            ) : (
              speedZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    zone.isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getZoneTypeIcon(zone.zoneType)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{zone.name}</p>
                      <p className="text-sm text-gray-600">{zone.speedLimit} km/h</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      zone.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Violations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Violations</h2>
          <div className="space-y-3">
            {violations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No violations</p>
            ) : (
              violations.map((violation) => (
                <div key={violation.id} className="p-3 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{getViolationIcon(violation.type)}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {violation.type.replace('_', ' ').toUpperCase()}
                        </p>
                        {violation.speed && violation.speedLimit && (
                          <p className="text-sm text-gray-600">
                            {violation.speed} km/h in {violation.speedLimit} km/h zone
                          </p>
                        )}
                        <p className="text-sm text-gray-500">{violation.location}</p>
                        <p className="text-xs text-gray-400">{formatTimeAgo(violation.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPenaltyColor(violation.penalty.type)}`}>
                        {violation.penalty.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {violation.penalty.amount} {violation.penalty.type.includes('time') ? 'sec' : 'pos'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">{violation.penalty.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Speed Trap History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Speed Trap History</h2>
        <div className="space-y-3">
          {speedTrapTriggers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No speed trap triggers</p>
          ) : (
            speedTrapTriggers.map((trigger) => (
              <div key={trigger.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📸</span>
                  <div>
                    <p className="font-medium text-gray-900">{trigger.trapName}</p>
                    <p className="text-sm text-gray-600">
                      {trigger.speed} km/h (limit: {trigger.speedLimit} km/h)
                    </p>
                    <p className="text-sm text-gray-500">{trigger.location}</p>
                    <p className="text-xs text-gray-400">{formatTimeAgo(trigger.timestamp)}</p>
                  </div>
                </div>
                {trigger.penalty && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {trigger.penalty.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {trigger.penalty.amount} {trigger.penalty.type.includes('time') ? 'sec' : 'pos'}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Enforcement Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Enforcement Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{violations.length}</div>
            <div className="text-sm text-gray-600">Total Violations</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {violations.reduce((sum, v) => sum + (v.penalty.amount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Penalty Seconds</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{speedTrapTriggers.length}</div>
            <div className="text-sm text-gray-600">Speed Trap Triggers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnforcementDashboard;
