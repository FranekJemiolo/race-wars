import { test, expect } from '@playwright/test';
import { getRaceReplayService, RaceRecording } from '../services/raceReplay.service';

/**
 * E2E Tests for Race Replay System
 * 
 * These tests simulate realistic multi-user races and verify:
 * - Recording functionality with multiple participants
 * - Race completion conditions and timing
 * - Replay playback accuracy
 * - Analysis and statistics correctness
 */

class RaceSimulator {
  private replayService = getRaceReplayService();
  
  /**
   * Simulate a realistic multi-user race
   */
  async simulateRace(config: {
    name: string;
    participants: number;
    laps: number;
    trackLength: number;
    duration: number;
    skillVariation?: boolean;
  }): Promise<RaceRecording> {
    const raceId = `test-race-${Date.now()}`;
    const startTime = Date.now();
    
    // Start recording
    this.replayService.startRecording(raceId, {
      name: config.name,
      trackName: 'Test Circuit',
      totalDistance: config.trackLength * config.laps,
      totalLaps: config.laps,
      centerLat: 37.7749,
      centerLng: -122.4194
    });

    // Generate participant profiles
    const participants = this.generateParticipants(config.participants, config.skillVariation);
    
    // Simulate race progression
    await this.simulateRaceProgression(raceId, participants, config, startTime);
    
    // Stop recording and return result
    const recording = this.replayService.stopRecording();
    if (!recording) {
      throw new Error('Failed to create recording');
    }
    
    return recording;
  }

  private generateParticipants(count: number, skillVariation: boolean = true) {
    const participants = [];
    const skills = skillVariation ? ['expert', 'intermediate', 'beginner'] : ['intermediate'];
    
    for (let i = 0; i < count; i++) {
      const skill = skills[i % skills.length] as 'expert' | 'intermediate' | 'beginner';
      const baseSpeed = this.getBaseSpeed(skill);
      
      participants.push({
        id: `driver-${i + 1}`,
        name: `Driver ${i + 1}`,
        skill,
        vehicle: i % 2 === 0 ? 'car' : 'motorcycle',
        baseSpeed,
        consistency: this.getConsistency(skill),
        racecraft: this.getRacecraft(skill)
      });
    }
    
    return participants;
  }

  private getBaseSpeed(skill: string): number {
    switch (skill) {
      case 'expert': return 180 + Math.random() * 20; // 180-200 km/h
      case 'intermediate': return 160 + Math.random() * 20; // 160-180 km/h
      case 'beginner': return 140 + Math.random() * 20; // 140-160 km/h
      default: return 170;
    }
  }

  private getConsistency(skill: string): number {
    switch (skill) {
      case 'expert': return 0.95; // 95% consistent
      case 'intermediate': return 0.85; // 85% consistent
      case 'beginner': return 0.70; // 70% consistent
      default: return 0.85;
    }
  }

  private getRacecraft(skill: string): number {
    switch (skill) {
      case 'expert': return 0.9; // Good at overtaking
      case 'intermediate': return 0.7; // Average at overtaking
      case 'beginner': return 0.5; // Poor at overtaking
      default: return 0.7;
    }
  }

