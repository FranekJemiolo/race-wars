import React, { useState, useEffect } from 'react';
import { RaceReplayPlayer } from '../components/RaceReplayPlayer';
import { getRaceReplayService, RaceRecording } from '../services/raceReplay.service';
import { getSimulationManager, RaceSimulationConfig } from '../services/simulationClient.service';

export const RaceReplayDemo: React.FC = () => {
  const replayService = getRaceReplayService();
  const simulationManager = getSimulationManager();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<RaceRecording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<RaceRecording | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importData, setImportData] = useState('');

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

  // Start recording a race
  const startRecording = () => {
    const raceId = `demo-race-${Date.now()}`;
    const raceInfo = {
      name: `Demo Race ${new Date().toLocaleTimeString()}`,
      trackName: 'San Francisco Circuit',
      totalDistance: 10000,
      totalLaps: 3,
      centerLat: 37.7749,
      centerLng: -122.4194
    };

    replayService.startRecording(raceId, raceInfo);
    setIsRecording(true);

    // Start simulation to generate data
    const simulationConfig: RaceSimulationConfig = {
      raceId,
      trackCenter: { lat: 37.7749, lng: -122.4194 },
      trackRadius: 1000,
      participants: Array.from({ length: 4 }, (_, i) => ({
        id: `driver-${i + 1}`,
        name: `Driver ${i + 1}`,
        skill: i === 0 ? 'expert' : i === 1 ? 'intermediate' : 'beginner',
        vehicle: i % 2 === 0 ? 'car' : 'motorcycle',
        startingPosition: i / 4
      })),
      raceDuration: 180 // 3 minutes
    };

    simulationManager.startRaceSimulation(simulationConfig);
    setIsSimulating(true);

    // Listen for simulation data and record it
    const handleSimulationUpdate = (data: any) => {
      if (isRecording) {
        replayService.addDataPoint({
          participantId: data.participantId,
          position: { lat: data.lat, lng: data.lng },
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy || 5,
          status: data.status || 'active',
          lap: data.lap || 1,
          lapTime: data.lapTime || 0,
          totalDistance: data.totalDistance || 0,
          antiCheatRisk: data.antiCheatRisk
        });

        // Update participant info
        replayService.updateParticipant(data.participantId, {
          name: data.name,
          vehicle: data.vehicle,
          finalPosition: data.position,
          finalTime: data.totalTime,
          status: data.status
        });
      }
    };

    // Mock simulation data updates
    const simulationInterval = setInterval(() => {
      if (isRecording && isSimulating) {
        // Generate mock data for each participant
        for (let i = 0; i < 4; i++) {
          const participantId = `driver-${i + 1}`;
          const baseTime = Date.now() - (raceId.split('-')[2] ? parseInt(raceId.split('-')[2]) : 0);
          const lap = Math.floor(baseTime / 60000) + 1; // New lap every minute
          
          handleSimulationUpdate({
            participantId,
            name: `Driver ${i + 1}`,
            lat: 37.7749 + Math.sin(baseTime / 1000 + i) * 0.01,
            lng: -122.4194 + Math.cos(baseTime / 1000 + i) * 0.01,
            speed: 100 + Math.random() * 50,
            heading: (baseTime / 100 + i * 90) % 360,
            accuracy: 5,
            status: lap > 3 ? 'finished' : 'active',
            lap,
            lapTime: baseTime % 60000,
            totalDistance: lap * 3333 + (baseTime % 60000) / 18,
            position: i + 1,
            totalTime: baseTime,
            vehicle: i % 2 === 0 ? 'car' : 'motorcycle',
            antiCheatRisk: Math.random() > 0.9 ? Math.random() * 100 : 0
          });
        }
      }
    }, 100);

    // Stop recording after race duration
    setTimeout(() => {
      stopRecording();
      clearInterval(simulationInterval);
    }, simulationConfig.raceDuration * 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (isRecording) {
      const recording = replayService.stopRecording();
      if (recording) {
        setCurrentRecording(recording);
        setSelectedRecording(recording.id);
      }
      setIsRecording(false);
      setIsSimulating(false);
      simulationManager.stopRaceSimulation();
    }
  };

  // Delete recording
  const deleteRecording = (recordingId: string) => {
    if (confirm('Are you sure you want to delete this recording?')) {
      replayService.deleteRecording(recordingId);
      if (selectedRecording === recordingId) {
        setSelectedRecording(null);
        setCurrentRecording(null);
      }
    }
  };

  // Export recording
  const exportRecording = (recordingId: string) => {
    const jsonData = replayService.exportRecording(recordingId);
    if (jsonData) {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const recording = recordings.find(r => r.id === recordingId);
      a.href = url;
      a.download = `${recording?.name || 'recording'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Import recording
  const importRecording = () => {
    try {
      const success = replayService.importRecording(importData);
      if (success) {
        setImportData('');
        setShowImportExport(false);
        alert('Recording imported successfully!');
      } else {
        alert('Failed to import recording. Please check the format.');
      }
    } catch (error) {
      alert('Error importing recording: ' + error);
    }
  };

  // Load sample recording for demo
  const loadSampleRecording = () => {
    const sampleRecording: RaceRecording = {
      id: 'sample-race-' + Date.now(),
      name: 'Sample Grand Prix',
      date: Date.now() - 86400000, // Yesterday
      duration: 300000, // 5 minutes
      trackInfo: {
        name: 'Monaco Street Circuit',
        totalDistance: 3333,
        totalLaps: 3,
        centerLat: 43.7347,
        centerLng: 7.4206
      },
      participants: [
        { id: 'driver-1', name: 'Lewis Hamilton', vehicle: 'car', finalPosition: 1, finalTime: 295000, status: 'finished' },
        { id: 'driver-2', name: 'Max Verstappen', vehicle: 'car', finalPosition: 2, finalTime: 296500, status: 'finished' },
        { id: 'driver-3', name: 'Charles Leclerc', vehicle: 'car', finalPosition: 3, finalTime: 297200, status: 'finished' },
        { id: 'driver-4', name: 'Carlos Sainz', vehicle: 'car', finalPosition: 4, finalTime: 298100, status: 'finished' }
      ],
      dataPoints: generateSampleDataPoints(),
      metadata: {
        recordedBy: 'demo',
        version: '1.0',
        compression: false
      }
    };

    replayService.recordings.set(sampleRecording.id, sampleRecording);
    setSelectedRecording(sampleRecording.id);
    setRecordings(replayService.getRecordings());
  };

  // Generate sample data points
  const generateSampleDataPoints = () => {
    const dataPoints = [];
    const participants = ['driver-1', 'driver-2', 'driver-3', 'driver-4'];
    
    for (let time = 0; time <= 300000; time += 1000) {
      participants.forEach((participantId, index) => {
        const lap = Math.floor(time / 100000) + 1;
        const progress = (time % 100000) / 100000;
        
        dataPoints.push({
          timestamp: time,
          participantId,
          position: {
            lat: 43.7347 + Math.sin(time / 10000 + index) * 0.005,
            lng: 7.4206 + Math.cos(time / 10000 + index) * 0.005
          },
          speed: 150 + Math.sin(time / 5000 + index) * 30,
          heading: (time / 100 + index * 90) % 360,
          accuracy: 5,
          status: lap > 3 ? 'finished' : 'active',
          lap,
          lapTime: time % 100000,
          totalDistance: lap * 3333 * progress,
          antiCheatRisk: index === 2 && time > 200000 ? 85 : 0
        });
      });
    }
    
    return dataPoints;
  };

  return (
    <div className="race-replay-demo min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Race Replay System</h1>
              <p className="text-gray-400 text-sm mt-1">
                Video-like playback for race analysis and review
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadSampleRecording}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium transition-colors"
              >
                Load Sample Race
              </button>
              
              <button
                onClick={() => setShowImportExport(!showImportExport)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
              >
                📁 Import/Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isRecording}
                className={`px-6 py-3 rounded font-medium transition-colors ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } ${isRecording ? 'animate-pulse' : ''}`}
              >
                {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
              </button>
              
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm">Recording in progress...</span>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-400">
              {recordings.length} recording{recordings.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {selectedRecording ? (
          /* Replay Player */
          <RaceReplayPlayer
            recordingId={selectedRecording}
            onRecordingSelect={(recording) => setCurrentRecording(recording)}
            className="mb-6"
            showMap={true}
            showAnalysis={true}
          />
        ) : (
          /* Recordings List */
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Available Recordings</h2>
            
            {recordings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <div className="text-6xl mb-4">🏁</div>
                  <p>No race recordings available</p>
                  <p className="text-sm mt-2">Start recording a race or load a sample recording to begin</p>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={startRecording}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-medium transition-colors"
                  >
                    Start Recording
                  </button>
                  <button
                    onClick={loadSampleRecording}
                    className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-medium transition-colors"
                  >
                    Load Sample Race
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{recording.name}</h3>
                        <div className="text-sm text-gray-400 mt-1">
                          {new Date(recording.date).toLocaleDateString()} • {recording.trackInfo.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {recording.participants.length} participants • {Math.floor(recording.duration / 60000)}:{((recording.duration % 60000) / 1000).toFixed(0).padStart(2, '0')} duration
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRecording(recording.id)}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors"
                        >
                          ▶ Play
                        </button>
                        
                        <button
                          onClick={() => exportRecording(recording.id)}
                          className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded transition-colors"
                          title="Export recording"
                        >
                          💾
                        </button>
                        
                        <button
                          onClick={() => deleteRecording(recording.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors"
                          title="Delete recording"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    
                    {/* Participant List */}
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="text-xs text-gray-500 mb-2">Participants:</div>
                      <div className="flex flex-wrap gap-2">
                        {recording.participants.map((participant) => (
                          <div
                            key={participant.id}
                            className="bg-gray-600 px-2 py-1 rounded text-xs"
                          >
                            {participant.name} - {participant.finalPosition}{getPositionSuffix(participant.finalPosition)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import/Export Modal */}
      {showImportExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Import Recording</h3>
              <button
                onClick={() => setShowImportExport(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Recording JSON Data:
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste recording JSON data here..."
                  className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-sm font-mono"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={importRecording}
                  disabled={!importData.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition-colors"
                >
                  Import
                </button>
                
                <button
                  onClick={() => setShowImportExport(false)}
                  className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">How to Use Race Replay</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">🎥 Video Controls</h4>
              <ul className="space-y-1">
                <li>• Play/Pause with spacebar or ▶ button</li>
                <li>• Seek with arrow keys or progress bar</li>
                <li>• Adjust playback speed (0.25x - 4x)</li>
                <li>• Jump to specific laps</li>
                <li>• Enable loop mode for continuous playback</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">📊 Analysis Features</h4>
              <ul className="space-y-1">
                <li>• Real-time position tracking</li>
                <li>• Performance statistics and metrics</li>
                <li>• Key moments detection (overtakes, finishes)</li>
                <li>• Participant comparison and focus</li>
                <li>• Export/import recordings for sharing</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="font-medium text-white mb-2">⌨️ Keyboard Shortcuts</h4>
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span>Space: Play/Pause</span>
              <span>←→: Seek</span>
              <span>↑↓: Speed</span>
              <span>F: Loop</span>
              <span>M: Mute</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getPositionSuffix(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return suffix;
}
