/**
 * Race Replay Service
 * 
 * Manages race data recording, playback, and analysis
 * Provides video-like controls for reviewing past races
 */

export interface RaceDataPoint {
  timestamp: number;
  participantId: string;
  position: {
    lat: number;
    lng: number;
  };
  speed: number;
  heading: number;
  accuracy: number;
  status: 'active' | 'finished' | 'disqualified' | 'dnf';
  lap: number;
  lapTime: number;
  totalDistance: number;
  antiCheatRisk?: number;
}

export interface RaceRecording {
  id: string;
  name: string;
  date: number;
  duration: number;
  trackInfo: {
    name: string;
    totalDistance: number;
    totalLaps: number;
    centerLat: number;
    centerLng: number;
  };
  participants: Array<{
    id: string;
    name: string;
    vehicle: string;
    finalPosition: number;
    finalTime: number;
    status: 'finished' | 'disqualified' | 'dnf';
  }>;
  dataPoints: RaceDataPoint[];
  metadata: {
    recordedBy: string;
    version: string;
    compression: boolean;
  };
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  currentLap: number;
  focusedParticipant: string | null;
}

export interface ReplayControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  jumpToLap: (lap: number) => void;
  focusParticipant: (participantId: string) => void;
  clearFocus: () => void;
  toggleLoop: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

export interface ReplayAnalysis {
  participantStats: Map<string, {
    avgSpeed: number;
    maxSpeed: number;
    minSpeed: number;
    avgLapTime: number;
    bestLapTime: number;
    totalDistance: number;
    overtakes: number;
    timeLost: number;
    timeGained: number;
  }>;
  keyMoments: Array<{
    timestamp: number;
    type: 'overtake' | 'crash' | 'finish' | 'disqualification' | 'best_lap';
    description: string;
    participantId: string;
    data: any;
  }>;
  raceStatistics: {
    totalOvertakes: number;
    avgSpeed: number;
    fastestLap: {
      participantId: string;
      time: number;
      lap: number;
    };
    closestFinish: {
      gap: number;
      participants: [string, string];
    };
  };
}

export class RaceReplayService {
  private recordings: Map<string, RaceRecording> = new Map();
  private currentRecording: RaceRecording | null = null;
  private playbackState: PlaybackState;
  private animationFrameId: number | null = null;
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();
  private lastUpdateTime = 0;

