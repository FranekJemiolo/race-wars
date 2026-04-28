/**
 * Spectator Replay Component
 * 
 * Allows spectators to replay recorded sessions with:
 * - Timeline scrubbing
 * - Playback controls (play, pause, speed)
 * - Multi-car tracking
 * - Incident markers
 * - Flag changes
 * - Position visualization
 */

import React, { useState, useEffect, useRef } from 'react';

interface ReplayData {
  sessionId: string;
  startTime: number;
  endTime: number;
  participants: Participant[];
  positions: PositionData[];
  incidents: IncidentData[];
  flagChanges: FlagChangeData[];
}

interface Participant {
  id: string;
  name: string;
  carNumber: string;
  color: string;
}

interface PositionData {
  timestamp: number;
  participantId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
}

interface IncidentData {
  timestamp: number;
  type: string;
  lat: number;
  lng: number;
  description: string;
}

interface FlagChangeData {
  timestamp: number;
  sector: number;
  flag: string;
}

interface SpectatorReplayProps {
  sessionId: string;
  onExit?: () => void;
}

export const SpectatorReplay: React.FC<SpectatorReplayProps> = ({
  sessionId,
  onExit,
}) => {
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showIncidents, setShowIncidents] = useState(true);
  const [showFlags, setShowFlags] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    loadReplayData();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (isPlaying && replayData) {
      lastTimestampRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [isPlaying, replayData, playbackSpeed]);

  const loadReplayData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockData: ReplayData = {
        sessionId,
        startTime: Date.now() - 3600000,
        endTime: Date.now(),
        participants: [
          { id: '1', name: 'John Doe', carNumber: '42', color: '#FF0000' },
          { id: '2', name: 'Jane Smith', carNumber: '7', color: '#00FF00' },
          { id: '3', name: 'Bob Johnson', carNumber: '11', color: '#0000FF' },
        ],
        positions: generateMockPositions(),
        incidents: [
          {
            timestamp: Date.now() - 2400000,
            type: 'off_track',
            lat: 37.7755,
            lng: -122.4185,
            description: 'Car #7 off track',
          },
          {
            timestamp: Date.now() - 1200000,
            type: 'spin',
            lat: 37.7756,
            lng: -122.4186,
            description: 'Car #42 spin',
          },
        ],
        flagChanges: [
          { timestamp: Date.now() - 1800000, sector: 2, flag: 'yellow' },
          { timestamp: Date.now() - 600000, sector: 2, flag: 'green' },
        ],
      };

      setReplayData(mockData);
      setCurrentTime(mockData.startTime);
      setSelectedParticipants(new Set(mockData.participants.map(p => p.id)));
    } catch (error) {
      console.error('Failed to load replay data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockPositions = (): PositionData[] => {
    const positions: PositionData[] = [];
    const startTime = Date.now() - 3600000;
    const participants = ['1', '2', '3'];
    
    for (let i = 0; i < 360; i++) {
      const timestamp = startTime + (i * 10000);
      participants.forEach(participantId => {
        positions.push({
          timestamp,
          participantId,
          lat: 37.7754 + (Math.sin(i * 0.1) * 0.001),
          lng: -122.4184 + (Math.cos(i * 0.1) * 0.001),
          speed: 150 + Math.random() * 20,
          heading: (i * 10) % 360,
        });
      });
    }
    
    return positions;
  };

  const animate = (timestamp: number) => {
    if (!replayData) return;

    const delta = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    const timeDelta = delta * playbackSpeed;
    setCurrentTime(prev => {
      const newTime = prev + timeDelta;
      if (newTime >= replayData.endTime) {
        setIsPlaying(false);
        return replayData.endTime;
      }
      return newTime;
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleScrub = (value: number) => {
    if (!replayData) return;
    const duration = replayData.endTime - replayData.startTime;
    const newTime = replayData.startTime + (duration * value);
    setCurrentTime(newTime);
  };

  const getCurrentPositions = () => {
    if (!replayData) return [];
    return replayData.positions.filter(
      p => Math.abs(p.timestamp - currentTime) < 1000 &&
           selectedParticipants.has(p.participantId)
    );
  };

  const getCurrentIncidents = () => {
    if (!replayData || !showIncidents) return [];
    return replayData.incidents.filter(
      i => Math.abs(i.timestamp - currentTime) < 5000
    );
  };

  const getCurrentFlags = () => {
    if (!replayData || !showFlags) return [];
    return replayData.flagChanges.filter(
      f => f.timestamp <= currentTime &&
           f.timestamp > currentTime - 300000
    );
  };

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getProgress = () => {
    if (!replayData) return 0;
    const duration = replayData.endTime - replayData.startTime;
    const elapsed = currentTime - replayData.startTime;
    return elapsed / duration;
  };

  if (isLoading) {
    return <div className="p-6">Loading replay...</div>;
  }

  if (!replayData) {
    return <div className="p-6">No replay data available</div>;
  }

  const currentPositions = getCurrentPositions();
  const currentIncidents = getCurrentIncidents();
  const currentFlags = getCurrentFlags();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Session Replay</h2>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Exit Replay
        </button>
      </div>

      {/* Map View */}
      <div className="relative bg-gray-100 rounded-lg h-96 mb-4 overflow-hidden">
        {/* Simple SVG-based map visualization */}
        <svg className="w-full h-full">
          {/* Track outline */}
          <ellipse
            cx="50%"
            cy="50%"
            rx="40%"
            ry="30%"
            fill="none"
            stroke="#ccc"
            strokeWidth="2"
          />
          
          {/* Current positions */}
          {currentPositions.map((pos, index) => {
            const participant = replayData.participants.find(p => p.id === pos.participantId);
            if (!participant) return null;
            
            // Convert lat/lng to SVG coordinates (simplified)
            const x = 50 + ((pos.lng + 122.4184) * 10000);
            const y = 50 - ((pos.lat - 37.7754) * 10000);
            
            return (
              <g key={`${pos.participantId}-${index}`}>
                {/* Car marker */}
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="8"
                  fill={participant.color}
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Car number */}
                <text
                  x={`${x}%`}
                  y={`${y}%`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {participant.carNumber}
                </text>
              </g>
            );
          })}

          {/* Incident markers */}
          {currentIncidents.map((incident, index) => {
            const x = 50 + ((incident.lng + 122.4184) * 10000);
            const y = 50 - ((incident.lat - 37.7754) * 10000);
            
            return (
              <g key={`incident-${index}`}>
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="12"
                  fill="rgba(255, 0, 0, 0.3)"
                  stroke="red"
                  strokeWidth="2"
                />
                <text
                  x={`${x}%`}
                  y={`${y}%`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="red"
                  fontSize="16"
                >
                  ⚠️
                </text>
              </g>
            );
          })}
        </svg>

        {/* Flag indicators */}
        <div className="absolute top-4 right-4 space-y-2">
          {currentFlags.map((flag, index) => (
            <div
              key={index}
              className={`px-3 py-1 rounded text-white text-sm ${
                flag.flag === 'yellow' ? 'bg-yellow-500' :
                flag.flag === 'red' ? 'bg-red-500' :
                flag.flag === 'green' ? 'bg-green-500' :
                'bg-gray-500'
              }`}
            >
              Sector {flag.sector}: {flag.flag.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setCurrentTime(replayData.startTime)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ⏮ Start
          </button>
          <button
            onClick={() => setCurrentTime(replayData.endTime)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ⏭ End
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="px-2 py-1 border rounded"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
              <option value={8}>8x</option>
            </select>
          </div>

          <div className="flex-1 text-center">
            <span className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(replayData.endTime)}
            </span>
          </div>
        </div>

        {/* Timeline scrubber */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={getProgress()}
          onChange={(e) => handleScrub(parseFloat(e.target.value))}
          className="w-full"
          disabled={isPlaying}
        />
      </div>

      {/* Participant selection */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Participants</h3>
        <div className="flex flex-wrap gap-2">
          {replayData.participants.map((participant) => (
            <button
              key={participant.id}
              onClick={() => toggleParticipant(participant.id)}
              className={`px-3 py-1 rounded flex items-center gap-2 ${
                selectedParticipants.has(participant.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: participant.color }}
              />
              <span>#{participant.carNumber}</span>
              <span>{participant.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showIncidents}
            onChange={(e) => setShowIncidents(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Incidents</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showFlags}
            onChange={(e) => setShowFlags(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Flags</span>
        </label>
      </div>

      {/* Current incidents list */}
      {currentIncidents.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded">
          <h4 className="font-semibold text-red-800 mb-2">Current Incidents</h4>
          {currentIncidents.map((incident, index) => (
            <div key={index} className="text-sm text-red-700">
              {incident.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
