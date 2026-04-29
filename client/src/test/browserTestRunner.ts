/**
 * Browser-based Race Replay Test Runner
 * 
 * This script runs in the browser to test the replay system
 * and provides real-time verification of functionality.
 */

import { getRaceReplayService } from '../services/raceReplay.service';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details: string;
  data?: any;
}

class BrowserTestRunner {
  private replayService = getRaceReplayService();
  private results: TestResult[] = [];

  async runTests(): Promise<TestResult[]> {
    console.log('🏁 Starting Browser-based Race Replay Tests...\n');
    
    this.results = [];

    // Test 1: Basic Recording
    await this.runTest('Basic Recording', async () => {
      return await this.testBasicRecording();
    });

    // Test 2: Multi-User Race
    await this.runTest('Multi-User Race', async () => {
      return await this.testMultiUserRace();
    });

    // Test 3: Playback Controls
    await this.runTest('Playback Controls', async () => {
      return await this.testPlaybackControls();
    });

    // Test 4: Analysis
    await this.runTest('Race Analysis', async () => {
      return await this.testRaceAnalysis();
    });

    // Test 5: Import/Export
    await this.runTest('Import/Export', async () => {
      return await this.testImportExport();
    });

    this.printResults();
    return this.results;
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: true,
        duration,
        details: result.details || 'Test passed',
        data: result.data
      });
      
      console.log(`✅ ${name} - ${duration}ms`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        passed: false,
        duration,
        details: (error as Error).message
      });
      
      console.log(`❌ ${name} - ${duration}ms`);
      console.log(`   Error: ${(error as Error).message}`);
    }
  }

  private async testBasicRecording(): Promise<any> {
    // Start recording
    const raceId = `test-race-${Date.now()}`;
    this.replayService.startRecording(raceId, {
      name: 'Browser Test Race',
      trackName: 'Test Circuit',
      totalDistance: 10000,
      totalLaps: 3,
      centerLat: 37.7749,
      centerLng: -122.4194
    });

    // Add some test data
    for (let i = 0; i < 100; i++) {
      this.replayService.addDataPoint({
        participantId: 'driver-1',
        position: { lat: 37.7749 + i * 0.0001, lng: -122.4194 + i * 0.0001 },
        speed: 150 + Math.random() * 20,
        heading: i * 10,
        accuracy: 5,
        status: 'active',
        lap: 1,
        lapTime: i * 1000,
        totalDistance: i * 100,
        antiCheatRisk: 0
      });

      this.replayService.updateParticipant('driver-1', {
        name: 'Test Driver',
        vehicle: 'car',
        finalPosition: 1,
        finalTime: 100000,
        status: 'finished'
      });
    }

    // Stop recording
    const recording = this.replayService.stopRecording();
    if (!recording) {
      throw new Error('Failed to create recording');
    }

    // Load for playback
    const loaded = this.replayService.loadRecording(recording.id);
    if (!loaded) {
      throw new Error('Failed to load recording');
    }

    return {
      details: `Created recording with ${recording.dataPoints.length} data points`,
      data: {
        dataPoints: recording.dataPoints.length,
        duration: recording.duration,
        participants: recording.participants.length
      }
    };
  }

  private async testMultiUserRace(): Promise<any> {
    // Simulate a multi-user race
    const raceId = `multi-user-test-${Date.now()}`;
    this.replayService.startRecording(raceId, {
      name: 'Multi-User Test Race',
      trackName: 'Multi-User Circuit',
      totalDistance: 15000,
      totalLaps: 5,
      centerLat: 37.7749,
      centerLng: -122.4194
    });

    // Simulate 4 participants
    const participants = ['driver-1', 'driver-2', 'driver-3', 'driver-4'];
    const participantNames = ['Alice', 'Bob', 'Charlie', 'Diana'];

    for (let lap = 1; lap <= 5; lap++) {
      for (let progress = 0; progress < 100; progress += 10) {
        participants.forEach((participantId, index) => {
          const baseSpeed = 150 + index * 10; // Different speeds
          const speed = baseSpeed + Math.random() * 20 - 10;
          
          this.replayService.addDataPoint({
            participantId,
            position: { 
              lat: 37.7749 + (lap * 0.01) + (progress * 0.0001), 
              lng: -122.4194 + (index * 0.01) + (progress * 0.0001) 
            },
            speed,
            heading: progress * 3.6,
            accuracy: 5,
            status: lap === 5 && progress === 90 ? 'finished' : 'active',
            lap,
            lapTime: progress * 1000,
            totalDistance: (lap - 1) * 3000 + progress * 30,
            antiCheatRisk: Math.random() > 0.9 ? Math.random() * 100 : 0
          });

          this.replayService.updateParticipant(participantId, {
            name: participantNames[index],
            vehicle: index % 2 === 0 ? 'car' : 'motorcycle',
            finalPosition: index + 1,
            finalTime: lap * 60000,
            status: lap === 5 && progress === 90 ? 'finished' : 'active'
          });
        });
      }
    }

    const recording = this.replayService.stopRecording();
    if (!recording) {
      throw new Error('Failed to create multi-user recording');
    }

    // Verify all participants have data
    const participantIds = new Set(recording.dataPoints.map(p => p.participantId));
    if (participantIds.size !== 4) {
      throw new Error(`Expected 4 participants, got ${participantIds.size}`);
    }

    return {
      details: `Multi-user race with ${recording.participants.length} participants and ${recording.dataPoints.length} data points`,
      data: {
        participants: recording.participants.length,
        dataPoints: recording.dataPoints.length,
        finishedCount: recording.participants.filter(p => p.status === 'finished').length
      }
    };
  }

  private async testPlaybackControls(): Promise<any> {
    // Load a recording first
    const recordings = this.replayService.getRecordings();
    if (recordings.length === 0) {
      throw new Error('No recordings available for playback test');
    }

    this.replayService.loadRecording(recordings[0].id);
    const controls = this.replayService.getControls();
    const initialState = this.replayService.getPlaybackState();

    // Test play
    controls.play();
    await this.sleep(100);
    const playState = this.replayService.getPlaybackState();
    
    if (!playState.isPlaying) {
      throw new Error('Play command failed');
    }

    if (playState.currentTime === initialState.currentTime) {
      throw new Error('Time did not advance during playback');
    }

    // Test pause
    controls.pause();
    const pauseState = this.replayService.getPlaybackState();
    
    if (pauseState.isPlaying) {
      throw new Error('Pause command failed');
    }

    // Test seek
    const seekTime = Math.floor(initialState.duration / 2);
    controls.seek(seekTime);
    const seekState = this.replayService.getPlaybackState();
    
    if (Math.abs(seekState.currentTime - seekTime) > 100) {
      throw new Error('Seek command failed');
    }

    // Test speed control
    controls.setPlaybackSpeed(2);
    const speedState = this.replayService.getPlaybackState();
    
    if (speedState.playbackSpeed !== 2) {
      throw new Error('Speed control failed');
    }

    // Test stop
    controls.stop();
    const stopState = this.replayService.getPlaybackState();
    
    if (stopState.isPlaying || stopState.currentTime !== 0) {
      throw new Error('Stop command failed');
    }

    return {
      details: 'All playback controls working correctly',
      data: {
        playWorked: playState.isPlaying,
        pauseWorked: !pauseState.isPlaying,
        seekWorked: Math.abs(seekState.currentTime - seekTime) < 100,
        speedWorked: speedState.playbackSpeed === 2,
        stopWorked: !stopState.isPlaying && stopState.currentTime === 0
      }
    };
  }

  private async testRaceAnalysis(): Promise<any> {
    // Load a recording
    const recordings = this.replayService.getRecordings();
    if (recordings.length === 0) {
      throw new Error('No recordings available for analysis test');
    }

    this.replayService.loadRecording(recordings[0].id);
    const analysis = this.replayService.analyzeRace();

    // Verify analysis structure
    if (!analysis.participantStats || !analysis.keyMoments || !analysis.raceStatistics) {
      throw new Error('Analysis structure incomplete');
    }

    // Verify participant statistics
    if (analysis.participantStats.size === 0) {
      throw new Error('No participant statistics found');
    }

    // Verify race statistics
    if (!analysis.raceStatistics.fastestLap || !analysis.raceStatistics.fastestLap.participantId) {
      throw new Error('Fastest lap not identified');
    }

    return {
      details: `Analysis complete: ${analysis.participantStats.size} participants, ${analysis.keyMoments.length} key moments`,
      data: {
        participantStats: analysis.participantStats.size,
        keyMoments: analysis.keyMoments.length,
        fastestLap: analysis.raceStatistics.fastestLap,
        totalOvertakes: analysis.raceStatistics.totalOvertakes
      }
    };
  }

  private async testImportExport(): Promise<any> {
    // Get a recording to export
    const recordings = this.replayService.getRecordings();
    if (recordings.length === 0) {
      throw new Error('No recordings available for import/export test');
    }

    const recording = recordings[0];
    
    // Export
    const exported = this.replayService.exportRecording(recording.id);
    if (!exported) {
      throw new Error('Export failed');
    }

    // Delete original
    const deleted = this.replayService.deleteRecording(recording.id);
    if (!deleted) {
      throw new Error('Delete failed');
    }

    // Import
    const imported = this.replayService.importRecording(exported);
    if (!imported) {
      throw new Error('Import failed');
    }

    // Verify imported recording
    const newRecordings = this.replayService.getRecordings();
    const importedRecording = newRecordings.find(r => r.id === recording.id);
    if (!importedRecording) {
      throw new Error('Imported recording not found');
    }

    // Verify data integrity
    if (importedRecording.name !== recording.name ||
        importedRecording.participants.length !== recording.participants.length) {
      throw new Error('Imported data mismatch');
    }

    return {
      details: `Successfully exported and imported recording "${recording.name}"`,
      data: {
        originalName: recording.name,
        importedName: importedRecording.name,
        originalParticipants: recording.participants.length,
        importedParticipants: importedRecording.participants.length,
        exportSize: exported.length
      }
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printResults(): void {
    console.log('\n🏁 Browser Test Results');
    console.log('='.repeat(40));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📊 Summary: ${passed}/${this.results.length} passed (${failed} failed)`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);

    if (failed === 0) {
      console.log('\n🎉 All browser tests passed!');
      console.log('✅ Race Replay System is working correctly in the browser!');
    } else {
      console.log('\n❌ Some tests failed:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`   • ${r.name}: ${r.details}`);
      });
    }

    console.log('\n🔗 Open browser console to see detailed test execution');
  }
}

// Make available globally for browser testing
(window as any).runReplayTests = async () => {
  const runner = new BrowserTestRunner();
  return await runner.runTests();
};

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  console.log('🏁 Race Replay Test Runner loaded');
  console.log('💡 Run `runReplayTests()` in console to start tests');
}

export { BrowserTestRunner };