  constructor() {
    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackSpeed: 1,
      volume: 1,
      isMuted: false,
      isLooping: false,
      currentLap: 1,
      focusedParticipant: null
    };
  }

  /**
   * Start recording a race
   */
  startRecording(raceId: string, raceInfo: any): void {
    const recording: RaceRecording = {
      id: raceId,
      name: raceInfo.name || `Race ${new Date().toLocaleDateString()}`,
      date: Date.now(),
      duration: 0,
      trackInfo: {
        name: raceInfo.trackName || 'Unknown Track',
        totalDistance: raceInfo.totalDistance || 0,
        totalLaps: raceInfo.totalLaps || 0,
        centerLat: raceInfo.centerLat || 0,
        centerLng: raceInfo.centerLng || 0
      },
      participants: [],
      dataPoints: [],
      metadata: {
        recordedBy: 'system',
        version: '1.0',
        compression: false
      }
    };

    this.recordings.set(raceId, recording);
    this.currentRecording = recording;
    this.lastUpdateTime = Date.now();
  }

  /**
   * Add data point to current recording
   */
  addDataPoint(dataPoint: Omit<RaceDataPoint, 'timestamp'>): void {
    if (!this.currentRecording) return;

    const point: RaceDataPoint = {
      ...dataPoint,
      timestamp: Date.now() - this.currentRecording.date
    };

    this.currentRecording.dataPoints.push(point);
    
    // Update duration
    this.currentRecording.duration = point.timestamp;
  }

  /**
   * Update participant information
   */
  updateParticipant(participantId: string, info: any): void {
    if (!this.currentRecording) return;

    const existingIndex = this.currentRecording.participants.findIndex(p => p.id === participantId);
    const participantInfo = {
      id: participantId,
      name: info.name || 'Unknown',
      vehicle: info.vehicle || 'car',
      finalPosition: info.finalPosition || 0,
      finalTime: info.finalTime || 0,
      status: info.status || 'finished'
    };

    if (existingIndex >= 0) {
      this.currentRecording.participants[existingIndex] = participantInfo;
    } else {
      this.currentRecording.participants.push(participantInfo);
    }
  }

  /**
   * Stop recording and save
   */
  stopRecording(): RaceRecording | null {
    if (!this.currentRecording) return null;

    const recording = { ...this.currentRecording };
    
    // Sort data points by timestamp
    recording.dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    
    // Compress data if needed (remove redundant points)
    if (recording.metadata.compression) {
      recording.dataPoints = this.compressDataPoints(recording.dataPoints);
    }

    this.currentRecording = null;
    return recording;
  }

  /**
   * Load a recording for playback
   */
  loadRecording(recordingId: string): boolean {
    const recording = this.recordings.get(recordingId);
    if (!recording) return false;

    this.currentRecording = recording;
    this.playbackState.duration = recording.duration;
    this.playbackState.currentTime = 0;
    this.playbackState.currentLap = 1;
    this.playbackState.focusedParticipant = null;

    this.emit('recording_loaded', { recording });
    return true;
  }

  /**
   * Get all recordings
   */
  getRecordings(): RaceRecording[] {
    return Array.from(this.recordings.values()).sort((a, b) => b.date - a.date);
  }

  /**
   * Get current recording
   */
  getCurrentRecording(): RaceRecording | null {
    return this.currentRecording;
  }

  /**
   * Get playback state
   */
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Get playback controls
   */
  getControls(): ReplayControls {
    return {
      play: () => this.play(),
      pause: () => this.pause(),
      stop: () => this.stop(),
      seek: (time: number) => this.seek(time),
      setPlaybackSpeed: (speed: number) => this.setPlaybackSpeed(speed),
      jumpToLap: (lap: number) => this.jumpToLap(lap),
      focusParticipant: (id: string) => this.focusParticipant(id),
      clearFocus: () => this.clearFocus(),
      toggleLoop: () => this.toggleLoop(),
      setVolume: (volume: number) => this.setVolume(volume),
      toggleMute: () => this.toggleMute()
    };
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.currentRecording || this.playbackState.isPlaying) return;

    this.playbackState.isPlaying = true;
    this.startAnimationLoop();
    this.emit('playback_started', { state: this.playbackState });
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.playbackState.isPlaying) return;

    this.playbackState.isPlaying = false;
    this.stopAnimationLoop();
    this.emit('playback_paused', { state: this.playbackState });
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.pause();
    this.playbackState.currentTime = 0;
    this.playbackState.currentLap = 1;
    this.emit('playback_stopped', { state: this.playbackState });
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (!this.currentRecording) return;

    this.playbackState.currentTime = Math.max(0, Math.min(time, this.playbackState.duration));
    this.updateCurrentLap();
    this.emit('playback_seeked', { state: this.playbackState });
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed: number): void {
    this.playbackState.playbackSpeed = Math.max(0.25, Math.min(speed, 4));
    this.emit('playback_speed_changed', { speed: this.playbackState.playbackSpeed });
  }

  /**
   * Jump to specific lap
   */
  jumpToLap(lap: number): void {
    if (!this.currentRecording) return;

    const lapDataPoints = this.currentRecording.dataPoints.filter(p => p.lap === lap);
    if (lapDataPoints.length > 0) {
      this.seek(lapDataPoints[0].timestamp);
    }
  }

  /**
   * Focus on specific participant
   */
  focusParticipant(participantId: string): void {
    this.playbackState.focusedParticipant = participantId;
    this.emit('participant_focused', { participantId });
  }

  /**
   * Clear participant focus
   */
  clearFocus(): void {
    this.playbackState.focusedParticipant = null;
    this.emit('participant_focus_cleared');
  }

  /**
   * Toggle loop mode
   */
  toggleLoop(): void {
    this.playbackState.isLooping = !this.playbackState.isLooping;
    this.emit('loop_toggled', { isLooping: this.playbackState.isLooping });
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.playbackState.volume = Math.max(0, Math.min(volume, 1));
    this.emit('volume_changed', { volume: this.playbackState.volume });
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.playbackState.isMuted = !this.playbackState.isMuted;
    this.emit('mute_toggled', { isMuted: this.playbackState.isMuted });
  }

  /**
   * Get current frame data
   */
  getCurrentFrame(): RaceDataPoint[] {
    if (!this.currentRecording) return [];

    const currentTime = this.playbackState.currentTime;
    return this.currentRecording.dataPoints.filter(point => 
      point.timestamp <= currentTime
    );
  }

  /**
   * Get participant position at current time
   */
  getParticipantPosition(participantId: string, time?: number): RaceDataPoint | null {
    if (!this.currentRecording) return null;

    const searchTime = time ?? this.playbackState.currentTime;
    const participantData = this.currentRecording.dataPoints
      .filter(point => point.participantId === participantId)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Find the last data point before or at the search time
    for (let i = participantData.length - 1; i >= 0; i--) {
      if (participantData[i].timestamp <= searchTime) {
        return participantData[i];
      }
    }

    return null;
  }

  /**
   * Get all participant positions at current time
   */
  getAllParticipantPositions(time?: number): Map<string, RaceDataPoint> {
    if (!this.currentRecording) return new Map();

    const searchTime = time ?? this.playbackState.currentTime;
    const positions = new Map<string, RaceDataPoint>();

    this.currentRecording.participants.forEach(participant => {
      const position = this.getParticipantPosition(participant.id, searchTime);
      if (position) {
        positions.set(participant.id, position);
      }
    });

    return positions;
  }

  /**
   * Analyze race performance
   */
  analyzeRace(): ReplayAnalysis {
    if (!this.currentRecording) {
      return {
        participantStats: new Map(),
        keyMoments: [],
        raceStatistics: {
          totalOvertakes: 0,
          avgSpeed: 0,
          fastestLap: { participantId: '', time: 0, lap: 0 },
          closestFinish: { gap: 0, participants: ['', ''] }
        }
      };
    }

    const participantStats = new Map();
    const keyMoments: any[] = [];
    let totalOvertakes = 0;
    let totalSpeed = 0;
    let speedCount = 0;
    let fastestLap = { participantId: '', time: Infinity, lap: 0 };

    // Calculate statistics for each participant
    this.currentRecording.participants.forEach(participant => {
      const participantData = this.currentRecording!.dataPoints
        .filter(point => point.participantId === participant.id)
        .sort((a, b) => a.timestamp - b.timestamp);

      if (participantData.length === 0) return;

      const speeds = participantData.map(p => p.speed);
      const lapTimes = this.calculateLapTimes(participantData);
      
      const stats = {
        avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        maxSpeed: Math.max(...speeds),
        minSpeed: Math.min(...speeds),
        avgLapTime: lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length,
        bestLapTime: Math.min(...lapTimes),
        totalDistance: participantData[participantData.length - 1].totalDistance,
        overtakes: this.calculateOvertakes(participantData),
        timeLost: 0,
        timeGained: 0
      };

      participantStats.set(participant.id, stats);
      
      // Track fastest lap
      if (stats.bestLapTime < fastestLap.time) {
        fastestLap = {
          participantId: participant.id,
          time: stats.bestLapTime,
          lap: lapTimes.indexOf(stats.bestLapTime) + 1
        };
      }

      totalSpeed += stats.avgSpeed;
      speedCount++;
      totalOvertakes += stats.overtakes;

      // Detect key moments
      this.detectKeyMoments(participantData, keyMoments);
    });

    // Calculate closest finish
    const closestFinish = this.calculateClosestFinish();

    return {
      participantStats,
      keyMoments,
      raceStatistics: {
        totalOvertakes,
        avgSpeed: speedCount > 0 ? totalSpeed / speedCount : 0,
        fastestLap,
        closestFinish
      }
    };
  }

  /**
   * Export recording to JSON
   */
  exportRecording(recordingId: string): string | null {
    const recording = this.recordings.get(recordingId);
    if (!recording) return null;

    return JSON.stringify(recording, null, 2);
  }

  /**
   * Import recording from JSON
   */
  importRecording(jsonData: string): boolean {
    try {
      const recording: RaceRecording = JSON.parse(jsonData);
      
      // Validate recording structure
      if (!this.validateRecording(recording)) {
        return false;
      }

      this.recordings.set(recording.id, recording);
      this.emit('recording_imported', { recording });
      return true;
    } catch (error) {
      console.error('Failed to import recording:', error);
      return false;
    }
  }

  /**
   * Delete recording
   */
  deleteRecording(recordingId: string): boolean {
    const deleted = this.recordings.delete(recordingId);
    if (deleted) {
      this.emit('recording_deleted', { recordingId });
    }
    return deleted;
  }

  // Private methods

  private startAnimationLoop(): void {
    const animate = () => {
      if (!this.playbackState.isPlaying) return;

      const deltaTime = 16.67 * this.playbackState.playbackSpeed; // 60fps adjusted by playback speed
      this.playbackState.currentTime += deltaTime;

      // Check for loop
      if (this.playbackState.currentTime >= this.playbackState.duration) {
        if (this.playbackState.isLooping) {
          this.playbackState.currentTime = 0;
        } else {
          this.pause();
          this.playbackState.currentTime = this.playbackState.duration;
        }
      }

      this.updateCurrentLap();
      this.emit('playback_updated', { state: this.playbackState });

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private stopAnimationLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateCurrentLap(): void {
    if (!this.currentRecording) return;

    const currentData = this.getAllParticipantPositions();
    if (currentData.size > 0) {
      const firstParticipant = currentData.values().next().value;
      this.playbackState.currentLap = Math.max(1, firstParticipant.lap);
    }
  }

  private compressDataPoints(dataPoints: RaceDataPoint[]): RaceDataPoint[] {
    const compressed: RaceDataPoint[] = [];
    const minInterval = 100; // Minimum interval between points in ms
    
    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      
      // Always include first point
      if (i === 0) {
        compressed.push(point);
        continue;
      }
      
      // Include point if enough time has passed or if significant change occurred
      const lastPoint = compressed[compressed.length - 1];
      const timeDiff = point.timestamp - lastPoint.timestamp;
      const distance = this.calculateDistance(lastPoint.position, point.position);
      
      if (timeDiff >= minInterval || distance > 10) {
        compressed.push(point);
      }
    }
    
    return compressed;
  }

  private calculateDistance(pos1: any, pos2: any): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (pos1.lat * Math.PI) / 180;
    const φ2 = (pos2.lat * Math.PI) / 180;
    const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private calculateLapTimes(dataPoints: RaceDataPoint[]): number[] {
    const lapTimes: number[] = [];
    let currentLap = 1;
    let lapStartTime = 0;

    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      
      if (point.lap > currentLap) {
        // Completed a lap
        const lapTime = point.timestamp - lapStartTime;
        lapTimes.push(lapTime);
        
        currentLap = point.lap;
        lapStartTime = point.timestamp;
      }
    }

    return lapTimes;
  }

  private calculateOvertakes(dataPoints: RaceDataPoint[]): number {
    let overtakes = 0;
    const positions = new Map<string, number>();

    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      const oldPosition = positions.get(point.participantId);
      
      // Simplified overtake detection (would need more sophisticated logic in production)
      if (oldPosition && oldPosition > point.position) {
        overtakes++;
      }
      
      positions.set(point.participantId, point.position);
    }

    return overtakes;
  }

  private detectKeyMoments(dataPoints: RaceDataPoint[], keyMoments: any[]): void {
    // Detect overtakes, crashes, finishes, etc.
    // This is a simplified version - production would have more sophisticated detection
    for (let i = 1; i < dataPoints.length; i++) {
      const prev = dataPoints[i - 1];
      const curr = dataPoints[i];
      
      // Detect finish
      if (curr.status === 'finished' && prev.status !== 'finished') {
        keyMoments.push({
          timestamp: curr.timestamp,
          type: 'finish',
          description: `${curr.participantId} finished the race`,
          participantId: curr.participantId,
          data: { position: curr.position, time: curr.timestamp }
        });
      }
      
      // Detect disqualification
      if (curr.status === 'disqualified' && prev.status !== 'disqualified') {
        keyMoments.push({
          timestamp: curr.timestamp,
          type: 'disqualification',
          description: `${curr.participantId} was disqualified`,
          participantId: curr.participantId,
          data: { reason: 'Anti-cheat detection' }
        });
      }
    }
  }

  private calculateClosestFinish(): { gap: number; participants: [string, string] } {
    // Find the closest finish between two participants
    let closestGap = Infinity;
    let closestParticipants: [string, string] = ['', ''];

    const finishedParticipants = this.currentRecording!.participants
      .filter(p => p.status === 'finished')
      .sort((a, b) => a.finalTime - b.finalTime);

    for (let i = 0; i < finishedParticipants.length - 1; i++) {
      const gap = finishedParticipants[i + 1].finalTime - finishedParticipants[i].finalTime;
      if (gap < closestGap) {
        closestGap = gap;
        closestParticipants = [finishedParticipants[i].id, finishedParticipants[i + 1].id];
      }
    }

    return { gap: closestGap, participants: closestParticipants };
  }

  private validateRecording(recording: any): boolean {
    return (
      recording &&
      typeof recording.id === 'string' &&
      typeof recording.name === 'string' &&
      Array.isArray(recording.dataPoints) &&
      Array.isArray(recording.participants) &&
      typeof recording.trackInfo === 'object'
    );
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  public on(eventType: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public off(eventType: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Singleton instance
let raceReplayService: RaceReplayService | null = null;

export function getRaceReplayService(): RaceReplayService {
  if (!raceReplayService) {
    raceReplayService = new RaceReplayService();
  }
  return raceReplayService;
}
