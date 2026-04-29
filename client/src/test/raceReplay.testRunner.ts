/**
 * Race Replay Test Runner
 * 
 * Executes comprehensive E2E tests for the race replay system
 * and provides detailed verification of functionality
 */

import { getRaceReplayService, RaceRecording } from '../services/raceReplay.service';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  data?: any;
}

interface RaceSimulationConfig {
  name: string;
  participants: number;
  laps: number;
  trackLength: number;
  duration: number;
  skillVariation: boolean;
  expectedFinishes?: number;
}

class RaceReplayTestRunner {
  private replayService = getRaceReplayService();
  private results: TestResult[] = [];
  private testRecordings: RaceRecording[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🏁 Starting Race Replay E2E Tests...\n');

    this.results = [];
    this.testRecordings = [];

    // Test 1: Basic Recording and Playback
    await this.runTest('Basic Recording and Playback', async () => {
      return await this.testBasicRecordingAndPlayback();
    });

    // Test 2: Multi-User Race Simulation
    await this.runTest('Multi-User Race Simulation', async () => {
      return await this.testMultiUserRaceSimulation();
    });

    // Test 3: Race Completion Conditions
    await this.runTest('Race Completion Conditions', async () => {
      return await this.testRaceCompletionConditions();
    });

    // Test 4: Playback Timing Accuracy
    await this.runTest('Playback Timing Accuracy', async () => {
      return await this.testPlaybackTimingAccuracy();
    });

    // Test 5: Key Moments Detection
    await this.runTest('Key Moments Detection', async () => {
      return await this.testKeyMomentsDetection();
    });

    // Test 6: Import/Export Functionality
    await this.runTest('Import/Export Functionality', async () => {
      return await this.testImportExportFunctionality();
    });

    // Test 7: Analysis and Statistics
    await this.runTest('Analysis and Statistics', async () => {
      return await this.testAnalysisAndStatistics();
    });

    // Test 8: Error Handling
    await this.runTest('Error Handling', async () => {
      return await this.testErrorHandling();
    });

    // Test 9: Large Race Simulation
    await this.runTest('Large Race Simulation', async () => {
      return await this.testLargeRaceSimulation();
    });

    // Test 10: Concurrent Operations
    await this.runTest('Concurrent Operations', async () => {
      return await this.testConcurrentOperations();
    });

    this.printResults();
    return this.results;
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        duration,
        details: result.details || 'Test passed successfully',
        data: result.data
      });
      
      console.log(`✅ ${testName} - ${duration}ms`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: false,
        duration,
        details: (error as Error).message
      });
      
      console.log(`❌ ${testName} - ${duration}ms`);
      console.log(`   Error: ${(error as Error).message}`);
    }
  }

  private async testBasicRecordingAndPlayback(): Promise<any> {
    // Create a simple 2-lap race with 3 participants
    const recording = await this.simulateRace({
      name: 'Basic Test Race',
      participants: 3,
      laps: 2,
      trackLength: 2000,
      duration: 120000,
      skillVariation: false
    });

    this.testRecordings.push(recording);

    // Verify recording structure
    if (!recording || recording.participants.length !== 3) {
      throw new Error('Recording structure invalid');
    }

    // Load for playback
    const loaded = this.replayService.loadRecording(recording.id);
    if (!loaded) {
      throw new Error('Failed to load recording');
    }

    // Test playback controls
    const controls = this.replayService.getControls();
    controls.play();
    
    // Wait a bit then pause
    await this.sleep(100);
    controls.pause();

    const state = this.replayService.getPlaybackState();
    if (state.currentTime === 0) {
      throw new Error('Playback time did not advance');
    }

    return {
      details: `Recorded ${recording.dataPoints.length} data points over ${recording.duration}ms`,
      data: {
        participants: recording.participants.length,
        dataPoints: recording.dataPoints.length,
        duration: recording.duration,
        playbackTime: state.currentTime
      }
    };
  }

  private async testMultiUserRaceSimulation(): Promise<any> {
    // Create a realistic 5-lap race with 8 participants
    const recording = await this.simulateRace({
      name: 'Multi-User Test Race',
      participants: 8,
      laps: 5,
      trackLength: 4000,
      duration: 300000,
      skillVariation: true
    });

    this.testRecordings.push(recording);

    // Verify all participants have data
    const participantIds = new Set(recording.dataPoints.map(p => p.participantId));
    if (participantIds.size !== 8) {
      throw new Error(`Expected 8 participants, got ${participantIds.size}`);
    }

    // Verify race completion
    const finishedCount = recording.participants.filter(p => p.status === 'finished').length;
    if (finishedCount === 0) {
      throw new Error('No participants finished the race');
    }

    // Verify position ordering
    const finished = recording.participants
      .filter(p => p.status === 'finished')
      .sort((a, b) => a.finalTime - b.finalTime);

    for (let i = 0; i < finished.length - 1; i++) {
      if (finished[i].finalTime > finished[i + 1].finalTime) {
        throw new Error('Positions not correctly ordered');
      }
    }

    return {
      details: `8 participants completed race with ${finishedCount} finishers`,
      data: {
        totalParticipants: 8,
        finishedCount,
        dataPoints: recording.dataPoints.length,
        raceDuration: recording.duration
      }
    };
  }

  private async testRaceCompletionConditions(): Promise<any> {
    // Create a race where not everyone finishes (short duration)
    const recording = await this.simulateRace({
      name: 'Incomplete Race Test',
      participants: 6,
      laps: 4,
      trackLength: 5000,
      duration: 90000, // Only 90 seconds - some won't finish
      skillVariation: true
    });

    this.testRecordings.push(recording);

    const finishedCount = recording.participants.filter(p => p.status === 'finished').length;
    const dnfCount = recording.participants.filter(p => p.status === 'dnf').length;

    // Should have some finishers and some DNFs
    if (finishedCount === 0) {
      throw new Error('No participants finished - race too short');
    }

    if (dnfCount === 0) {
      throw new Error('All participants finished - race too long');
    }

    return {
      details: `Race completion: ${finishedCount} finished, ${dnfCount} DNF`,
      data: {
        finishedCount,
        dnfCount,
        totalParticipants: recording.participants.length
      }
    };
  }

  private async testPlaybackTimingAccuracy(): Promise<any> {
    const recording = await this.simulateRace({
      name: 'Timing Test Race',
      participants: 3,
      laps: 2,
      trackLength: 1500,
      duration: 60000,
      skillVariation: false
    });

    this.testRecordings.push(recording);

    this.replayService.loadRecording(recording.id);
    const controls = this.replayService.getControls();

    // Test normal speed playback
    const startTime = Date.now();
    controls.play();
    
    await this.sleep(500); // Play for 500ms
    
    const realElapsed = Date.now() - startTime;
    const playbackState = this.replayService.getPlaybackState();
    controls.pause();

    const timeError = Math.abs(playbackState.currentTime - realElapsed);
    if (timeError > 200) { // Allow 200ms tolerance
      throw new Error(`Timing error too large: ${timeError}ms`);
    }

    // Test 2x speed
    controls.seek(0);
    controls.setPlaybackSpeed(2);
    
    const speedTestStart = Date.now();
    controls.play();
    
    await this.sleep(300); // Play for 300ms at 2x speed
    
    const speedRealElapsed = Date.now() - speedTestStart;
    const speedPlaybackState = this.replayService.getPlaybackState();
    controls.stop();

    const expectedTime = speedRealElapsed * 2;
    const speedError = Math.abs(speedPlaybackState.currentTime - expectedTime);
    if (speedError > 200) {
      throw new Error(`2x speed timing error: ${speedError}ms`);
    }

    return {
      details: `Timing accuracy: Normal ${timeError}ms error, 2x speed ${speedError}ms error`,
      data: {
        normalSpeedError: timeError,
        doubleSpeedError: speedError,
        realElapsed,
        speedRealElapsed
      }
    };
  }

  private async testKeyMomentsDetection(): Promise<any> {
    const recording = await this.simulateRace({
      name: 'Key Moments Test',
      participants: 5,
      laps: 3,
      trackLength: 3000,
      duration: 180000,
      skillVariation: true
    });

    this.testRecordings.push(recording);

    this.replayService.loadRecording(recording.id);
    const analysis = this.replayService.analyzeRace();

    // Should detect finish moments
    const finishMoments = analysis.keyMoments.filter(m => m.type === 'finish');
    if (finishMoments.length === 0) {
      throw new Error('No finish moments detected');
    }

    // Should have participant statistics
    if (analysis.participantStats.size !== 5) {
      throw new Error('Participant statistics incomplete');
    }

    // Should have fastest lap
    if (!analysis.raceStatistics.fastestLap.participantId) {
      throw new Error('Fastest lap not identified');
    }

    return {
      details: `Detected ${analysis.keyMoments.length} key moments, fastest lap: ${analysis.raceStatistics.fastestLap.time}ms`,
      data: {
        keyMomentsCount: analysis.keyMoments.length,
        finishMoments: finishMoments.length,
        participantStats: analysis.participantStats.size,
        fastestLap: analysis.raceStatistics.fastestLap
      }
    };
  }

  private async testImportExportFunctionality(): Promise<any> {
    const recording = await this.simulateRace({
      name: 'Import/Export Test',
      participants: 4,
      laps: 2,
      trackLength: 2500,
      duration: 120000,
      skillVariation: true
    });

    // Export recording
    const exportedData = this.replayService.exportRecording(recording.id);
    if (!exportedData) {
      throw new Error('Failed to export recording');
    }

    // Delete original
    const deleted = this.replayService.deleteRecording(recording.id);
    if (!deleted) {
      throw new Error('Failed to delete recording');
    }

    // Import recording
    const imported = this.replayService.importRecording(exportedData);
    if (!imported) {
      throw new Error('Failed to import recording');
    }

    // Verify imported recording
    const recordings = this.replayService.getRecordings();
    const importedRecording = recordings.find(r => r.id === recording.id);
    if (!importedRecording) {
      throw new Error('Imported recording not found');
    }

    // Verify data integrity
    if (importedRecording.name !== recording.name ||
        importedRecording.participants.length !== recording.participants.length ||
        importedRecording.dataPoints.length !== recording.dataPoints.length) {
      throw new Error('Imported recording data mismatch');
    }

    this.testRecordings.push(importedRecording);

    return {
      details: `Successfully exported and imported recording with ${recording.dataPoints.length} data points`,
      data: {
        originalDataPoints: recording.dataPoints.length,
        importedDataPoints: importedRecording.dataPoints.length,
        originalParticipants: recording.participants.length,
        importedParticipants: importedRecording.participants.length
      }
    };
  }

  private async testAnalysisAndStatistics(): Promise<any> {
    const recording = await this.simulateRace({
      name: 'Analysis Test',
      participants: 6,
      laps: 4,
      trackLength: 3500,
      duration: 240000,
      skillVariation: true
    });

    this.testRecordings.push(recording);

    this.replayService.loadRecording(recording.id);
    const analysis = this.replayService.analyzeRace();

    // Verify participant statistics
    let totalOvertakes = 0;
    let totalSpeed = 0;
    let speedCount = 0;

    analysis.participantStats.forEach((stats, participantId) => {
      if (stats.avgSpeed <= 0 || stats.maxSpeed <= 0) {
        throw new Error(`Invalid speed stats for ${participantId}`);
      }
      if (stats.maxSpeed < stats.avgSpeed) {
        throw new Error(`Max speed less than avg speed for ${participantId}`);
      }
      if (stats.totalDistance <= 0) {
        throw new Error(`Invalid distance for ${participantId}`);
      }

      totalOvertakes += stats.overtakes;
      totalSpeed += stats.avgSpeed;
      speedCount++;
    });

    // Verify race statistics
    if (analysis.raceStatistics.avgSpeed <= 0) {
      throw new Error('Invalid average speed');
    }

    if (!analysis.raceStatistics.fastestLap.participantId) {
      throw new Error('Fastest lap not found');
    }

    return {
      details: `Analysis complete: ${totalOvertakes} total overtakes, avg speed: ${analysis.raceStatistics.avgSpeed.toFixed(1)} km/h`,
      data: {
        totalOvertakes,
        avgSpeed: analysis.raceStatistics.avgSpeed,
        fastestLap: analysis.raceStatistics.fastestLap,
        participantsAnalyzed: analysis.participantStats.size
      }
    };
  }

  private async testErrorHandling(): Promise<any> {
    // Test invalid operations
    const invalidLoad = this.replayService.loadRecording('invalid-id');
    if (invalidLoad) {
      throw new Error('Should not load invalid recording');
    }

    const invalidExport = this.replayService.exportRecording('invalid-id');
    if (invalidExport) {
      throw new Error('Should not export invalid recording');
    }

    const invalidDelete = this.replayService.deleteRecording('invalid-id');
    if (invalidDelete) {
      throw new Error('Should not delete invalid recording');
    }

    const invalidImport = this.replayService.importRecording('invalid json');
    if (invalidImport) {
      throw new Error('Should not import invalid JSON');
    }

    // Test operations without loaded recording
    const controls = this.replayService.getControls();
    
    // These should not throw errors
    controls.play();
    controls.pause();
    controls.stop();
    controls.seek(1000);

    const analysis = this.replayService.analyzeRace();
    if (analysis.participantStats.size !== 0) {
      throw new Error('Analysis without recording should be empty');
    }

    return {
      details: 'All error conditions handled correctly',
      data: {
        invalidLoadHandled: !invalidLoad,
        invalidExportHandled: !invalidExport,
        invalidDeleteHandled: !invalidDelete,
        invalidImportHandled: !invalidImport,
        emptyAnalysis: analysis.participantStats.size === 0
      }
    };
  }

  private async testLargeRaceSimulation(): Promise<any> {
    // Test with many participants and laps
    const recording = await this.simulateRace({
      name: 'Large Race Test',
      participants: 12,
      laps: 6,
      trackLength: 5000,
      duration: 600000, // 10 minutes
      skillVariation: true
    });

    this.testRecordings.push(recording);

    // Verify performance with large dataset
    if (recording.dataPoints.length < 1000) {
      throw new Error('Insufficient data points for large race');
    }

    // Test playback performance
    const startTime = Date.now();
    this.replayService.loadRecording(recording.id);
    const loadTime = Date.now() - startTime;

    if (loadTime > 1000) { // Should load within 1 second
      throw new Error(`Loading too slow: ${loadTime}ms`);
    }

    const analysisStartTime = Date.now();
    this.replayService.analyzeRace();
    const analysisTime = Date.now() - analysisStartTime;

    if (analysisTime > 2000) { // Should analyze within 2 seconds
      throw new Error(`Analysis too slow: ${analysisTime}ms`);
    }

    return {
      details: `Large race: ${recording.dataPoints.length} data points, load: ${loadTime}ms, analysis: ${analysisTime}ms`,
      data: {
        participants: 12,
        laps: 6,
        dataPoints: recording.dataPoints.length,
        loadTime,
        analysisTime
      }
    };
  }

  private async testConcurrentOperations(): Promise<any> {
    // Create multiple recordings
    const recording1 = await this.simulateRace({
      name: 'Concurrent Test 1',
      participants: 3,
      laps: 2,
      trackLength: 2000,
      duration: 60000,
      skillVariation: false
    });

    const recording2 = await this.simulateRace({
      name: 'Concurrent Test 2',
      participants: 3,
      laps: 2,
      trackLength: 2000,
      duration: 60000,
      skillVariation: false
    });

    const recording3 = await this.simulateRace({
      name: 'Concurrent Test 3',
      participants: 3,
      laps: 2,
      trackLength: 2000,
      duration: 60000,
      skillVariation: false
    });

    this.testRecordings.push(recording1, recording2, recording3);

    // Test switching between recordings
    this.replayService.loadRecording(recording1.id);
    const state1 = this.replayService.getPlaybackState();

    this.replayService.loadRecording(recording2.id);
    const state2 = this.replayService.getPlaybackState();

    this.replayService.loadRecording(recording3.id);
    const state3 = this.replayService.getPlaybackState();

    // Verify each recording loads correctly
    if (state1.duration !== recording1.duration ||
        state2.duration !== recording2.duration ||
        state3.duration !== recording3.duration) {
      throw new Error('Concurrent loading failed');
    }

    // Test analysis on each
    const analysis1 = this.replayService.analyzeRace();
    this.replayService.loadRecording(recording2.id);
    const analysis2 = this.replayService.analyzeRace();
    this.replayService.loadRecording(recording3.id);
    const analysis3 = this.replayService.analyzeRace();

    if (analysis1.participantStats.size !== 3 ||
        analysis2.participantStats.size !== 3 ||
        analysis3.participantStats.size !== 3) {
      throw new Error('Concurrent analysis failed');
    }

    return {
      details: 'Successfully handled 3 concurrent recordings',
      data: {
        recordingsCount: 3,
        allLoadedCorrectly: true,
        allAnalyzedCorrectly: true
      }
    };
  }

  private async simulateRace(config: RaceSimulationConfig): Promise<RaceRecording> {
    const raceId = `test-race-${Date.now()}-${Math.random()}`;
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

    // Generate participants
    const participants = this.generateParticipants(config.participants, config.skillVariation);
    
    // Simulate race
    await this.simulateRaceProgression(raceId, participants, config, startTime);
    
    // Stop recording
    const recording = this.replayService.stopRecording();
    if (!recording) {
      throw new Error('Failed to create recording');
    }
    
    return recording;
  }

  private generateParticipants(count: number, skillVariation: boolean) {
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
      case 'expert': return 180 + Math.random() * 20;
      case 'intermediate': return 160 + Math.random() * 20;
      case 'beginner': return 140 + Math.random() * 20;
      default: return 170;
    }
  }

  private getConsistency(skill: string): number {
    switch (skill) {
      case 'expert': return 0.95;
      case 'intermediate': return 0.85;
      case 'beginner': return 0.70;
      default: return 0.85;
    }
  }

  private getRacecraft(skill: string): number {
    switch (skill) {
      case 'expert': return 0.9;
      case 'intermediate': return 0.7;
      case 'beginner': return 0.5;
      default: return 0.7;
    }
  }

  private async simulateRaceProgression(
    raceId: string, 
    participants: any[], 
    config: RaceSimulationConfig, 
    startTime: number
  ) {
    const trackCenter = { lat: 37.7749, lng: -122.4194 };
    const trackRadius = 1000;
    const lapLength = config.trackLength;
    
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

    const interval = 100;
    const totalSteps = config.duration / interval;
    
    for (let step = 0; step < totalSteps; step++) {
      const currentTime = startTime + (step * interval);
      const elapsedTime = step * interval;
      
      // Update participants
      for (const state of states) {
        if (state.finished) continue;
        
        const speedVariation = (Math.random() - 0.5) * 20 * (1 - state.consistency);
        state.currentSpeed = Math.max(100, Math.min(220, state.baseSpeed + speedVariation));
        
        const distanceInInterval = (state.currentSpeed / 3.6) * (interval / 1000);
        state.totalDistance += distanceInInterval;
        state.lapProgress = (state.totalDistance % lapLength) / lapLength;
        
        if (state.lapProgress < distanceInInterval / lapLength) {
          state.currentLap++;
          state.lapTimes.push(elapsedTime - (state.lapTimes.reduce((a, b) => a + b, 0) || 0));
          
          if (state.currentLap > config.laps) {
            state.finished = true;
            state.finishTime = elapsedTime;
            state.totalTime = elapsedTime;
          }
        }
        
        const trackAngle = (state.totalDistance / trackRadius) % (2 * Math.PI);
        const lat = trackCenter.lat + Math.cos(trackAngle) * (trackRadius / 111320);
        const lng = trackCenter.lng + Math.sin(trackAngle) * (trackRadius / (111320 * Math.cos(trackCenter.lat * Math.PI / 180)));
        
        state.heading = (trackAngle * 180 / Math.PI + 90) % 360;
        
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
        
        this.replayService.updateParticipant(state.id, {
          name: state.name,
          vehicle: state.vehicle,
          finalPosition: 0,
          finalTime: state.totalTime,
          status: state.finished ? 'finished' : 'active'
        });
      }
      
      states.sort((a, b) => b.totalDistance - a.totalDistance);
      states.forEach((state, index) => {
        state.position = index + 1;
      });
      
      const finishedCount = states.filter(s => s.finished).length;
      const firstFinishTime = states.find(s => s.finished)?.finishTime || 0;
      
      if (finishedCount === participants.length || 
          (firstFinishTime > 0 && elapsedTime > firstFinishTime + 30000)) {
        break;
      }
      
      await this.sleep(10);
    }
    
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printResults(): void {
    console.log('\n🏁 Race Replay E2E Test Results');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📊 Summary: ${passed}/${this.results.length} passed (${failed} failed)`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   • ${r.testName}: ${r.details}`);
      });
    }

    console.log('\n📈 Test Recordings Created:');
    this.testRecordings.forEach((recording, index) => {
      console.log(`   ${index + 1}. ${recording.name}`);
      console.log(`      Participants: ${recording.participants.length}`);
      console.log(`      Data Points: ${recording.dataPoints.length}`);
      console.log(`      Duration: ${recording.duration}ms`);
    });

    console.log('\n✅ All tests completed!');
  }

  // Cleanup method
  cleanup(): void {
    this.testRecordings.forEach(recording => {
      this.replayService.deleteRecording(recording.id);
    });
    this.testRecordings = [];
  }
}

// Export for use in tests
export { RaceReplayTestRunner };

// Auto-run if called directly
if (typeof window === 'undefined') {
  // Running in Node.js environment
  const runner = new RaceReplayTestRunner();
  runner.runAllTests().then(results => {
    process.exit(results.filter(r => !r.passed).length);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}
