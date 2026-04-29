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

  // Get controls
  const controls = replayService.getControls();

  if (!recording) {
    return (
      <div className={`race-replay-player bg-gray-900 text-white p-6 rounded-lg ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Race Replay Player</h2>
          <p className="text-gray-400 mb-6">Select a race recording to replay</p>
          
          <button
            onClick={() => setShowRecordingsList(!showRecordingsList)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {showRecordingsList ? 'Hide' : 'Show'} Recordings ({recordings.length})
          </button>
          
          {showRecordingsList && (
            <div className="mt-6 bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              {recordings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recordings available</p>
              ) : (
                <div className="space-y-2">
                  {recordings.map((rec) => (
                    <div
                      key={rec.id}
                      onClick={() => loadRecording(rec.id)}
                      className="bg-gray-700 hover:bg-gray-600 p-3 rounded cursor-pointer transition-colors"
                    >
                      <div className="font-medium">{rec.name}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(rec.date).toLocaleDateString()} • {formatTime(rec.duration)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rec.participants.length} participants • {rec.trackInfo.name}
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
    <div className={`race-replay-player bg-gray-900 text-white rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{recording.name}</h2>
            <div className="text-sm text-gray-400">
              {new Date(recording.date).toLocaleDateString()} • {recording.trackInfo.name}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowRecordingsList(!showRecordingsList)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              📁 Recordings ({recordings.length})
            </button>
          </div>
        </div>
      </div>

      {/* Video-like Controls */}
      <div className="bg-gray-800 p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="relative h-2 bg-gray-700 rounded-full cursor-pointer overflow-hidden"
          >
            <div
              className="absolute h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
            />
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-100"
              style={{ left: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
            />
          </div>
          
          {/* Time Display */}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatReplayTime(playbackState.currentTime)}</span>
            <span>{formatReplayTime(playbackState.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => controls.seek(Math.max(0, playbackState.currentTime - 10000))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Skip back 10s"
          >
            ⏪ -10s
          </button>
          
          <button
            onClick={() => controls.seek(Math.max(0, playbackState.currentTime - 5000))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Skip back 5s"
          >
            ⏪ -5s
          </button>
          
          <button
            onClick={() => controls.seek(Math.max(0, playbackState.currentTime - 1000))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Skip back 1s"
          >
            ◀◀
          </button>
          
          <button
            onClick={playbackState.isPlaying ? controls.pause : controls.play}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            title={playbackState.isPlaying ? 'Pause' : 'Play'}
          >
            {playbackState.isPlaying ? '⏸' : '▶'}
          </button>
          
          <button
            onClick={() => controls.seek(Math.min(playbackState.duration, playbackState.currentTime + 1000))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Skip forward 1s"
          >
            ▶▶
          </button>
          
          <button
            onClick={() => controls.seek(Math.min(playbackState.duration, playbackState.currentTime + 5000))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Skip forward 5s"
          >
            ⏩ +5s
          </button>
          
          <button
            onClick={() => controls.seek(Math.min(playbackState.duration, playbackState.currentTime + 10000))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Skip forward 10s"
          >
            ⏩ +10s
          </button>
          
          <button
            onClick={controls.stop}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Stop"
          >
            ⏹
          </button>
        </div>

        {/* Additional Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Playback Speed */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Speed:</span>
              <select
                value={playbackState.playbackSpeed}
                onChange={(e) => controls.setPlaybackSpeed(Number(e.target.value))}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>

            {/* Lap Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Lap:</span>
              <select
                value={playbackState.currentLap}
                onChange={(e) => controls.jumpToLap(Number(e.target.value))}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              >
                {Array.from({ length: recording.trackInfo.totalLaps }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Lap {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Loop Toggle */}
            <button
              onClick={controls.toggleLoop}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                playbackState.isLooping 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🔁 Loop
            </button>
          </div>

          <div className="text-sm text-gray-400">
            {formatReplayTime(playbackState.currentTime)} / {formatReplayTime(playbackState.duration)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Map/Visualization */}
        {showMap && (
          <div className="w-1/2 bg-gray-800 p-4 border-r border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Race View</h3>
            
            {/* Participant Positions */}
            <div className="space-y-2">
              {Array.from(currentPositions.entries()).map(([participantId, position]) => {
                const participant = recording.participants.find(p => p.id === participantId);
                const isFocused = playbackState.focusedParticipant === participantId;
                
                return (
                  <div
                    key={participantId}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      isFocused ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => isFocused ? controls.clearFocus() : controls.focusParticipant(participantId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{participant?.name || participantId}</div>
                        <div className="text-xs text-gray-400">
                          Lap {position.lap} • {formatSpeed(position.speed)} • {formatDistance(position.totalDistance)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
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
          <div className={`${showMap ? 'w-1/2' : 'w-full'} bg-gray-800 p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Race Analysis</h3>
              <button
                onClick={() => {
                  const analysis = replayService.analyzeRace();
                  setAnalysis(analysis);
                }}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
              >
                Analyze
              </button>
            </div>

            {analysis && (
              <div className="space-y-4">
                {/* Race Statistics */}
                <div>
                  <h4 className="font-medium mb-2">Race Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Total Overtakes:</span>
                      <div className="font-medium">{analysis.raceStatistics.totalOvertakes}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Speed:</span>
                      <div className="font-medium">{formatSpeed(analysis.raceStatistics.avgSpeed)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Fastest Lap:</span>
                      <div className="font-medium">
                        {recording.participants.find(p => p.id === analysis.raceStatistics.fastestLap.participantId)?.name} - 
                        {formatTime(analysis.raceStatistics.fastestLap.time)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Closest Finish:</span>
                      <div className="font-medium">{formatTime(analysis.raceStatistics.closestFinish.gap)}</div>
                    </div>
                  </div>
                </div>

                {/* Key Moments */}
                <div>
                  <h4 className="font-medium mb-2">Key Moments</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {analysis.keyMoments.map((moment: any, index: number) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                        onClick={() => {
                          controls.seek(moment.timestamp);
                          setSelectedKeyMoment(moment);
                        }}
                      >
                        <div className="font-medium">{moment.description}</div>
                        <div className="text-xs text-gray-400">
                          {formatReplayTime(moment.timestamp)} • {moment.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Participant Stats */}
                <div>
                  <h4 className="font-medium mb-2">Participant Performance</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {Array.from(analysis.participantStats.entries()).map(([participantId, stats]: [string, any]) => {
                      const participant = recording.participants.find(p => p.id === participantId);
                      return (
                        <div key={participantId} className="text-sm p-2 bg-gray-700 rounded">
                          <div className="font-medium">{participant?.name || participantId}</div>
                          <div className="text-xs text-gray-400">
                            Best Lap: {formatTime(stats.bestLapTime)} • 
                            Avg Speed: {formatSpeed(stats.avgSpeed)} • 
                            Overtakes: {stats.overtakes}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Race Recordings</h3>
              <button
                onClick={() => setShowRecordingsList(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {recordings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recordings available</p>
            ) : (
              <div className="space-y-2">
                {recordings.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => loadRecording(rec.id)}
                    className="bg-gray-700 hover:bg-gray-600 p-4 rounded cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{rec.name}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(rec.date).toLocaleDateString()} • {formatTime(rec.duration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rec.participants.length} participants • {rec.trackInfo.name}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Export functionality
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
                        className="text-gray-400 hover:text-white"
                        title="Export recording"
                      >
                        💾
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
      <div className="bg-gray-800 p-2 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          Keyboard: Space (Play/Pause) | ←→ (Seek) | ↑↓ (Speed) | F (Loop) | M (Mute)
        </div>
      </div>
    </div>
  );
};
