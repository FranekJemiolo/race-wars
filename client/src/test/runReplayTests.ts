#!/usr/bin/env node

/**
 * Race Replay Test Execution Script
 * 
 * This script runs comprehensive E2E tests for the race replay system
 * and provides detailed verification of functionality with realistic race data.
 */

import { RaceReplayTestRunner } from './raceReplay.testRunner';

async function main() {
  console.log('🏁 Starting Race Replay System Validation...\n');
  
  const runner = new RaceReplayTestRunner();
  
  try {
    const results = await runner.runAllTests();
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`\n🎯 Final Results: ${passed}/${results.length} tests passed`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Race Replay System is working correctly.');
      console.log('\n✅ System Validation Complete:');
      console.log('   • Multi-user race recording and playback');
      console.log('   • Accurate timing and position tracking');
      console.log('   • Race completion conditions');
      console.log('   • Key moments detection and analysis');
      console.log('   • Import/export functionality');
      console.log('   • Error handling and edge cases');
      console.log('   • Large race performance');
      console.log('   • Concurrent operations');
      
      console.log('\n🚀 The Race Replay System is ready for production use!');
    } else {
      console.log(`❌ ${failed} tests failed. Please review the issues above.`);
      process.exit(1);
    }
    
    // Cleanup test data
    runner.cleanup();
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runReplayTests };