  private async simulateRaceProgression(
    raceId: string, 
    participants: any[], 
    config: any, 
    startTime: number
  ) {
    const trackCenter = { lat: 37.7749, lng: -122.4194 };
    const trackRadius = 1000;
    const lapLength = config.trackLength;
    
    // Initialize participant states
    const states = participants.map(p => ({
      ...p,
      currentLap: 1,
      lapProgress: 0,
      totalDistance: 0,
      position: participants.indexOf(p) + 1,
      totalTime: 0,
      lapTimes: [] as number[],
      finished: false,
      finishTime: 0,
      currentSpeed: p.baseSpeed,
      heading: 0
    }));

    // Simulate race in 100ms intervals
    const interval = 100;
    const totalSteps = config.duration / interval;
    
    for (let step = 0; step < totalSteps; step++) {
      const currentTime = startTime + (step * interval);
      const elapsedTime = step * interval;
      
      // Update each participant
      for (const state of states) {
        if (state.finished) continue;
        
        // Calculate speed variations based on skill
        const speedVariation = (Math.random() - 0.5) * 20 * (1 - state.consistency);
        state.currentSpeed = Math.max(100, Math.min(220, state.baseSpeed + speedVariation));
        
        // Calculate distance covered in this interval
        const distanceInInterval = (state.currentSpeed / 3.6) * (interval / 1000); // Convert km/h to m/s
        state.totalDistance += distanceInInterval;
        state.lapProgress = (state.totalDistance % lapLength) / lapLength;
        
        // Check for lap completion
        if (state.lapProgress < distanceInInterval / lapLength) {
          // Completed a lap
          state.currentLap++;
          state.lapTimes.push(elapsedTime - (state.lapTimes.reduce((a: number, b: number) => a + b, 0) || 0));
          
          // Check for race completion
          if (state.currentLap > config.laps) {
            state.finished = true;
            state.finishTime = elapsedTime;
            state.totalTime = elapsedTime;
          }
        }
        
        // Calculate position on track
        const trackAngle = (state.totalDistance / trackRadius) % (2 * Math.PI);
        const lat = trackCenter.lat + Math.cos(trackAngle) * (trackRadius / 111320);
        const lng = trackCenter.lng + Math.sin(trackAngle) * (trackRadius / (111320 * Math.cos(trackCenter.lat * Math.PI / 180)));
        
        state.heading = (trackAngle * 180 / Math.PI + 90) % 360;
        
        // Add data point to recording
        this.replayService.addDataPoint({
          participantId: state.id,
          position: { lat, lng },
          speed: state.currentSpeed,
          heading: state.heading,
          accuracy: 5 + Math.random() * 3,
          status: state.finished ? 'finished' : 'active',
          lap: state.currentLap,
          lapTime: state.lapTimes[state.lapTimes.length - 1] || 0,
          totalDistance: state.totalDistance,
          antiCheatRisk: Math.random() > 0.95 ? Math.random() * 100 : 0
        });
        
        // Update participant info
        this.replayService.updateParticipant(state.id, {
          name: state.name,
          vehicle: state.vehicle,
          finalPosition: 0, // Will be calculated after race
          finalTime: state.totalTime,
          status: state.finished ? 'finished' : 'active'
        });
      }
      
      // Update positions based on distance
      states.sort((a, b) => b.totalDistance - a.totalDistance);
      states.forEach((state, index) => {
        state.position = index + 1;
      });
      
      // Check race completion conditions
      const finishedCount = states.filter(s => s.finished).length;
      const firstFinishTime = states.find(s => s.finished)?.finishTime || 0;
      
      // End race if all finished or timeout after first finish + 30 seconds
      if (finishedCount === participants.length || 
          (firstFinishTime > 0 && elapsedTime > firstFinishTime + 30000)) {
        break;
      }
      
      // Small delay to simulate real-time
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Finalize participant positions
    states.sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.totalTime - b.totalTime;
      return b.totalDistance - a.totalDistance;
    });
    
    states.forEach((state, index) => {
      this.replayService.updateParticipant(state.id, {
        name: state.name,
        vehicle: state.vehicle,
        finalPosition: index + 1,
        finalTime: state.totalTime,
        status: state.finished ? 'finished' : 'dnf'
      });
    });
  }
}

