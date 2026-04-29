import React, { useState } from 'react';
import { RouteSelector } from '../components/RouteSelector';
import { getRaceRoutesService, RaceRoute } from '../services/raceRoutes.service';

export const RouteSelectionDemo: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<RaceRoute | null>(null);
  const [showRacePreview, setShowRacePreview] = useState(false);
  const routesService = getRaceRoutesService();

  const handleRouteSelect = (route: RaceRoute) => {
    setSelectedRoute(route);
    setShowRacePreview(true);
  };

  const startRace = () => {
    if (selectedRoute) {
      console.log('Starting race on:', selectedRoute.name);
      // In a real app, this would navigate to the race setup/lobby
      alert(`Race starting on ${selectedRoute.name}!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">🏁 Race Route Selection</h1>
          <p className="text-gray-400">
            Choose from world-famous racing circuits and start your race
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {!showRacePreview ? (
          <RouteSelector
            onRouteSelect={handleRouteSelect}
            selectedRouteId={selectedRoute?.id}
          />
        ) : (
          <div className="space-y-6">
            {/* Back Button */}
            <button
              onClick={() => setShowRacePreview(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg touch-manipulation"
            >
              ← Back to Routes
            </button>

            {/* Race Preview */}
            {selectedRoute && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-4">Race Preview</h2>
                
                {/* Track Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{selectedRoute.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span>{selectedRoute.location}, {selectedRoute.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="capitalize">{selectedRoute.type} Circuit</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Difficulty:</span>
                        <span className="capitalize">{selectedRoute.difficulty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Distance:</span>
                        <span>{(selectedRoute.distance / 1000).toFixed(3)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Laps:</span>
                        <span>{selectedRoute.laps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Distance:</span>
                        <span>{((selectedRoute.distance * selectedRoute.laps) / 1000).toFixed(1)} km</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Race Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Est. Lap Time:</span>
                        <span>{Math.floor(selectedRoute.estimatedLapTime / 60000)}:{Math.floor((selectedRoute.estimatedLapTime % 60000) / 1000).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Est. Race Time:</span>
                        <span>{Math.floor((selectedRoute.estimatedLapTime * selectedRoute.laps) / 60000)}:{Math.floor(((selectedRoute.estimatedLapTime * selectedRoute.laps) % 60000) / 1000).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Max Speed:</span>
                        <span>{selectedRoute.maxSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Corners:</span>
                        <span>{selectedRoute.corners}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Elevation Change:</span>
                        <span>±{selectedRoute.elevationGain}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Surface:</span>
                        <span className="capitalize">{selectedRoute.surface}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Track Features */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Track Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoute.features.map((feature, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lap Record */}
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold mb-2">Official Lap Record</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.floor(selectedRoute.lapRecord.time / 60000)}:{Math.floor((selectedRoute.lapRecord.time % 60000) / 1000).toString().padStart(2, '0')}.{Math.floor((selectedRoute.lapRecord.time % 1000) / 10).toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm text-gray-400">Time</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{selectedRoute.lapRecord.driver}</div>
                      <div className="text-sm text-gray-400">Driver</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{selectedRoute.lapRecord.year}</div>
                      <div className="text-sm text-gray-400">Year</div>
                    </div>
                  </div>
                </div>

                {/* Racing Tips */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Racing Tips</h3>
                  <div className="space-y-2">
                    {selectedRoute.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-3 bg-gray-700 rounded p-3">
                        <span className="text-lg">💡</span>
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Track Sectors */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Track Sectors</h3>
                  <div className="space-y-3">
                    {selectedRoute.sectors.map((sector) => (
                      <div key={sector.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{sector.name}</h4>
                          <span className="text-sm text-gray-400">
                            {(sector.distance / 1000).toFixed(2)} km
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {sector.characteristics.map((char, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-600 rounded text-xs">
                              {char}
                            </span>
                          ))}
                        </div>
                        <div className="text-sm text-gray-400">
                          Typical sector time: {Math.floor(sector.typicalTime / 1000)}s
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={startRace}
                    className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg touch-manipulation"
                  >
                    🏁 Start Race
                  </button>
                  <button
                    onClick={() => setShowRacePreview(false)}
                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold touch-manipulation"
                  >
                    Choose Different Route
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{routesService.getAllRoutes().length}</div>
              <div className="text-xs text-gray-400">Total Routes</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {routesService.getRoutesByType('street').length}
              </div>
              <div className="text-xs text-gray-400">Street Circuits</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {routesService.getRoutesByType('permanent').length}
              </div>
              <div className="text-xs text-gray-400">Permanent Circuits</div>
            </div>
            <div>
              <div className="text-lg font-bold">
                {routesService.getRoutesByDifficulty('expert').length}
              </div>
              <div className="text-xs text-gray-400">Expert Tracks</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
