import React, { useState, useEffect } from 'react';
import { getRaceRoutesService, RaceRoute } from '../../services/raceRoutes.service';

interface MobileRouteSelectorProps {
  onRouteSelect: (route: RaceRoute) => void;
  selectedRouteId?: string;
  className?: string;
}

export const MobileRouteSelector: React.FC<MobileRouteSelectorProps> = ({
  onRouteSelect,
  selectedRouteId,
  className = ''
}) => {
  const routesService = getRaceRoutesService();
  const [routes, setRoutes] = useState<RaceRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RaceRoute | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'street' | 'permanent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const allRoutes = routesService.getAllRoutes();
    setRoutes(allRoutes);
    
    if (selectedRouteId) {
      const route = routesService.getRoute(selectedRouteId);
      if (route) {
        setSelectedRoute(route);
      }
    }
  }, [selectedRouteId]);

  const handleRouteSelect = (route: RaceRoute) => {
    setSelectedRoute(route);
    onRouteSelect(route);
    routesService.selectRoute(route.id);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getFilteredRoutes = (): RaceRoute[] => {
    let filtered = [...routes];

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(route => route.type === activeTab);
    }

    // Search filter
    if (searchQuery) {
      filtered = routesService.searchRoutes(searchQuery);
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'hard': return 'bg-orange-600';
      case 'expert': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'street': return '🏙️';
      case 'permanent': return '🏁';
      case 'hybrid': return '🔄';
      default: return '📍';
    }
  };

  const getCountryFlag = (country: string): string => {
    const flags: { [key: string]: string } = {
      'Monaco': '🇲🇨',
      'United Kingdom': '🇬🇧',
      'Belgium': '🇧🇪',
      'Japan': '🇯🇵',
      'Germany': '🇩🇪'
    };
    return flags[country] || '🏳️';
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(3)}km`;
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const RouteCard: React.FC<{ route: RaceRoute }> = ({ route }) => (
    <div
      className={`bg-gray-800 rounded-xl overflow-hidden touch-manipulation transition-all duration-200 ${
        selectedRoute?.id === route.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleRouteSelect(route)}
    >
      {/* Track Preview */}
      <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-1">{getTypeIcon(route.type)}</div>
            <div className="text-xs text-gray-400">{route.location}</div>
          </div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(route.difficulty)}`}>
            {route.difficulty.toUpperCase()}
          </span>
        </div>
        
        <div className="absolute top-2 right-2 text-2xl">
          {getCountryFlag(route.country)}
        </div>
      </div>

      {/* Route Info */}
      <div className="p-4">
        <h3 className="font-bold text-base mb-2">{route.name}</h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="flex items-center gap-1">
            <span>📏</span>
            <span>{formatDistance(route.distance)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{formatTime(route.estimatedLapTime)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏁</span>
            <span>{route.laps} laps</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span>{route.maxSpeed} km/h</span>
          </div>
        </div>

        {/* Lap Record */}
        <div className="bg-gray-700 rounded p-2 text-xs mb-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Lap Record</span>
            <span className="font-mono">{formatTime(route.lapRecord.time)}</span>
          </div>
          <div className="text-gray-400">{route.lapRecord.driver}</div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(showDetails === route.id ? null : route.id);
            }}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs touch-manipulation"
          >
            {showDetails === route.id ? 'Hide' : 'Show'} Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRouteSelect(route);
            }}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-xs touch-manipulation"
          >
            Select
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails === route.id && (
        <div className="border-t border-gray-700 p-4 bg-gray-750">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Description</h4>
              <p className="text-xs text-gray-400">{route.description}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Key Features</h4>
              <div className="flex flex-wrap gap-1">
                {route.features.slice(0, 3).map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Racing Tips</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                {route.tips.slice(0, 2).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`mobile-route-selector bg-gray-900 text-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold">Select Route</h1>
            <p className="text-xs text-gray-400">Choose your racing circuit</p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-gray-700 rounded-lg touch-manipulation disabled:opacity-50"
          >
            <span className={`text-xl ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-gray-700 rounded-lg text-white placeholder-gray-400 text-sm"
            />
            <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-700">
          {['all', 'street', 'permanent'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-sm font-medium capitalize touch-manipulation ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? 'All Routes' : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Circuits`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {getFilteredRoutes().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-400">No routes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredRoutes().map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </div>

      {/* Selected Route Summary */}
      {selectedRoute && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-40">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{selectedRoute.name}</h3>
              <p className="text-xs text-gray-400">
                {formatDistance(selectedRoute.distance)} • {selectedRoute.laps} laps • {formatTime(selectedRoute.estimatedLapTime * selectedRoute.laps)} total
              </p>
            </div>
            <button
              onClick={() => handleRouteSelect(selectedRoute)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm touch-manipulation"
            >
              Start Race
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-30">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🏁</span>
            <span className="text-xs text-gray-400">Routes</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">🏆</span>
            <span className="text-xs text-gray-400">Records</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">📊</span>
            <span className="text-xs text-gray-400">Stats</span>
          </button>
          <button className="flex flex-col items-center py-2 touch-manipulation">
            <span className="text-xl">⚙️</span>
            <span className="text-xs text-gray-400">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
