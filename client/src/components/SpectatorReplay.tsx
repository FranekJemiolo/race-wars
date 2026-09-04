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
    return (
      <div className="cockpit-card p-8 text-center">
        <h2 className="text-xl font-bold font-orbitron text-white mb-2">No Replay Telemetry Available</h2>
        <p className="text-gray-400 text-sm">Please select an active session recording to inspect.</p>
      </div>
    );
  }

  const currentPositions = getCurrentPositions();
  const currentIncidents = getCurrentIncidents();
  const currentFlags = getCurrentFlags();

  return (
    <div className="cockpit-card p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold font-orbitron text-white tracking-wide flex items-center gap-3">
            <span>🎬</span> Session Replay Analysis
          </h2>
          <p className="text-xs text-gray-400 font-mono-numbers mt-1">
            SESSION ID: {sessionId} • 60Hz MULTI-VECTOR PLAYBACK
          </p>
        </div>
        <button
          onClick={onExit}
          className="cockpit-btn"
        >
          ← Exit Replay
        </button>
      </div>

      {/* Map View */}
      <div className="relative bg-[#090d16] border border-white/10 rounded-xl h-96 mb-6 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Simple SVG-based map visualization */}
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Track background glow */}
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="30"
            fill="none"
            stroke="rgba(0, 212, 255, 0.15)"
            strokeWidth="6"
          />
          {/* Track line */}
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="30"
            fill="none"
            stroke="#00ff88"
            strokeWidth="2"
            strokeDasharray="4 2"
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
                  cx={`${x}`}
                  cy={`${y}`}
                  r="3.5"
                  fill={participant.color || '#00d4ff'}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
                {/* Car number */}
                <text
                  x={`${x}`}
                  y={`${y}`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="2.5"
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
                  cx={`${x}`}
                  cy={`${y}`}
                  r="4"
                  fill="rgba(255, 51, 102, 0.4)"
                  stroke="#ff3366"
                  strokeWidth="0.8"
                />
                <text
                  x={`${x}`}
                  y={`${y}`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="3"
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
              className={`px-3 py-1 rounded-md text-xs font-bold font-orbitron flex items-center gap-2 border ${
                flag.flag === 'yellow' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                flag.flag === 'red' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                flag.flag === 'green' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' :
                'bg-gray-800 text-gray-300 border-gray-700'
              }`}
            >
              <span>{flag.flag === 'yellow' ? '🟡' : flag.flag === 'red' ? '🔴' : '🟢'}</span>
              <span>SEC {flag.sector}: {flag.flag.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`cockpit-btn ${isPlaying ? 'cockpit-btn-amber' : 'cockpit-btn-green'}`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setCurrentTime(replayData.startTime)}
            className="cockpit-btn text-xs py-2 px-3"
          >
            ⏮ Start
          </button>
          <button
            onClick={() => setCurrentTime(replayData.endTime)}
            className="cockpit-btn text-xs py-2 px-3"
          >
            ⏭ End
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-300 ml-auto">
            <span>Speed:</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="cockpit-input py-1 px-2 text-xs w-auto"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1.0x</option>
              <option value={2}>2.0x</option>
              <option value={4}>4.0x</option>
              <option value={8}>8.0x</option>
            </select>
          </div>

          <div className="text-right text-xs font-mono-numbers text-cyan-400 font-bold ml-2">
            {formatTime(currentTime)} / {formatTime(replayData.endTime)}
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
          className="w-full accent-[#00ff88] cursor-pointer"
          disabled={isPlaying}
        />
      </div>

      {/* Participant selection */}
      <div className="mb-6">
        <h3 className="font-orbitron text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
          Tracked Competitors
        </h3>
        <div className="flex flex-wrap gap-2">
          {replayData.participants.map((participant) => (
            <button
              key={participant.id}
              onClick={() => toggleParticipant(participant.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border ${
                selectedParticipants.has(participant.id)
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                  : 'bg-gray-800/80 text-gray-400 border-white/10 hover:border-white/30'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: participant.color || '#00d4ff' }}
              />
              <span className="font-mono-numbers font-bold">#{participant.carNumber}</span>
              <span>{participant.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display options */}
      <div className="flex items-center gap-6 text-sm text-gray-300">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showIncidents}
            onChange={(e) => setShowIncidents(e.target.checked)}
            className="accent-[#00d4ff] rounded cursor-pointer"
          />
          <span>Show Incidents</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFlags}
            onChange={(e) => setShowFlags(e.target.checked)}
            className="accent-[#00ff88] rounded cursor-pointer"
          />
          <span>Show Flags</span>
        </label>
      </div>

      {/* Current incidents list */}
      {currentIncidents.length > 0 && (
        <div className="mt-6 p-4 bg-red-950/30 border border-red-500/30 rounded-xl">
          <h4 className="font-orbitron text-xs font-bold text-red-400 tracking-wider mb-2 flex items-center gap-2">
            <span>🚨</span> Incident Reports Active
          </h4>
          <div className="space-y-1">
            {currentIncidents.map((incident, index) => (
              <div key={index} className="text-xs text-red-200">
                • {incident.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
