import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getRaceReplayService, RaceRecording, PlaybackState, ReplayControls } from '../services/raceReplay.service';
import { formatTime, formatDistance, formatSpeed } from '../utils/formatting';

interface RaceReplayPlayerProps {
  recordingId?: string;
  onRecordingSelect?: (recording: RaceRecording) => void;
  className?: string;
  showMap?: boolean;
  showAnalysis?: boolean;
}

export const RaceReplayPlayer: React.FC<RaceReplayPlayerProps> = ({
  recordingId,
  onRecordingSelect,
  className = '',
  showMap = true,
  showAnalysis = true
}) => {
  const replayService = getRaceReplayService();
  const [recording, setRecording] = useState<RaceRecording | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(replayService.getPlaybackState());
  const [recordings, setRecordings] = useState<RaceRecording[]>([]);
  const [showRecordingsList, setShowRecordingsList] = useState(false);
  const [currentPositions, setCurrentPositions] = useState(new Map());
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedKeyMoment, setSelectedKeyMoment] = useState<any>(null);
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Load recordings on mount
  useEffect(() => {
    const loadRecordings = () => {
      setRecordings(replayService.getRecordings());
    };

    loadRecordings();
    
    const handleRecordingImported = () => loadRecordings();
    const handleRecordingDeleted = () => loadRecordings();
    
    replayService.on('recording_imported', handleRecordingImported);
    replayService.on('recording_deleted', handleRecordingDeleted);
    
    return () => {
      replayService.off('recording_imported', handleRecordingImported);
      replayService.off('recording_deleted', handleRecordingDeleted);
    };
  }, []);

  // Load specific recording if provided
  useEffect(() => {
    if (recordingId) {
      replayService.loadRecording(recordingId);
      const loadedRecording = replayService.getCurrentRecording();
      setRecording(loadedRecording);
    }
  }, [recordingId]);

  // Update playback state
  useEffect(() => {
    const handlePlaybackUpdate = (event: any) => {
      setPlaybackState(event.state);
      updateCurrentPositions();
    };

    const handleRecordingLoaded = (event: any) => {
      setRecording(event.recording);
      onRecordingSelect?.(event.recording);
    };

    replayService.on('playback_updated', handlePlaybackUpdate);
    replayService.on('recording_loaded', handleRecordingLoaded);
    
    return () => {
      replayService.off('playback_updated', handlePlaybackUpdate);
      replayService.off('recording_loaded', handleRecordingLoaded);
    };
  }, [onRecordingSelect]);

  // Update current positions during playback
  const updateCurrentPositions = useCallback(() => {
    if (recording) {
      const positions = replayService.getAllParticipantPositions();
      setCurrentPositions(new Map(positions));
    }
  }, [recording]);

  // Format time for display
  const formatReplayTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !recording) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * playbackState.duration;
    
    replayService.seek(seekTime);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const controls = replayService.getControls();
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          playbackState.isPlaying ? controls.pause() : controls.play();
          break;
        case 'ArrowLeft':
          controls.seek(Math.max(0, playbackState.currentTime - 5000));
          break;
        case 'ArrowRight':
          controls.seek(Math.min(playbackState.duration, playbackState.currentTime + 5000));
          break;
        case 'ArrowUp':
          controls.setPlaybackSpeed(Math.min(4, playbackState.playbackSpeed + 0.25));
          break;
        case 'ArrowDown':
          controls.setPlaybackSpeed(Math.max(0.25, playbackState.playbackSpeed - 0.25));
          break;
        case 'f':
          controls.toggleLoop();
          break;
        case 'm':
          controls.toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState]);

  // Load recording
  const loadRecording = (recordingId: string) => {
    replayService.loadRecording(recordingId);
    setShowRecordingsList(false);
  };

  const loadDemoRecording = () => {
    const demoRecording: RaceRecording = {
      id: 'demo-laguna-seca',
      name: 'Laguna Seca Pro Championship Final',
      date: Date.now() - 3600000,
      duration: 180000, // 3 minutes demo
      trackInfo: {
        name: 'Laguna Seca Raceway',
        totalDistance: 3602,
        totalLaps: 3,
        centerLat: 36.584,
        centerLng: -121.753
      },
      participants: [
        { id: 'driver-77', name: 'Marcus Kane #77', vehicle: 'Apex GT3', finalPosition: 1, finalTime: 178210, status: 'finished' },
        { id: 'driver-44', name: 'Lewis Vance #44', vehicle: 'Vortex V8', finalPosition: 2, finalTime: 178630, status: 'finished' },
        { id: 'driver-12', name: 'Max Stone #12', vehicle: 'Kronos RS', finalPosition: 3, finalTime: 179400, status: 'finished' }
      ],
      dataPoints: [
        { timestamp: 0, participantId: 'driver-77', position: { lat: 36.584, lng: -121.753 }, speed: 180, heading: 90, accuracy: 1, status: 'active', lap: 1, lapTime: 0, totalDistance: 0 },
        { timestamp: 50000, participantId: 'driver-77', position: { lat: 36.586, lng: -121.750 }, speed: 245, heading: 95, accuracy: 1, status: 'active', lap: 1, lapTime: 50000, totalDistance: 1200 },
        { timestamp: 110000, participantId: 'driver-77', position: { lat: 36.588, lng: -121.748 }, speed: 260, heading: 100, accuracy: 1, status: 'active', lap: 2, lapTime: 58000, totalDistance: 2400 },
        { timestamp: 178210, participantId: 'driver-77', position: { lat: 36.584, lng: -121.753 }, speed: 210, heading: 90, accuracy: 1, status: 'finished', lap: 3, lapTime: 59210, totalDistance: 3602 }
      ],
      metadata: { recordedBy: 'Steward GPS telemetry', version: '2.0', compression: false }
    };

    replayService.importRecording(JSON.stringify(demoRecording));
    replayService.loadRecording(demoRecording.id);
    setRecording(demoRecording);
    setShowRecordingsList(false);
  };

  // Get controls
  const controls = replayService.getControls();

  if (!recording) {
    return (
      <div className={`cockpit-card p-6 md:p-10 shadow-2xl text-center ${className}`}>
        <div className="max-w-xl mx-auto">
          <div className="text-4xl mb-3">🎬</div>
          <h2 className="text-2xl font-bold font-orbitron text-white mb-2 tracking-wide">
            Race Replay & Telemetry Hub
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Synchronized multi-vector telemetry playback with timeline scrubbers, GPS delta analysis, and steward event markers.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <button
              onClick={() => setShowRecordingsList(!showRecordingsList)}
              className="cockpit-btn cockpit-btn-cyan w-full sm:w-auto"
            >
              📁 {showRecordingsList ? 'Hide Archive' : 'Browse Recordings'} ({recordings.length})
            </button>
            <button
              onClick={loadDemoRecording}
              className="cockpit-btn cockpit-btn-green w-full sm:w-auto"
            >
              ▶ Load Laguna Seca Telemetry Replay
            </button>
          </div>
          
          {showRecordingsList && (
            <div className="mt-6 bg-black/40 border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto text-left">
              {recordings.length === 0 ? (
                <div className="text-gray-400 text-center py-6 text-sm">
                  No local session telemetry recordings found.
                </div>
              ) : (
                <div className="space-y-3">
                  {recordings.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => loadRecording(rec.id)}
                      className="cockpit-card-interactive p-4 cursor-pointer"
                    >
                      <div className="font-bold text-white font-orbitron text-sm">{rec.name}</div>
                      <div className="text-xs text-cyan-400 font-mono-numbers mt-1">
                        {new Date(rec.date).toLocaleDateString()} • Duration: {formatTime(rec.duration)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {rec.participants.length} Drivers on Grid • {rec.trackInfo.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`cockpit-card shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-white/10 bg-black/20 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <h2 className="text-lg md:text-xl font-bold font-orbitron text-white">{recording.name}</h2>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-3 font-mono-numbers">
            <span>{new Date(recording.date).toLocaleDateString()}</span>
            <span>•</span>
            <span className="text-cyan-400">{recording.trackInfo.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRecordingsList(!showRecordingsList)}
            className="cockpit-btn text-xs py-2 px-3"
          >
            📁 Select Session ({recordings.length})
          </button>
        </div>
      </div>

      {/* Video-like Controls */}
      <div className="p-4 bg-black/40 border-b border-white/10">
        {/* Progress Bar */}
        <div className="mb-4">
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="relative h-2.5 bg-gray-800 rounded-full cursor-pointer overflow-hidden border border-white/10"
          >
            <div
              className="absolute h-full bg-gradient-to-r from-[#00ff88] to-[#00d4ff] transition-all duration-100"
              style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
            />
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_8px_#00ff88] transition-all duration-100"
              style={{ left: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
            />
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between text-xs font-mono-numbers text-gray-400 mt-1.5">
            <span className="text-[#00ff88] font-bold">{formatReplayTime(playbackState.currentTime)}</span>
            <span>{formatReplayTime(playbackState.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => controls.seek(Math.max(0, playbackState.currentTime - 10000))}
            className="cockpit-btn text-xs py-1.5 px-2.5"
            title="Skip back 10s"
          >
            ⏪ -10s
          </button>
          
          <button
            onClick={() => controls.seek(Math.max(0, playbackState.currentTime - 5000))}
            className="cockpit-btn text-xs py-1.5 px-2.5"
            title="Skip back 5s"
          >
            ⏪ -5s
          </button>
          
          <button
            onClick={() => controls.seek(Math.max(0, playbackState.currentTime - 1000))}
            className="cockpit-btn text-xs py-1.5 px-2"
            title="Skip back 1s"
          >
            ◀
          </button>
          
          <button
            onClick={playbackState.isPlaying ? controls.pause : controls.play}
            className={`cockpit-btn px-4 py-2 text-sm font-bold ${playbackState.isPlaying ? 'cockpit-btn-amber' : 'cockpit-btn-green'}`}
            title={playbackState.isPlaying ? 'Pause' : 'Play'}
          >
            {playbackState.isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          
          <button
            onClick={() => controls.seek(Math.min(playbackState.duration, playbackState.currentTime + 1000))}
            className="cockpit-btn text-xs py-1.5 px-2"
            title="Skip forward 1s"
          >
            ▶
          </button>
          
          <button
            onClick={() => controls.seek(Math.min(playbackState.duration, playbackState.currentTime + 5000))}
            className="cockpit-btn text-xs py-1.5 px-2.5"
            title="Skip forward 5s"
          >
            +5s ⏩
          </button>
          
          <button
            onClick={() => controls.seek(Math.min(playbackState.duration, playbackState.currentTime + 10000))}
            className="cockpit-btn text-xs py-1.5 px-2.5"
            title="Skip forward 10s"
          >
            +10s ⏩
          </button>
          
          <button
            onClick={controls.stop}
            className="cockpit-btn text-xs py-1.5 px-2.5 hover:text-red-400"
            title="Stop"
          >
            ⏹ Stop
          </button>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Playback Speed */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>Speed:</span>
              <select
                value={playbackState.playbackSpeed}
                onChange={(e) => controls.setPlaybackSpeed(Number(e.target.value))}
                className="cockpit-input py-1 px-2 text-xs w-auto"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
                <option value={4}>4.0x</option>
              </select>
            </div>

            {/* Lap Selection */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>Lap:</span>
              <select
                value={playbackState.currentLap}
                onChange={(e) => controls.jumpToLap(Number(e.target.value))}
                className="cockpit-input py-1 px-2 text-xs w-auto"
              >
                {Array.from({ length: recording.trackInfo.totalLaps }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Lap {i + 1} / {recording.trackInfo.totalLaps}
                  </option>
                ))}
              </select>
            </div>

            {/* Loop Toggle */}
            <button
              onClick={controls.toggleLoop}
              className={`cockpit-btn text-xs py-1 px-2.5 ${
                playbackState.isLooping 
                  ? 'cockpit-btn-cyan' 
                  : ''
              }`}
            >
              🔁 Loop
            </button>
          </div>

          <div className="text-xs font-mono-numbers text-cyan-400 font-bold">
            {formatReplayTime(playbackState.currentTime)} / {formatReplayTime(playbackState.duration)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Map/Visualization */}
        {showMap && (
          <div className="w-full lg:w-1/2 p-5 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20">
            <h3 className="text-sm font-bold font-orbitron text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>🏎️</span> Competitor Position Stream
            </h3>
            
            {/* Participant Positions */}
            <div className="space-y-2">
              {Array.from(currentPositions.entries()).map(([participantId, position]) => {
                const participant = recording.participants.find(p => p.id === participantId);
                const isFocused = playbackState.focusedParticipant === participantId;
                
                return (
                  <div
                    key={participantId}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isFocused 
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(0,212,255,0.25)]' 
                        : 'cockpit-card-interactive'
                    }`}
                    onClick={() => isFocused ? controls.clearFocus() : controls.focusParticipant(participantId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{participant?.name || participantId}</div>
                        <div className="text-xs text-gray-400 font-mono-numbers mt-0.5">
                          Lap {position.lap} • <span className="text-[#00ff88]">{formatSpeed(position.speed)}</span> • {formatDistance(position.totalDistance)}
                        </div>
                      </div>
                      <div className="text-xs text-cyan-400 font-mono-numbers font-bold">
                        {formatReplayTime(position.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis Panel */}
        {showAnalysis && (
          <div className={`${showMap ? 'w-full lg:w-1/2' : 'w-full'} p-5 bg-black/30`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-orbitron text-white uppercase tracking-wider flex items-center gap-2">
                <span>📊</span> Telemetry Analysis
              </h3>
              <button
                onClick={() => {
                  const analysis = replayService.analyzeRace();
                  setAnalysis(analysis);
                }}
                className="cockpit-btn cockpit-btn-cyan text-xs py-1.5 px-3"
              >
                Run Diagnostics
              </button>
            </div>

            {analysis && (
              <div className="space-y-4">
                {/* Race Statistics */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold font-orbitron text-gray-300 uppercase tracking-wider mb-3">Race Statistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono-numbers">
                    <div>
                      <span className="text-gray-400">Total Overtakes:</span>
                      <div className="font-bold text-cyan-400 text-sm">{analysis.raceStatistics.totalOvertakes}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Speed:</span>
                      <div className="font-bold text-[#00ff88] text-sm">{formatSpeed(analysis.raceStatistics.avgSpeed)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Fastest Lap:</span>
                      <div className="font-bold text-[#ffaa00] text-sm">
                        {recording.participants.find(p => p.id === analysis.raceStatistics.fastestLap.participantId)?.name} - 
                        {formatTime(analysis.raceStatistics.fastestLap.time)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Closest Finish:</span>
                      <div className="font-bold text-white text-sm">{formatTime(analysis.raceStatistics.closestFinish.gap)}</div>
                    </div>
                  </div>
                </div>

                {/* Key Moments */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold font-orbitron text-gray-300 uppercase tracking-wider mb-2">Key Incident Moments</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {analysis.keyMoments.map((moment: any, index: number) => (
                      <div
                        key={index}
                        className="text-xs p-2.5 rounded-lg cursor-pointer cockpit-card-interactive"
                        onClick={() => {
                          controls.seek(moment.timestamp);
                          setSelectedKeyMoment(moment);
                        }}
                      >
                        <div className="font-semibold text-white">{moment.description}</div>
                        <div className="text-[11px] text-cyan-400 font-mono-numbers mt-0.5">
                          {formatReplayTime(moment.timestamp)} • {moment.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Participant Stats */}
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <h4 className="text-xs font-bold font-orbitron text-gray-300 uppercase tracking-wider mb-2">Driver Performance</h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {Array.from(analysis.participantStats.entries()).map(([participantId, stats]: [string, any]) => {
                      const participant = recording.participants.find(p => p.id === participantId);
                      return (
                        <div key={participantId} className="text-xs p-2.5 rounded-lg cockpit-card-interactive">
                          <div className="font-bold text-white">{participant?.name || participantId}</div>
                          <div className="text-[11px] text-gray-400 font-mono-numbers mt-0.5">
                            Best Lap: <span className="text-[#00ff88]">{formatTime(stats.bestLapTime)}</span> • 
                            Avg: {formatSpeed(stats.avgSpeed)} • 
                            Passes: {stats.overtakes}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recordings List Modal */}
      {showRecordingsList && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="cockpit-card p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold font-orbitron text-white">Race Recordings Archive</h3>
              <button
                onClick={() => setShowRecordingsList(false)}
                className="text-gray-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>
            
            {recordings.length === 0 ? (
              <div className="text-gray-400 text-center py-8 text-sm">
                No telemetry recordings currently stored.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => loadRecording(rec.id)}
                    className="cockpit-card-interactive p-4 cursor-pointer"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-bold font-orbitron text-white text-sm">{rec.name}</div>
                        <div className="text-xs text-cyan-400 font-mono-numbers mt-0.5">
                          {new Date(rec.date).toLocaleDateString()} • {formatTime(rec.duration)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {rec.participants.length} Drivers • {rec.trackInfo.name}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const jsonData = replayService.exportRecording(rec.id);
                          if (jsonData) {
                            const blob = new Blob([jsonData], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${rec.name}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="cockpit-btn text-xs py-1 px-2.5"
                        title="Export recording"
                      >
                        💾 Export JSON
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="bg-black/40 p-2.5 border-t border-white/10">
        <div className="text-[11px] font-mono-numbers text-gray-400 text-center">
          Shortcuts: Space (Play/Pause) | ←→ (Seek) | ↑↓ (Speed) | F (Loop)
        </div>
      </div>
    </div>
  );
};