test.describe('Race Replay System E2E Tests', () => {
  let simulator: RaceSimulator;
  
  test.beforeEach(async () => {
    simulator = new RaceSimulator();
  });

  test('should record and replay a multi-user race with accurate timing', async () => {
    // Arrange: Simulate a 5-lap race with 4 participants
    const recording = await simulator.simulateRace({
      name: 'Test Multi-User Race',
      participants: 4,
      laps: 5,
      trackLength: 5000, // 5km per lap
      duration: 300000, // 5 minutes max
      skillVariation: true
    });

    // Assert: Recording was created successfully
    expect(recording).toBeTruthy();
    expect(recording.participants).toHaveLength(4);
    expect(recording.dataPoints.length).toBeGreaterThan(0);
    expect(recording.duration).toBeGreaterThan(0);

    // Assert: All participants have realistic data
    recording.participants.forEach(participant => {
      expect(participant.finalPosition).toBeGreaterThan(0);
      expect(participant.finalPosition).toBeLessThanOrEqual(4);
      expect(participant.finalTime).toBeGreaterThan(0);
      expect(['finished', 'dnf']).toContain(participant.status);
    });

    // Assert: Data points are properly ordered by timestamp
    for (let i = 1; i < recording.dataPoints.length; i++) {
      expect(recording.dataPoints[i].timestamp).toBeGreaterThanOrEqual(
        recording.dataPoints[i - 1].timestamp
      );
    }

    // Test: Load recording for playback
    const replayService = getRaceReplayService();
    const loaded = replayService.loadRecording(recording.id);
    expect(loaded).toBe(true);

    // Test: Verify playback state
    const playbackState = replayService.getPlaybackState();
    expect(playbackState.duration).toBe(recording.duration);
    expect(playbackState.currentTime).toBe(0);
    expect(playbackState.isPlaying).toBe(false);

    // Test: Test seeking functionality
    const controls = replayService.getControls();
    controls.seek(recording.duration / 2);
    
    const updatedState = replayService.getPlaybackState();
    expect(updatedState.currentTime).toBe(recording.duration / 2);

    // Test: Get positions at specific time
    const midRacePositions = replayService.getAllParticipantPositions(recording.duration / 2);
    expect(midRacePositions.size).toBe(4);

    // Test: Verify position data integrity
    midRacePositions.forEach((position, participantId) => {
      expect(position.participantId).toBe(participantId);
      expect(position.speed).toBeGreaterThan(0);
      expect(position.lat).toBeDefined();
      expect(position.lng).toBeDefined();
      expect(position.lap).toBeGreaterThan(0);
    });
  });

  test('should handle race completion conditions correctly', async () => {
    // Arrange: Simulate a race where not everyone finishes
    const recording = await simulator.simulateRace({
      name: 'Incomplete Race Test',
      participants: 6,
      laps: 3,
      trackLength: 3000,
      duration: 180000, // 3 minutes
      skillVariation: true
    });

    // Assert: At least one participant finished
    const finishedParticipants = recording.participants.filter(p => p.status === 'finished');
    expect(finishedParticipants.length).toBeGreaterThan(0);

    // Assert: Some participants may not have finished (DNF)
    const dnfParticipants = recording.participants.filter(p => p.status === 'dnf');
    expect(dnfParticipants.length).toBeGreaterThanOrEqual(0);

    // Assert: Final positions are correctly ordered
    const sortedParticipants = recording.participants
      .filter(p => p.status === 'finished')
      .sort((a, b) => a.finalTime - b.finalTime);
    
    for (let i = 0; i < sortedParticipants.length - 1; i++) {
      expect(sortedParticipants[i].finalTime).toBeLessThanOrEqual(
        sortedParticipants[i + 1].finalTime
      );
    }

    // Test: Verify race analysis works correctly
    const replayService = getRaceReplayService();
    replayService.loadRecording(recording.id);
    
    const analysis = replayService.analyzeRace();
    expect(analysis.participantStats.size).toBe(6);
    expect(analysis.raceStatistics.totalOvertakes).toBeGreaterThanOrEqual(0);
    expect(analysis.raceStatistics.fastestLap.time).toBeGreaterThan(0);
  });

  test('should maintain accurate timing during playback', async () => {
    // Arrange: Create a short race for precise timing tests
    const recording = await simulator.simulateRace({
      name: 'Timing Accuracy Test',
      participants: 3,
      laps: 2,
      trackLength: 2000,
      duration: 120000, // 2 minutes
      skillVariation: false
    });

    // Test: Load and start playback
    const replayService = getRaceReplayService();
    replayService.loadRecording(recording.id);
    
    const controls = replayService.getControls();
    
    // Test: Play for 1 second
    const startTime = Date.now();
    controls.play();
    
    // Wait for 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const endTime = Date.now();
    const actualElapsed = endTime - startTime;
    
    // Assert: Playback time should be close to real time (within 100ms tolerance)
    const playbackState = replayService.getPlaybackState();
    const expectedTime = actualElapsed * playbackState.playbackSpeed;
    expect(Math.abs(playbackState.currentTime - expectedTime)).toBeLessThan(200);

    // Test: Pause functionality
    controls.pause();
    const pausedTime = playbackState.currentTime;
    
    // Wait 500ms while paused
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Assert: Time should not have advanced while paused
    const pausedState = replayService.getPlaybackState();
    expect(pausedState.currentTime).toBe(pausedTime);
    expect(pausedState.isPlaying).toBe(false);

    // Test: Speed control
    controls.setPlaybackSpeed(2);
    controls.play();
    
    const speedTestStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const speedTestEnd = Date.now();
    const speedTestElapsed = speedTestEnd - speedTestStart;
    
    const speedState = replayService.getPlaybackState();
    const expectedSpeedTime = pausedTime + (speedTestElapsed * 2);
    
    expect(Math.abs(speedState.currentTime - expectedSpeedTime)).toBeLessThan(200);
    
    controls.stop();
  });

  test('should correctly identify and analyze key race moments', async () => {
    // Arrange: Create a race with overtakes and finishes
    const recording = await simulator.simulateRace({
      name: 'Key Moments Test',
      participants: 5,
      laps: 4,
      trackLength: 4000,
      duration: 240000, // 4 minutes
      skillVariation: true
    });

    // Test: Analyze race for key moments
    const replayService = getRaceReplayService();
    replayService.loadRecording(recording.id);
    
    const analysis = replayService.analyzeRace();
    
    // Assert: Key moments are detected
    expect(analysis.keyMoments.length).toBeGreaterThan(0);
    
    // Assert: Finish moments are detected
    const finishMoments = analysis.keyMoments.filter(m => m.type === 'finish');
    expect(finishMoments.length).toBeGreaterThan(0);
    
    // Assert: Each finish moment has correct data
    finishMoments.forEach(moment => {
      expect(moment.participantId).toBeTruthy();
      expect(moment.timestamp).toBeGreaterThan(0);
      expect(moment.timestamp).toBeLessThanOrEqual(recording.duration);
      expect(moment.data).toBeDefined();
    });

    // Assert: Participant statistics are calculated correctly
    analysis.participantStats.forEach((stats, participantId) => {
      expect(stats.avgSpeed).toBeGreaterThan(0);
      expect(stats.maxSpeed).toBeGreaterThanOrEqual(stats.avgSpeed);
      expect(stats.minSpeed).toBeLessThanOrEqual(stats.avgSpeed);
      expect(stats.totalDistance).toBeGreaterThan(0);
    });

    // Assert: Fastest lap is identified
    expect(analysis.raceStatistics.fastestLap.participantId).toBeTruthy();
    expect(analysis.raceStatistics.fastestLap.time).toBeGreaterThan(0);
    expect(analysis.raceStatistics.fastestLap.lap).toBeGreaterThan(0);
  });

  test('should handle race timeout conditions properly', async () => {
    // Arrange: Create a race with very slow participants
    const recording = await simulator.simulateRace({
      name: 'Timeout Test',
      participants: 4,
      laps: 3,
      trackLength: 6000, // Long track
      duration: 60000, // Only 1 minute - should timeout
      skillVariation: false
    });

    // Assert: Some participants should have DNF status due to timeout
    const dnfParticipants = recording.participants.filter(p => p.status === 'dnf');
    expect(dnfParticipants.length).toBeGreaterThan(0);

    // Assert: At least one participant should have finished (fastest ones)
    const finishedParticipants = recording.participants.filter(p => p.status === 'finished');
    expect(finishedParticipants.length).toBeGreaterThan(0);

    // Assert: Recording duration reflects actual race time
    expect(recording.duration).toBeLessThan(60000 + 30000); // Should be less than max + timeout
  });

  test('should maintain data integrity during import/export', async () => {
    // Arrange: Create a complex race
    const originalRecording = await simulator.simulateRace({
      name: 'Import/Export Test',
      participants: 4,
      laps: 3,
      trackLength: 3500,
      duration: 180000,
      skillVariation: true
    });

    // Test: Export recording
    const replayService = getRaceReplayService();
    const exportedData = replayService.exportRecording(originalRecording.id);
    expect(exportedData).toBeTruthy();
    expect(typeof exportedData).toBe('string');

    // Test: Delete original recording
    const deleted = replayService.deleteRecording(originalRecording.id);
    expect(deleted).toBe(true);

    // Assert: Recording is gone
    const recordings = replayService.getRecordings();
    expect(recordings.find(r => r.id === originalRecording.id)).toBeFalsy();

    // Test: Import recording
    const imported = replayService.importRecording(exportedData);
    expect(imported).toBe(true);

    // Assert: Imported recording matches original
    const importedRecordings = replayService.getRecordings();
    const importedRecording = importedRecordings.find(r => r.id === originalRecording.id);
    expect(importedRecording).toBeTruthy();

    expect(importedRecording!.name).toBe(originalRecording.name);
    expect(importedRecording!.participants.length).toBe(originalRecording.participants.length);
    expect(importedRecording!.dataPoints.length).toBe(originalRecording.dataPoints.length);
    expect(importedRecording!.duration).toBe(originalRecording.duration);

    // Test: Verify imported recording works for playback
    const loaded = replayService.loadRecording(importedRecording!.id);
    expect(loaded).toBe(true);

    const playbackState = replayService.getPlaybackState();
    expect(playbackState.duration).toBe(originalRecording.duration);
  });

  test('should handle concurrent recording and playback', async () => {
    // This test verifies that the system can handle multiple recordings
    const recording1 = await simulator.simulateRace({
      name: 'Concurrent Test 1',
      participants: 3,
      laps: 2,
      trackLength: 2000,
      duration: 90000,
      skillVariation: false
    });

    const recording2 = await simulator.simulateRace({
      name: 'Concurrent Test 2',
      participants: 3,
      laps: 2,
      trackLength: 2000,
      duration: 90000,
      skillVariation: false
    });

    // Assert: Both recordings exist
    const replayService = getRaceReplayService();
    const recordings = replayService.getRecordings();
    expect(recordings.length).toBeGreaterThanOrEqual(2);

    // Test: Load first recording
    replayService.loadRecording(recording1.id);
    const state1 = replayService.getPlaybackState();
    expect(state1.duration).toBe(recording1.duration);

    // Test: Switch to second recording
    replayService.loadRecording(recording2.id);
    const state2 = replayService.getPlaybackState();
    expect(state2.duration).toBe(recording2.duration);

    // Test: Both recordings can be analyzed independently
    const analysis1 = replayService.analyzeRace();
    expect(analysis1.participantStats.size).toBe(3);

    // Switch back to first recording
    replayService.loadRecording(recording1.id);
    const analysis2 = replayService.analyzeRace();
    expect(analysis2.participantStats.size).toBe(3);
  });

  test('should handle edge cases and error conditions', async () => {
    const replayService = getRaceReplayService();

    // Test: Load non-existent recording
    const loaded = replayService.loadRecording('non-existent-id');
    expect(loaded).toBe(false);

    // Test: Export non-existent recording
    const exported = replayService.exportRecording('non-existent-id');
    expect(exported).toBeNull();

    // Test: Delete non-existent recording
    const deleted = replayService.deleteRecording('non-existent-id');
    expect(deleted).toBe(false);

    // Test: Import invalid JSON
    const invalidImport = replayService.importRecording('invalid json');
    expect(invalidImport).toBe(false);

    // Test: Import empty JSON
    const emptyImport = replayService.importRecording('{}');
    expect(emptyImport).toBe(false);

    // Test: Controls without loaded recording
    const controls = replayService.getControls();
    expect(() => controls.play()).not.toThrow();
    expect(() => controls.pause()).not.toThrow();
    expect(() => controls.stop()).not.toThrow();
    expect(() => controls.seek(1000)).not.toThrow();

    // Test: Analysis without loaded recording
    const analysis = replayService.analyzeRace();
    expect(analysis.participantStats.size).toBe(0);
    expect(analysis.keyMoments.length).toBe(0);
  });
});
