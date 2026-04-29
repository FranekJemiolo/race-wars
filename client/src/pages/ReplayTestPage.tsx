import React, { useState, useEffect } from 'react';
import { BrowserTestRunner } from '../test/browserTestRunner';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details: string;
  data?: any;
}

export const ReplayTestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [runner] = useState(() => new BrowserTestRunner());

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, `LOG: ${args.join(' ')}`]);
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setLogs([]);
    setCurrentTest('Initializing...');

    try {
      // Override the runner's printResults to capture results
      const testResults = await runner.runTests();
      setResults(testResults);
      setCurrentTest('Tests completed');
    } catch (error) {
      setLogs(prev => [...prev, `FATAL ERROR: ${(error as Error).message}`]);
      setCurrentTest('Test execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setLogs([]);
    setCurrentTest('');
  };

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => r.passed === false).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🏁 Race Replay System E2E Tests</h1>
          <p className="text-gray-400">
            Comprehensive end-to-end testing of the race replay system with realistic multi-user race simulations
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
              <p className="text-gray-400 text-sm">
                Click "Run Tests" to execute comprehensive E2E tests that verify:
              </p>
              <ul className="text-gray-400 text-sm mt-2 space-y-1">
                <li>• Multi-user race recording with realistic timing</li>
                <li>• Video-like playback controls and seeking</li>
                <li>• Race completion conditions and timeout handling</li>
                <li>• Key moments detection (overtakes, finishes)</li>
                <li>• Import/export functionality and data integrity</li>
                <li>• Performance analysis and statistics</li>
                <li>• Error handling and edge cases</li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={runTests}
                disabled={isRunning}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRunning 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isRunning ? '⏳ Running...' : '🚀 Run Tests'}
              </button>
              
              <button
                onClick={clearResults}
                disabled={isRunning}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRunning 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          
          {currentTest && (
            <div className="mt-4 p-3 bg-gray-700 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm">Current: {currentTest}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{results.length}</div>
                <div className="text-sm text-gray-400">Total Tests</div>
              </div>
              <div className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{passedCount}</div>
                <div className="text-sm text-gray-400">Passed</div>
              </div>
              <div className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{failedCount}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
              <div className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{totalDuration}ms</div>
                <div className="text-sm text-gray-400">Duration</div>
              </div>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-900/20 border-green-700' 
                      : 'bg-red-900/20 border-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        result.passed ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className="font-medium">{result.name}</span>
                      <span className="text-sm text-gray-400">{result.duration}ms</span>
                    </div>
                    <span className={`text-sm ${
                      result.passed ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-400">
                    {result.details}
                  </div>
                  
                  {result.data && (
                    <div className="mt-2 text-xs text-gray-500">
                      <details>
                        <summary className="cursor-pointer hover:text-gray-400">Test Data</summary>
                        <pre className="mt-2 bg-gray-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Console Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Console Output</h2>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear Logs
              </button>
            </div>
            
            <div className="bg-black rounded p-4 font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.startsWith('ERROR:') ? 'text-red-400' : 
                    log.startsWith('LOG:') ? 'text-gray-300' : 
                    'text-gray-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Information */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">About These Tests</h2>
          <div className="text-gray-400 space-y-2">
            <p>
              These E2E tests simulate realistic multi-user races to verify the race replay system works correctly:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="font-medium text-white mb-2">🏁 Race Simulation</h3>
                <ul className="text-sm space-y-1">
                  <li>• Multiple participants with different skill levels</li>
                  <li>• Realistic speed variations and consistency</li>
                  <li>• Proper lap timing and position tracking</li>
                  <li>• Race completion and timeout conditions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">🎬 Replay Verification</h3>
                <ul className="text-sm space-y-1">
                  <li>• Video-like playback controls (play/pause/seek)</li>
                  <li>• Accurate timing at different playback speeds</li>
                  <li>• Key moments detection (overtakes, finishes)</li>
                  <li>• Performance analysis and statistics</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-700 rounded">
              <p className="text-sm">
                <strong>Success Criteria:</strong> All tests must pass to prove the replay system works correctly 
                with realistic race data, proper timing, and full functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
