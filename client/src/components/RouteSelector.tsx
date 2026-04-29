import React, { useState, useEffect, useMemo } from 'react';
import { getRaceRoutesService, RaceRoute } from '../services/raceRoutes.service';

interface RouteSelectorProps {
  onRouteSelect: (route: RaceRoute) => void;
  selectedRouteId?: string;
  className?: string;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  onRouteSelect,
  selectedRouteId,
  className = ''
}) => {
  const routesService = getRaceRoutesService();
  const [routes, setRoutes] = useState<RaceRoute[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<RaceRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RaceRoute | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard' | 'expert'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'street' | 'permanent' | 'hybrid'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'difficulty' | 'country'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    const allRoutes = routesService.getAllRoutes();
    setRoutes(allRoutes);
    
    // Set initial selected route if provided
    if (selectedRouteId) {
      const route = routesService.getRoute(selectedRouteId);
      if (route) {
        setSelectedRoute(route);
      }
    }
  }, [selectedRouteId]);

  useEffect(() => {
    // Apply filters and search
    let filtered = [...routes];

    // Search filter
    if (searchQuery) {
      filtered = routesService.searchRoutes(searchQuery);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(route => route.difficulty === difficultyFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(route => route.type === typeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'distance':
          return b.distance - a.distance;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3, expert: 4 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'country':
          return a.country.localeCompare(b.country);
        default:
          return 0;
      }
    });

    setFilteredRoutes(filtered);
  }, [routes, searchQuery, difficultyFilter, typeFilter, sortBy]);

  const handleRouteSelect = (route: RaceRoute) => {
    setSelectedRoute(route);
    onRouteSelect(route);
    routesService.selectRoute(route.id);
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

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(3)}km`;
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  const RouteCard: React.FC<{ route: RaceRoute }> = ({ route }) => (
    <div
      className={`bg-gray-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl ${
        selectedRoute?.id === route.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleRouteSelect(route)}
    >
      {/* Track Preview */}
      <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-1">{getTypeIcon(route.type)}</div>
            <div className="text-xs text-gray-400">{route.location}</div>
          </div>
        </div>
        
        {/* Track characteristics overlay */}
        <div className="absolute top-2 left-2 flex gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(route.difficulty)}`}>
            {route.difficulty.toUpperCase()}
          </span>
          <span className="px-2 py-1 bg-gray-700 rounded text-xs font-medium">
            {route.corners} corners
          </span>
        </div>
        
        {/* Country flag */}
        <div className="absolute top-2 right-2 text-2xl">
          {getCountryFlag(route.country)}
        </div>
      </div>

      {/* Route Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2">{route.name}</h3>
        
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
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
        <div className="bg-gray-700 rounded p-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Lap Record</span>
            <span className="font-mono">{formatTime(route.lapRecord.time)}</span>
          </div>
          <div className="text-gray-400">{route.lapRecord.driver} ({route.lapRecord.year})</div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(showDetails === route.id ? null : route.id);
            }}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm touch-manipulation"
          >
            {showDetails === route.id ? 'Hide' : 'Show'} Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRouteSelect(route);
            }}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation"
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
              <h4 className="font-semibold text-sm mb-2">Track Features</h4>
              <div className="flex flex-wrap gap-1">
                {route.features.map((feature, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Racing Tips</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                {route.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Surface:</span>
                <span className="ml-2 capitalize">{route.surface}</span>
              </div>
              <div>
                <span className="text-gray-400">Width:</span>
                <span className="ml-2">{route.width}m</span>
              </div>
              <div>
                <span className="text-gray-400">Elevation:</span>
                <span className="ml-2">±{route.elevationGain}m</span>
              </div>
              <div>
                <span className="text-gray-400">Longest Straight:</span>
                <span className="ml-2">{formatDistance(route.longestStraight)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const RouteListItem: React.FC<{ route: RaceRoute }> = ({ route }) => (
    <div
      className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-700 ${
        selectedRoute?.id === route.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleRouteSelect(route)}
    >
      <div className="flex items-center gap-4">
        {/* Track icon and info */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl">{getTypeIcon(route.type)}</div>
              <div className="text-xs text-gray-400">{route.corners}</div>
            </div>
          </div>
        </div>

        {/* Route details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{route.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(route.difficulty)}`}>
              {route.difficulty}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{getCountryFlag(route.country)} {route.location}</span>
            <span>📏 {formatDistance(route.distance)}</span>
            <span>⏱️ {formatTime(route.estimatedLapTime)}</span>
            <span>🏁 {route.laps} laps</span>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            Lap Record: {formatTime(route.lapRecord.time)} - {route.lapRecord.driver}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(showDetails === route.id ? null : route.id);
            }}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs touch-manipulation"
          >
            Info
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRouteSelect(route);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs touch-manipulation"
          >
            Select
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails === route.id && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">{route.description}</p>
          <div className="flex flex-wrap gap-1">
            {route.features.slice(0, 3).map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-gray-700 rounded text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`route-selector bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Race Route</h2>
        <p className="text-gray-400">Choose from world-famous racing circuits</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-gray-800 rounded-lg text-white placeholder-gray-400"
          />
          <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 rounded-lg text-white"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 rounded-lg text-white"
          >
            <option value="all">All Types</option>
            <option value="street">Street Circuits</option>
            <option value="permanent">Permanent Circuits</option>
            <option value="hybrid">Hybrid Circuits</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 rounded-lg text-white"
          >
            <option value="name">Sort by Name</option>
            <option value="distance">Sort by Distance</option>
            <option value="difficulty">Sort by Difficulty</option>
            <option value="country">Sort by Country</option>
          </select>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {filteredRoutes.length} routes found
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Routes Display */}
      {filteredRoutes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">No routes found matching your criteria</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredRoutes.map((route) => 
            viewMode === 'grid' ? 
              <RouteCard key={route.id} route={route} /> : 
              <RouteListItem key={route.id} route={route} />
          )}
        </div>
      )}

      {/* Selected Route Summary */}
      {selectedRoute && (
        <div className="fixed bottom-4 left-4 right-4 bg-gray-800 rounded-lg p-4 shadow-lg z-40">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Selected: {selectedRoute.name}</h3>
              <p className="text-sm text-gray-400">
                {formatDistance(selectedRoute.distance)} • {selectedRoute.laps} laps • {formatTime(selectedRoute.estimatedLapTime * selectedRoute.laps)} total
              </p>
            </div>
            <button
              onClick={() => handleRouteSelect(selectedRoute)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium touch-manipulation"
            >
              Start Race
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
